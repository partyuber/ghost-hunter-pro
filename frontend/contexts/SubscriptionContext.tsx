import React, { createContext, useContext, useState, useEffect } from 'react';
import Purchases, { PurchasesOffering } from 'react-native-purchases';
import { Platform, Alert } from 'react-native';

interface SubscriptionContextType {
  isSubscribed: boolean;
  isLoading: boolean;
  offerings: PurchasesOffering | null;
  purchasePackage: (packageToPurchase: any) => Promise<void>;
  restorePurchases: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isSubscribed: false,
  isLoading: true,
  offerings: null,
  purchasePackage: async () => {},
  restorePurchases: async () => {},
  checkSubscription: async () => {},
});

export const useSubscription = () => useContext(SubscriptionContext);

// RevenueCat API Keys - Replace with your actual keys
const REVENUECAT_API_KEY = Platform.select({
  ios: 'YOUR_IOS_API_KEY',
  android: 'YOUR_ANDROID_API_KEY',
}) || 'MOCK_API_KEY';

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);

  useEffect(() => {
    initializePurchases();
  }, []);

  const initializePurchases = async () => {
    try {
      // For development/testing, we'll use a mock subscription system
      // In production, uncomment the RevenueCat initialization:
      // Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      
      // Mock mode for development
      console.log('[Subscription] Initializing in mock mode');
      await checkSubscription();
      // await loadOfferings();
    } catch (error) {
      console.error('[Subscription] Initialization error:', error);
      setIsLoading(false);
    }
  };

  const loadOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null) {
        setOfferings(offerings.current);
      }
    } catch (error) {
      console.error('[Subscription] Error loading offerings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSubscription = async () => {
    try {
      // For production, use RevenueCat:
      // const customerInfo = await Purchases.getCustomerInfo();
      // const isActive = customerInfo.entitlements.active['premium'] !== undefined;
      // setIsSubscribed(isActive);
      
      // Mock mode - check local storage
      const mockSubscription = localStorage.getItem('mock_subscription');
      setIsSubscribed(mockSubscription === 'true');
    } catch (error) {
      console.error('[Subscription] Error checking subscription:', error);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  };

  const purchasePackage = async (packageToPurchase: any) => {
    try {
      // For production, use RevenueCat:
      // const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      // const isActive = customerInfo.entitlements.active['premium'] !== undefined;
      // setIsSubscribed(isActive);
      
      // Mock mode - simulate purchase
      Alert.alert(
        'Mock Subscription',
        'In production, this will process a real payment through the app store. For now, activating mock subscription.',
        [
          {
            text: 'Activate Mock Subscription',
            onPress: () => {
              localStorage.setItem('mock_subscription', 'true');
              setIsSubscribed(true);
              Alert.alert('Success!', 'Your subscription is now active!');
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Error', 'Failed to process purchase');
      }
    }
  };

  const restorePurchases = async () => {
    try {
      // For production, use RevenueCat:
      // const customerInfo = await Purchases.restorePurchases();
      // const isActive = customerInfo.entitlements.active['premium'] !== undefined;
      // setIsSubscribed(isActive);
      
      // Mock mode
      const mockSubscription = localStorage.getItem('mock_subscription');
      if (mockSubscription === 'true') {
        setIsSubscribed(true);
        Alert.alert('Success', 'Subscription restored!');
      } else {
        Alert.alert('No Subscription', 'No active subscription found');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases');
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        isLoading,
        offerings,
        purchasePackage,
        restorePurchases,
        checkSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
