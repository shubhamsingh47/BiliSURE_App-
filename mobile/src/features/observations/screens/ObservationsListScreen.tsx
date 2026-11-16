import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { COLORS } from '../../../theme/colors';
import { CustomHeader } from '../../../components/CustomHeader';
import { usePatientStore } from '../../../store/usePatientStore';

interface ObservationsListScreenProps {
  onBack: () => void;
}

export const ObservationsListScreen: React.FC<ObservationsListScreenProps> = ({ onBack }) => {
  const { observations, selectedBaby } = usePatientStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <CustomHeader title={`Observations - ${selectedBaby?.name || 'Baby 1'}`} onBack={onBack} />
      <FlatList
        data={observations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.siteText}>Site: {item.site}</Text>
              <Text style={styles.valText}>{item.bilirubinValue.toFixed(1)} mg/dL</Text>
            </View>
            <Text style={styles.observerText}>Logged by {item.observerName}</Text>
            {item.clinicalNotes ? (
              <Text style={styles.notesText}>{item.clinicalNotes}</Text>
            ) : null}
            <Text style={styles.timeText}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  siteText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  valText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EF4444',
  },
  observerText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginVertical: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },
});
