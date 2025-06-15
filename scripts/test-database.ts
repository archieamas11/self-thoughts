import { databaseService } from '../services/database';

/**
 * Simple test script to verify database functionality
 * Run this to add sample data if the database appears empty
 */
async function testDatabase() {
  try {
    console.log('🧪 Starting database test...');
    
    // Initialize database
    await databaseService.init();
    console.log('✅ Database initialized');
    
    // Check current entries
    const currentEntries = await databaseService.getAllEntries();
    console.log(`📊 Current entries count: ${currentEntries.length}`);
    
    // If no entries, add sample data
    if (currentEntries.length === 0) {
      console.log('📝 Adding sample entries...');
      
      const sampleEntries = [
        {
          id: 'sample-1',
          title: 'Welcome to Your Journal!',
          content: 'This is your first journal entry! You can write about anything here - your thoughts, feelings, daily experiences, or dreams for the future. Happy journaling! 🌟',
          date: new Date().toISOString().split('T')[0],
          mood: '😊',
          moodLabel: 'Happy',
          isArchived: false,
          isFavorite: true,
        },
        {
          id: 'sample-2',
          title: 'A Thoughtful Moment',
          content: 'Today I took some time to reflect on my goals and what makes me grateful. It\'s amazing how writing can help clarify our thoughts and feelings.',
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
          mood: '🤔',
          moodLabel: 'Thoughtful',
          isArchived: false,
          isFavorite: false,
        },
        {
          id: 'sample-3',
          title: 'Testing Archive Feature',
          content: 'This entry is just for testing the archive functionality. When you long-press on an entry, you can archive it!',
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
    }
    
    // Check user profile
    let profile = await databaseService.getUserProfile();
    if (!profile) {
      console.log('👤 Creating default user profile...');
      profile = { name: 'Journal Writer', bio: '' };
      await databaseService.insertUserProfile(profile);

      console.log('✅ User profile created');
    }
    
    // Final verification
    const finalEntries = await databaseService.getAllEntries();
    console.log(`🎉 Database test complete! Total entries: ${finalEntries.length}`);
    
    return {
      success: true,
      entriesCount: finalEntries.length,
      profile: profile,
    };
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return {
      success: false,
      error: error,
    };
  }
}

// Export for use in React components or console
export { testDatabase };

