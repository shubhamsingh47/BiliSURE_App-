import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { UserCheck, Shield, Phone, Mail, Plus } from 'lucide-react-native';
import { COLORS } from '../../../theme/colors';
import { PurpleHeader } from '../../../components/PurpleHeader';
import { StatusBadge } from '../../../components/StatusBadge';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  onDuty: boolean;
  phone: string;
  email: string;
}

const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'st-1',
    name: 'Dr. Rajesh Verma',
    role: 'Hospital Doctor (Neonatologist)',
    department: 'Neonatal Intensive Care (NICU)',
    onDuty: true,
    phone: '+91 98765 43210',
    email: 'rajesh.verma@districtcivil.org',
  },
  {
    id: 'st-2',
    name: 'Nurse Sunita Patel',
    role: 'Senior Staff Nurse',
    department: 'Special Newborn Care Unit (SNCU)',
    onDuty: true,
    phone: '+91 98765 43211',
    email: 'sunita.patel@districtcivil.org',
  },
  {
    id: 'st-3',
    name: 'Nurse Anjali Rao',
    role: 'Staff Nurse',
    department: 'Postnatal Ward & PT Stations',
    onDuty: false,
    phone: '+91 98765 43212',
    email: 'anjali.rao@districtcivil.org',
  },
  {
    id: 'st-4',
    name: 'Dr. Anita Desai',
    role: 'Pediatric Registrar',
    department: 'Emergency Pediatrics',
    onDuty: true,
    phone: '+91 98765 43213',
    email: 'anita.desai@districtcivil.org',
  },
];

interface StaffManagementScreenProps {
  onBack: () => void;
}

export const StaffManagementScreen: React.FC<StaffManagementScreenProps> = ({ onBack }) => {
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);

  const toggleDuty = (id: string) => {
    setStaff((prev) =>
      prev.map((s) => (s.id === id ? { ...s, onDuty: !s.onDuty } : s))
    );
  };

  return (
    <View style={styles.safeArea}>
      <PurpleHeader
        title="Clinical Staff Management"
        subtitle="District Civil Hospital Roster"
        onBack={onBack}
      />

      <View style={styles.container}>
        <FlatList
          data={staff}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.topRow}>
                <View style={styles.avatar}>
                  <UserCheck size={20} color={COLORS.primary} />
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.role}>{item.role}</Text>
                  <Text style={styles.dept}>{item.department}</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => toggleDuty(item.id)}
                >
                  <StatusBadge
                    label={item.onDuty ? 'On Duty' : 'Off Duty'}
                    variant={item.onDuty ? 'normal' : 'neutral'}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.contactRow}>
                <View style={styles.contactItem}>
                  <Phone size={12} color={COLORS.textSecondary} />
                  <Text style={styles.contactText}>{item.phone}</Text>
                </View>
                <View style={styles.contactItem}>
                  <Mail size={12} color={COLORS.textSecondary} />
                  <Text style={styles.contactText}>{item.email}</Text>
                </View>
              </View>
            </View>
          )}
        />
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
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
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
  role: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 1,
  },
  dept: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
