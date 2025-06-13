import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  mood: string;
  moodLabel: string;
  isArchived?: boolean;
}

interface JournalContextType {
  entries: JournalEntry[];
  addEntry: (entry: Omit<JournalEntry, 'id' | 'date'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'date'>>) => Promise<void>;
  archiveEntry: (id: string) => Promise<void>;
  isLoading: boolean;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

const STORAGE_KEY = '@journal_entries';

export function JournalProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load entries from AsyncStorage on component mount
  useEffect(() => {
    loadEntries();
  }, []);
  const loadEntries = async () => {
    try {
      const storedEntries = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
      } else {
        // No stored entries, start with empty array
        setEntries([]);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
      setEntries([]); // Fallback to empty array
    } finally {
      setIsLoading(false);
    }
  };
  const addEntry = async (newEntry: Omit<JournalEntry, 'id' | 'date'>) => {
    try {
      const entry: JournalEntry = {
        ...newEntry,
        id: Date.now().toString(), // Simple ID generation
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      };

      const updatedEntries = [entry, ...entries]; // Add new entry at the beginning
      setEntries(updatedEntries);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Error saving entry:', error);
      throw error;
    }
  };
  const updateEntry = async (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'date'>>) => {
    try {
      const updatedEntries = entries.map(entry => 
        entry.id === id 
          ? { ...entry, ...updates }
          : entry
      );
      setEntries(updatedEntries);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  };

  const archiveEntry = async (id: string) => {
    try {
      const updatedEntries = entries.map(entry => 
        entry.id === id 
          ? { ...entry, isArchived: true }
          : entry
      );
      setEntries(updatedEntries);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Error archiving entry:', error);
      throw error;
    }
  };

  return (
    <JournalContext.Provider value={{ entries, addEntry, updateEntry, archiveEntry, isLoading }}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournal() {
  const context = useContext(JournalContext);
  if (context === undefined) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
}
