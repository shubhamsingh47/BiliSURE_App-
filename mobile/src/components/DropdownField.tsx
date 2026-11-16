import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { ChevronDown, Check, X } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

export interface DropdownOption {
  label: string;
  value: string;
  description?: string;
}

interface DropdownFieldProps {
  label: string;
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
  style?: ViewStyle;
}

export const DropdownField: React.FC<DropdownFieldProps> = ({
  label,
  options,
  selectedValue,
  onSelect,
  placeholder = 'Select an option',
  error,
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  const handleChoose = (val: string) => {
    onSelect(val);
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
        style={[
          styles.trigger,
          error ? styles.triggerError : null,
        ]}
      >
        <Text
          style={[
            styles.triggerText,
            !selectedOption && styles.placeholderText,
          ]}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Mobile Select Bottom Sheet Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = item.value === selectedValue;
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleChoose(item.value)}
                    style={[
                      styles.optionItem,
                      isSelected && styles.optionItemSelected,
                    ]}
                  >
                    <View style={styles.optionTextContainer}>
                      <Text
                        style={[
                          styles.optionLabel,
                          isSelected && styles.optionLabelSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {item.description ? (
                        <Text style={styles.optionDescription}>{item.description}</Text>
                      ) : null}
                    </View>
                    {isSelected && (
                      <Check size={18} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
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
  trigger: {
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
  triggerError: {
    borderColor: COLORS.critical,
  },
  triggerText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
  },
  placeholderText: {
    color: COLORS.textMuted,
  },
  errorText: {
    fontSize: 11,
    color: COLORS.critical,
    marginTop: 4,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '65%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  optionItemSelected: {
    backgroundColor: COLORS.primaryBg,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  optionLabelSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  optionDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
