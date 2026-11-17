import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { Admission, TreatmentSession } from '../../../types';
import { COLORS } from '../../../theme/colors';

interface NurseTreatmentTrackerScreenProps {
  onBack?: () => void;
  onRecordBilirubin?: (babyUhid: string) => void;
  onOpenNotifications?: () => void;
}

export const NurseTreatmentTrackerScreen: React.FC<NurseTreatmentTrackerScreenProps> = ({
  onBack,
  onRecordBilirubin,
  onOpenNotifications,
}) => {
  const { admissions, startTreatmentSession, endTreatmentSession, approveDischarge, notifications } = useNetworkStore();
  const { user } = useAuthStore();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const [activeAdmission, setActiveAdmission] = useState<Admission | null>(null);
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [phototherapyType, setPhototherapyType] = useState('Double Surface High-Intensity LED');
  const [irradiance, setIrradiance] = useState('35');
  const [sessionNotes, setSessionNotes] = useState('Eye patches and genital shield placed securely. Baby calm.');
  const [isProcessing, setIsProcessing] = useState(false);

  // Admitted neonates who have an allocated station
  const treatedPatients = admissions.filter((a) => a.admissionStatus === 'under_treatment');

  const handleStartSession = async () => {
    if (!activeAdmission) return;
    setIsProcessing(true);
    try {
      await startTreatmentSession(activeAdmission.id || activeAdmission.admissionId, {
        phototherapyType,
        irradianceMwCm2: parseFloat(irradiance) || 35,
        nurseName: user.name,
        notes: sessionNotes,
      });
      setSessionModalVisible(false);
      Alert.alert('Session Started', `Phototherapy session active for ${activeAdmission.babyName}.`);
    } catch {
      Alert.alert('Error', 'Failed to start session');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEndSession = async (admission: Admission, session: TreatmentSession) => {
    setIsProcessing(true);
    try {
      await endTreatmentSession(admission.id || admission.admissionId, session.sessionId, user.name, 'Concluded scheduled cycle.');
      Alert.alert('Session Concluded', 'Session duration saved. Ready for nursing observation and post-session bilirubin testing.');
    } catch {
      Alert.alert('Error', 'Failed to conclude session');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompletePhototherapy = (admission: Admission) => {
    Alert.alert(
      'Complete Phototherapy Treatment',
      `Are you sure you want to conclude phototherapy for ${admission.babyName} (${admission.babyUhid})?\n\nThis will mark the phototherapy treatment course as completed and release station ${admission.ptStationName || ''} to the cleaning & sanitization pool.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '✓ Complete Treatment',
          style: 'default',
          onPress: async () => {
            setIsProcessing(true);
            try {
              // Conclude any active session if one is in progress
              const activeSess = admission.treatmentSessions.find((s) => s.status === 'active');
              if (activeSess) {
                await endTreatmentSession(
                  admission.id || admission.admissionId,
                  activeSess.sessionId,
                  user.name,
                  'Final cycle concluded upon phototherapy completion.'
                );
              }

              // Complete phototherapy admission & release station
              await approveDischarge(admission.id || admission.admissionId, {
                doctorName: user.name,
                dischargeBilirubinValue: admission.initialAdmissionBilirubin || 10.0,
                dischargeNotes: 'Phototherapy course completed successfully. Infant clinically stable.',
                followUpPlan: 'Follow-up TcB evaluation at referring centre in 24-48 hours.',
              });

              Alert.alert(
                'Phototherapy Completed!',
                `Phototherapy treatment for ${admission.babyName} has been successfully completed. Station ${admission.ptStationName || ''} is now released for sanitization.`
              );
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to complete phototherapy');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleGroup}>
            {onBack && (
              <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <Text style={styles.backBtnText}>←</Text>
              </TouchableOpacity>
            )}
            <View>
              <Text style={styles.headerTitle}>Phototherapy Tracking</Text>
              <Text style={styles.headerSubtitle}>Active Treatment Sessions • {user.facility}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onOpenNotifications}
            style={styles.notifBtn}
            activeOpacity={0.7}
            accessibilityLabel="Notifications"
          >
            <Text style={styles.bellIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.badgeDot}>
                <Text style={styles.badgeDotText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Patient Treatment Cards */}
      <FlatList
        data={treatedPatients}
        keyExtractor={(item) => item.id || item.admissionId}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💡</Text>
            <Text style={styles.emptyTitle}>No Active Sessions</Text>
            <Text style={styles.emptySub}>No patients currently undergoing phototherapy in this unit.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const activeSession = item.treatmentSessions.find((s) => s.status === 'active');
          const completedCount = item.treatmentSessions.filter((s) => s.status === 'completed').length;
          const totalDurationMins = item.treatmentSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.stationPill}>
                  <Text style={styles.stationText}>📍 {item.ptStationName || 'Station Assigned'}</Text>
                </View>
                {((item.treatmentSessions && item.treatmentSessions.length > 0) || !!activeSession) && (
                  <TouchableOpacity
                    onPress={() => handleCompletePhototherapy(item)}
                    style={styles.headerCompleteBtn}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.headerCompleteBtnText}>Complete</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.babyName}>{item.babyName} ({item.babyUhid})</Text>
              <Text style={styles.admissionSub}>
                Admitted: {new Date(item.admittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Doctor: {item.assignedDoctor}
              </Text>

              {/* Stats Bar */}
              <View style={styles.statsBar}>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{item.initialAdmissionBilirubin || 14.8} mg/dL</Text>
                  <Text style={styles.statLbl}>Admission TSB</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statVal, { color: '#00A569' }]}>{(totalDurationMins / 60).toFixed(1)} hrs</Text>
                  <Text style={styles.statLbl}>Cumulative PT</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{completedCount} Cycles</Text>
                  <Text style={styles.statLbl}>Completed</Text>
                </View>
              </View>

              {/* Active Session Card */}
              {activeSession ? (
                <View style={styles.activeSessionBox}>
                  <View style={styles.activeSessionHeader}>
                    <Text style={styles.activeSessionTitle} numberOfLines={2}>
                      Current Cycle: {activeSession.phototherapyType}
                    </Text>
                    <Text style={styles.irradianceText}>⚡ {activeSession.irradianceMwCm2} µW/cm²</Text>
                  </View>
                  <Text style={styles.startedAtText}>
                    Started at: {new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleEndSession(item, activeSession)}
                    style={styles.endCycleBtn}
                    disabled={isProcessing}
                  >
                    <Text style={styles.endCycleBtnText}>■ Stop / Conclude Phototherapy Cycle</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setActiveAdmission(item);
                    setSessionModalVisible(true);
                  }}
                  style={styles.startCycleBtn}
                  disabled={isProcessing}
                >
                  <Text style={styles.startCycleBtnText}>▶ Start New Phototherapy Session</Text>
                </TouchableOpacity>
              )}

              {/* Serial Reading Action */}
              {onRecordBilirubin && (
                <TouchableOpacity
                  onPress={() => onRecordBilirubin(item.babyUhid)}
                  style={styles.readingBtn}
                >
                  <Text style={styles.readingBtnText}>+ Log Serial Bilirubin Test</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {/* Start Session Modal */}
      <Modal visible={sessionModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Initiate Phototherapy Session</Text>
            <Text style={styles.modalSub}>Patient: {activeAdmission?.babyName} ({activeAdmission?.babyUhid})</Text>

            <Text style={styles.inputLabel}>Equipment / Light Source Type</Text>
            <View style={styles.typeRow}>
              {['Double Surface LED', 'Overhead Blue LED', 'LED Tunnel', 'Fiberoptic Blanket'].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setPhototherapyType(t)}
                  style={[styles.typePill, phototherapyType === t && styles.typePillActive]}
                >
                  <Text style={[styles.typePillText, phototherapyType === t && styles.typePillTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Irradiance Level (µW/cm²/nm)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="number-pad"
              value={irradiance}
              onChangeText={setIrradiance}
            />

            <Text style={styles.inputLabel}>Nursing Notes</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={2}
              value={sessionNotes}
              onChangeText={setSessionNotes}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity onPress={() => setSessionModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleStartSession} style={styles.confirmStartBtn} disabled={isProcessing}>
                <Text style={styles.confirmStartBtnText}>Start Phototherapy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#7D3BFF',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  backBtn: {
    marginRight: 12,
    padding: 6,
  },
  backBtnText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellIcon: {
    fontSize: 18,
  },
  badgeDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#FC3949',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#7D3BFF',
  },
  badgeDotText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stationPill: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7D3BFF',
  },
  babyName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#181829',
    marginBottom: 2,
  },
  admissionSub: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#181829',
  },
  statLbl: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  activeSessionBox: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  activeSessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 6,
    gap: 8,
  },
  activeSessionTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#1D4ED8',
    lineHeight: 18,
  },
  irradianceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    flexShrink: 0,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  startedAtText: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 8,
  },
  endCycleBtn: {
    backgroundColor: '#FC3949',
    borderRadius: 12,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endCycleBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  startCycleBtn: {
    backgroundColor: '#7D3BFF',
    borderRadius: 14,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  startCycleBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  readingBtn: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    height: 38,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readingBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7D3BFF',
  },
  headerCompleteBtn: {
    backgroundColor: '#00A569',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCompleteBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#181829',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#181829',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#181829',
    marginBottom: 6,
    marginTop: 10,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
    marginBottom: 6,
  },
  typePillActive: {
    backgroundColor: '#7D3BFF',
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  typePillTextActive: {
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#181829',
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    fontSize: 12,
    color: '#181829',
    textAlignVertical: 'top',
    minHeight: 60,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmStartBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#7D3BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmStartBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
