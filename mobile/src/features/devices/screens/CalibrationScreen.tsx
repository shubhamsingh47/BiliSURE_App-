import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../theme/colors';

interface CalibrationScreenProps {
  onBack: () => void;
  onOpenStatus: () => void;
  onOpenAlert: () => void;
}

export const CalibrationScreen: React.FC<CalibrationScreenProps> = ({
  onBack,
  onOpenStatus,
  onOpenAlert,
}) => {
  const [autoCalibrate, setAutoCalibrate] = useState(true);
  const [accuracyTest, setAccuracyTest] = useState(true);
  const [recordLog, setRecordLog] = useState(false);

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calibration</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onOpenAlert} style={styles.diagPill}>
          <Text style={styles.diagText}>Health</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Toggle 1: Auto Calibrate */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Auto Caliberate</Text>
            <Text style={styles.settingSub}>Initiate Auto caliberate the device</Text>
          </View>
          <Switch
            value={autoCalibrate}
            onValueChange={(val) => {
              setAutoCalibrate(val);
              if (val) onOpenStatus();
            }}
            trackColor={{ false: '#E2E8F0', true: '#7C3AED' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Toggle 2: Accuracy Test */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Accuracy Test</Text>
            <Text style={styles.settingSub}>Initiate the accuracy test</Text>
          </View>
          <Switch
            value={accuracyTest}
            onValueChange={setAccuracyTest}
            trackColor={{ false: '#E2E8F0', true: '#7C3AED' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Toggle 3: Record Calibration Log */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Record Calibration Log</Text>
            <Text style={styles.settingSub}>Save and send the calibration log</Text>
          </View>
          <Switch
            value={recordLog}
            onValueChange={setRecordLog}
            trackColor={{ false: '#E2E8F0', true: '#7C3AED' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* 3D Sensor Grid Illustration from Frame 47 */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenStatus}
          style={styles.gridContainer}
        >
          <Svg width={240} height={200} viewBox="0 0 240 200">
            {/* Tilted sensor grid */}
            <Rect
              x="30"
              y="20"
              width="180"
              height="150"
              rx="24"
              fill="#EDE9FE"
              stroke="#A78BFA"
              strokeWidth="4"
              transform="rotate(12 120 100)"
            />
            {/* Internal grid lines */}
            <Path
              d="M 50 70 L 190 100 M 40 115 L 180 145 M 85 30 L 115 170 M 135 40 L 165 180"
              stroke="#8B5CF6"
              strokeWidth="3.5"
            />
          </Svg>
          <Text style={styles.gridHint}>Tap sensor to view calibration status</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  diagPill: {
    backgroundColor: '#F3E8FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  diagText: {
    color: '#7C3AED',
    fontWeight: '700',
    fontSize: 13,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  settingSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 3,
  },
  gridContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  gridHint: {
    color: '#7C3AED',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
});
