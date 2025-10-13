import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function DevUnlockScreen() {
  const { checkSubscription } = useSubscription();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const activateDevSubscription = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('user_id');
      
      if (!userId) {
        Alert.alert('Error', 'User ID not found');
        return;
      }

      // Call backend to activate subscription
      const response = await fetch(`${BACKEND_URL}/api/subscription/dev-activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await response.json();

      if (data.success) {
        await checkSubscription();
        Alert.alert('Success!', 'Development subscription activated!', [
          { text: 'OK', onPress: () => router.replace('/') }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to activate');
      }
    } catch (error) {
      console.error('Dev activation error:', error);
      Alert.alert('Error', 'Failed to activate subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="bug-outline" size={80} color="#00ff88" />
        <Text style={styles.title}>Developer Mode</Text>
        <Text style={styles.subtitle}>Activate subscription for testing</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={activateDevSubscription}
          disabled={loading}
        >
          <Ionicons name="unlock-outline" size={24} color="#000" />
          <Text style={styles.buttonText}>
            {loading ? 'Activating...' : 'Activate Dev Subscription'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          ⚠️ This is for testing only. In production, users must subscribe through Stripe.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00ff88',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ff88',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});
