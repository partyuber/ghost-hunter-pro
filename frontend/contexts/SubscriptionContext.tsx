import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface SubscriptionContextType {
  isSubscribed: boolean;
  isLoading: boolean;
  userId: string | null;
  subscriptionStatus: string | null;
  createCheckoutSession: () => Promise<void>;
  checkSubscription: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isSubscribed: false,
  isLoading: true,
  userId: null,
  subscriptionStatus: null,
  createCheckoutSession: async () => {},
  checkSubscription: async () => {},
  cancelSubscription: async () => {},
});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      // Get or create user ID
      let storedUserId = await AsyncStorage.getItem('user_id');
      if (!storedUserId) {
        storedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('user_id', storedUserId);
      }
      setUserId(storedUserId);
      
      // Check subscription status
      await checkSubscription();
    } catch (error) {
      console.error('[Subscription] Initialization error:', error);
      setIsLoading(false);
    }
  };

  const checkSubscription = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('user_id');
      if (!storedUserId) return;

      const response = await fetch(`${BACKEND_URL}/api/subscription/status?user_id=${storedUserId}`);
      const data = await response.json();
      
      if (data.success) {
        setIsSubscribed(data.is_subscribed);
        setSubscriptionStatus(data.status);
      }
    } catch (error) {
      console.error('[Subscription] Error checking status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createCheckoutSession = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('user_id');
      if (!storedUserId) {
        Alert.alert('Error', 'User ID not found');
        return;
      }

      setIsLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/subscription/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: storedUserId,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.checkout_url) {
        // Open Stripe checkout in browser
        const { Linking } = await import('react-native');
        await Linking.openURL(data.checkout_url);
        
        // Start polling for subscription status
        Alert.alert(
          'Payment Window Opened',
          'Complete your payment in the browser. We\'ll automatically detect when you\'re done!',
          [
            {
              text: 'OK',
              onPress: () => startPollingSubscription(),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('[Subscription] Checkout error:', error);
      Alert.alert('Error', 'Failed to start checkout process');
    } finally {
      setIsLoading(false);
    }
  };

  const startPollingSubscription = () => {
    // Poll every 3 seconds for up to 5 minutes
    let pollCount = 0;
    const maxPolls = 100; // 5 minutes
    
    const pollInterval = setInterval(async () => {
      pollCount++;
      
      await checkSubscription();
      
      if (isSubscribed || pollCount >= maxPolls) {
        clearInterval(pollInterval);
        if (isSubscribed) {
          Alert.alert('Success!', 'Your subscription is now active! 🎉');
        }
      }
    }, 3000);
  };

  const cancelSubscription = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('user_id');
      if (!storedUserId) return;

      const response = await fetch(`${BACKEND_URL}/api/subscription/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: storedUserId,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await checkSubscription();
        Alert.alert('Success', 'Subscription cancelled');
      } else {
        Alert.alert('Error', data.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('[Subscription] Cancel error:', error);
      Alert.alert('Error', 'Failed to cancel subscription');
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        isLoading,
        userId,
        subscriptionStatus,
        createCheckoutSession,
        checkSubscription,
        cancelSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
