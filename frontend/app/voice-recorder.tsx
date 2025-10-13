import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function VoiceRecorderScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permission, setPermission] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const requestPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    setPermission(status === 'granted');
  };

  const startRecording = async () => {
    try {
      if (!permission) {
        Alert.alert('Permission Required', 'Please grant microphone permission');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        const newRecording = {
          uri,
          duration: recordingDuration,
          timestamp: new Date().toISOString(),
          transcription: '',
        };
        setRecordings([newRecording, ...recordings]);
      }

      setRecording(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const transcribeRecording = async (uri: string, index: number) => {
    try {
      setIsTranscribing(true);

      // Read the audio file as base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      const response = await fetch(`${BACKEND_URL}/api/transcribe`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();

      if (data.success) {
        const updatedRecordings = [...recordings];
        updatedRecordings[index].transcription = data.transcription;
        setRecordings(updatedRecordings);
        Alert.alert('Success', 'Transcription complete!');
      } else {
        throw new Error('Transcription failed');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      Alert.alert('Error', 'Failed to transcribe audio');
    } finally {
      setIsTranscribing(false);
    }
  };

  const playRecording = async (uri: string) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();
    } catch (error) {
      console.error('Playback error:', error);
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.recorderSection}>
        <View style={styles.recordingIndicator}>
          {isRecording && <View style={styles.recordingPulse} />}
          <Ionicons
            name={isRecording ? 'mic' : 'mic-outline'}
            size={60}
            color={isRecording ? '#ff4444' : '#00ff88'}
          />
        </View>

        <Text style={styles.duration}>{formatDuration(recordingDuration)}</Text>

        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonActive,
          ]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Ionicons
            name={isRecording ? 'stop' : 'radio-button-on'}
            size={32}
            color="#000"
          />
          <Text style={styles.recordButtonText}>
            {isRecording ? 'STOP' : 'RECORD'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <ScrollView style={styles.recordingsList}>
        <Text style={styles.listTitle}>Recordings ({recordings.length})</Text>
        {recordings.map((rec, index) => (
          <View key={index} style={styles.recordingItem}>
            <View style={styles.recordingInfo}>
              <Text style={styles.recordingDuration}>
                {formatDuration(rec.duration)}
              </Text>
              <Text style={styles.recordingTimestamp}>
                {new Date(rec.timestamp).toLocaleTimeString()}
              </Text>
            </View>

            <View style={styles.recordingActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => playRecording(rec.uri)}
              >
                <Ionicons name="play" size={20} color="#00ff88" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => transcribeRecording(rec.uri, index)}
                disabled={isTranscribing}
              >
                {isTranscribing ? (
                  <ActivityIndicator size="small" color="#00ff88" />
                ) : (
                  <Ionicons name="document-text" size={20} color="#00ff88" />
                )}
              </TouchableOpacity>
            </View>

            {rec.transcription && (
              <View style={styles.transcriptionContainer}>
                <Text style={styles.transcriptionLabel}>Transcription:</Text>
                <Text style={styles.transcriptionText}>{rec.transcription}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  recorderSection: {
    padding: 40,
    alignItems: 'center',
  },
  recordingIndicator: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00ff8833',
    marginBottom: 20,
  },
  recordingPulse: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#ff444433',
  },
  duration: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 20,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ff88',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
  },
  recordButtonActive: {
    backgroundColor: '#ff4444',
  },
  recordButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 20,
  },
  recordingsList: {
    flex: 1,
    padding: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  recordingItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  recordingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recordingDuration: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  recordingTimestamp: {
    fontSize: 14,
    color: '#888',
  },
  recordingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  transcriptionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  transcriptionLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  transcriptionText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
});