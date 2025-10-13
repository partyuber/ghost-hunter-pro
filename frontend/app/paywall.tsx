import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Link } from 'expo-router';

export default function PaywallScreen() {
  const { createCheckoutSession, isLoading } = useSubscription();

  const features = [
    { icon: 'radio-outline', title: 'Spirit Box', description: 'Radio frequency scanning for spirit communication' },
    { icon: 'mic-outline', title: 'AI Voice Recorder', description: 'Record and transcribe with OpenAI Whisper' },
    { icon: 'analytics-outline', title: 'EVP Analyzer', description: 'AI-powered paranormal voice analysis' },
    { icon: 'camera-outline', title: 'IR/Thermal Camera', description: 'Night vision and thermal imaging modes' },
    { icon: 'pulse-outline', title: 'EMF Detector', description: 'Electromagnetic field detection' },
    { icon: 'folder-outline', title: 'Investigation Sessions', description: 'Track and manage ghost hunting sessions' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="skull-outline" size={80} color="#00ff88" />
          <Text style={styles.title}>Ghost Hunter Pro</Text>
          <Text style={styles.subtitle}>Professional Paranormal Investigation</Text>
        </View>

        <View style={styles.priceCard}>
          <Text style={styles.priceAmount}>$19.99</Text>
          <Text style={styles.pricePeriod}>per month</Text>
          <Text style={styles.priceNote}>Billed monthly • Cancel anytime</Text>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Full Access To All Tools</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon as any} size={24} color="#00ff88" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#00ff88" />
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={createCheckoutSession}
          disabled={isLoading}
        >
          <Text style={styles.subscribeButtonText}>
            {isLoading ? 'Loading...' : 'Subscribe Now with Stripe'}
          </Text>
        </TouchableOpacity>

        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimer}>
            • Secure payment powered by Stripe
          </Text>
          <Text style={styles.disclaimer}>
            • Subscription automatically renews unless cancelled
          </Text>
          <Text style={styles.disclaimer}>
            • Cancel anytime from your account settings
          </Text>
          <Text style={styles.disclaimer}>
            • No refunds for partial months
          </Text>
        </View>

        <Link href="/dev-unlock" asChild>
          <TouchableOpacity style={styles.devButton}>
            <Ionicons name="bug-outline" size={16} color="#666" />
            <Text style={styles.devButtonText}>Developer Mode</Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ff88',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  priceCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  pricePeriod: {
    fontSize: 18,
    color: '#888',
    marginTop: 8,
  },
  priceNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00ff8822',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#888',
  },
  subscribeButton: {
    backgroundColor: '#00ff88',
    borderRadius: 30,
    padding: 18,
    alignItems: 'center',
    marginBottom: 24,
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  disclaimerContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  disclaimer: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  devButtonText: {
    fontSize: 12,
    color: '#666',
  },
});
