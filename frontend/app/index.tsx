import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
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
    textShadowColor: '#00ff88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
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
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
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
