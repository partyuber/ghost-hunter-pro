import { Stack } from 'expo-router';
import React from 'react';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';

export default function RootLayout() {
  return (
    <SubscriptionProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0a0a0a',
          },
          headerTintColor: '#00ff88',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackTitle: 'Back',
          contentStyle: {
            backgroundColor: '#0a0a0a',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="paywall"
          options={{
            title: 'Subscribe',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="spirit-box"
          options={{
            title: 'Spirit Box',
          }}
        />
        <Stack.Screen
          name="voice-recorder"
          options={{
            title: 'Voice Recorder',
          }}
        />
        <Stack.Screen
          name="emf-detector"
          options={{
            title: 'EMF Detector',
          }}
        />
        <Stack.Screen
          name="evp-analyzer"
          options={{
            title: 'EVP Analyzer',
          }}
        />
        <Stack.Screen
          name="camera"
          options={{
            title: 'IR/Thermal Camera',
          }}
        />
        <Stack.Screen
          name="sessions"
          options={{
            title: 'Sessions',
          }}
        />
      </Stack>
    </SubscriptionProvider>
  );
}
