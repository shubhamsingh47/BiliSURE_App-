import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ScrollView, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { usePatientStore } from '../../../store/usePatientStore';
import { Admission, TreatmentSession } from '../../../types';
import { COLORS } from '../../../theme/colors';
import { getScreenTopPadding } from '../../../theme/responsive';

interface NurseTreatmentTrackerScreenProps {
  onBack?: () => void;
  onRecordBilirubin?: (babyUhid: string) => void;
  onOpenNotifications?: () => void;
  embedded?: boolean;
}

export const NurseTreatmentTrackerScreen: React.FC<NurseTreatmentTrackerScreenProps> = ({
  onBack,
  onRecordBilirubin,
  onOpenNotifications,
  embedded = false,
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

  // Sample entry modal state
  const [sampleModalVisible, setSampleModalVisible] = useState(false);
  const [sampleAdmission, setSampleAdmission] = useState<Admission | null>(null);
  const [sampleValue, setSampleValue] = useState('');
  const [sampleMethod, setSampleMethod] = useState<'TcB' | 'TSB'>('TcB');
  const [sampleSite, setSampleSite] = useState('Forehead');

  // Cycle & sample history page state
  const [cycleHistoryAdmission, setCycleHistoryAdmission] = useState<Admission | null>(null);
  const [historyTab, setHistoryTab] = useState<'cycles' | 'samples'>('cycles');
  const readings = usePatientStore((s) => s.readings);

  // Admitted neonates who have an allocated station in the active hospital
  const currentHosp = (user?.facility || 'PGI').toUpperCase();
  const currentHospId = user?.facilityId || (currentHosp === 'KGMU' ? 'hosp_kgmu' : currentHosp === 'RML' ? 'hosp_rml' : 'hosp_pgi');

  const treatedPatients = admissions.filter(
    (a) =>
      a.admissionStatus === 'under_treatment' &&
      (a.hospitalId === currentHospId || a.hospitalName?.toUpperCase() === currentHosp)
  );

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

  const handleSaveSample = async () => {
    if (!sampleAdmission) return;
    const numVal = parseFloat(sampleValue);
    if (isNaN(numVal) || numVal <= 0 || numVal > 40) {
      Alert.alert('Invalid Value', 'Please enter a valid bilirubin reading between 0.1 and 40.0 mg/dL.');
      return;
    }
    setIsProcessing(true);
    try {
      await usePatientStore.getState().addReading({
        babyId: sampleAdmission.babyId || sampleAdmission.babyUhid,
        babyUhid: sampleAdmission.babyUhid,
        value: numVal,
        unit: 'mg/dL',
        method: sampleMethod,
        measurementSite: sampleSite,
        phototherapyPhase: 'during_phototherapy',
        operatorName: user.name,
        sampleTimestamp: new Date().toISOString(),
        source: 'hospital_pt_tracker',
      });
      setSampleModalVisible(false);
      Alert.alert(
        'Sample Logged Successfully',
        `Serial ${sampleMethod} test (${numVal} mg/dL) recorded for ${sampleAdmission.babyName} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save sample reading');
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

  const babyReadings = readings.filter(
    (r) =>
      (cycleHistoryAdmission?.babyUhid && r.babyUhid === cycleHistoryAdmission.babyUhid) ||
      (cycleHistoryAdmission?.babyId && r.babyId === cycleHistoryAdmission.babyId)
  );
  const sortedReadings = [...babyReadings].sort(
    (a, b) => new Date(b.sampleTimestamp || b.timestamp).getTime() - new Date(a.sampleTimestamp || a.timestamp).getTime()
  );

  useEffect(() => {
    if (!cycleHistoryAdmission) return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      setCycleHistoryAdmission(null);
      return true;
    });
    return () => backHandler.remove();
  }, [cycleHistoryAdmission]);

  // Full-page Patient History View (Cycles & Samples)
  if (cycleHistoryAdmission) {
    return (
      <View style={styles.container}>
        {/* Full Page Header */}
        <View style={[styles.header, { paddingTop: getScreenTopPadding(insets, 10) }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <TouchableOpacity
                onPress={() => setCycleHistoryAdmission(null)}
                style={styles.backBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.backBtnText}>←</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Patient History</Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {cycleHistoryAdmission.babyName} ({cycleHistoryAdmission.babyUhid}) • {cycleHistoryAdmission.ptStationName || 'Station Assigned'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Page Body */}
        <View style={styles.historyPageBody}>
          {/* Top Toggle between Cycles and Samples */}
          <View style={styles.historyToggleRow}>
            <TouchableOpacity
              style={[styles.historyToggleBtn, historyTab === 'cycles' && styles.historyToggleBtnActive]}
              onPress={() => setHistoryTab('cycles')}
              activeOpacity={0.8}
            >
              <Text style={[styles.historyToggleBtnText, historyTab === 'cycles' && styles.historyToggleBtnTextActive]}>
                Cycles ({cycleHistoryAdmission.treatmentSessions?.length || 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.historyToggleBtn, historyTab === 'samples' && styles.historyToggleBtnActive]}
              onPress={() => setHistoryTab('samples')}
              activeOpacity={0.8}
            >
              <Text style={[styles.historyToggleBtnText, historyTab === 'samples' && styles.historyToggleBtnTextActive]}>
                Samples ({sortedReadings.length})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            showsVerticalScrollIndicator={false}
          >
            {historyTab === 'cycles' ? (
              (!cycleHistoryAdmission.treatmentSessions || cycleHistoryAdmission.treatmentSessions.length === 0) ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>⏱️</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#64748B' }}>No cycles recorded yet</Text>
                  <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, textAlign: 'center' }}>
                    Cycles will appear here as soon as phototherapy sessions start and stop.
                  </Text>
                </View>
              ) : (
                cycleHistoryAdmission.treatmentSessions.map((session, idx) => {
                  const isActive = session.status === 'active';
                  const startD = new Date(session.startTime);
                  const endD = session.endTime ? new Date(session.endTime) : null;
                  const durationText = session.durationMinutes
                    ? `${Math.floor(session.durationMinutes / 60)}h ${session.durationMinutes % 60}m (${session.durationMinutes} mins)`
                    : isActive
                    ? 'In progress...'
                    : '< 1 min';

                  return (
                    <View key={session.sessionId || idx} style={styles.cycleHistoryCard}>
                      <View style={styles.cycleHeaderRow}>
                        <Text style={styles.cycleTitle}>Cycle #{idx + 1}</Text>
                        <View style={[styles.cycleStatusBadge, isActive ? styles.cycleActiveBadge : styles.cycleCompletedBadge]}>
                          <Text style={[styles.cycleStatusText, isActive ? styles.cycleActiveText : styles.cycleCompletedText]}>
                            {isActive ? '● ACTIVE' : '✓ COMPLETED'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.cycleDetailRow}>
                        <Text style={styles.cycleDetailLbl}>Type / Light:</Text>
                        <Text style={styles.cycleDetailVal}>{session.phototherapyType}</Text>
                      </View>

                      <View style={styles.cycleDetailRow}>
                        <Text style={styles.cycleDetailLbl}>Irradiance:</Text>
                        <Text style={styles.cycleDetailVal}>{session.irradianceMwCm2} µW/cm²</Text>
                      </View>

                      <View style={styles.cycleDetailRow}>
                        <Text style={styles.cycleDetailLbl}>Started:</Text>
                        <Text style={styles.cycleDetailVal}>{startD.toLocaleDateString()} {startD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                      </View>

                      <View style={styles.cycleDetailRow}>
                        <Text style={styles.cycleDetailLbl}>Stopped:</Text>
                        <Text style={styles.cycleDetailVal}>
                          {endD ? `${endD.toLocaleDateString()} ${endD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Running right now'}
                        </Text>
                      </View>

                      <View style={styles.cycleDetailRow}>
                        <Text style={styles.cycleDetailLbl}>Cycle Duration:</Text>
                        <Text style={[styles.cycleDetailVal, { fontWeight: '800', color: isActive ? '#0284C7' : '#00A569' }]}>
                          {durationText}
                        </Text>
                      </View>

                      <View style={styles.cycleDetailRow}>
                        <Text style={styles.cycleDetailLbl}>Nurse in Charge:</Text>
                        <Text style={styles.cycleDetailVal}>{session.nurseName || 'Nursing Staff'}</Text>
                      </View>

                      {session.notes ? (
                        <Text style={styles.cycleNotesText}>Notes: {session.notes}</Text>
                      ) : null}
                    </View>
                  );
                })
              )
            ) : (
              sortedReadings.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>🧪</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#64748B' }}>No samples recorded yet</Text>
                  <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, textAlign: 'center' }}>
                    Bilirubin readings logged using "+ Add Bilirubin Sample" will appear here.
                  </Text>
                </View>
              ) : (
                sortedReadings.map((reading, idx) => {
                  const sampleDate = new Date(reading.sampleTimestamp || reading.timestamp);
                  const formattedDate = sampleDate.toLocaleDateString([], {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const formattedTime = sampleDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <View key={reading.id || idx} style={styles.sampleHistoryCard}>
                      <Text style={styles.sampleValueText}>{reading.value} {reading.unit || 'mg/dL'}</Text>
                      <Text style={styles.sampleTimestampText}>{formattedDate} • {formattedTime}</Text>
                    </View>
                  );
                })
              )
            )}
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      {!embedded && (
        <View style={[styles.header, { paddingTop: getScreenTopPadding(insets, 10) }]}>
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
      )}

      {/* Patient Treatment Cards */}
      <FlatList
        data={treatedPatients}
        keyExtractor={(item) => item.id || item.admissionId}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💡</Text>
            <Text style={styles.emptyTitle}>No Active Sessions</Text>
            <Text style={styles.emptySub}>No patients currently undergoing phototherapy in this unit.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const activeSession = item.treatmentSessions.find((s) => s.status === 'active');
          const sessions = item.treatmentSessions || [];
          const totalCycles = sessions.length;
          const recentSession = totalCycles > 0 ? sessions[totalCycles - 1] : null;

          let recentDurationText = '0 min';
          if (recentSession) {
            if (recentSession.status === 'active') {
              const elapsedMins = Math.max(1, Math.round((new Date().getTime() - new Date(recentSession.startTime).getTime()) / 60000));
              recentDurationText = elapsedMins >= 60
                ? `${(elapsedMins / 60).toFixed(1)} hrs`
                : `${elapsedMins} mins`;
            } else if (recentSession.durationMinutes) {
              recentDurationText = recentSession.durationMinutes >= 60
                ? `${(recentSession.durationMinutes / 60).toFixed(1)} hrs`
                : `${recentSession.durationMinutes} mins`;
            } else if (recentSession.endTime) {
              const dur = Math.max(1, Math.round((new Date(recentSession.endTime).getTime() - new Date(recentSession.startTime).getTime()) / 60000));
              recentDurationText = dur >= 60 ? `${(dur / 60).toFixed(1)} hrs` : `${dur} mins`;
            }
          }

          const hasStarted = totalCycles > 0 || !!activeSession;

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.stationPill}>
                  <Text style={styles.stationText}>📍 {item.ptStationName || 'Station Assigned'}</Text>
                </View>
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

                {/* Tappable Duration (Recent Cycle Duration -> Opens Full Page History) */}
                <TouchableOpacity
                  style={[styles.statItem, styles.statItemTappable]}
                  onPress={() => {
                    setHistoryTab('cycles');
                    setCycleHistoryAdmission(item);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.statVal, { color: '#00A569' }]}>{recentDurationText}</Text>
                  <Text style={styles.statLbl}>Duration ⓘ</Text>
                </TouchableOpacity>

                {/* Tappable Cycles Tag -> Shows Number of Cycles */}
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => {
                    setHistoryTab('cycles');
                    setCycleHistoryAdmission(item);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.statVal}>{totalCycles}</Text>
                  <Text style={styles.statLbl}>Cycles</Text>
                </TouchableOpacity>
              </View>

              {/* Active Session / Start Actions */}
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

                  <View style={styles.actionBtnRow}>
                    <TouchableOpacity
                      onPress={() => handleEndSession(item, activeSession)}
                      style={[styles.halfActionBtn, styles.stopCycleBtn]}
                      disabled={isProcessing}
                    >
                      <Text style={styles.actionBtnText}>■ Stop Cycle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleCompletePhototherapy(item)}
                      style={[styles.halfActionBtn, styles.completeBtn]}
                      disabled={isProcessing}
                    >
                      <Text style={styles.actionBtnText}>✓ Complete PT</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : hasStarted ? (
                <View style={styles.actionBtnRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setActiveAdmission(item);
                      setSessionModalVisible(true);
                    }}
                    style={[styles.halfActionBtn, styles.startCycleBtnHalf]}
                    disabled={isProcessing}
                  >
                    <Text style={styles.actionBtnText}>▶ Start Session</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleCompletePhototherapy(item)}
                    style={[styles.halfActionBtn, styles.completeBtn]}
                    disabled={isProcessing}
                  >
                    <Text style={styles.actionBtnText}>✓ Complete PT</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setActiveAdmission(item);
                    setSessionModalVisible(true);
                  }}
                  style={styles.fullStartBtn}
                  disabled={isProcessing}
                >
                  <Text style={styles.actionBtnText}>▶ Start Phototherapy Session</Text>
                </TouchableOpacity>
              )}

              {/* Permanent Add Sample Action */}
              <TouchableOpacity
                onPress={() => {
                  setSampleAdmission(item);
                  setSampleValue(''); // Always empty, never show previous or prefilled values
                  setSampleSite('Forehead');
                  setSampleModalVisible(true);
                }}
                style={styles.addSampleBtnFull}
                activeOpacity={0.8}
              >
                <Text style={styles.addSampleBtnText}>🧪 + Add Bilirubin Sample</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* Start Session Modal */}
      <Modal
        visible={sessionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSessionModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSessionModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.modalTitle}>Initiate Phototherapy Session</Text>
                <Text style={styles.modalSub}>Patient: {activeAdmission?.babyName} ({activeAdmission?.babyUhid})</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSessionModalVisible(false)}
                style={styles.modalCloseIconBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.modalCloseIconText}>✕</Text>
              </TouchableOpacity>
            </View>

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
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Permanent Add Sample Modal */}
      <Modal
        visible={sampleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSampleModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSampleModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.modalTitle}>Record Bilirubin Sample</Text>
                <Text style={styles.modalSub}>
                  Patient: {sampleAdmission?.babyName} ({sampleAdmission?.babyUhid})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSampleModalVisible(false)}
                style={styles.modalCloseIconBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.modalCloseIconText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Sample Timestamp</Text>
            <View style={styles.timestampBox}>
              <Text style={styles.timestampText}>
                🕒 Current Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Always Auto-recorded)
              </Text>
            </View>

            <Text style={styles.inputLabel}>Bilirubin Value (mg/dL)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="decimal-pad"
              placeholder="e.g. 13.5"
              placeholderTextColor="#94A3B8"
              value={sampleValue}
              onChangeText={setSampleValue}
            />

            <Text style={styles.inputLabel}>Measurement Site</Text>
            <View style={styles.typeRow}>
              {['Forehead', 'Sternum'].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSampleSite(s)}
                  style={[styles.typePill, sampleSite === s && styles.typePillActive]}
                >
                  <Text style={[styles.typePillText, sampleSite === s && styles.typePillTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity onPress={() => setSampleModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveSample} style={styles.confirmStartBtn} disabled={isProcessing}>
                <Text style={styles.confirmStartBtnText}>Save Sample</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
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
  actionBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  halfActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  startCycleBtnHalf: {
    backgroundColor: '#7D3BFF',
  },
  stopCycleBtn: {
    backgroundColor: '#FC3949',
  },
  completeBtn: {
    backgroundColor: '#00A569',
  },
  fullStartBtn: {
    backgroundColor: '#7D3BFF',
    borderRadius: 14,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statItemTappable: {
    borderRadius: 8,
  },
  addSampleBtnFull: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  addSampleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7D3BFF',
  },
  timestampBox: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  timestampText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  cycleHistoryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cycleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cycleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#181829',
  },
  cycleStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cycleStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cycleActiveBadge: {
    backgroundColor: '#DCFCE7',
  },
  cycleActiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  cycleCompletedBadge: {
    backgroundColor: '#F1F5F9',
  },
  cycleCompletedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  cycleDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cycleDetailLbl: {
    fontSize: 11,
    color: '#64748B',
  },
  cycleDetailVal: {
    fontSize: 11,
    color: '#181829',
    fontWeight: '600',
  },
  cycleNotesText: {
    fontSize: 11,
    color: '#475569',
    fontStyle: 'italic',
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: '#E2E8F0',
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
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modalCloseIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  modalCloseIconText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  historyPageBody: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  historyToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  historyToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyToggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  historyToggleBtnTextActive: {
    color: '#7D3BFF',
    fontWeight: '800',
  },
  sampleHistoryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sampleValueText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7D3BFF',
  },
  sampleTimestampText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
});
