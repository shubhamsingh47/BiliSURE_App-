import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { moderateScale, fontScale } from '../theme/responsive';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dialogCard}>
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: isDestructive ? '#FEE2E2' : '#EDE9FE' },
                ]}
              >
                <AlertCircle
                  size={moderateScale(26)}
                  color={isDestructive ? '#DC2626' : '#7D3BFF'}
                  strokeWidth={2.4}
                />
              </View>

              <Text style={styles.titleText}>{title}</Text>
              <Text style={styles.messageText}>{message}</Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onCancel}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={cancelText}
                >
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    { backgroundColor: isDestructive ? '#DC2626' : '#7D3BFF' },
                  ]}
                  onPress={onConfirm}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={confirmText}
                >
                  <Text style={styles.confirmButtonText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  dialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    paddingVertical: moderateScale(24),
    paddingHorizontal: moderateScale(22),
    width: '100%',
    maxWidth: moderateScale(340),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 10,
  },
  iconWrapper: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(4),
  },
  titleText: {
    fontSize: fontScale(17.5),
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: moderateScale(10),
    letterSpacing: -0.2,
  },
  messageText: {
    fontSize: fontScale(13.5),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: moderateScale(8),
    marginBottom: moderateScale(20),
    paddingHorizontal: moderateScale(4),
  },
  actionsRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
    width: '100%',
    marginTop: moderateScale(4),
  },
  cancelButton: {
    flex: 1,
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: fontScale(13.5),
    fontWeight: '700',
    color: '#475569',
  },
  confirmButton: {
    flex: 1.15,
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: fontScale(13.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
