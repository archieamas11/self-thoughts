import * as ImagePicker from 'expo-image-picker';
import {
  Bell,
  BookOpen,
  Calendar,
  Camera,
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
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useJournal } from '../../contexts/JournalContext';

interface Stat {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

export default function Profile() {
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [editNameModalVisible, setEditNameModalVisible] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const { entries, userProfile, updateUserProfile } = useJournal();

  // Calculate real statistics
  const totalEntries = entries.filter(entry => !entry.isArchived).length;
  const favoriteEntries = entries.filter(entry => !entry.isArchived && entry.isFavorite).length;
  
  // Calculate this month's entries
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthEntries = entries.filter(entry => {
    if (entry.isArchived) return false;
    const entryDate = new Date(entry.date);
    return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
  }).length;

  // Calculate streak (simplified - consecutive days from most recent entry)
  const calculateStreak = () => {
    if (entries.length === 0) return 0;
    
    const sortedEntries = entries
      .filter(entry => !entry.isArchived)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (sortedEntries.length === 0) return 0;
    
    let streak = 1;
    const today = new Date();
    const mostRecentDate = new Date(sortedEntries[0].date);
    
    // Check if the most recent entry is from today or yesterday
    const daysDiff = Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 1) return 0; // Streak broken
    
    // Count consecutive days
    for (let i = 1; i < sortedEntries.length; i++) {
      const currentDate = new Date(sortedEntries[i - 1].date);
      const previousDate = new Date(sortedEntries[i].date);
      const diff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
      
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
      value: entries.filter(entry => entry.isArchived).length.toString(),
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

  const handleGoogleLogin = () => {
    // Mock Google login - you'll implement the real functionality later
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
            Alert.alert('Success!', 'You are now logged in. Your notes will sync across devices.');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? Your local notes will remain but won\'t sync until you log back in.',
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
      ]
    );
  };

  const handleProfilePicturePress = async () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission denied', 'Sorry, we need camera permissions to take a photo.');
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
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission denied', 'Sorry, we need gallery permissions to choose a photo.');
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
          },
        },
        {
          text: 'Remove Picture',
          style: 'destructive',
          onPress: async () => {
            await updateUserProfile({ profilePicture: undefined });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleEditName = () => {
    setTempName(userProfile.name);
    setEditNameModalVisible(true);
  };

  const handleSaveName = async () => {
    if (tempName.trim()) {
      await updateUserProfile({ name: tempName.trim() });
      setEditNameModalVisible(false);
    }
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

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <TouchableOpacity style={styles.profileImage} onPress={handleProfilePicturePress}>
              {userProfile.profilePicture ? (
                <Image source={{ uri: userProfile.profilePicture }} style={styles.profileImageStyle} />
              ) : (
                <User size={40} color="#6B7280" />
              )}
              <View style={styles.cameraIcon}>
                <Camera size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.profileNameContainer}>
            <Text style={styles.profileName}>{userProfile.name}</Text>
            <TouchableOpacity style={styles.editNameButton} onPress={handleEditName}>
              <Edit size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileBio}>
            "Writing helps me understand myself better and appreciate life's small moments."
          </Text>
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
              <Text style={styles.statNumber}>{entries.filter(entry => entry.isArchived).length}</Text>
              <Text style={styles.statLabel}>Archived</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={[styles.statCard, { backgroundColor: stat.color }]}>
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

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
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
                      Sync your journal entries across all your devices. Your notes will be securely stored and accessible anywhere.
                    </Text>
                    
                    <TouchableOpacity style={styles.googleLoginButton} onPress={handleGoogleLogin}>
                      <View style={styles.googleIcon}>
                        <Text style={styles.googleIconText}>G</Text>
                      </View>
                      <Text style={styles.googleLoginText}>Continue with Google</Text>
                    </TouchableOpacity>

                    <View style={styles.benefits}>
                      <View style={styles.benefitItem}>
                        <Shield size={16} color="#059669" />
                        <Text style={styles.benefitText}>Secure cloud backup</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Smartphone size={16} color="#059669" />
                        <Text style={styles.benefitText}>Access from any device</Text>
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
                    
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                      <LogOut size={16} color="#EF4444" />
                      <Text style={styles.logoutText}>Sign out</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Privacy & Security Section */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Privacy & Security</Text>
                
                <TouchableOpacity style={styles.settingItem}>
                  <Lock size={20} color="#3B82F6" />
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>App Lock</Text>
                    <Text style={styles.settingDescription}>Require passcode or biometric to open app</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem}>
                  <Shield size={20} color="#3B82F6" />
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>Data Export</Text>
                    <Text style={styles.settingDescription}>Download your journal entries</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Notifications Section */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Notifications</Text>
                
                <TouchableOpacity style={styles.settingItem}>
                  <Bell size={20} color="#3B82F6" />
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>Daily Reminders</Text>
                    <Text style={styles.settingDescription}>Get reminded to write in your journal</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* About Section */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>About</Text>
                
                <View style={styles.aboutItem}>
                  <Text style={styles.aboutLabel}>Version</Text>
                  <Text style={styles.aboutValue}>1.0.0</Text>
                </View>
                
                <TouchableOpacity style={styles.settingItem}>
                  <Text style={styles.settingTitle}>Terms of Service</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.settingItem}>
                  <Text style={styles.settingTitle}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Name Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editNameModalVisible}
        onRequestClose={() => setEditNameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editNameModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Name</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setEditNameModalVisible(false)}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.editNameContent}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.nameInput}
                value={tempName}
                onChangeText={setTempName}
                placeholder="Enter your name"
                autoFocus
                maxLength={50}
              />
              
              <View style={styles.editNameButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditNameModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.saveButton, !tempName.trim() && styles.saveButtonDisabled]}
                  onPress={handleSaveName}
                  disabled={!tempName.trim()}
                >
                  <Text style={[styles.saveButtonText, !tempName.trim() && styles.saveButtonTextDisabled]}>
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  settingsButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
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
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profileImageStyle: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  editNameButton: {
    marginLeft: 8,
    padding: 4,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  profileStat: {
    alignItems: 'center',
  },
   archivedStat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  achievementsContainer: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  achievementIcon: {
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  unearned: {
    color: '#9CA3AF',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6B7280',
  },

  actionsContainer: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionContent: { // Added style for text container in security card
    marginLeft: 12,
    flex: 1,
  },
  actionTitle: { // Added style for the title in security card
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  actionSubtitle: { // Added style for the subtitle in security card
    fontSize: 14,
    color: '#6B7280',
  },
  actionText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
    fontWeight: '500',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    padding: 24,
  },
  modalSection: {
    marginBottom: 32,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  
  // Login styles
  loginPrompt: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loginIcon: {
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  googleLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleIconText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  googleLoginText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  benefits: {
    alignSelf: 'stretch',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#059669',
    marginLeft: 8,
    fontWeight: '500',
  },
  
  // Logged in styles
  loggedInContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  syncStatus: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  logoutText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 6,
    fontWeight: '500',
  },
  
  // Settings item styles
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingContent: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // About styles
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 12,
  },
  aboutLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  aboutValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  
  // Edit Name Modal styles
  editNameModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  editNameContent: {
    padding: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    marginBottom: 24,
  },
  editNameButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
});