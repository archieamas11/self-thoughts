import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Search, Calendar, Heart } from 'lucide-react-native';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  mood: string;
}

const mockEntries: JournalEntry[] = [
  {
    id: '1',
    title: 'A Beautiful Morning',
    content: 'Today started with the most amazing sunrise. The sky was painted in shades of orange and pink, and I felt so grateful to witness such beauty...',
    date: '2025-01-15',
    mood: '😊',
  },
  {
    id: '2',
    title: 'Reflections on Growth',
    content: 'I\'ve been thinking about how much I\'ve grown this year. The challenges I faced seemed impossible at the time, but they shaped me into who I am today...',
    date: '2025-01-14',
    mood: '🤔',
  },
  {
    id: '3',
    title: 'Gratitude Practice',
    content: 'Three things I\'m grateful for today: my family\'s health, the warm cup of coffee this morning, and the unexpected call from an old friend...',
    date: '2025-01-13',
    mood: '🙏',
  },
];

export default function JournalHome() {
  const [searchQuery, setSearchQuery] = useState('');
  const [entries] = useState<JournalEntry[]>(mockEntries);

  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Journal</Text>
        <Text style={styles.subtitle}>
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </Text>
      </View>

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

      <ScrollView style={styles.entriesContainer} showsVerticalScrollIndicator={false}>
        {filteredEntries.map((entry) => (
          <TouchableOpacity key={entry.id} style={styles.entryCard}>
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
              <TouchableOpacity style={styles.favoriteButton}>
                <Heart size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  entriesContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  entryContent: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  favoriteButton: {
    padding: 8,
  },
});