import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
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
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.actionModal}>
          <View style={styles.iconContainer}>
            <Text style={styles.questionIcon}>?</Text>
          </View>
            
          <Text style={styles.actionModalTitle}>
            What do you want to do?
          </Text>
         <Text style={styles.actionMessage}>
            Restoring will bring the "{entryTitle}" back to your journal, while permanently deleting it will remove it forever.
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
        </View>
      </TouchableOpacity>
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
  actionModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    width: '85%',
    maxWidth: 320,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
