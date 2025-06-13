import { Save } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AlertModal from '../../components/AlertModal';
import SuccessModal from '../../components/SuccessModal';
import { useJournal } from '../../contexts/JournalContext';

const moodOptions = [
  { emoji: '😊', label: 'Happy', color: '#FDE047' },
  { emoji: '😢', label: 'Sad', color: '#60A5FA' },
  { emoji: '😡', label: 'Angry', color: '#F87171' },
  { emoji: '😴', label: 'Tired', color: '#A78BFA' },
  { emoji: '🤔', label: 'Thoughtful', color: '#34D399' },
  { emoji: '🙏', label: 'Grateful', color: '#FBBF24' },
];

export default function AddEntry() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState(moodOptions[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  const { addEntry } = useJournal();

  const handleSaveEntry = async () => {
    if (!title.trim() || !content.trim()) {
      setShowIncompleteModal(true);
      return;
    }

    setIsLoading(true);
    try {
      await addEntry({
        title: title.trim(),
        content: content.trim(),
        mood: selectedMood.emoji,
        moodLabel: selectedMood.label,
      });
      
      // Show success modal
      setShowSuccessModal(true);
    } catch (error) {
      setShowErrorModal(true);
      console.error('Error saving entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Reset form after successful save
    setTitle('');
    setContent('');
    setSelectedMood(moodOptions[0]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>New Entry</Text>
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && { opacity: 0.7 }]} 
          onPress={handleSaveEntry}
          disabled={isLoading}
        >
          <Save size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodContainer}>
            {moodOptions.map((mood) => (
              <TouchableOpacity
                key={mood.label}
                style={[
                  styles.moodOption,
                  selectedMood.label === mood.label && styles.selectedMoodOption,
                ]}
                onPress={() => setSelectedMood(mood)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Title</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="What's on your mind today?"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your thoughts</Text>
          <TextInput
            style={styles.contentInput}
            placeholder="Write about your day, your feelings, or anything that comes to mind..."
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inspirationSection}>
          <Text style={styles.inspirationTitle}>💡 Writing Prompts</Text>
          <View style={styles.promptsContainer}>
            <TouchableOpacity style={styles.promptCard}>
              <Text style={styles.promptText}>What made you smile today?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.promptCard}>
              <Text style={styles.promptText}>What are you grateful for?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.promptCard}>
              <Text style={styles.promptText}>What did you learn today?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <SuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Entry Saved!"
        message="Your journal entry has been saved successfully. Keep up the great work!"
      />

      <AlertModal
        visible={showIncompleteModal}
        onClose={() => setShowIncompleteModal(false)}
        title="Incomplete Entry"
        message="Please add both a title and content for your journal entry."
        buttonText="Got it"
      />

      <AlertModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        message="Failed to save your entry. Please try again."
        buttonText="Try Again"
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  formContainer: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  moodContainer: {
    marginBottom: 8,
  },
  moodOption: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: 80,
  },
  selectedMoodOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
  },
  titleInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contentInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 200,
  },
  inspirationSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  inspirationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  promptsContainer: {
    gap: 12,
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  promptText: {
    fontSize: 14,
    color: '#4B5563',
    fontStyle: 'italic',
  },
});