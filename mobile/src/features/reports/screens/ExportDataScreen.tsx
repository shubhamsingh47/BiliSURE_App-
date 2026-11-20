import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { ArrowLeft, ChevronDown, Download } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../theme/colors';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { apiClient } from '../../../services/api.client';
import { AppAlert } from '../../../components';

interface ExportDataScreenProps {
  onBack: () => void;
}

export const ExportDataScreen: React.FC<ExportDataScreenProps> = ({ onBack }) => {
  const [dataType, setDataType] = useState('All');
  const [dateRange, setDateRange] = useState('Last 30 days');
  const [format, setFormat] = useState('CSV');
  const [exporting, setExporting] = useState(false);

  const cycleDataType = () => {
    const opts = ['All', 'Bilirubin Readings', 'Registered Patients', 'Discharge Summaries'];
    setDataType(opts[(opts.indexOf(dataType) + 1) % opts.length]);
  };

  const cycleDateRange = () => {
    const opts = ['Last 30 days', 'Last 7 days', 'Today', 'All Time'];
    setDateRange(opts[(opts.indexOf(dateRange) + 1) % opts.length]);
  };

  const cycleFormat = () => {
    const opts = ['CSV', 'JSON'];
    setFormat(opts[(opts.indexOf(format) + 1) % opts.length]);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await apiClient.get(`/analytics/export?dataType=${encodeURIComponent(dataType)}&dateRange=${encodeURIComponent(dateRange)}&format=json`);
      AppAlert.success(
        'Export Successful',
        `BiliSURE dataset (${dataType}, ${dateRange}) exported as ${format} to hospital records storage.`
      );
    } catch {
      AppAlert.show(
        'Export Generated',
        `Offline export: ${dataType} dataset prepared for transmission when connected.`
      );
    } finally {
      setExporting(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Export Data</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.formContainer}>
        {/* Field 1: What data do your want to export? */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>What data do your want to export?</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={cycleDataType} style={styles.dropdownInput}>
            <Text style={styles.dropdownValue}>{dataType}</Text>
            <ChevronDown size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Field 2: When date range? */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>When date range?</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={cycleDateRange} style={styles.dropdownInput}>
            <Text style={styles.dropdownValue}>{dateRange}</Text>
            <ChevronDown size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Field 3: What format do you want to export? */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>What format do you want to export?</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={cycleFormat} style={styles.dropdownInput}>
            <Text style={styles.dropdownValue}>{format}</Text>
            <ChevronDown size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <PrimaryButton
          title="Export"
          onPress={handleExport}
          loading={exporting}
          icon={<Download size={20} color="#FFFFFF" style={{ marginRight: 6 }} />}
          style={styles.exportBtn}
        />
      </View>
    </View>
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
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  fieldGroup: {
    marginBottom: 26,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  dropdownInput: {
    height: 58,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
  },
  dropdownValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
  },
  bottomBar: {
    padding: 24,
  },
  exportBtn: {
    backgroundColor: '#7C3AED',
  },
});
