import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Magnetometer } from 'expo-sensors';

export default function EMFDetectorScreen() {
  const [emfLevel, setEmfLevel] = useState(0);
  const [magnetometerData, setMagnetometerData] = useState({ x: 0, y: 0, z: 0 });
  const [isActive, setIsActive] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const subscription = useRef<any>(null);

  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, []);

  useEffect(() => {
    if (emfLevel > 50) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [emfLevel]);

  const startMonitoring = async () => {
    try {
      const { status } = await Magnetometer.requestPermissionsAsync();
      if (status === 'granted') {
        setIsActive(true);
        Magnetometer.setUpdateInterval(100);
        
        subscription.current = Magnetometer.addListener((data) => {
          setMagnetometerData(data);
          
          // Calculate EMF level based on magnetic field strength
          const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
          // Normalize to 0-100 scale (typical Earth's magnetic field is ~25-65 µT)
          const normalized = Math.min(100, Math.max(0, (magnitude - 25) * 3));
          setEmfLevel(Math.round(normalized));
        });
      }
    } catch (error) {
      console.error('Error starting magnetometer:', error);
    }
  };

  const stopMonitoring = () => {
    if (subscription.current) {
      subscription.current.remove();
      subscription.current = null;
    }
    setIsActive(false);
  };

  const getEMFColor = () => {
    if (emfLevel < 30) return '#00ff88';
    if (emfLevel < 60) return '#ffaa00';
    return '#ff4444';
  };

  const getEMFStatus = () => {
    if (emfLevel < 30) return 'NORMAL';
    if (emfLevel < 60) return 'ELEVATED';
    return 'HIGH ACTIVITY';
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.detector,
            { transform: [{ scale: pulseAnim }] },
            { borderColor: getEMFColor() + '33' },
          ]}
        >
          <Ionicons
            name="pulse-outline"
            size={100}
            color={getEMFColor()}
          />
        </Animated.View>

        <View style={styles.levelContainer}>
          <Text style={styles.levelLabel}>EMF LEVEL</Text>
          <Text style={[styles.levelValue, { color: getEMFColor() }]}>
            {emfLevel}%
          </Text>
          <View style={styles.levelBar}>
            <View
              style={[
                styles.levelBarFill,
                {
                  width: `${emfLevel}%`,
                  backgroundColor: getEMFColor(),
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getEMFColor() }]} />
          <Text style={[styles.statusText, { color: getEMFColor() }]}>
            {getEMFStatus()}
          </Text>
        </View>

        <View style={styles.readingsContainer}>
          <Text style={styles.readingsTitle}>Raw Magnetometer Data</Text>
          <View style={styles.readingRow}>
            <Text style={styles.readingLabel}>X:</Text>
            <Text style={styles.readingValue}>{magnetometerData.x.toFixed(2)} µT</Text>
          </View>
          <View style={styles.readingRow}>
            <Text style={styles.readingLabel}>Y:</Text>
            <Text style={styles.readingValue}>{magnetometerData.y.toFixed(2)} µT</Text>
          </View>
          <View style={styles.readingRow}>
            <Text style={styles.readingLabel}>Z:</Text>
            <Text style={styles.readingValue}>{magnetometerData.z.toFixed(2)} µT</Text>
          </View>
        </View>

        <Text style={styles.infoText}>
          EMF detector uses your device's magnetometer to detect electromagnetic field disturbances
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
  detector: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    marginBottom: 40,
  },
  levelContainer: {
    width: '100%',
    marginBottom: 40,
  },
  levelLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
  },
  levelValue: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  levelBar: {
    width: '100%',
    height: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    overflow: 'hidden',
  },
  levelBarFill: {
    height: '100%',
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  readingsContainer: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  readingsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  readingLabel: {
    fontSize: 14,
    color: '#888',
  },
  readingValue: {
    fontSize: 14,
    color: '#00ff88',
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});