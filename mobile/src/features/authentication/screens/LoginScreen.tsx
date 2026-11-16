import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../../../theme/colors';
import { CustomInput } from '../../../components/CustomInput';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { useAuthStore, PRIMARY_PRESET_USERS } from '../../../store/useAuthStore';
import { apiClient } from '../../../services/api.client';
import { PrimaryUserRole, PermissionProfile } from '../../../types';

interface LoginScreenProps {
  onSuccess: () => void;
  onGoToRegister?: () => void;
}

const PRIMARY_ROLES: {
  key: PrimaryUserRole;
  title: string;
  facility: string;
  icon: string;
  defaultEmail: string;
}[] = [
  {
    key: 'doctor_referring',
    title: 'Doctor / Referring Centre',
    facility: 'North Community Health Centre (CHC)',
    icon: '🩺',
    defaultEmail: 'priya.sharma@chc.district.org',
  },
  {
    key: 'receiving_hospital',
    title: 'Receiving Hospital',
    facility: 'District Civil Hospital NICU / Operations',
    icon: '🏥',
    defaultEmail: 'rajesh.verma@dch.district.org',
  },
  {
    key: 'district_admin',
    title: 'District Administrator',
    facility: 'Central District Health Authority',
    icon: '🏛️',
    defaultEmail: 'cmo.district@health.gov.in',
  },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [selectedPrimaryRole, setSelectedPrimaryRole] = useState<PrimaryUserRole>('doctor_referring');
  const [selectedHospitalProfile, setSelectedHospitalProfile] = useState<PermissionProfile>('clinical');
  const [email, setEmail] = useState('priya.sharma@chc.district.org');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setUser, switchRole, setHospitalPermissionProfile } = useAuthStore();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { user, accessToken } = response.data.data;
      setUser(user, accessToken);
      onSuccess();
    } catch {
      // Graceful offline/demo session fallback with matching preset
      const matched = PRIMARY_PRESET_USERS[selectedPrimaryRole] || PRIMARY_PRESET_USERS.doctor_referring;
      setUser(matched, 'mock_jwt_token');
      if (selectedPrimaryRole === 'receiving_hospital') {
        setHospitalPermissionProfile(selectedHospitalProfile);
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRoleLogin = (role: PrimaryUserRole, profile?: PermissionProfile) => {
    switchRole(role);
    if (role === 'receiving_hospital' && profile) {
      setHospitalPermissionProfile(profile);
    }
    const user = PRIMARY_PRESET_USERS[role];
    setUser(user, 'mock_jwt_token');
    onSuccess();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brandTitle}>BiliSURE</Text>
        <Text style={styles.subtitle}>Newborn Jaundice Monitoring & PT Network</Text>
        <View style={styles.roleCountBadge}>
          <Text style={styles.roleCountText}>Unified 3-Role Architecture</Text>
        </View>
      </View>

      {/* Primary Role Selector */}
      <View style={styles.quickSection}>
        <Text style={styles.sectionTitle}>Select Primary Role</Text>
        {PRIMARY_ROLES.map((r) => {
          const isSelected = selectedPrimaryRole === r.key;
          return (
            <TouchableOpacity
              key={r.key}
              style={[styles.roleCard, isSelected && styles.roleCardActive]}
              onPress={() => {
                setSelectedPrimaryRole(r.key);
                setEmail(r.defaultEmail);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.roleIcon}>{r.icon}</Text>
              <View style={styles.roleInfo}>
                <Text style={[styles.roleTitle, isSelected && styles.roleTitleActive]}>
                  {r.title}
                </Text>
                <Text style={styles.roleFacility}>{r.facility}</Text>
              </View>
              {isSelected && <Text style={styles.checkIcon}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Permissions Profile Selector for Receiving Hospital */}
      {selectedPrimaryRole === 'receiving_hospital' && (
        <View style={styles.profileBox}>
          <Text style={styles.profileBoxTitle}>Hospital Permission Profile:</Text>
          <View style={styles.profileRow}>
            {(['clinical', 'nursing', 'management'] as PermissionProfile[]).map((prof) => {
              const isPActive = selectedHospitalProfile === prof;
              const label =
                prof === 'clinical'
                  ? 'Doctor (Clinical)'
                  : prof === 'nursing'
                  ? 'Nurse (Treatment)'
                  : 'Admin (Operations)';
              return (
                <TouchableOpacity
                  key={prof}
                  onPress={() => setSelectedHospitalProfile(prof)}
                  style={[styles.profilePill, isPActive && styles.profilePillActive]}
                >
                  <Text style={[styles.profilePillText, isPActive && styles.profilePillTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Login Credentials Form */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Sign In</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}

        <CustomInput
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="doctor@hospital.org"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <CustomInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />

        <PrimaryButton
          title={loading ? 'Authenticating...' : 'Sign In to BiliSURE'}
          onPress={handleLogin}
          disabled={loading}
          style={styles.signInBtn}
        />

        <TouchableOpacity
          style={styles.oneTapBtn}
          onPress={() => handleQuickRoleLogin(selectedPrimaryRole, selectedHospitalProfile)}
        >
          <Text style={styles.oneTapBtnText}>⚡ 1-Tap Quick Demo Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8F9FD',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#7D3BFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  roleCountBadge: {
    marginTop: 8,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roleCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7D3BFF',
  },
  quickSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  roleCardActive: {
    borderColor: '#7D3BFF',
    backgroundColor: '#F5F3FF',
  },
  roleIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  roleTitleActive: {
    color: '#7D3BFF',
  },
  roleFacility: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  checkIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: '#7D3BFF',
  },
  profileBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileBoxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  profileRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  profilePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  profilePillActive: {
    backgroundColor: '#7D3BFF',
  },
  profilePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  profilePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 10,
  },
  signInBtn: {
    marginTop: 10,
  },
  oneTapBtn: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
  },
  oneTapBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7D3BFF',
  },
});
