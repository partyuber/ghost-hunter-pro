import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

export default function SpiritBoxScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [frequency, setFrequency] = useState(88.1);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const freqAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isScanning) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Frequency sweep animation
      const sweepFrequency = setInterval(() => {
        setFrequency((prev) => {
          const newFreq = prev + 0.5;
          return newFreq > 108.0 ? 88.0 : newFreq;
        });
      }, 100);

      // Generate white noise audio
      playWhiteNoise();

      return () => {
        clearInterval(sweepFrequency);
        stopSound();
      };
    } else {
      pulseAnim.setValue(1);
      stopSound();
    }
  }, [isScanning]);

  const playWhiteNoise = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
      
      // In a real implementation, you would generate or play white noise
      // For now, we'll simulate it
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const stopSound = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
  };

  const toggleScanning = () => {
    setIsScanning(!isScanning);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.scanningIndicator,
            { transform: [{ scale: isScanning ? pulseAnim : 1 }] },
          ]}
        >
          <Ionicons
            name="radio-outline"
            size={100}
            color={isScanning ? '#00ff88' : '#333'}
          />
        </Animated.View>

        <View style={styles.frequencyDisplay}>
          <Text style={styles.frequencyLabel}>FREQUENCY</Text>
          <Text style={styles.frequencyValue}>{frequency.toFixed(1)} MHz</Text>
          <View style={styles.frequencyBar}>
            <View
              style={[
                styles.frequencyBarFill,
                { width: `${((frequency - 88.0) / 20.0) * 100}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: isScanning ? '#00ff88' : '#333' }]} />
          <Text style={styles.statusText}>
            {isScanning ? 'SCANNING...' : 'READY'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.scanButton,
            isScanning && styles.scanButtonActive,
          ]}
          onPress={toggleScanning}
        >
          <Ionicons
            name={isScanning ? 'stop' : 'play'}
            size={32}
            color="#000"
          />
          <Text style={styles.scanButtonText}>
            {isScanning ? 'STOP' : 'START'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.infoText}>
          The Spirit Box rapidly scans radio frequencies to allow spirit communication
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
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningIndicator: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00ff8833',
    marginBottom: 40,
  },
  frequencyDisplay: {
    width: '100%',
    marginBottom: 40,
  },
  frequencyLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
  },
  frequencyValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00ff88',
    textAlign: 'center',
    marginBottom: 16,
  },
  frequencyBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  frequencyBarFill: {
    height: '100%',
    backgroundColor: '#00ff88',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ff88',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 40,
  },
  scanButtonActive: {
    backgroundColor: '#ff4444',
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});