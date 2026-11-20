import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
} from 'lucide-react-native';
import { useDialogStore, DialogType } from '../store/useDialogStore';
import { moderateScale, fontScale } from '../theme/responsive';

export const AppDialog: React.FC = () => {
  const { isOpen, options, hide } = useDialogStore();

  if (!isOpen || !options) return null;

  const {
    title,
    message,
    type = 'info',
    confirmText = 'OK',
    cancelText = 'Cancel',
    showCancel = false,
    onConfirm,
    onCancel,
  } = options;

  const handleConfirm = async () => {
    hide();
    if (onConfirm) {
      await onConfirm();
    }
  };

  const handleCancel = () => {
    hide();
    if (onCancel) {
      onCancel();
    }
  };

  const renderIcon = (dialogType: DialogType) => {
    const iconSize = moderateScale(26);
    switch (dialogType) {
      case 'success':
        return (
          <View style={[styles.iconWrapper, { backgroundColor: '#DCFCE7' }]}>
            <CheckCircle2 size={iconSize} color="#16A34A" strokeWidth={2.4} />
          </View>
        );
      case 'warning':
        return (
          <View style={[styles.iconWrapper, { backgroundColor: '#FEF3C7' }]}>
            <AlertTriangle size={iconSize} color="#D97706" strokeWidth={2.4} />
          </View>
        );
      case 'danger':
        return (
          <View style={[styles.iconWrapper, { backgroundColor: '#FEE2E2' }]}>
            <AlertCircle size={iconSize} color="#DC2626" strokeWidth={2.4} />
          </View>
        );
      case 'info':
      default:
        return (
          <View style={[styles.iconWrapper, { backgroundColor: '#EDE9FE' }]}>
            <Info size={iconSize} color="#7D3BFF" strokeWidth={2.4} />
          </View>
        );
    }
  };

  const getConfirmBtnColor = (dialogType: DialogType) => {
    switch (dialogType) {
      case 'danger':
        return '#DC2626';
      case 'success':
        return '#16A34A';
      default:
        return '#7D3BFF';
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <TouchableWithoutFeedback onPress={showCancel ? handleCancel : handleConfirm}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dialogCard}>
              {/* Dynamic Tinted Icon Badge */}
              {renderIcon(type)}

              {/* Title */}
              <Text style={styles.titleText}>{title}</Text>

              {/* Message */}
              {!!message && <Text style={styles.messageText}>{message}</Text>}

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                {showCancel && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancel}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={cancelText}
                  >
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    { backgroundColor: getConfirmBtnColor(type) },
                    !showCancel && { flex: 1, width: '100%' },
                  ]}
                  onPress={handleConfirm}
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
