import React, { createContext, useContext, useEffect, useState } from 'react';
import { databaseService } from '../services/database';

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
  bio: string;
  profilePicture?: string;
}

interface JournalContextType {
  entries: JournalEntry[];
  addEntry: (entry: Omit<JournalEntry, 'id' | 'date'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'date'>>) => Promise<void>;
  archiveEntry: (id: string) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  isLoading: boolean;
  userProfile: UserProfile;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

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
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: '', bio: '' });

  // Initialize database and load data on component mount
  useEffect(() => {
    initializeAndLoadData();
  }, []);  const initializeAndLoadData = async () => {
    try {
      // Initialize the database (includes migration from AsyncStorage)
      await databaseService.init();
      
      // Load entries from SQLite
      const loadedEntries = await databaseService.getAllEntries();
      setEntries(loadedEntries);

      // Load or generate user profile
      let profile = await databaseService.getUserProfile();
      
      if (!profile) {
        // Generate random name for first-time users
        const randomName = generateRandomName();
        profile = { name: randomName, bio: '' };
        await databaseService.insertUserProfile(profile);

      }
      
      setUserProfile(profile);
      console.log('✅ Database initialization complete!');
    } catch (error) {
      console.error('❌ Error initializing data:', error);
      setEntries([]);
      // Generate fallback name if loading fails
      setUserProfile({ name: generateRandomName(), bio: '' });
    } finally {
      setIsLoading(false);
    }
  };  const addEntry = async (newEntry: Omit<JournalEntry, 'id' | 'date'>) => {
    try {
      const entry: JournalEntry = {
        ...newEntry,
        id: Date.now().toString(), // Simple ID generation
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      };

      // Insert into database
      await databaseService.insertEntry(entry);

      // Update local state
      const updatedEntries = [entry, ...entries]; // Add new entry at the beginning
      setEntries(updatedEntries);
      
      console.log('✅ Entry saved successfully');
    } catch (error) {
      console.error('❌ Error saving entry:', error);
      throw error;
    }
  };

  const updateEntry = async (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'date'>>) => {
    try {
      // Update in database
      await databaseService.updateEntry(id, updates);
      
      // Update local state
      const updatedEntries = entries.map(entry => 
        entry.id === id 
          ? { ...entry, ...updates }
          : entry
      );
      setEntries(updatedEntries);
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  };

  const archiveEntry = async (id: string) => {
    try {
      // Update in database
      await databaseService.updateEntry(id, { isArchived: true });
      
      // Update local state
      const updatedEntries = entries.map(entry => 
        entry.id === id 
          ? { ...entry, isArchived: true }
          : entry
      );
      setEntries(updatedEntries);
    } catch (error) {
      console.error('Error archiving entry:', error);
      throw error;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      // Delete from database
      await databaseService.deleteEntry(id);
      
      // Update local state
      const updatedEntries = entries.filter(entry => entry.id !== id);
      setEntries(updatedEntries);
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      const entry = entries.find(e => e.id === id);
      if (!entry) return;

      const newFavoriteStatus = !entry.isFavorite;
      
      // Update in database
      await databaseService.updateEntry(id, { isFavorite: newFavoriteStatus });
      
      // Update local state
      const updatedEntries = entries.map(entry => 
        entry.id === id 
          ? { ...entry, isFavorite: newFavoriteStatus }
          : entry
      );
      setEntries(updatedEntries);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    try {
      const updatedProfile = { ...userProfile, ...updates };
      
      // Update in database
      await databaseService.updateUserProfile(updates);
      
      // Update local state
      setUserProfile(updatedProfile);
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
      deleteEntry,
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
