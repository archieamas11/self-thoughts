import React from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface ActionModalProps {
  visible: boolean;
  onClose: () => void;
  entryTitle: string;
  onRestore: () => void;
  onDelete: () => void;
}

export default function ActionModal({
  visible,
  onClose,
  entryTitle,
  onRestore,
  onDelete,
}: ActionModalProps) {
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
  }, [visible, fadeAnim, scaleAnim, slideAnim]);  return (
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
                styles.actionModal,
                {
                  transform: [
                    { scale: scaleAnim },
                    { translateY: slideAnim }
                  ],
                },
              ]}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.questionIcon}>?</Text>
              </View>

              <Text style={styles.actionModalTitle}>What do you want to do?</Text>
              <Text style={styles.actionMessage}>
                Restoring will bring the "{entryTitle}" back to your journal, while
                permanently deleting it will remove it forever.
              </Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.actionModalButton, styles.restoreButton]}
                  onPress={onRestore}
                >
                  <Text style={styles.restoreButtonText}>Restore</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionModalButton, styles.deleteButton]}
                  onPress={onDelete}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
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
  actionModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    width: '90%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  iconContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
  },
  questionIcon: {
    fontSize: 48,
    fontWeight: '300',
    color: '#6B7280',
    textAlign: 'center',
  },
  actionModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  actionMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionModalButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    flex: 1,
  },
  restoreButton: {
    backgroundColor: '#10B981',
  },
  restoreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
