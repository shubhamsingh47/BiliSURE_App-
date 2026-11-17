import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Building2, Check, ArrowRight } from 'lucide-react-native';
import { COLORS } from '../../../theme/colors';
import { PurpleHeader } from '../../../components/PurpleHeader';
import { PrimaryButton } from '../../../components/PrimaryButton';

interface Facility {
  id: string;
  name: string;
  type: string;
  district: string;
  role: string;
}

const MOCK_FACILITIES: Facility[] = [
  {
    id: 'fac-1',
    name: 'North Community Health Centre (CHC)',
    type: 'Referring Centre / CHC',
    district: 'Central District',
    role: 'Attending Pediatrician',
  },
  {
    id: 'fac-2',
    name: 'Primary Health Centre (PHC) - West Block',
    type: 'Referring Centre / PHC',
    district: 'Central District',
    role: 'Medical Officer',
  },
  {
    id: 'fac-3',
    name: 'District Civil Hospital',
    type: 'District Referral Hospital',
    district: 'Central District',
    role: 'Visiting Neonatal Consultant',
  },
];

interface FacilitySelectionScreenProps {
  onBack?: () => void;
  onFacilitySelected: (facility: Facility) => void;
}

export const FacilitySelectionScreen: React.FC<FacilitySelectionScreenProps> = ({
  onBack,
  onFacilitySelected,
}) => {
  const [selectedId, setSelectedId] = useState<string>('fac-1');

  const selectedFacility = MOCK_FACILITIES.find((f) => f.id === selectedId) || MOCK_FACILITIES[0];

  return (
    <View style={styles.safeArea}>
      <PurpleHeader
        title="Select Active Facility"
        subtitle="Choose your assigned healthcare station for this session"
        onBack={onBack}
      />

      <View style={styles.container}>
        <FlatList
          data={MOCK_FACILITIES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSelected = item.id === selectedId;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedId(item.id)}
                style={[styles.card, isSelected && styles.cardSelected]}
              >
                <View style={styles.iconCircle}>
                  <Building2 size={20} color={isSelected ? COLORS.white : COLORS.primary} />
                </View>

                <View style={styles.infoCol}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.type}>{item.type}</Text>
                  <Text style={styles.roleTag}>Assignment: {item.role}</Text>
                </View>

                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <Check size={14} color={COLORS.white} />}
                </View>
              </TouchableOpacity>
            );
          }}
        />

        <View style={styles.footer}>
          <PrimaryButton
            title={`Enter as ${selectedFacility.name.split(' ')[0]}`}
            onPress={() => onFacilitySelected(selectedFacility)}
            icon={<ArrowRight size={18} color={COLORS.white} style={{ marginRight: 8 }} />}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FAF5FF',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  type: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  roleTag: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 4,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
});
