import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { ArrowLeft, Trash2, AlertCircle } from 'lucide-react-native';
import { COLORS } from '../../../theme/colors';
import { PrimaryButton } from '../../../components/PrimaryButton';

interface DeviceAlertScreenProps {
  onBack: () => void;
}

export const DeviceAlertScreen: React.FC<DeviceAlertScreenProps> = ({ onBack }) => {
  const handleContactSupport = () => {
    Alert.alert(
      'BiliSURE Support',
      'Device replacement request generated for BiliSURE Serial #BS-2026-X1-9942. Our biomedical support team will deliver new sensor modules within 4 hours.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test Remaining</Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.trashBtn}>
          <Trash2 size={22} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* ALERT ! pill */}
        <View style={styles.alertPill}>
          <Text style={styles.alertPillText}>ALERT !</Text>
        </View>

        <Text style={styles.brokenHeading}>Something seems broken</Text>

        <Text style={styles.testCountNumber}>10</Text>

        {/* Yellow/Gold Bar from Frame 52 */}
        <View style={styles.goldBar} />

        {/* Red Alert Pill */}
        <View style={styles.redAlertBox}>
          <AlertCircle size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.redAlertText}>
            Sorry! No more tests can be perfomed
          </Text>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <PrimaryButton
          title="Contact Support"
          onPress={handleContactSupport}
          style={styles.supportBtn}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  trashBtn: {
    padding: 6,
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingTop: 30,
  },
  alertPill: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 28,
    marginBottom: 28,
  },
  alertPillText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  brokenHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 16,
  },
  testCountNumber: {
    fontSize: 84,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 10,
  },
  goldBar: {
    width: '100%',
    height: 10,
    backgroundColor: '#F59E0B',
    borderRadius: 5,
    marginVertical: 24,
  },
  redAlertBox: {
    backgroundColor: '#EF4444',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  redAlertText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomBar: {
    padding: 24,
  },
  supportBtn: {
    backgroundColor: '#7C3AED',
  },
});
