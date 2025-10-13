import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function SessionsScreen() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [newSession, setNewSession] = useState({
    name: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/sessions`);
      const data = await response.json();
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      Alert.alert('Error', 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async () => {
    if (!newSession.name || !newSession.location) {
      Alert.alert('Error', 'Please fill in name and location');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSession),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Session created successfully!');
        setShowNewSessionForm(false);
        setNewSession({
          name: '',
          location: '',
          date: new Date().toISOString().split('T')[0],
          notes: '',
        });
        loadSessions();
      }
    } catch (error) {
      console.error('Error creating session:', error);
      Alert.alert('Error', 'Failed to create session');
    }
  };

  const deleteSession = async (sessionId: string) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${BACKEND_URL}/api/sessions/${sessionId}`, {
                method: 'DELETE',
              });
              const data = await response.json();
              if (data.success) {
                loadSessions();
              }
            } catch (error) {
              console.error('Error deleting session:', error);
              Alert.alert('Error', 'Failed to delete session');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ff88" />
        <Text style={styles.loadingText}>Loading sessions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Investigation Sessions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowNewSessionForm(!showNewSessionForm)}
        >
          <Ionicons
            name={showNewSessionForm ? 'close' : 'add'}
            size={24}
            color="#000"
          />
        </TouchableOpacity>
      </View>

      {showNewSessionForm && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>New Investigation Session</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Session Name"
            placeholderTextColor="#666"
            value={newSession.name}
            onChangeText={(text) => setNewSession({ ...newSession, name: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Location"
            placeholderTextColor="#666"
            value={newSession.location}
            onChangeText={(text) => setNewSession({ ...newSession, location: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Date (YYYY-MM-DD)"
            placeholderTextColor="#666"
            value={newSession.date}
            onChangeText={(text) => setNewSession({ ...newSession, date: text })}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notes (optional)"
            placeholderTextColor="#666"
            value={newSession.notes}
            onChangeText={(text) => setNewSession({ ...newSession, notes: text })}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity style={styles.createButton} onPress={createSession}>
            <Text style={styles.createButtonText}>Create Session</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.sessionsList}>
        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={60} color="#333" />
            <Text style={styles.emptyStateText}>No sessions yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Create your first investigation session
            </Text>
          </View>
        ) : (
          sessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionName}>{session.name}</Text>
                  <View style={styles.sessionMetadata}>
                    <Ionicons name="location-outline" size={14} color="#888" />
                    <Text style={styles.sessionLocation}>{session.location}</Text>
                  </View>
                  <View style={styles.sessionMetadata}>
                    <Ionicons name="calendar-outline" size={14} color="#888" />
                    <Text style={styles.sessionDate}>{session.date}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteSession(session.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ff4444" />
                </TouchableOpacity>
              </View>

              {session.notes && (
                <Text style={styles.sessionNotes}>{session.notes}</Text>
              )}

              <View style={styles.sessionFooter}>
                <Text style={styles.sessionTime}>
                  Created: {new Date(session.created_at).toLocaleString()}
                </Text>
              </View>
            </View>
          ))
        )}
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    color: '#888',
    marginTop: 16,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00ff88',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 12,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: '#00ff88',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  sessionsList: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#444',
    marginTop: 8,
  },
  sessionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 8,
  },
  sessionMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  sessionLocation: {
    fontSize: 14,
    color: '#888',
  },
  sessionDate: {
    fontSize: 14,
    color: '#888',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  sessionNotes: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 12,
    lineHeight: 20,
  },
  sessionFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  sessionTime: {
    fontSize: 12,
    color: '#666',
  },
});