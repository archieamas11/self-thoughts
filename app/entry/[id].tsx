import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Heart, Redo, Undo } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useJournal } from '../../contexts/JournalContext';

// Interface for history states
interface HistoryState {
  title: string;
  content: string;
  timestamp: number;
}

// Hook for undo/redo functionality
const useUndoRedo = (initialTitle: string, initialContent: string) => {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentTitle, setCurrentTitle] = useState(initialTitle);
  const [currentContent, setCurrentContent] = useState(initialContent);
  const isUpdatingFromHistory = useRef(false);
  const MAX_HISTORY_SIZE = 100;

  // Initialize history when initial values change
  useEffect(() => {
    if (history.length === 0) {
      const initialState: HistoryState = {
        title: initialTitle,
        content: initialContent,
        timestamp: Date.now()
      };
      setHistory([initialState]);
      setCurrentIndex(0);
      setCurrentTitle(initialTitle);
      setCurrentContent(initialContent);
    }
  }, [initialTitle, initialContent, history.length]);
  // Add a new state to history
  const addToHistory = useCallback((title: string, content: string) => {
    if (isUpdatingFromHistory.current) return;

    setHistory(prev => {
      // Check if this state is different from the current one
      const currentState = prev[currentIndex];
      if (currentState && currentState.title === title && currentState.content === content) {
        return prev; // No change, don't add to history
      }

      const newState: HistoryState = {
        title,
        content,
        timestamp: Date.now()
      };

      // Remove any states after current index (for when we're not at the end)
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newState);
      
      // Keep only last MAX_HISTORY_SIZE states to manage memory
      if (newHistory.length > MAX_HISTORY_SIZE) {
        const removeCount = newHistory.length - MAX_HISTORY_SIZE;
        const trimmedHistory = newHistory.slice(removeCount);
        setCurrentIndex(trimmedHistory.length - 1);
        return trimmedHistory;
      }
      
      setCurrentIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [currentIndex]);

  // Undo function
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const prevState = history[newIndex];
      
      isUpdatingFromHistory.current = true;
      setCurrentTitle(prevState.title);
      setCurrentContent(prevState.content);
      setCurrentIndex(newIndex);
      
      // Reset flag after state updates
      setTimeout(() => {
        isUpdatingFromHistory.current = false;
      }, 0);
      
      return { title: prevState.title, content: prevState.content };
    }
    return null;
  }, [currentIndex, history]);

  // Redo function
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      const nextState = history[newIndex];
      
      isUpdatingFromHistory.current = true;
      setCurrentTitle(nextState.title);
      setCurrentContent(nextState.content);
      setCurrentIndex(newIndex);
      
      // Reset flag after state updates
      setTimeout(() => {
        isUpdatingFromHistory.current = false;
      }, 0);
      
      return { title: nextState.title, content: nextState.content };
    }
    return null;
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    currentTitle,
    currentContent,
    setCurrentTitle,
    setCurrentContent,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    isUpdatingFromHistory: isUpdatingFromHistory.current,
    historySize: history.length
  };
};

// Debounced save hook
const useAutoSave = (
  entryId: string,
  title: string,
  content: string,
  originalTitle: string,
  originalContent: string,
  updateEntry: (id: string, updates: any) => Promise<void>,
  delay: number = 1000
) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSavedRef = useRef({ title: originalTitle, content: originalContent });

  // Initialize lastSavedRef when original values change
  useEffect(() => {
    lastSavedRef.current = { title: originalTitle, content: originalContent };
  }, [originalTitle, originalContent]);

  // Check if there are unsaved changes
  useEffect(() => {
    const titleChanged = title !== lastSavedRef.current.title;
    const contentChanged = content !== lastSavedRef.current.content;
    setHasUnsavedChanges(titleChanged || contentChanged);
  }, [title, content]);

  // Debounced save function
  useEffect(() => {
    if (hasUnsavedChanges && !isSaving) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout
      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await updateEntry(entryId, { title, content });
          lastSavedRef.current = { title, content };
          setHasUnsavedChanges(false);
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsSaving(false);
        }
      }, delay);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, hasUnsavedChanges, isSaving, entryId, updateEntry, delay]);

  // Manual save function
  const saveNow = useCallback(async () => {
    if (hasUnsavedChanges && !isSaving) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      setIsSaving(true);
      try {
        await updateEntry(entryId, { title, content });
        lastSavedRef.current = { title, content };
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Manual save failed:', error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    }
  }, [hasUnsavedChanges, isSaving, title, content, entryId, updateEntry]);

  return { hasUnsavedChanges, isSaving, saveNow };
};

export default function EntryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { entries, updateEntry, toggleFavorite: toggleEntryFavorite } = useJournal();

  const entry = entries.find(e => e.id === id);
    // Initialize undo/redo system
  const {
    currentTitle,
    currentContent,
    setCurrentTitle,
    setCurrentContent,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    isUpdatingFromHistory,
    historySize
  } = useUndoRedo(
    entry?.title || '',
    entry?.content || ''
  );

  // Initialize autosave system
  const { hasUnsavedChanges, isSaving, saveNow } = useAutoSave(
    id || '',
    currentTitle,
    currentContent,
    entry?.title || '',
    entry?.content || '',
    updateEntry,
    1000 // 1 second delay for autosave
  );
  // Debounced history addition to avoid too many history entries
  const debouncedAddToHistory = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastInteractionTime = useRef<number>(Date.now());
  
  const addToHistoryDebounced = useCallback((title: string, content: string) => {
    if (isUpdatingFromHistory) return;
    
    const now = Date.now();
    const timeSinceLastInteraction = now - lastInteractionTime.current;
    
    // If it's been more than 5 seconds since last interaction, immediately add to history
    if (timeSinceLastInteraction > 5000) {
      addToHistory(title, content);
      lastInteractionTime.current = now;
      return;
    }
    
    if (debouncedAddToHistory.current) {
      clearTimeout(debouncedAddToHistory.current);
    }
    
    debouncedAddToHistory.current = setTimeout(() => {
      addToHistory(title, content);
      lastInteractionTime.current = Date.now();
    }, 300); // Add to history after 300ms of no changes
  }, [addToHistory, isUpdatingFromHistory]);
  // Handle title changes
  const handleTitleChange = useCallback((text: string) => {
    if (!isUpdatingFromHistory) {
      setCurrentTitle(text);
      addToHistoryDebounced(text, currentContent);
    }
  }, [setCurrentTitle, addToHistoryDebounced, currentContent, isUpdatingFromHistory]);

  // Handle content changes
  const handleContentChange = useCallback((text: string) => {
    if (!isUpdatingFromHistory) {
      setCurrentContent(text);
      addToHistoryDebounced(currentTitle, text);
    }
  }, [setCurrentContent, addToHistoryDebounced, currentTitle, isUpdatingFromHistory]);

  // Handle undo
  const handleUndo = useCallback(() => {
    const result = undo();
    if (result) {
      // The undo hook already updates currentTitle and currentContent
      // We don't need to do anything else here
    }
  }, [undo]);

  // Handle redo
  const handleRedo = useCallback(() => {
    const result = redo();
    if (result) {
      // The redo hook already updates currentTitle and currentContent
      // We don't need to do anything else here
    }
  }, [redo]);
  // Save when screen loses focus
  useFocusEffect(
    useCallback(() => {
      // Add current state to history when screen gains focus
      addToHistory(currentTitle, currentContent);
      
      return () => {
        // Save when leaving the screen
        if (hasUnsavedChanges) {
          saveNow().catch(error => {
            console.error('Error saving on focus loss:', error);
          });
        }
      };
    }, [hasUnsavedChanges, saveNow, addToHistory, currentTitle, currentContent])
  );

  // Save when navigating back
  const handleBack = useCallback(async () => {
    try {
      await saveNow();
    } catch (error) {
      console.error('Error saving before navigation:', error);
    }
    router.back();
  }, [saveNow, router]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (debouncedAddToHistory.current) {
        clearTimeout(debouncedAddToHistory.current);
      }
    };
  }, []);

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
  
  const handleToggleFavorite = async () => {
    if (id) {
      try {
        await toggleEntryFavorite(id);
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    }
  };
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
          {/* Undo button */}
          <TouchableOpacity 
            onPress={handleUndo} 
            style={[styles.actionIcon, { opacity: canUndo ? 1 : 0.3 }]}
            disabled={!canUndo}
          >
            <Undo 
              size={24} 
              color="#6B7280"
            />
          </TouchableOpacity>
          {/* Redo button */}
          <TouchableOpacity 
            onPress={handleRedo} 
            style={[styles.actionIcon, { opacity: canRedo ? 1 : 0.3 }]}
            disabled={!canRedo}
          >
            <Redo 
              size={24} 
              color="#6B7280"
            />
          </TouchableOpacity>          
          {/* Favorite button */}
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.actionIcon}>
            <Heart 
              size={24} 
              color={entry?.isFavorite ? "#EF4444" : "#6B7280"} 
              fill={entry?.isFavorite ? "#EF4444" : "none"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.entryHeader}>
            <Text style={styles.mood}>{entry.mood}</Text>
            <View style={styles.dateContainer}>
              <Calendar size={16} color="#6B7280" />
              <Text style={styles.date}>{formatDate(entry.date)}</Text>
            </View>
          </View>

          <TextInput
            style={styles.titleInput}
            value={currentTitle}
            onChangeText={handleTitleChange}
            placeholder="Entry title..."
            multiline={true}
            textAlignVertical="top"
            placeholderTextColor="#9CA3AF"
          />
          
          <TextInput
            style={styles.contentInput}
            value={currentContent}
            onChangeText={handleContentChange}
            placeholder="What's on your mind?"
            multiline={true}
            textAlignVertical="top"
            placeholderTextColor="#9CA3AF"
            scrollEnabled={false}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  },  unsavedText: {
    color: '#EF4444',
    fontSize: 20,
    fontWeight: 'bold',
  },
  savingText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '500',
  },
  actionIcon: {
    padding: 8,
  },
  favoriteIcon: {
    padding: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  contentContainer: {
    paddingTop: 24,
    paddingBottom: 40,
    flexGrow: 1,
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
    padding: 0,
    textAlignVertical: 'top',
    minHeight: 200,
    flex: 1,
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
