import { databaseService } from '../services/database';

/**
 * Utility functions for database operations during development
 * These can be called from the console or used in debugging
 */

export const DatabaseUtils = {
  /**
   * Initialize the database
   */
  async init() {
    try {
      await databaseService.init();
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
    }
  },

  /**
   * Get all entries from the database
   */
  async getAllEntries() {
    try {
      const entries = await databaseService.getAllEntries();
      console.log(`📖 Found ${entries.length} entries:`, entries);
      return entries;
    } catch (error) {
      console.error('❌ Failed to get entries:', error);
      return [];
    }
  },

  /**
   * Get user profile
   */
  async getUserProfile() {
    try {
      const profile = await databaseService.getUserProfile();
      console.log('👤 User profile:', profile);
      return profile;
    } catch (error) {
      console.error('❌ Failed to get user profile:', error);
      return null;
    }
  },

  /**
   * Clear all data (use with caution!)
   */
  async clearAllData() {
    try {
      await databaseService.clearAllData();
      console.log('🗑️ All data cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear data:', error);
    }
  },

  /**
   * Add sample data for testing
   */
  async addSampleData() {
    try {
      const sampleEntries = [
        {
          id: '1',
          title: 'My First SQLite Entry',
          content:
            'This is a test entry created after migrating to SQLite! The migration was successful.',
          date: new Date().toISOString().split('T')[0],
          mood: '😊',
          moodLabel: 'Happy',
          isArchived: false,
          isFavorite: false,
        },
        {
          id: '2',
          title: 'Another Test Entry',
          content:
            'This is another test entry to verify that multiple entries work correctly in SQLite.',
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
          mood: '🤔',
          moodLabel: 'Thoughtful',
          isArchived: false,
          isFavorite: true,
        },
        {
          id: '3',
          title: 'Archived Entry',
          content:
            'This entry should be archived to test the archive functionality.',
          date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
          mood: '😴',
          moodLabel: 'Tired',
          isArchived: true,
          isFavorite: false,
        },
      ];

      for (const entry of sampleEntries) {
        await databaseService.insertEntry(entry);
      }

      console.log(`✅ Added ${sampleEntries.length} sample entries`);
    } catch (error) {
      console.error('❌ Failed to add sample data:', error);
    }
  },

  /**
   * Database health check
   */
  async healthCheck() {
    try {
      await databaseService.init();
      const entries = await databaseService.getAllEntries();
      const profile = await databaseService.getUserProfile();

      console.log('🔍 Database Health Check:');
      console.log(`  📊 Total entries: ${entries.length}`);
      console.log(`  👤 User profile exists: ${profile ? 'Yes' : 'No'}`);
      console.log(
        `  📝 Active entries: ${entries.filter((e) => !e.isArchived).length}`
      );
      console.log(
        `  📦 Archived entries: ${entries.filter((e) => e.isArchived).length}`
      );
      console.log(
        `  ⭐ Favorite entries: ${entries.filter((e) => e.isFavorite).length}`
      );
      console.log('✅ Database is healthy');

      return {
        totalEntries: entries.length,
        hasProfile: !!profile,
        activeEntries: entries.filter((e) => !e.isArchived).length,
        archivedEntries: entries.filter((e) => e.isArchived).length,
        favoriteEntries: entries.filter((e) => e.isFavorite).length,
      };
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return null;
    }
  },
};

// Export for console usage
if (typeof global !== 'undefined') {
  (global as any).DatabaseUtils = DatabaseUtils;
}
