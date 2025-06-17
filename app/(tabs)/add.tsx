import { Save } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AlertModal from '../../components/AlertModal';
import SuccessModal from '../../components/SuccessModal';
import { useJournal } from '../../contexts/JournalContext';
import styles from '../../styles/addEntryTab.styles';

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

      <ScrollView
        style={styles.formContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.moodContainer}
          >
            {moodOptions.map((mood) => (
              <TouchableOpacity
                key={mood.label}
                style={[
                  styles.moodOption,
                  selectedMood.label === mood.label &&
                    styles.selectedMoodOption,
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
