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
  isFavorite?: boolean;
}

export interface UserProfile {
  name: string;
  profilePicture?: string;
}

interface JournalContextType {
  entries: JournalEntry[];
  addEntry: (entry: Omit<JournalEntry, 'id' | 'date'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'date'>>) => Promise<void>;
  archiveEntry: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  isLoading: boolean;
  userProfile: UserProfile;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

const STORAGE_KEY = '@journal_entries';
const PROFILE_STORAGE_KEY = '@user_profile';

// Generate a random profile name
const generateRandomName = (): string => {
  const firstNames = [
    'Cocoa', 'Caramel', 'Nougat', 'Pixel', 'Zephyr', 'Wisp', 'Glimmer', 'Echo', 'Juno', 'Orion',
    'Nebula', 'Comet', 'Stardust', 'Elara', 'Lyra', 'Calypso', 'Solstice', 'Equinox', 'Nimbus', 'Cirrus'
  ];
  
  const lastNames = [
    'Whiskerbloom', 'Moonpaw', 'Shadowclaw', 'Stargazer', 'Riverbend', 'Sunpetal', 'Dreamweaver', 'Skyrunner', 'Frostfang', 'Silentstep',
    'Cinderfall', 'Mistwalker', 'Thornwood', 'Silvermane', 'Quickfoot', 'Brightwing', 'Stonehelm', 'Ironheart', 'Goldleaf', 'Nightshade'
  ];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return `${firstName} ${lastName}`;
};

export function JournalProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: '' });

  // Load entries and profile from AsyncStorage on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load entries
      const storedEntries = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
      } else {
        setEntries([]);
      }

      // Load or generate user profile
      const storedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (storedProfile) {
        setUserProfile(JSON.parse(storedProfile));
      } else {
        // Generate random name for first-time users
        const randomName = generateRandomName();
        const newProfile: UserProfile = { name: randomName };
        setUserProfile(newProfile);
        await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setEntries([]);
      // Generate fallback name if loading fails
      setUserProfile({ name: generateRandomName() });
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

  const toggleFavorite = async (id: string) => {
    try {
      const updatedEntries = entries.map(entry => 
        entry.id === id 
          ? { ...entry, isFavorite: !entry.isFavorite }
          : entry
      );
      setEntries(updatedEntries);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  };
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    try {
      const updatedProfile = { ...userProfile, ...updates };
      setUserProfile(updatedProfile);
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };
  return (
    <JournalContext.Provider value={{ 
      entries, 
      addEntry, 
      updateEntry, 
      archiveEntry,
      toggleFavorite, 
      isLoading, 
      userProfile, 
      updateUserProfile 
    }}>
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
