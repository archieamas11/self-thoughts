import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Heart } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useJournal } from '../../contexts/JournalContext';

export default function EntryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { entries, updateEntry } = useJournal();
  const [isFavorite, setIsFavorite] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const originalEntry = useRef<{ title: string; content: string } | null>(null);

  const entry = entries.find(e => e.id === id);
  
  // Initialize the editable fields when entry is loaded
  useEffect(() => {
    if (entry) {
      setEditedTitle(entry.title);
      setEditedContent(entry.content);
      originalEntry.current = { title: entry.title, content: entry.content };
      setHasUnsavedChanges(false);
    }
  }, [entry]);

  // Auto-save function
  const saveChanges = useCallback(async () => {
    if (hasUnsavedChanges && entry && id && originalEntry.current) {
      const titleChanged = editedTitle !== originalEntry.current.title;
      const contentChanged = editedContent !== originalEntry.current.content;
      
      if (titleChanged || contentChanged) {
        try {
          await updateEntry(id, {
            title: editedTitle,
            content: editedContent,
          });
          originalEntry.current = { title: editedTitle, content: editedContent };
          setHasUnsavedChanges(false);
        } catch (error) {
          console.error('Error saving changes:', error);
        }
      }
    }
  }, [hasUnsavedChanges, entry, id, editedTitle, editedContent, updateEntry]);

  // Save when screen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        // This cleanup function runs when the screen loses focus
        saveChanges();
      };
    }, [saveChanges])
  );

  // Save when navigating back
  const handleBack = async () => {
    await saveChanges();
    router.back();
  };
  // Track changes
  const handleTitleChange = (text: string) => {
    setEditedTitle(text);
    if (originalEntry.current) {
      setHasUnsavedChanges(text !== originalEntry.current.title || editedContent !== originalEntry.current.content);
    }
  };

  const handleContentChange = (text: string) => {
    setEditedContent(text);
    if (originalEntry.current) {
      setHasUnsavedChanges(editedTitle !== originalEntry.current.title || text !== originalEntry.current.content);
    }
  };
  if (!entry) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Entry not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backIcon}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          {hasUnsavedChanges && (
            <View style={styles.unsavedIndicator}>
              <Text style={styles.unsavedText}>•</Text>
            </View>
          )}
          <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteIcon}>
            <Heart 
              size={24} 
              color={isFavorite ? "#EF4444" : "#6B7280"} 
              fill={isFavorite ? "#EF4444" : "none"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.entryHeader}>
          <Text style={styles.mood}>{entry.mood}</Text>
          <View style={styles.dateContainer}>
            <Calendar size={16} color="#6B7280" />
            <Text style={styles.date}>{formatDate(entry.date)}</Text>
          </View>
        </View>

        <TextInput
          style={styles.titleInput}
          value={editedTitle}
          onChangeText={handleTitleChange}
          placeholder="Entry title..."
          multiline={true}
          textAlignVertical="top"
          placeholderTextColor="#9CA3AF"
        />
        
        <TextInput
          style={styles.contentInput}
          value={editedContent}
          onChangeText={handleContentChange}
          placeholder="What's on your mind?"
          multiline={true}
          textAlignVertical="top"
          placeholderTextColor="#9CA3AF"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backIcon: {
    padding: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unsavedIndicator: {
    marginRight: 8,
  },
  unsavedText: {
    color: '#EF4444',
    fontSize: 20,
    fontWeight: 'bold',
  },
  favoriteIcon: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  mood: {
    fontSize: 32,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  titleInput: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    lineHeight: 36,
    padding: 0,
    textAlignVertical: 'top',
    minHeight: 40,
  },
  contentInput: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 40,
    padding: 0,
    textAlignVertical: 'top',
    minHeight: 200,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
