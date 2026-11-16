import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Calendar, Clock, X, Check } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

interface DateTimePickerFieldProps {
  label: string;
  value: string; // e.g. "2026-11-16" or "14:30" or ISO string
  onChange: (val: string) => void;
  mode?: 'date' | 'time' | 'datetime';
  error?: string;
  style?: ViewStyle;
}

export const DateTimePickerField: React.FC<DateTimePickerFieldProps> = ({
  label,
  value,
  onChange,
  mode = 'date',
  error,
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVal, setSelectedVal] = useState(value);

  const displayIcon = mode === 'time' ? (
    <Clock size={18} color={COLORS.primary} />
  ) : (
    <Calendar size={18} color={COLORS.primary} />
  );

  const handleConfirm = () => {
    onChange(selectedVal);
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
        style={[
          styles.field,
          error ? styles.fieldError : null,
        ]}
      >
        <Text style={styles.valueText}>
          {value || (mode === 'time' ? 'Select Time (HH:MM)' : 'Select Date (YYYY-MM-DD)')}
        </Text>
        {displayIcon}
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Mobile Picker Modal Sheet */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set {label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.quickSelects}>
              {mode === 'date' ? (
                <>
                  <TouchableOpacity
                    onPress={() => setSelectedVal(new Date().toISOString().split('T')[0])}
                    style={[styles.quickChip, selectedVal === new Date().toISOString().split('T')[0] && styles.quickChipActive]}
                  >
                    <Text style={[styles.quickText, selectedVal === new Date().toISOString().split('T')[0] && styles.quickTextActive]}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 1);
                      setSelectedVal(d.toISOString().split('T')[0]);
                    }}
                    style={styles.quickChip}
                  >
                    <Text style={styles.quickText}>Yesterday</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 2);
                      setSelectedVal(d.toISOString().split('T')[0]);
                    }}
                    style={styles.quickChip}
                  >
                    <Text style={styles.quickText}>2 Days Ago</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      const now = new Date();
                      const hh = String(now.getHours()).padStart(2, '0');
                      const mm = String(now.getMinutes()).padStart(2, '0');
                      setSelectedVal(`${hh}:${mm}`);
                    }}
                    style={styles.quickChip}
                  >
                    <Text style={styles.quickText}>Now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setSelectedVal('08:00')}
                    style={styles.quickChip}
                  >
                    <Text style={styles.quickText}>08:00 AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setSelectedVal('14:00')}
                    style={styles.quickChip}
                  >
                    <Text style={styles.quickText}>02:00 PM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setSelectedVal('20:00')}
                    style={styles.quickChip}
                  >
                    <Text style={styles.quickText}>08:00 PM</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <View style={styles.selectedDisplay}>
              <Text style={styles.selectedLabel}>Selected Value:</Text>
              <Text style={styles.selectedValText}>{selectedVal || 'None'}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleConfirm}
              style={styles.confirmBtn}
            >
              <Check size={16} color={COLORS.white} />
              <Text style={styles.confirmBtnText}>Confirm Selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  field: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  fieldError: {
    borderColor: COLORS.critical,
  },
  valueText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 11,
    color: COLORS.critical,
    marginTop: 4,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  quickSelects: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  quickChipActive: {
    backgroundColor: COLORS.primaryBg,
  },
  quickText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  quickTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  selectedDisplay: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  selectedLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  selectedValText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});
