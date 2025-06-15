import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { JournalEntry } from '../contexts/JournalContext';
import { databaseService } from '../services/database';

export default function DatabaseDebugger() {
  const [status, setStatus] = useState('Not initialized');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const testDatabase = async () => {
    try {
      setStatus('Initializing...');
      setError(null);
      
      await databaseService.init();
      setStatus('Initialized');
      
      const loadedEntries = await databaseService.getAllEntries();
      setEntries(loadedEntries);
      setStatus(`Loaded ${loadedEntries.length} entries`);
    } catch (err: any) {
      setError(err.message);
      setStatus('Error');
    }
  };

  const addTestEntry = async () => {
    try {
      const testEntry: JournalEntry = {
        id: `test-${Date.now()}`,
        title: 'Test Entry',
        content: 'This is a test entry from the debugger',
        date: new Date().toISOString().split('T')[0],
        mood: '🧪',
        moodLabel: 'Testing',
        isArchived: false,
        isFavorite: false,
      };

      await databaseService.insertEntry(testEntry);
      await testDatabase(); // Refresh
    } catch (err: any) {
      setError(err.message);
    }
  };

  const clearDatabase = async () => {
    try {
      await databaseService.clearAllData();
      await testDatabase(); // Refresh
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    testDatabase();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Database Debugger</Text>
      
      <View style={styles.statusSection}>
        <Text style={styles.statusLabel}>Status: {status}</Text>
        {error && <Text style={styles.error}>Error: {error}</Text>}
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity style={styles.button} onPress={testDatabase}>
          <Text style={styles.buttonText}>Test Database</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={addTestEntry}>
          <Text style={styles.buttonText}>Add Test Entry</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearDatabase}>
          <Text style={styles.buttonText}>Clear Database</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.entriesSection}>
        <Text style={styles.sectionTitle}>Entries ({entries.length}):</Text>
        {entries.map((entry, index) => (
          <View key={entry.id} style={styles.entryItem}>
            <Text style={styles.entryTitle}>{entry.title}</Text>
            <Text style={styles.entryContent}>{entry.content}</Text>
            <Text style={styles.entryMeta}>{entry.mood} • {entry.date}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: 'red',
    marginTop: 5,
  },
  buttonSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  entriesSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  entryItem: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  entryTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  entryContent: {
    marginTop: 5,
    color: '#666',
  },
  entryMeta: {
    marginTop: 5,
    fontSize: 12,
    color: '#999',
  },
});
