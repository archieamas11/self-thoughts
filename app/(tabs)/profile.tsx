import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import {
  BookOpen,
  Calendar,
  Camera,
  Download,
  Edit,
  Globe,
  Heart,
  Lock,
  LogIn,
  LogOut,
  Settings,
  Shield,
  Smartphone,
  User,
  X
} from 'lucide-react-native';
import type React from 'react';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useJournal } from '../../contexts/JournalContext';
import styles from '../../styles/profileTab.styles';

interface Stat {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

export default function Profile() {
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'picture' | 'name' | 'bio'>(
    'picture',
  );
  const [tempName, setTempName] = useState('');
  const [tempBio, setTempBio] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const { entries, userProfile, updateUserProfile } = useJournal();

  const defaultBio = "Writing helps me understand myself better and appreciate life's small moments.";
  const version = '1.3.0';

  // Calculate real statistics
  const totalEntries = entries.filter((entry) => !entry.isArchived).length;
  const favoriteEntries = entries.filter(
    (entry) => !entry.isArchived && entry.isFavorite,
  ).length;

  // Calculate this month's entries
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthEntries = entries.filter((entry) => {
    if (entry.isArchived) return false;
    const entryDate = new Date(entry.date);
    return (
      entryDate.getMonth() === currentMonth &&
      entryDate.getFullYear() === currentYear
    );
  }).length;

  // Calculate streak (simplified - consecutive days from most recent entry)
  const calculateStreak = () => {
    if (entries.length === 0) return 0;

    const sortedEntries = entries
      .filter((entry) => !entry.isArchived)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (sortedEntries.length === 0) return 0;

    let streak = 1;
    const today = new Date();
    const mostRecentDate = new Date(sortedEntries[0].date);

    // Check if the most recent entry is from today or yesterday
    const daysDiff = Math.floor(
      (today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysDiff > 1) return 0; // Streak broken

    // Count consecutive days
    for (let i = 1; i < sortedEntries.length; i++) {
      const currentDate = new Date(sortedEntries[i - 1].date);
      const previousDate = new Date(sortedEntries[i].date);
      const diff = Math.floor(
        (currentDate.getTime() - previousDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const currentStreak = calculateStreak();

  const stats: Stat[] = [
    {
      label: 'Total Entries',
      value: totalEntries.toString(),
      icon: <BookOpen size={20} color="#3B82F6" />,
      color: '#EFF6FF',
    },
    {
      label: 'This Month',
      value: thisMonthEntries.toString(),
      icon: <Calendar size={20} color="#7C3AED" />,
      color: '#F3E8FF',
    },
    {
      label: 'Favorite Entries',
      value: favoriteEntries.toString(),
      icon: <Heart size={20} color="#DC2626" />,
      color: '#FEF2F2',
    },
    {
      label: 'Archived Entries',
      value: entries.filter((entry) => entry.isArchived).length.toString(),
      icon: <Lock size={20} color="#6B7280" />,
      color: '#F9FAFB',
    },
  ];

  // const achievements = [
  //   { title: 'First Entry', description: 'Started your journaling journey', earned: true },
  //   { title: 'Week Warrior', description: 'Wrote for 7 consecutive days', earned: true },
  //   { title: 'Month Master', description: 'Completed 30 days of journaling', earned: false },
  //   { title: 'Reflection Pro', description: 'Wrote 100 journal entries', earned: false },
  // ];

  const exportDatabase = async () => {
    try {
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'Sharing Not Available',
          'Sharing is not available on this device. Your data will be logged to the console instead.'
        );
      }

      // Get all data from the database
      const [allEntries, userProfileData] = await Promise.all([
        // Get entries from the journal context (already loaded)
        entries,
        // Get user profile
        userProfile
      ]);

      // Create export data object
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          appVersion: version,
          totalEntries: allEntries.length,
          activeEntries: allEntries.filter(entry => !entry.isArchived).length,
          archivedEntries: allEntries.filter(entry => entry.isArchived).length,
          favoriteEntries: allEntries.filter(entry => entry.isFavorite).length,
        },
        userProfile: userProfileData,
        entries: allEntries.map(entry => ({
          ...entry,
          // Add readable export date
          exportDate: new Date().toISOString()
        }))
      };

      // Create a formatted JSON string
      const jsonString = JSON.stringify(exportData, null, 2);

      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `self-thoughts-backup-${timestamp}.json`;
      const fileUri = FileSystem.documentDirectory + filename;

      // Write the JSON file
      await FileSystem.writeAsStringAsync(fileUri, jsonString);

      if (isAvailable) {
        // Share the file
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Journal Data',
          UTI: 'public.json'
        });

        Alert.alert(
          'Export Successful!',
          `Your journal data has been exported successfully. File: ${filename}\n\nThis includes ${exportData.metadata.totalEntries} entries and your profile data.`
        );
      } else {
        // If sharing not available, just log the data
        console.log('📊 Exported Journal Data:', exportData);
        Alert.alert(
          'Export Complete',
          `Your journal data has been prepared and logged to the console. Total entries: ${exportData.metadata.totalEntries}`
        );
      }

      // Clean up the temporary file after sharing
      setTimeout(async () => {
        try {
          await FileSystem.deleteAsync(fileUri);
        } catch (cleanupError) {
          console.warn('Could not clean up temporary export file:', cleanupError);
        }
      }, 5000);

    } catch (error) {
      console.error('❌ Export failed:', error);
      Alert.alert(
        'Export Failed',
        `Failed to export your journal data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };


  const handleGoogleLogin = () => {
    // Mock Google login - I will implement the real functionality later
    Alert.alert(
      'Google Login',
      'This is a demo. Real Google authentication will be implemented later.',
      [
        {
          text: 'Simulate Login',
          onPress: () => {
            setIsLoggedIn(true);
            setUserEmail('user@example.com');
            setSettingsModalVisible(false);
            Alert.alert(
              'Success!',
              'You are now logged in. Your notes will sync across devices.',
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      "Are you sure you want to logout? Your local notes will remain but won't sync until you log back in.",
      [
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            setIsLoggedIn(false);
            setUserEmail('');
            Alert.alert('Logged out', 'You have been logged out successfully.');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };
  const handleEditProfilePress = async () => {
    setTempName(userProfile.name);
    setTempBio(userProfile.bio);
    setActiveTab('picture');
    setEditProfileModalVisible(true);
  };

  const handleTakePhoto = async () => {
    setEditProfileModalVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission denied',
        'Sorry, we need camera permissions to take a photo.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await updateUserProfile({ profilePicture: result.assets[0].uri });
    }
  };

  const handleChooseFromGallery = async () => {
    setEditProfileModalVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission denied',
        'Sorry, we need gallery permissions to choose a photo.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await updateUserProfile({ profilePicture: result.assets[0].uri });
    }
  };

  const handleRemovePicture = async () => {
    setEditProfileModalVisible(false);
    await updateUserProfile({ profilePicture: undefined });
  };

  const handleSaveName = async () => {
    if (tempName.trim()) {
      await updateUserProfile({ name: tempName.trim() });
      setEditProfileModalVisible(false);
    }
  };

  const handleSaveBio = async () => {
    await updateUserProfile({ bio: tempBio.trim() || defaultBio });
    setEditProfileModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setSettingsModalVisible(true)}
        >
          <Settings size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <TouchableOpacity
              style={styles.profileImage}
              onPress={handleEditProfilePress}
            >
              {userProfile.profilePicture ? (
                <Image
                  source={{ uri: userProfile.profilePicture }}
                  style={styles.profileImageStyle}
                />
              ) : (
                <User size={40} color="#6B7280" />
              )}
              <View style={styles.editIcon}>
                <Edit size={12} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.profileNameContainer}>
            <Text style={styles.profileName}>{userProfile.name}</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.profileBio}>
              "{userProfile.bio || defaultBio}"
            </Text>
          </TouchableOpacity>
          <View style={styles.profileStats}>
            {/* <View style={styles.profileStat}>
              <Text style={styles.statNumber}>{Math.floor(totalEntries * 3.3)}</Text>
              <Text style={styles.statLabel}>Days Active</Text>
            </View> */}
            <View style={styles.profileStat}>
              <Text style={styles.statNumber}>{totalEntries}</Text>
              <Text style={styles.statLabel}>Entries</Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={styles.statNumber}>{favoriteEntries}</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
            <View style={styles.archivedStat}>
              <Text style={styles.statNumber}>
                {entries.filter((entry) => entry.isArchived).length}
              </Text>
              <Text style={styles.statLabel}>Archived</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View
                key={index}
                style={[styles.statCard, { backgroundColor: stat.color }]}
              >
                <View style={styles.statIcon}>{stat.icon}</View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsContainer}>
            {achievements.map((achievement, index) => (
              <View key={index} style={styles.achievementCard}>
                <View style={styles.achievementIcon}>
                  <Award
                    size={20}
                    color={achievement.earned ? '#F59E0B' : '#9CA3AF'}
                  />
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={[
                    styles.achievementTitle,
                    !achievement.earned && styles.unearned
                  ]}>
                    {achievement.title}
                  </Text>
                  <Text style={styles.achievementDescription}>
                    {achievement.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View> */}
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={settingsModalVisible}
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSettingsModalVisible(false)}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Account Section */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Account</Text>

                {!isLoggedIn ? (
                  <View style={styles.loginPrompt}>
                    <View style={styles.loginIcon}>
                      <LogIn size={40} color="#3B82F6" />
                    </View>
                    <Text style={styles.loginTitle}>Sign in with Google</Text>
                    <Text style={styles.loginDescription}>
                      Sync your journal entries across all your devices. Your
                      notes will be securely stored and accessible anywhere.
                    </Text>

                    <TouchableOpacity
                      style={styles.googleLoginButton}
                      onPress={handleGoogleLogin}
                    >
                      <View style={styles.googleIcon}>
                        <Text style={styles.googleIconText}>G</Text>
                      </View>
                      <Text style={styles.googleLoginText}>
                        Continue with Google
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.benefits}>
                      <View style={styles.benefitItem}>
                        <Shield size={16} color="#059669" />
                        <Text style={styles.benefitText}>
                          Secure cloud backup
                        </Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Smartphone size={16} color="#059669" />
                        <Text style={styles.benefitText}>
                          Access from any device
                        </Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Globe size={16} color="#059669" />
                        <Text style={styles.benefitText}>Automatic sync</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.loggedInContainer}>
                    <View style={styles.userInfo}>
                      <View style={styles.userAvatar}>
                        <User size={24} color="#3B82F6" />
                      </View>
                      <View style={styles.userDetails}>
                        <Text style={styles.userEmail}>{userEmail}</Text>
                        <Text style={styles.syncStatus}>✓ Syncing enabled</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.logoutButton}
                      onPress={handleLogout}
                    >
                      <LogOut size={16} color="#EF4444" />
                      <Text style={styles.logoutText}>Sign out</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Privacy & Security Section */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Privacy & Security</Text>
                <TouchableOpacity style={styles.settingItem}
                  onPress={() => Alert.alert('Soon hehe',
                    'This feature is not yet implemented. I will work on it soon.'
                  )}>
                  <Lock size={20} color="#3B82F6" />
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>App Lock</Text>
                    <Text style={styles.settingDescription}>
                      Require passcode or biometric to open app
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Your Data</Text>
                <TouchableOpacity style={styles.settingItem}
                  onPress={exportDatabase}>
                  <Download size={20} color="#3B82F6" />
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>Download Data</Text>
                    <Text style={styles.settingDescription}>
                      Export your journal data as a file
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Notifications Section */}
              {/* <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Notifications</Text>
                
                <TouchableOpacity style={styles.settingItem}>
                  <Bell size={20} color="#3B82F6" />
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>Daily Reminders</Text>
                    <Text style={styles.settingDescription}>Get reminded to write in your journal</Text>
                  </View>
                </TouchableOpacity>
              </View> */}

              {/* About Section */}
              <View style={styles.modalSection}>
                <View style={styles.aboutItem}>
                  <Text style={styles.aboutLabel}>Version</Text>
                  <Text style={styles.aboutValue}>{version}</Text>
                </View>

                {/* <TouchableOpacity style={styles.settingItem}>
                  <Text style={styles.settingTitle}>Terms of Service</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem}>
                  <Text style={styles.settingTitle}>Privacy Policy</Text>
                </TouchableOpacity> */}

                {/* Footer */}
                <View style={styles.footerContent}>
                  <Text style={styles.footerText}>
                    Made with <Heart size={12} color="#EF4444" fill="#EF4444" /> by Archie Albarico
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editProfileModalVisible}
        onRequestClose={() => setEditProfileModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.editProfileModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setEditProfileModalVisible(false)}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'picture' && styles.activeTab,
                ]}
                onPress={() => setActiveTab('picture')}
              >
                <Camera
                  size={20}
                  color={activeTab === 'picture' ? '#3B82F6' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'picture' && styles.activeTabText,
                  ]}
                >
                  Picture
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === 'name' && styles.activeTab]}
                onPress={() => setActiveTab('name')}
              >
                <User
                  size={20}
                  color={activeTab === 'name' ? '#3B82F6' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'name' && styles.activeTabText,
                  ]}
                >
                  Name
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === 'bio' && styles.activeTab]}
                onPress={() => setActiveTab('bio')}
              >
                <Edit
                  size={20}
                  color={activeTab === 'bio' ? '#3B82F6' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'bio' && styles.activeTabText,
                  ]}
                >
                  Bio
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabContent}>
              {/* Picture Tab */}
              {activeTab === 'picture' && (
                <View style={styles.pictureTab}>
                  <View style={styles.currentProfileContainer}>
                    <View style={styles.currentProfilePicture}>
                      {userProfile.profilePicture ? (
                        <Image
                          source={{ uri: userProfile.profilePicture }}
                          style={styles.currentProfileImage}
                        />
                      ) : (
                        <User size={60} color="#6B7280" />
                      )}
                    </View>
                    <Text style={styles.currentPictureLabel}>
                      Current Profile Picture
                    </Text>
                  </View>

                  <View style={styles.pictureOptions}>
                    <TouchableOpacity
                      style={styles.pictureOption}
                      onPress={handleTakePhoto}
                    >
                      <View style={styles.optionIcon}>
                        <Camera size={24} color="#3B82F6" />
                      </View>
                      <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>Take Photo</Text>
                        <Text style={styles.optionDescription}>
                          Use camera to take a new photo
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.pictureOption}
                      onPress={handleChooseFromGallery}
                    >
                      <View style={styles.optionIcon}>
                        <BookOpen size={24} color="#3B82F6" />
                      </View>
                      <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>
                          Choose from Gallery
                        </Text>
                        <Text style={styles.optionDescription}>
                          Select an existing photo
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {userProfile.profilePicture && (
                      <TouchableOpacity
                        style={[styles.pictureOption, styles.destructiveOption]}
                        onPress={handleRemovePicture}
                      >
                        <View style={styles.optionIcon}>
                          <X size={24} color="#EF4444" />
                        </View>
                        <View style={styles.optionContent}>
                          <Text
                            style={[styles.optionTitle, styles.destructiveText]}
                          >
                            Remove Picture
                          </Text>
                          <Text style={styles.optionDescription}>
                            Use default avatar
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
              {/* Name Tab */}
              {activeTab === 'name' && (
                <View style={styles.nameTab}>
                  <ScrollView
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={false}
                  >
                    <Text style={styles.inputLabel}>Display Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={tempName}
                      onChangeText={setTempName}
                      placeholder="Enter your name"
                      autoFocus
                      maxLength={50}
                    />
                    <Text style={styles.inputHelper}>
                      This is how your name appears in your profile
                    </Text>
                  </ScrollView>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setEditProfileModalVisible(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.saveButton,
                        !tempName.trim() && styles.saveButtonDisabled,
                      ]}
                      onPress={handleSaveName}
                      disabled={!tempName.trim()}
                    >
                      <Text
                        style={[
                          styles.saveButtonText,
                          !tempName.trim() && styles.saveButtonTextDisabled,
                        ]}
                      >
                        Save Changes
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {/* Bio Tab */}
              {activeTab === 'bio' && (
                <View style={styles.bioTab}>
                  <ScrollView
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={false}
                  >
                    <Text style={styles.inputLabel}>Bio</Text>
                    <TextInput
                      style={[styles.textInput, styles.bioInput]}
                      value={tempBio}
                      onChangeText={setTempBio}
                      placeholder={defaultBio}
                      autoFocus
                      multiline
                      maxLength={200}
                    />
                    <Text style={styles.inputHelper}>
                      {tempBio.length}/200 characters
                    </Text>
                  </ScrollView>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setEditProfileModalVisible(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleSaveBio}
                    >
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
