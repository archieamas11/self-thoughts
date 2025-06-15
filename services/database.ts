import * as SQLite from 'expo-sqlite';
import { JournalEntry, UserProfile } from '../contexts/JournalContext';

const DB_NAME = 'selfThoughtsDB';

class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async ensureConnection(): Promise<void> {
    if (!this.db || !this.isInitialized) {
      await this.init();
    }
  }
  async init(): Promise<void> {
    try {
      if (this.isInitialized && this.db) {
        return;
      }

      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.createTables();
      await this.migrateFromAsyncStorage();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      this.isInitialized = false;
      this.db = null;
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create journal_entries table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        date TEXT NOT NULL,
        mood TEXT NOT NULL,
        moodLabel TEXT NOT NULL,
        isArchived INTEGER DEFAULT 0,
        isFavorite INTEGER DEFAULT 0,
        createdAt INTEGER DEFAULT (strftime('%s', 'now')),
        updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);

    // Create user_profile table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        name TEXT NOT NULL,
        profilePicture TEXT,
        createdAt INTEGER DEFAULT (strftime('%s', 'now')),
        updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);

    // Create indexes for better performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_entries_date ON journal_entries(date);
      CREATE INDEX IF NOT EXISTS idx_entries_archived ON journal_entries(isArchived);
      CREATE INDEX IF NOT EXISTS idx_entries_favorite ON journal_entries(isFavorite);
    `);
  }
  private async migrateFromAsyncStorage(): Promise<void> {
    try {
      // Check if data already exists in SQLite
      const entriesCount = await this.getEntriesCount();
      const profileExists = await this.getProfileExists();

      // Only migrate if SQLite is empty
      if (entriesCount === 0 && !profileExists) {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          
          // Migrate entries
          const storedEntries = await AsyncStorage.getItem('@journal_entries');
          if (storedEntries) {
            const entries: JournalEntry[] = JSON.parse(storedEntries);
            for (const entry of entries) {
              await this.insertEntry(entry);
            }
            console.log(`Migrated ${entries.length} entries from AsyncStorage to SQLite`);
          }

          // Migrate user profile
          const storedProfile = await AsyncStorage.getItem('@user_profile');
          if (storedProfile) {
            const profile: UserProfile = JSON.parse(storedProfile);
            await this.insertUserProfile(profile);
            console.log('Migrated user profile from AsyncStorage to SQLite');
          }

          // Clean up AsyncStorage after successful migration
          await AsyncStorage.removeItem('@journal_entries');
          await AsyncStorage.removeItem('@user_profile');
          console.log('Cleaned up AsyncStorage after migration');
        } catch (asyncStorageError: any) {
          console.log('AsyncStorage not available or no data to migrate:', asyncStorageError?.message || 'Unknown error');
          // This is expected in fresh installations or when AsyncStorage is not available
        }
        
        // Add sample entries if database is still empty
        const finalEntriesCount = await this.getEntriesCount();
        if (finalEntriesCount === 0) {
          await this.addSampleEntries();
        }
      }
    } catch (error) {
      console.error('Error during AsyncStorage migration:', error);
      // Migration failure shouldn't break the app
    }
  }

  private async addSampleEntries(): Promise<void> {
    const sampleEntries: JournalEntry[] = [
      {
        id: 'welcome-entry',
        title: 'Welcome to Your Journal! 🎉',
        content: 'This is your first journal entry! You can write about anything here - your thoughts, feelings, daily experiences, or dreams for the future. Feel free to delete this entry once you\'ve created your own. Happy journaling! ✨',
        date: new Date().toISOString().split('T')[0],
        mood: '😊',
        moodLabel: 'Happy',
        isArchived: false,
        isFavorite: true,
      },
      {
        id: 'sample-thoughtful',
        title: 'A Moment of Reflection',
        content: 'Taking time to reflect on my goals and what I\'m grateful for. Writing helps me organize my thoughts and gain clarity about what truly matters in my life.',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
        mood: '🤔',
        moodLabel: 'Thoughtful',
        isArchived: false,
        isFavorite: false,
      },
    ];

    for (const entry of sampleEntries) {
      await this.insertEntry(entry);
    }
    
    console.log(`Added ${sampleEntries.length} sample entries to get you started!`);
  }

  private async getEntriesCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM journal_entries');
    return result?.count || 0;
  }

  private async getProfileExists(): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM user_profile');
    return (result?.count || 0) > 0;
  }
  // Journal Entries CRUD operations
  async getAllEntries(): Promise<JournalEntry[]> {
    await this.ensureConnection();
    if (!this.db) throw new Error('Database not initialized');

    const entries = await this.db.getAllAsync<any>(`
      SELECT * FROM journal_entries 
      ORDER BY date DESC, createdAt DESC
    `);

    return entries.map(entry => ({
      id: entry.id,
      title: entry.title,
      content: entry.content,
      date: entry.date,
      mood: entry.mood,
      moodLabel: entry.moodLabel,
      isArchived: Boolean(entry.isArchived),
      isFavorite: Boolean(entry.isFavorite),
    }));
  }
  async insertEntry(entry: JournalEntry): Promise<void> {
    await this.ensureConnection();
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      await this.db.runAsync(`
        INSERT INTO journal_entries (id, title, content, date, mood, moodLabel, isArchived, isFavorite)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        entry.id,
        entry.title,
        entry.content,
        entry.date,
        entry.mood,
        entry.moodLabel,
        entry.isArchived ? 1 : 0,
        entry.isFavorite ? 1 : 0,
      ]);
    } catch (error) {
      console.error('❌ Error inserting entry:', error);
      // Reset connection on error
      this.isInitialized = false;
      this.db = null;
      throw error;
    }
  }
  async updateEntry(id: string, updates: Partial<Omit<JournalEntry, 'id' | 'date'>>): Promise<void> {
    await this.ensureConnection();
    if (!this.db) throw new Error('Database not initialized');

    const setClause: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      setClause.push('title = ?');
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      setClause.push('content = ?');
      values.push(updates.content);
    }
    if (updates.mood !== undefined) {
      setClause.push('mood = ?');
      values.push(updates.mood);
    }
    if (updates.moodLabel !== undefined) {
      setClause.push('moodLabel = ?');
      values.push(updates.moodLabel);
    }
    if (updates.isArchived !== undefined) {
      setClause.push('isArchived = ?');
      values.push(updates.isArchived ? 1 : 0);
    }
    if (updates.isFavorite !== undefined) {
      setClause.push('isFavorite = ?');
      values.push(updates.isFavorite ? 1 : 0);
    }

    if (setClause.length > 0) {
      setClause.push('updatedAt = strftime("%s", "now")');
      values.push(id);

      try {
        await this.db.runAsync(`
          UPDATE journal_entries 
          SET ${setClause.join(', ')} 
          WHERE id = ?
        `, values);
      } catch (error) {
        console.error('❌ Error updating entry:', error);
        // Reset connection on error
        this.isInitialized = false;
        this.db = null;
        throw error;
      }
    }
  }

  async deleteEntry(id: string): Promise<void> {
    await this.ensureConnection();
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync('DELETE FROM journal_entries WHERE id = ?', [id]);
      console.log('✅ Entry deleted successfully:', id);
    } catch (error) {
      console.error('❌ Error deleting entry:', error);
      // Reset connection on error
      this.isInitialized = false;
      this.db = null;
      throw error;
    }
  }

  // User Profile operations
  async getUserProfile(): Promise<UserProfile | null> {
    await this.ensureConnection();
    if (!this.db) throw new Error('Database not initialized');

    const profile = await this.db.getFirstAsync<any>('SELECT * FROM user_profile WHERE id = 1');
    
    if (profile) {
      return {
        name: profile.name,
        profilePicture: profile.profilePicture,
      };
    }
    
    return null;
  }

  async insertUserProfile(profile: UserProfile): Promise<void> {
    await this.ensureConnection();
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(`
        INSERT OR REPLACE INTO user_profile (id, name, profilePicture)
        VALUES (1, ?, ?)
      `, [profile.name, profile.profilePicture || null]);
      console.log('✅ User profile inserted successfully');
    } catch (error) {
      console.error('❌ Error inserting user profile:', error);
      // Reset connection on error
      this.isInitialized = false;
      this.db = null;
      throw error;
    }
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    await this.ensureConnection();
    if (!this.db) throw new Error('Database not initialized');

    const setClause: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      setClause.push('name = ?');
      values.push(updates.name);
    }
    if (updates.profilePicture !== undefined) {
      setClause.push('profilePicture = ?');
      values.push(updates.profilePicture);
    }

    if (setClause.length > 0) {
      setClause.push('updatedAt = strftime("%s", "now")');

      try {
        await this.db.runAsync(`
          UPDATE user_profile 
          SET ${setClause.join(', ')} 
          WHERE id = 1
        `, values);
        console.log('✅ User profile updated successfully');
      } catch (error) {
        console.error('❌ Error updating user profile:', error);
        // Reset connection on error
        this.isInitialized = false;
        this.db = null;
        throw error;
      }
    }
  }

  // Utility methods
  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
    }
  }

  async clearAllData(): Promise<void> {
    await this.ensureConnection();
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.execAsync(`
        DELETE FROM journal_entries;
        DELETE FROM user_profile;
      `);
      console.log('✅ All data cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      // Reset connection on error
      this.isInitialized = false;
      this.db = null;
      throw error;
    }
  }
}

// Export a singleton instance
export const databaseService = DatabaseService.getInstance();
