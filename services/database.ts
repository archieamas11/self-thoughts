import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { JournalEntry, UserProfile } from '../contexts/JournalContext';

const DB_NAME = 'selfThoughtsDB';

class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async ensureConnection(): Promise<void> {
    // If we have an active initialization in progress, wait for it
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    // If we think we're initialized but the connection is null, reinitialize
    if (this.isInitialized && !this.db) {
      console.log(
        '⚠️ Database marked as initialized but connection is null, reinitializing...',
      );
      this.isInitialized = false;
    }

    // If not initialized or no database connection, initialize
    if (!this.isInitialized || !this.db) {
      await this.init();
    }

    // Final check to ensure we have a valid connection
    if (!this.db) {
      throw new Error('Database connection could not be established');
    }
  }

  async init(): Promise<void> {
    // Prevent multiple simultaneous initialization attempts
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInit();
    return this.initPromise;
  }

  private async _doInit(): Promise<void> {
    try {
      if (this.isInitialized && this.db) {
        return;
      }

      console.log(`🔧 Initializing database on platform: ${Platform.OS}`);

      // Close existing connection if any
      if (this.db) {
        try {
          await this.db.closeAsync();
        } catch (closeError) {
          console.warn('Warning: Error closing existing database:', closeError);
        }
        this.db = null;
      }

      // Platform-specific database opening with retry logic
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          if (Platform.OS === 'web') {
            // For web, we need different handling
            console.log('🌐 Opening database for web platform');
            this.db = await SQLite.openDatabaseAsync(':memory:');
          } else {
            // For native platforms
            console.log('📱 Opening database for native platform');
            this.db = await SQLite.openDatabaseAsync(DB_NAME);
          }

          if (this.db) {
            break; // Successfully opened
          }
        } catch (openError) {
          retryCount++;
          console.warn(
            `Database open attempt ${retryCount} failed:`,
            openError,
          );

          if (retryCount < maxRetries) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * retryCount),
            );
          } else {
            throw openError;
          }
        }
      }

      if (!this.db) {
        throw new Error('Failed to open database after multiple attempts');
      }

      console.log('✅ Database opened successfully');

      // Test the connection before proceeding
      await this.testConnection();

      await this.createTables();

      this.isInitialized = true;
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      this.isInitialized = false;
      this.db = null;
      this.initPromise = null;
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log('🔧 Creating tables...');

      // Test connection before creating tables
      await this.testConnection();

      // Create journal_entries table with better error handling
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
          name TEXT NOT NULL DEFAULT '',
          bio TEXT NOT NULL DEFAULT '',
          profilePicture TEXT,
          createdAt INTEGER DEFAULT (strftime('%s', 'now')),
          updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
        );
      `);

      // Create indexes for better performance
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_entries_date ON journal_entries(date);
      `);

      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_entries_archived ON journal_entries(isArchived);
      `);

      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_entries_favorite ON journal_entries(isFavorite);
      `);

      console.log('✅ Tables created successfully');
    } catch (error) {
      console.error('❌ Error creating tables:', error);
      throw error;
    }
  }

  // Test database connection
  private async testConnection(): Promise<void> {
    if (!this.db) {
      throw new Error('Database connection is null');
    }

    try {
      // Simple test query
      await this.db.getFirstAsync('SELECT 1 as test');
      console.log('✅ Database connection test passed');
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      throw new Error(`Database connection test failed: ${error}`);
    }
  }

  // Journal Entries CRUD operations
  async getAllEntries(): Promise<JournalEntry[]> {
    try {
      await this.ensureConnection();
      if (!this.db) throw new Error('Database not initialized');

      console.log('📖 Fetching all entries...');

      const entries = await this.db.getAllAsync<any>(`
        SELECT * FROM journal_entries 
        ORDER BY date DESC, createdAt DESC
      `);

      console.log(`✅ Retrieved ${entries.length} entries`);

      return entries.map((entry) => ({
        id: entry.id,
        title: entry.title,
        content: entry.content,
        date: entry.date,
        mood: entry.mood,
        moodLabel: entry.moodLabel,
        isArchived: Boolean(entry.isArchived),
        isFavorite: Boolean(entry.isFavorite),
      }));
    } catch (error) {
      console.error('❌ Error getting all entries:', error);
      await this.handleDatabaseError(error);
      throw error;
    }
  }

  async insertEntry(entry: JournalEntry): Promise<void> {
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        await this.ensureConnection();
        if (!this.db) throw new Error('Database not initialized');

        console.log('➕ Inserting entry:', entry.id);

        // Test connection before attempting insert
        await this.testConnection();

        const result = await this.db.runAsync(
          `
          INSERT INTO journal_entries (id, title, content, date, mood, moodLabel, isArchived, isFavorite)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            entry.id,
            entry.title,
            entry.content,
            entry.date,
            entry.mood,
            entry.moodLabel,
            entry.isArchived ? 1 : 0,
            entry.isFavorite ? 1 : 0,
          ],
        );

        console.log(
          '✅ Entry inserted successfully:',
          entry.id,
          'Result:',
          result,
        );
        return; // Success, exit retry loop
      } catch (error) {
        retryCount++;
        console.error(
          `❌ Error inserting entry (attempt ${retryCount}):`,
          error,
        );

        if (retryCount < maxRetries) {
          console.log(
            `🔄 Retrying insert operation... (${retryCount}/${maxRetries})`,
          );
          await this.handleDatabaseError(error);
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount),
          );
        } else {
          console.error('❌ Max retries reached for insert operation');
          throw error;
        }
      }
    }
  }

  async updateEntry(
    id: string,
    updates: Partial<Omit<JournalEntry, 'id' | 'date'>>,
  ): Promise<void> {
    try {
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

        console.log('📝 Updating entry:', id);

        await this.db.runAsync(
          `
          UPDATE journal_entries 
          SET ${setClause.join(', ')} 
          WHERE id = ?
        `,
          values,
        );

        console.log('✅ Entry updated successfully:', id);
      }
    } catch (error) {
      console.error('❌ Error updating entry:', error);
      await this.handleDatabaseError(error);
      throw error;
    }
  }

  async deleteEntry(id: string): Promise<void> {
    try {
      await this.ensureConnection();
      if (!this.db) throw new Error('Database not initialized');

      console.log('🗑️ Deleting entry:', id);

      await this.db.runAsync('DELETE FROM journal_entries WHERE id = ?', [id]);
      console.log('✅ Entry deleted successfully:', id);
    } catch (error) {
      console.error('❌ Error deleting entry:', error);
      await this.handleDatabaseError(error);
      throw error;
    }
  }

  // User Profile operations
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      await this.ensureConnection();
      if (!this.db) throw new Error('Database not initialized');

      console.log('👤 Fetching user profile...');

      const profile = await this.db.getFirstAsync<any>(
        'SELECT * FROM user_profile WHERE id = 1',
      );

      if (profile) {
        console.log('✅ User profile found');
        return {
          name: profile.name || '',
          bio: profile.bio || '',
          profilePicture: profile.profilePicture,
        };
      }

      console.log('ℹ️ No user profile found');
      return null;
    } catch (error) {
      console.error('❌ Error getting user profile:', error);
      await this.handleDatabaseError(error);
      throw error;
    }
  }

  async insertUserProfile(profile: UserProfile): Promise<void> {
    try {
      await this.ensureConnection();
      if (!this.db) throw new Error('Database not initialized');

      console.log('👤 Inserting user profile...');

      await this.db.runAsync(
        `
        INSERT OR REPLACE INTO user_profile (id, name, bio, profilePicture)
        VALUES (1, ?, ?, ?)
      `,
        [profile.name || '', profile.bio || '', profile.profilePicture || null],
      );

      console.log('✅ User profile inserted successfully');
    } catch (error) {
      console.error('❌ Error inserting user profile:', error);
      await this.handleDatabaseError(error);
      throw error;
    }
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    try {
      await this.ensureConnection();
      if (!this.db) throw new Error('Database not initialized');

      const setClause: string[] = [];
      const values: any[] = [];

      if (updates.name !== undefined) {
        setClause.push('name = ?');
        values.push(updates.name);
      }
      if (updates.bio !== undefined) {
        setClause.push('bio = ?');
        values.push(updates.bio);
      }
      if (updates.profilePicture !== undefined) {
        setClause.push('profilePicture = ?');
        values.push(updates.profilePicture);
      }

      if (setClause.length > 0) {
        setClause.push('updatedAt = strftime("%s", "now")');

        console.log('👤 Updating user profile...');

        await this.db.runAsync(
          `
          UPDATE user_profile 
          SET ${setClause.join(', ')} 
          WHERE id = 1
        `,
          values,
        );

        console.log('✅ User profile updated successfully');
      }
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      await this.handleDatabaseError(error);
      throw error;
    }
  }

  // Error handling method
  private async handleDatabaseError(error: any): Promise<void> {
    console.error('🔄 Handling database error, attempting to reinitialize...');

    // Reset state
    this.isInitialized = false;
    this.initPromise = null;

    // Close existing connection if it exists
    if (this.db) {
      try {
        await this.db.closeAsync();
      } catch (closeError) {
        console.warn(
          'Warning: Error closing database during error handling:',
          closeError,
        );
      }
      this.db = null;
    }

    // Try to reinitialize after a short delay
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log('🔄 Attempting to reinitialize database...');
      await this.init();
      console.log('✅ Database reinitialized successfully');
    } catch (reinitError) {
      console.error('❌ Failed to reinitialize database:', reinitError);
      // Don't throw here, let the calling method handle the retry logic
    }
  }

  // Utility methods
  async closeDatabase(): Promise<void> {
    try {
      if (this.db) {
        await this.db.closeAsync();
        console.log('✅ Database closed successfully');
      }
    } catch (error) {
      console.error('❌ Error closing database:', error);
    } finally {
      this.db = null;
      this.isInitialized = false;
      this.initPromise = null;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await this.ensureConnection();
      if (!this.db) throw new Error('Database not initialized');

      console.log('🧹 Clearing all data...');

      await this.db.execAsync(`
        DELETE FROM journal_entries;
        DELETE FROM user_profile;
      `);

      console.log('✅ All data cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      await this.handleDatabaseError(error);
      throw error;
    }
  }

  // Health check method
  async isHealthy(): Promise<boolean> {
    try {
      await this.ensureConnection();
      if (!this.db) return false;

      // Simple query to test connection
      await this.db.getFirstAsync('SELECT 1');
      return true;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const databaseService = DatabaseService.getInstance();
