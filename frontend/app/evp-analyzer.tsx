import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function EVPAnalyzerScreen() {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
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
          analysis: null,
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

  const analyzeEVP = async (uri: string, index: number) => {
    try {
      setIsAnalyzing(true);

      // Read the audio file as base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await fetch(`${BACKEND_URL}/api/analyze-evp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recording_id: `rec_${Date.now()}`,
          audio_base64: base64Audio,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const updatedRecordings = [...recordings];
        updatedRecordings[index].analysis = data.analysis;
        setRecordings(updatedRecordings);
        Alert.alert('Analysis Complete', 'EVP analysis finished successfully!');
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('EVP analysis error:', error);
      Alert.alert('Error', 'Failed to analyze recording');
    } finally {
      setIsAnalyzing(false);
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
            name={isRecording ? 'analytics' : 'analytics-outline'}
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
            {isRecording ? 'STOP' : 'RECORD EVP'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.infoText}>
          Record in silence for best EVP detection results
        </Text>
      </View>

      <View style={styles.divider} />

      <ScrollView style={styles.recordingsList}>
        <Text style={styles.listTitle}>EVP Recordings ({recordings.length})</Text>
        {recordings.map((rec, index) => (
          <View key={index} style={styles.recordingItem}>
            <View style={styles.recordingHeader}>
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
                  onPress={() => analyzeEVP(rec.uri, index)}
                  disabled={isAnalyzing || rec.analysis !== null}
                >
                  {isAnalyzing ? (
                    <ActivityIndicator size="small" color="#00ff88" />
                  ) : (
                    <Ionicons
                      name={rec.analysis ? 'checkmark-circle' : 'search'}
                      size={20}
                      color={rec.analysis ? '#00ff88' : '#888'}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {rec.analysis && (
              <View style={styles.analysisContainer}>
                <Text style={styles.analysisTitle}>AI Analysis</Text>
                
                {rec.analysis.transcription && (
                  <View style={styles.analysisSection}>
                    <Text style={styles.analysisLabel}>Transcription:</Text>
                    <Text style={styles.analysisText}>
                      {rec.analysis.transcription || 'No speech detected'}
                    </Text>
                  </View>
                )}

                {rec.analysis.anomalies_detected?.length > 0 && (
                  <View style={styles.analysisSection}>
                    <Text style={styles.analysisLabel}>Anomalies Detected:</Text>
                    {rec.analysis.anomalies_detected.map((anomaly: string, i: number) => (
                      <View key={i} style={styles.anomalyItem}>
                        <Ionicons name="warning" size={16} color="#ffaa00" />
                        <Text style={styles.anomalyText}>{anomaly}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.analysisSection}>
                  <Text style={styles.analysisLabel}>Detailed Analysis:</Text>
                  <Text style={styles.analysisText}>{rec.analysis.ai_analysis}</Text>
                </View>

                <View style={styles.confidenceContainer}>
                  <Text style={styles.confidenceLabel}>Confidence:</Text>
                  <View style={styles.confidenceBar}>
                    <View
                      style={[
                        styles.confidenceBarFill,
                        { width: `${rec.analysis.confidence}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.confidenceValue}>{rec.analysis.confidence}%</Text>
                </View>
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
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 16,
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
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
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
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordingInfo: {
    flex: 1,
  },
  recordingDuration: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  recordingTimestamp: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
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
  analysisContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 12,
  },
  analysisSection: {
    marginBottom: 12,
  },
  analysisLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  analysisText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  anomalyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  anomalyText: {
    fontSize: 14,
    color: '#ffaa00',
  },
  confidenceContainer: {
    marginTop: 12,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  confidenceBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#0a0a0a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  confidenceBarFill: {
    height: '100%',
    backgroundColor: '#00ff88',
  },
  confidenceValue: {
    fontSize: 12,
    color: '#00ff88',
    textAlign: 'right',
  },
});