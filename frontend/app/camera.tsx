import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [filterMode, setFilterMode] = useState<'normal' | 'infrared' | 'thermal'>('normal');
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={60} color="#00ff88" />
          <Text style={styles.permissionText}>Camera permission required</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const toggleFilterMode = () => {
    setFilterMode((current) => {
      if (current === 'normal') return 'infrared';
      if (current === 'infrared') return 'thermal';
      return 'normal';
    });
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        Alert.alert('Photo Captured', 'Ghost photo saved successfully!');
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to capture photo');
      }
    }
  };

  const getFilterStyle = () => {
    switch (filterMode) {
      case 'infrared':
        return {
          tintColor: '#00ff00',
          backgroundColor: '#001100',
        };
      case 'thermal':
        return {
          tintColor: '#ff0000',
          backgroundColor: '#110000',
        };
      default:
        return {};
    }
  };

  const getFilterLabel = () => {
    switch (filterMode) {
      case 'infrared':
        return 'INFRARED MODE';
      case 'thermal':
        return 'THERMAL MODE';
      default:
        return 'NORMAL MODE';
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        {filterMode !== 'normal' && (
          <View
            style={[
              styles.filterOverlay,
              getFilterStyle(),
            ]}
          />
        )}

        <View style={styles.overlay}>
          <View style={styles.topControls}>
            <View style={styles.modeIndicator}>
              <Text style={styles.modeText}>{getFilterLabel()}</Text>
            </View>
          </View>

          <View style={styles.centerOverlay}>
            <View style={styles.scanLine} />
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>

          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleFilterMode}
            >
              <Ionicons name="color-filter-outline" size={28} color="#fff" />
              <Text style={styles.controlLabel}>Filter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleCameraFacing}
            >
              <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
              <Text style={styles.controlLabel}>Flip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  permissionText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 20,
    marginBottom: 30,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  camera: {
    flex: 1,
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topControls: {
    paddingTop: 60,
    alignItems: 'center',
  },
  modeIndicator: {
    backgroundColor: '#00000088',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  modeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  centerOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLine: {
    width: '80%',
    height: 2,
    backgroundColor: '#00ff8866',
  },
  cornerTL: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: 30,
    height: 30,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#00ff88',
  },
  cornerTR: {
    position: 'absolute',
    top: '20%',
    right: '10%',
    width: 30,
    height: 30,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#00ff88',
  },
  cornerBL: {
    position: 'absolute',
    bottom: '20%',
    left: '10%',
    width: 30,
    height: 30,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#00ff88',
  },
  cornerBR: {
    position: 'absolute',
    bottom: '20%',
    right: '10%',
    width: 30,
    height: 30,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: '#00ff88',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  controlButton: {
    alignItems: 'center',
    gap: 4,
  },
  controlLabel: {
    fontSize: 12,
    color: '#fff',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#00ff88',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00ff88',
  },
});