import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Calendar, Filter, Heart, Search } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ActionModal from '../../components/ActionModal';
import ConfirmModal from '../../components/ConfirmModal';
import FilterModal from '../../components/FilterModal';
import { useJournal } from '../../contexts/JournalContext';

export default function JournalHome() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'archived' | 'favorites'>('all');
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedEntryForArchive, setSelectedEntryForArchive] = useState<{ id: string; title: string } | null>(null);
  const [selectedEntryForAction, setSelectedEntryForAction] = useState<{ id: string; title: string; isArchived: boolean } | null>(null);
  const { entries, isLoading, archiveEntry, deleteEntry, updateEntry, toggleFavorite } = useJournal();
  const router = useRouter();

  const moodOptions = [
    { emoji: '😊', label: 'Happy', color: '#FDE047' },
    { emoji: '😢', label: 'Sad', color: '#60A5FA' },
    { emoji: '😡', label: 'Angry', color: '#F87171' },
    { emoji: '😴', label: 'Tired', color: '#A78BFA' },
    { emoji: '🤔', label: 'Thoughtful', color: '#34D399' },
    { emoji: '🙏', label: 'Grateful', color: '#FBBF24' },
  ];

  const filteredEntries = entries.filter(entry => {
    // Filter by type first
    if (filterType === 'archived' && !entry.isArchived) return false;
    if (filterType === 'favorites' && !entry.isFavorite) return false;
    if (filterType === 'all' && entry.isArchived) return false;
    
    const matchesSearchQuery =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMood = selectedMood ? entry.mood === selectedMood : true;
    return matchesSearchQuery && matchesMood;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleArchiveEntry = async (entryId: string, entryTitle: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedEntryForArchive({ id: entryId, title: entryTitle });
    setShowArchiveModal(true);
  };

  const handleShowActions = async (entryId: string, entryTitle: string, isArchived: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedEntryForAction({ id: entryId, title: entryTitle, isArchived });
    setShowActionModal(true);
  };

  const handleLongPress = (entry: any) => {
    if (entry.isArchived) {
      handleShowActions(entry.id, entry.title, true);
    } else {
      handleArchiveEntry(entry.id, entry.title);
    }
  };

  const confirmArchiveEntry = async () => {
    if (selectedEntryForArchive) {
      try {
        await archiveEntry(selectedEntryForArchive.id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.error('Error archiving entry:', error);
        // Could add an error modal here if needed
      }
    }
    setShowArchiveModal(false);
    setSelectedEntryForArchive(null);
  };

  const handleDeleteAction = async () => {
    if (selectedEntryForAction) {
      try {
        await deleteEntry(selectedEntryForAction.id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.error('Error deleting entry:', error);
      }
    }
    setShowActionModal(false);
    setSelectedEntryForAction(null);
  };

  const handleRestoreAction = async () => {
    if (selectedEntryForAction) {
      try {
        // Update entry to remove archived status (restore it)
        await updateEntry(selectedEntryForAction.id, { isArchived: false });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.error('Error restoring entry:', error);
      }
    }
    setShowActionModal(false);
    setSelectedEntryForAction(null);
  };

  const handleToggleFavorite = async (entryId: string) => {
    try {
      await toggleFavorite(entryId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    // My journal header
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Journal</Text>
        <Text style={styles.subtitle}>
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </Text>
      </View>

      {/* Search bar and filters */}
      <View style={styles.searchAndFilterContainer}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your entries..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Filter button */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Mood Filter */}
      <View style={styles.moodFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodFilterContent}>
          <TouchableOpacity
            style={[
              styles.moodButton,
              selectedMood === null && styles.activeMoodButton,
            ]}
            onPress={() => setSelectedMood(null)}
          >
            <Text style={[
              styles.moodButtonText,
              selectedMood === null && styles.activeMoodButtonText
            ]}>All</Text>
          </TouchableOpacity>
          {moodOptions.map((mood) => (
            <TouchableOpacity
              key={mood.emoji}
              style={[
                styles.moodButton,
                selectedMood === mood.emoji && styles.activeMoodButton,
                selectedMood === mood.emoji && { backgroundColor: mood.color, borderColor: mood.color },
              ]}
              onPress={() => setSelectedMood(mood.emoji)}
            >
              <Text style={[
                styles.moodButtonText,
                selectedMood === mood.emoji && styles.activeMoodButtonText
              ]}>{mood.emoji}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Journal entries list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading your entries...</Text>
        </View>
      ) : (
        <ScrollView style={styles.entriesContainer} showsVerticalScrollIndicator={false}>
          {filteredEntries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No entries found' : 'No entries yet'}
              </Text>
              <Text style={styles.emptyMessage}>
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Start your journaling journey by creating your first entry'
                }
              </Text>
            </View>
          ) : (
            filteredEntries.map((entry) => (
              <TouchableOpacity 
                key={entry.id} 
                style={[
                  styles.entryCard,
                  entry.isArchived && styles.archivedEntryCard
                ]}
                onPress={() => router.push(`/entry/${entry.id}`)}
                onLongPress={() => handleLongPress(entry)}
                delayLongPress={300}
              >
                <View style={styles.entryHeader}>
                  <Text style={styles.entryMood}>{entry.mood}</Text>
                  <View style={styles.entryDateContainer}>
                    <Calendar size={14} color="#6B7280" />
                    <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                  </View>
                </View>
                <Text style={styles.entryTitle}>{entry.title}</Text>
                <Text style={styles.entryContent} numberOfLines={3}>
                  {entry.content}
                </Text>
                <View style={styles.entryFooter}>
                  <TouchableOpacity 
                    style={styles.favoriteButton}
                    onPress={() => handleToggleFavorite(entry.id)}
                  >
                    <Heart 
                      size={16} 
                      color="#EF4444" 
                      fill={entry.isFavorite ? '#EF4444' : 'none'}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      <ConfirmModal
        visible={showArchiveModal}
        onClose={() => {
          setShowArchiveModal(false);
          setSelectedEntryForArchive(null);
        }}
        onConfirm={confirmArchiveEntry}
        title="Archive Entry"
        message={`Are you sure you want to archive "${selectedEntryForArchive?.title}"?`}
        confirmText="Archive"
        cancelText="Cancel"
        confirmColor="#EF4444"
        iconColor="#EF4444"
      />

      <ActionModal
        visible={showActionModal}
        onClose={() => {
          setShowActionModal(false);
          setSelectedEntryForAction(null);
        }}
        entryTitle={selectedEntryForAction?.title || ''}
        onRestore={handleRestoreAction}
        onDelete={handleDeleteAction}
      />

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filterType={filterType}
        onFilterSelect={setFilterType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  searchAndFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 44,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    textAlignVertical: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 6,
    flexShrink: 0,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minWidth: 44,
    height: 44,
  },
  moodFilterContainer: {
    paddingHorizontal: 16, // Reduced from 24
    paddingVertical: 10,
  },
  moodFilterContent: {
    alignItems: 'center',
  },
  moodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  activeMoodButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  moodButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeMoodButtonText: {
    color: '#FFFFFF',
  },
  entriesContainer: {
    flex: 1,
    paddingHorizontal: 16, // Reduced from 24
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // Changed from 16
    padding: 16, // Changed from 20
    marginBottom: 12, // Changed from 16
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1, // Changed from 2
    },
    shadowOpacity: 0.08, // Changed from 0.1
    shadowRadius: 2.62, // Changed from 3.84
    elevation: 3, // Changed from 5
  },
  archivedEntryCard: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Changed from 12
  },
  entryMood: {
    fontSize: 24,
  },
  entryDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryDate: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  entryTitle: {
    fontSize: 17, // Changed from 18
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6, // Changed from 8
  },
  entryContent: {
    fontSize: 13, // Changed from 14
    color: '#4B5563',
    lineHeight: 18, // Changed from 20
    marginBottom: 8, // Changed from 12
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4, // Added for slight separation
  },
  favoriteButton: {
    padding: 6, // Changed from 8
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});