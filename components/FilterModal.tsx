import { Archive, Heart } from 'lucide-react-native';
import React from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type FilterType = 'all' | 'archived' | 'favorites';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filterType: FilterType;
  onFilterSelect: (filter: FilterType) => void;
}

export default function FilterModal({
  visible,
  onClose,
  filterType,
  onFilterSelect,
}: FilterModalProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.3)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    if (visible) {
      // Reset values for smooth opening
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.3);
      slideAnim.setValue(30);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          speed: 12,
          bounciness: 4,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.3,
          duration: 200,
          easing: Easing.in(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 30,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim, slideAnim]);

  const handleFilterSelect = (filter: FilterType) => {
    onFilterSelect(filter);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <Animated.View
              style={[
                styles.filterModal,
                {
                  transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
                },
              ]}
            >
              <Text style={styles.filterModalTitle}>Filter Entries</Text>

              <TouchableOpacity
                style={[
                  styles.filterModalButton,
                  filterType === 'all' && styles.activeFilterModalButton,
                ]}
                onPress={() => handleFilterSelect('all')}
              >
                <Text
                  style={[
                    styles.filterModalButtonText,
                    filterType === 'all' && styles.activeFilterModalButtonText,
                  ]}
                >
                  All Entries
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterModalButton,
                  filterType === 'favorites' && styles.activeFilterModalButton,
                ]}
                onPress={() => handleFilterSelect('favorites')}
              >
                <View style={styles.filterModalButtonContent}>
                  <Heart
                    size={18}
                    color={filterType === 'favorites' ? '#FFFFFF' : '#EF4444'}
                  />
                  <Text
                    style={[
                      styles.filterModalButtonText,
                      filterType === 'favorites' &&
                        styles.activeFilterModalButtonText,
                    ]}
                  >
                    Favorites
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterModalButton,
                  filterType === 'archived' && styles.activeFilterModalButton,
                ]}
                onPress={() => handleFilterSelect('archived')}
              >
                <View style={styles.filterModalButtonContent}>
                  <Archive
                    size={18}
                    color={filterType === 'archived' ? '#FFFFFF' : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.filterModalButtonText,
                      filterType === 'archived' &&
                        styles.activeFilterModalButtonText,
                    ]}
                  >
                    Archived
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 600,
    minWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  activeFilterModalButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterModalButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterModalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  activeFilterModalButtonText: {
    color: '#FFFFFF',
  },
});
