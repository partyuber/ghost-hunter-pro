import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../contexts/SubscriptionContext';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function HomeScreen() {
  const { isSubscribed, isLoading, checkSubscription } = useSubscription();
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Check if returning from successful Stripe checkout
    const verifyStripeSession = async () => {
      if (params.subscription === 'success' && params.session_id && params.user_id) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/subscription/verify-session?session_id=${params.session_id}&user_id=${params.user_id}`, {
            method: 'POST',
          });
          const data = await response.json();
          
          if (data.success && data.is_subscribed) {
            await checkSubscription();
            // Clear URL params
            router.replace('/');
          }
        } catch (error) {
          console.error('Error verifying session:', error);
        }
      }
    };

    verifyStripeSession();
  }, [params]);

  useEffect(() => {
    if (!isLoading && !isSubscribed) {
      router.replace('/paywall');
    }
  }, [isSubscribed, isLoading]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#00ff88" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isSubscribed) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="skull-outline" size={60} color="#00ff88" />
          <Text style={styles.title}>Ghost Hunter</Text>
          <Text style={styles.subtitle}>Professional Paranormal Investigation</Text>
        </View>

        <View style={styles.toolsGrid}>
          <Link href="/spirit-box" asChild>
            <TouchableOpacity style={styles.toolCard}>
              <Ionicons name="radio-outline" size={40} color="#00ff88" />
              <Text style={styles.toolTitle}>Spirit Box</Text>
              <Text style={styles.toolDescription}>Radio frequency scanning</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/voice-recorder" asChild>
            <TouchableOpacity style={styles.toolCard}>
              <Ionicons name="mic-outline" size={40} color="#00ff88" />
              <Text style={styles.toolTitle}>Voice Recorder</Text>
              <Text style={styles.toolDescription}>AI-powered transcription</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/emf-detector" asChild>
            <TouchableOpacity style={styles.toolCard}>
              <Ionicons name="pulse-outline" size={40} color="#00ff88" />
              <Text style={styles.toolTitle}>EMF Detector</Text>
              <Text style={styles.toolDescription}>Electromagnetic field sensor</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/evp-analyzer" asChild>
            <TouchableOpacity style={styles.toolCard}>
              <Ionicons name="analytics-outline" size={40} color="#00ff88" />
              <Text style={styles.toolTitle}>EVP Analyzer</Text>
              <Text style={styles.toolDescription}>Audio anomaly detection</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/camera" asChild>
            <TouchableOpacity style={styles.toolCard}>
              <Ionicons name="camera-outline" size={40} color="#00ff88" />
              <Text style={styles.toolTitle}>IR/Thermal Camera</Text>
              <Text style={styles.toolDescription}>Night vision & thermal imaging</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/sessions" asChild>
            <TouchableOpacity style={styles.toolCard}>
              <Ionicons name="folder-outline" size={40} color="#00ff88" />
              <Text style={styles.toolTitle}>Sessions</Text>
              <Text style={styles.toolDescription}>Investigation history</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 16,
    fontSize: 14,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00ff88',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  toolsGrid: {
    gap: 16,
  },
  toolCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00ff8833',
  },
  toolTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  toolDescription: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
});
