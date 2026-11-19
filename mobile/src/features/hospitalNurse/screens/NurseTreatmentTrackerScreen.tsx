import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Clock,
  FlaskConical,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Calendar,
  Check,
  X,
  Plus,
  Minus,
  Edit3,
  Sparkles,
} from 'lucide-react-native';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { usePatientStore } from '../../../store/usePatientStore';
import { Admission, TreatmentSession, BilirubinReading } from '../../../types';
import { COLORS } from '../../../theme/colors';
import { getScreenTopPadding, fontScale, moderateScale } from '../../../theme/responsive';

interface NurseTreatmentTrackerScreenProps {
  onBack?: () => void;
  onRecordBilirubin?: (babyUhid: string) => void;
  onOpenNotifications?: () => void;
  embedded?: boolean;
  initialAdmission?: Admission | null;
  initialBabyIdOrUhid?: string | null;
  initialPtFilter?: 'active' | 'concluded';
  highlightBabyIdOrUhid?: string | null;
}

// Flowsheet unified row entry
interface FlowsheetEntry {
  id: string;
  type: 'pt_session' | 'bilirubin_reading';
  timestamp: string;
  dateStr: string;
  timeRange: string;
  durationHoursText: string | null;
  durationMinutes: number | null;
  bilirubinValue: number | null;
  method?: string;
  operator: string;
}

const formatDateShort = (isoString?: string): string => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const formatTimeShort = (isoString?: string): string => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Safe local calendar date string (YYYY-MM-DD) avoiding UTC conversion shift
const getLocalDateKey = (dateInput: Date | string): string => {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const NurseTreatmentTrackerScreen: React.FC<NurseTreatmentTrackerScreenProps> = ({
  onBack,
  onRecordBilirubin,
  onOpenNotifications,
  embedded = false,
  initialAdmission = null,
  initialBabyIdOrUhid = null,
  initialPtFilter = 'active',
  highlightBabyIdOrUhid = null,
}) => {
  const insets = useSafeAreaInsets();
  const { admissions, logTreatmentSession, approveDischarge, concludePhototherapy, updateAdmission, updateTreatmentSession, notifications } = useNetworkStore();
  const { user } = useAuthStore();
  const { babies, readings, addReading, updateReading, observations, updateBaby } = usePatientStore();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Selected patient for detailed Flowsheet Table view
  const [detailedAdmission, setDetailedAdmission] = useState<Admission | null>(initialAdmission || null);

  // Modals state
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [targetAdmissionForLog, setTargetAdmissionForLog] = useState<Admission | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingReadingId, setEditingReadingId] = useState<string | null>(null);
  const [editAdmissionTsbModalVisible, setEditAdmissionTsbModalVisible] = useState(false);
  const [editAdmissionTsbValue, setEditAdmissionTsbValue] = useState('');

  // Log PT Form state (Roller Wheels for Start & End Time)
  const [ptDateOption, setPtDateOption] = useState<'today' | 'yesterday' | 'day_before'>('today');
  const [startHour, setStartHour] = useState(9);
  const [startMin, setStartMin] = useState(0);
  const [endHour, setEndHour] = useState(13);
  const [endMin, setEndMin] = useState(0);
  const [ptDurationHours, setPtDurationHours] = useState(4.0);
  const [ptDevice, setPtDevice] = useState('Double Surface High-Intensity LED');
  const [isLoggingPt, setIsLoggingPt] = useState(false);

  // Time Roller Helpers
  const pad2 = (n: number) => n.toString().padStart(2, '0');

  const calculateDurationHours = (sH: number, sM: number, eH: number, eM: number) => {
    const startMins = sH * 60 + sM;
    const endMins = eH * 60 + eM;
    let diff = endMins - startMins;
    if (diff <= 0) {
      diff += 24 * 60; // overnight session
    }
    return Number((diff / 60).toFixed(1));
  };

  const stepStartHour = (delta: number) => {
    const nextH = (startHour + delta + 24) % 24;
    setStartHour(nextH);
    setPtDurationHours(calculateDurationHours(nextH, startMin, endHour, endMin));
  };

  const stepStartMin = (delta: number) => {
    let nextM = startMin + delta;
    let nextH = startHour;
    if (nextM >= 60) {
      nextM = 0;
      nextH = (nextH + 1) % 24;
    } else if (nextM < 0) {
      nextM = 45;
      nextH = (nextH - 1 + 24) % 24;
    }
    setStartMin(nextM);
    setStartHour(nextH);
    setPtDurationHours(calculateDurationHours(nextH, nextM, endHour, endMin));
  };

  const stepEndHour = (delta: number) => {
    const nextH = (endHour + delta + 24) % 24;
    setEndHour(nextH);
    setPtDurationHours(calculateDurationHours(startHour, startMin, nextH, endMin));
  };

  const stepEndMin = (delta: number) => {
    let nextM = endMin + delta;
    let nextH = endHour;
    if (nextM >= 60) {
      nextM = 0;
      nextH = (nextH + 1) % 24;
    } else if (nextM < 0) {
      nextM = 45;
      nextH = (nextH - 1 + 24) % 24;
    }
    setEndMin(nextM);
    setEndHour(nextH);
    setPtDurationHours(calculateDurationHours(startHour, startMin, nextH, nextM));
  };

  const applyDurationHours = (hours: number) => {
    const validHours = Math.max(0.5, Math.min(24, Number(hours.toFixed(1))));
    setPtDurationHours(validHours);
    const startTotal = startHour * 60 + startMin;
    const endTotal = (startTotal + Math.round(validHours * 60)) % (24 * 60);
    setEndHour(Math.floor(endTotal / 60));
    setEndMin(endTotal % 60);
  };

  // Bilirubin Quick Add Modal state (TcB default routine method)
  const [biliModalVisible, setBiliModalVisible] = useState(false);
  const [targetAdmissionForBili, setTargetAdmissionForBili] = useState<Admission | null>(null);
  const [biliValue, setBiliValue] = useState('');
  const [biliMethod, setBiliMethod] = useState<'TSB' | 'TcB'>('TcB');
  const [biliSite, setBiliSite] = useState('Forehead');
  const [isLoggingBili, setIsLoggingBili] = useState(false);

  // Manage all Flowsheet Records Modal state (Single Card Pencil)
  const [manageRecordsModalVisible, setManageRecordsModalVisible] = useState(false);

  // Filter admitted neonates currently under phototherapy treatment in the active hospital
  const currentHosp = (user?.facility || 'PGI').toUpperCase();
  const currentHospId = user?.facilityId || (currentHosp === 'KGMU' ? 'hosp_kgmu' : currentHosp === 'RML' ? 'hosp_rml' : 'hosp_pgi');

  // Phototherapy patient filter: active treatments vs concluded courses
  const [ptListFilter, setPtListFilter] = useState<'active' | 'concluded'>(initialPtFilter || 'active');

  useEffect(() => {
    if (initialPtFilter) {
      setPtListFilter(initialPtFilter);
    }
  }, [initialPtFilter]);

  const activePatients = useMemo(
    () =>
      admissions.filter(
        (a) =>
          a.admissionStatus === 'under_treatment' &&
          !a.stationReleased &&
          (a.hospitalId === currentHospId || a.hospitalName?.toUpperCase() === currentHosp)
      ),
    [admissions, currentHospId, currentHosp]
  );

  const concludedPatients = useMemo(
    () =>
      admissions.filter(
        (a) =>
          (a.treatmentSessions || []).length > 0 &&
          (a.stationReleased || a.admissionStatus === 'in_observation' || a.admissionStatus === 'discharged') &&
          (a.hospitalId === currentHospId || a.hospitalName?.toUpperCase() === currentHosp)
      ),
    [admissions, currentHospId, currentHosp]
  );

  const targetHighlight = highlightBabyIdOrUhid || initialBabyIdOrUhid;

  const treatedPatients = useMemo(() => {
    const list = ptListFilter === 'active' ? activePatients : concludedPatients;
    if (!targetHighlight) return list;

    return [...list].sort((a, b) => {
      const aMatch =
        (a.babyUhid && a.babyUhid === targetHighlight) ||
        (a.babyId && a.babyId === targetHighlight) ||
        (a.admissionId && a.admissionId === targetHighlight) ||
        (a.id && a.id === targetHighlight);
      const bMatch =
        (b.babyUhid && b.babyUhid === targetHighlight) ||
        (b.babyId && b.babyId === targetHighlight) ||
        (b.admissionId && b.admissionId === targetHighlight) ||
        (b.id && b.id === targetHighlight);

      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }, [ptListFilter, activePatients, concludedPatients, targetHighlight]);

  // Sync initial target admission only if explicitly provided
  useEffect(() => {
    if (initialAdmission) {
      setDetailedAdmission(initialAdmission);
    }
  }, [initialAdmission]);

  // Keep detailedAdmission in sync with updated store state
  useEffect(() => {
    if (detailedAdmission) {
      const refreshed = admissions.find(
        (a) => a.id === detailedAdmission.id || a.admissionId === detailedAdmission.admissionId
      );
      if (refreshed) {
        setDetailedAdmission(refreshed);
      }
    }
  }, [admissions]);

  // Handle hardware back press on Android when inside detailed flowsheet
  useEffect(() => {
    if (!detailedAdmission) return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      setDetailedAdmission(null);
      return true;
    });
    return () => backHandler.remove();
  }, [detailedAdmission]);

  // 1. Calculate Day-Wise Exposure for the Baby Card
  const getDayWiseExposure = (sessions: TreatmentSession[] = []) => {
    if (!sessions || sessions.length === 0) return [];

    // Group only recorded sessions by local calendar date (YYYY-MM-DD)
    const dayMap = new Map<string, { label: string; date: Date; minutes: number }>();
    const now = new Date();
    const todayStr = getLocalDateKey(now);
    const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayStr = getLocalDateKey(yesterdayDate);

    sessions.forEach((s) => {
      const dur = s.durationMinutes || 0;
      if (dur <= 0) return;
      const sDate = new Date(s.startTime);
      if (isNaN(sDate.getTime())) return;
      const dKey = getLocalDateKey(sDate);

      let label = formatDateShort(s.startTime);
      if (dKey === todayStr) label = `${label} (Today)`;
      else if (dKey === yesterdayStr) label = `${label} (Yesterday)`;

      if (dayMap.has(dKey)) {
        dayMap.get(dKey)!.minutes += dur;
      } else {
        dayMap.set(dKey, {
          label,
          date: new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate()),
          minutes: dur,
        });
      }
    });

    // Only days with recorded minutes > 0
    const activeDays = Array.from(dayMap.values()).filter((d) => d.minutes > 0);
    if (activeDays.length === 0) return [];

    // Sort by date ascending (oldest to newest)
    activeDays.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Show up to the latest 3 days in oldest-to-newest format
    const latestDays = activeDays.slice(-3);

    // Calculate max hours among these days for relative scaling (baseline 12h)
    const maxDayHours = Math.max(12, ...latestDays.map((d) => d.minutes / 60));

    return latestDays.map((d) => {
      const hours = Number((d.minutes / 60).toFixed(1));
      return {
        label: d.label,
        date: d.date,
        hours,
        percent: Math.min(100, Math.round((hours / maxDayHours) * 100)),
      };
    });
  };

  // 2. Build the Unified Clinical Flowsheet Table Entries
  const getUnifiedFlowsheetEntries = (admission: Admission): FlowsheetEntry[] => {
    const list: FlowsheetEntry[] = [];

    // Add PT Sessions
    (admission.treatmentSessions || []).forEach((s) => {
      const startD = new Date(s.startTime);
      const startStr = formatTimeShort(s.startTime);
      let endStr = '';
      if (s.endTime) {
        endStr = formatTimeShort(s.endTime);
      } else if (s.durationMinutes) {
        const computedEnd = new Date(startD.getTime() + s.durationMinutes * 60000);
        endStr = formatTimeShort(computedEnd.toISOString());
      } else {
        endStr = startStr;
      }
      const durHours = s.durationMinutes ? (s.durationMinutes / 60).toFixed(1) + ' hrs' : '< 1 hr';

      list.push({
        id: s.sessionId || 'sess_' + Math.random(),
        type: 'pt_session',
        timestamp: s.startTime,
        dateStr: formatDateShort(s.startTime),
        timeRange: `${startStr} – ${endStr}`,
        durationHoursText: durHours,
        durationMinutes: s.durationMinutes || 0,
        bilirubinValue: null,
        operator: s.nurseName || 'Nurse Staff',
      });
    });

    // Add Bilirubin Readings for this patient
    const babyReadings = readings.filter(
      (r) =>
        (r.babyUhid && r.babyUhid === admission.babyUhid) ||
        (r.babyId && r.babyId === admission.babyId)
    );

    babyReadings.forEach((r) => {
      const ts = r.sampleTimestamp || r.timestamp;

      list.push({
        id: r.id || 'rdg_' + Math.random(),
        type: 'bilirubin_reading',
        timestamp: ts,
        dateStr: formatDateShort(ts),
        timeRange: formatTimeShort(ts),
        durationHoursText: null,
        durationMinutes: null,
        bilirubinValue: r.value,
        method: r.method || 'TcB',
        operator: r.operatorName || 'Pediatric Lab',
      });
    });

    // Sort chronologically (newest first)
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // Resolve baby's true initial bilirubin (from baby details - if not present, keep it blank)
  const getResolvedAdmissionTsb = (adm: Admission | null): number | null => {
    if (!adm) return null;
    const matchingBaby = babies.find(
      (b) => (b.uhid && b.uhid === adm.babyUhid) || (b.id && b.id === adm.babyId)
    );
    if (matchingBaby?.initialValue && matchingBaby.initialValue > 0) {
      return matchingBaby.initialValue;
    }
    if (adm.initialAdmissionBilirubin != null && adm.initialAdmissionBilirubin > 0) {
      return adm.initialAdmissionBilirubin;
    }
    return null;
  };

  // Open Log PT Time Modal
  const handleOpenLogPt = (admission: Admission) => {
    setTargetAdmissionForLog(admission);
    setEditingSessionId(null);
    setPtDateOption('today');
    setStartHour(9);
    setStartMin(0);
    setEndHour(13);
    setEndMin(0);
    setPtDurationHours(4.0);
    setLogModalVisible(true);
  };

  // Open Bilirubin Quick Add Modal
  const handleOpenBiliModal = (admission: Admission) => {
    setTargetAdmissionForBili(admission);
    setEditingReadingId(null);
    setBiliValue('');
    setBiliSite('Forehead');
    setBiliMethod('TcB');
    setBiliModalVisible(true);
  };

  // Open Edit Admission TSB Modal
  const handleOpenEditAdmissionTsb = () => {
    if (!detailedAdmission) return;
    const current = getResolvedAdmissionTsb(detailedAdmission);
    setEditAdmissionTsbValue(current != null ? current.toFixed(1) : '');
    setEditAdmissionTsbModalVisible(true);
  };

  // Save Initial Bilirubin
  const handleSaveAdmissionTsb = async () => {
    if (!detailedAdmission) return;
    const num = parseFloat(editAdmissionTsbValue);
    if (isNaN(num) || num <= 0 || num > 40) {
      Alert.alert('Invalid Value', 'Please enter a valid bilirubin reading between 0.1 and 40.0 mg/dL.');
      return;
    }
    try {
      await updateAdmission(detailedAdmission.id || detailedAdmission.admissionId, {
        initialAdmissionBilirubin: num,
      });
      const matchingBaby = babies.find(
        (b) => (b.uhid && b.uhid === detailedAdmission.babyUhid) || (b.id && b.id === detailedAdmission.babyId)
      );
      if (matchingBaby) {
        usePatientStore.getState().updateBaby(matchingBaby.id, { initialValue: num });
      }
      setEditAdmissionTsbModalVisible(false);
      Alert.alert('Initial Bilirubin Updated', `Initial Bilirubin set to ${num.toFixed(1)} mg/dL.`);
    } catch {
      Alert.alert('Error', 'Failed to update Initial Bilirubin.');
    }
  };

  // Edit PT Session (called from duration badge or row)
  const handleEditPtSession = (row: FlowsheetEntry) => {
    if (!detailedAdmission) return;
    setTargetAdmissionForLog(detailedAdmission);
    setEditingSessionId(row.id);
    const session = (detailedAdmission.treatmentSessions || []).find((s) => s.sessionId === row.id);
    if (session) {
      const sD = new Date(session.startTime);
      if (!isNaN(sD.getTime())) {
        setStartHour(sD.getHours());
        setStartMin(sD.getMinutes());
      }
      if (session.endTime) {
        const eD = new Date(session.endTime);
        if (!isNaN(eD.getTime())) {
          setEndHour(eD.getHours());
          setEndMin(eD.getMinutes());
        }
      } else if (session.durationMinutes && !isNaN(sD.getTime())) {
        const eD = new Date(sD.getTime() + session.durationMinutes * 60000);
        setEndHour(eD.getHours());
        setEndMin(eD.getMinutes());
      }
      setPtDurationHours(session.durationMinutes ? Number((session.durationMinutes / 60).toFixed(1)) : 4.0);
    }
    setLogModalVisible(true);
  };

  // Add PT to an empty cell
  const handleAddPtToRow = (row: FlowsheetEntry) => {
    if (!detailedAdmission) return;
    setTargetAdmissionForLog(detailedAdmission);
    setEditingSessionId(null);
    const d = new Date(row.timestamp);
    if (!isNaN(d.getTime())) {
      setStartHour(d.getHours());
      setStartMin(d.getMinutes());
      setEndHour((d.getHours() + 4) % 24);
      setEndMin(d.getMinutes());
    } else {
      setStartHour(9);
      setStartMin(0);
      setEndHour(13);
      setEndMin(0);
    }
    setPtDurationHours(4.0);
    setLogModalVisible(true);
  };

  // Edit Bilirubin Reading (called from reading badge or row)
  const handleEditBilirubin = (row: FlowsheetEntry) => {
    if (!detailedAdmission) return;
    setTargetAdmissionForBili(detailedAdmission);
    setEditingReadingId(row.id);
    setBiliValue(row.bilirubinValue != null ? row.bilirubinValue.toString() : '');
    setBiliMethod((row.method as any) || 'TcB');
    setBiliSite('Forehead');
    setBiliModalVisible(true);
  };

  // Add Bilirubin to an empty cell
  const handleAddBiliToRow = (row: FlowsheetEntry) => {
    if (!detailedAdmission) return;
    setTargetAdmissionForBili(detailedAdmission);
    setEditingReadingId(null);
    setBiliValue('');
    setBiliMethod('TcB');
    setBiliSite('Forehead');
    setBiliModalVisible(true);
  };

  // Save PT Log (create or edit)
  const handleSavePtLog = async () => {
    if (!targetAdmissionForLog) return;
    if (ptDurationHours <= 0) {
      Alert.alert('Invalid Duration', 'Please enter a duration greater than 0.');
      return;
    }

    setIsLoggingPt(true);
    try {
      const now = new Date();
      let targetDate = new Date();
      if (ptDateOption === 'yesterday') {
        targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      } else if (ptDateOption === 'day_before') {
        targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
      }

      const sH = startHour;
      const sM = startMin;
      const eH = endHour;
      const eM = endMin;

      const startDateTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), sH, sM);
      let endDateTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), eH, eM);
      if (endDateTime.getTime() <= startDateTime.getTime()) {
        endDateTime = new Date(endDateTime.getTime() + 86400000); // overnight
      }

      const durationMins = Math.round(ptDurationHours * 60);

      if (editingSessionId) {
        await updateTreatmentSession(targetAdmissionForLog.id || targetAdmissionForLog.admissionId, editingSessionId, {
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          durationMinutes: durationMins,
        });
        setLogModalVisible(false);
        setEditingSessionId(null);
        Alert.alert(
          'Session Updated',
          `${ptDurationHours} hrs updated for ${targetAdmissionForLog.babyName} (${formatDateShort(targetDate.toISOString())}, ${pad2(sH)}:${pad2(sM)}–${pad2(eH)}:${pad2(eM)}).`
        );
      } else {
        await logTreatmentSession(targetAdmissionForLog.id || targetAdmissionForLog.admissionId, {
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          durationMinutes: durationMins,
          phototherapyType: ptDevice,
          nurseName: user.name,
        });
        setLogModalVisible(false);
        Alert.alert(
          'Session Logged',
          `${ptDurationHours} hrs recorded for ${targetAdmissionForLog.babyName} (${formatDateShort(targetDate.toISOString())}, ${pad2(sH)}:${pad2(sM)}–${pad2(eH)}:${pad2(eM)}).`
        );
      }
    } catch {
      Alert.alert('Error', 'Failed to save phototherapy session');
    } finally {
      setIsLoggingPt(false);
    }
  };

  // Save Bilirubin Test (create or edit)
  const handleSaveBilirubin = async () => {
    if (!targetAdmissionForBili) return;
    const num = parseFloat(biliValue);
    if (isNaN(num) || num <= 0 || num > 40) {
      Alert.alert('Invalid Value', 'Please enter a valid bilirubin reading between 0.1 and 40.0 mg/dL.');
      return;
    }

    setIsLoggingBili(true);
    try {
      if (editingReadingId) {
        updateReading(editingReadingId, {
          value: num,
          method: biliMethod,
        });
        setBiliModalVisible(false);
        setEditingReadingId(null);
        Alert.alert(
          'Reading Updated',
          `${num.toFixed(1)} mg/dL (${biliMethod}) updated for ${targetAdmissionForBili.babyName}.`
        );
      } else {
        await addReading({
          babyId: targetAdmissionForBili.babyId || targetAdmissionForBili.babyUhid,
          babyUhid: targetAdmissionForBili.babyUhid,
          value: num,
          unit: 'mg/dL',
          method: biliMethod,
          measurementSite: (biliSite || 'forehead').toLowerCase(),
          phototherapyPhase: 'during_phototherapy',
          operatorName: user.name,
          sampleTimestamp: new Date().toISOString(),
          source: 'clinical_flowsheet',
        });
        setBiliModalVisible(false);
        Alert.alert(
          'Reading Recorded',
          `${num.toFixed(1)} mg/dL (${biliMethod}) recorded for ${targetAdmissionForBili.babyName} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
        );
      }
    } catch {
      Alert.alert('Error', 'Failed to save bilirubin reading');
    } finally {
      setIsLoggingBili(false);
    }
  };

  // Conclude Treatment
  const handleConcludeTreatment = (admission: Admission) => {
    const totalMinutes = (admission.treatmentSessions || []).reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    Alert.alert(
      'Conclude Phototherapy Treatment',
      `Complete treatment course for ${admission.babyName} (${admission.babyUhid})?\n\n• Cumulative Exposure: ${totalHours} hrs\n• Station: ${admission.ptStationName || 'Bed'}\n\nThis will release the station back to the sanitization pool. The patient will remain admitted in observation until discharged by the doctor.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '✓ Conclude & Free Station',
          style: 'destructive',
          onPress: async () => {
            try {
              await concludePhototherapy(admission.id || admission.admissionId);

              setDetailedAdmission(null);
              Alert.alert(
                'Treatment Concluded',
                `Phototherapy finished. Station released to cleaning pool. Patient is now in observation.`
              );
            } catch {
              Alert.alert('Error', 'Failed to conclude treatment');
            }
          },
        },
      ]
    );
  };

  // Pre-calculate flowsheet metrics if detailed admission is active
  const detailedFlowsheetData = useMemo(() => {
    if (!detailedAdmission) return null;
    const totalMinutes = (detailedAdmission.treatmentSessions || []).reduce(
      (acc, s) => acc + (s.durationMinutes || 0),
      0
    );
    const totalHours = (totalMinutes / 60).toFixed(1);
    const flowsheetRows = getUnifiedFlowsheetEntries(detailedAdmission);
    const patientReadings = readings.filter(
      (r) =>
        (r.babyUhid && r.babyUhid === detailedAdmission.babyUhid) ||
        (r.babyId && r.babyId === detailedAdmission.babyId)
    );
    const matchingBaby = babies.find(
      (b) =>
        (detailedAdmission.babyUhid && b.uhid === detailedAdmission.babyUhid) ||
        (detailedAdmission.babyId && (b.id === detailedAdmission.babyId || b.uhid === detailedAdmission.babyId))
    );
    const isAdmissionDischarged =
      detailedAdmission.admissionStatus === 'discharged' ||
      matchingBaby?.status === 'discharged';

    return {
      totalHours,
      flowsheetRows,
      latestReading: patientReadings[0],
      isAdmissionDischarged,
    };
  }, [detailedAdmission, readings, babies]);

  return (
    <View style={styles.container}>
      {detailedAdmission && detailedFlowsheetData ? (
        // VIEW 1: THE UNIFIED CLINICAL FLOWSHEET TABLE (DETAILED INSIDE VIEW)
        <View style={styles.container}>
          {/* Full Screen Header (Tight, no wasted whitespace) */}
          <View style={[styles.header, { paddingTop: embedded ? 6 : getScreenTopPadding(insets, 8), paddingBottom: 6 }]}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => setDetailedAdmission(null)}
                style={styles.backBtn}
                activeOpacity={0.7}
                accessibilityLabel="Back to Ward Overview"
              >
                <ArrowLeft size={20} color="#181829" />
              </TouchableOpacity>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  Clinical Flowsheet
                </Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {detailedAdmission.babyName} ({detailedAdmission.babyUhid}) • {detailedAdmission.ptStationName || 'Station'}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.flowsheetBody, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Top KPI Metrics Card */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiCol}>
                <Text style={styles.kpiLabel}>Total Exposure</Text>
                <Text style={[styles.kpiVal, { color: '#00A569' }]}>{detailedFlowsheetData.totalHours} hrs</Text>
              </View>
              <View style={styles.kpiDivider} />
              <TouchableOpacity
                style={styles.kpiCol}
                onPress={!detailedFlowsheetData.isAdmissionDischarged ? handleOpenEditAdmissionTsb : undefined}
                activeOpacity={!detailedFlowsheetData.isAdmissionDischarged ? 0.7 : 1}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.kpiLabel}>Initial Bilirubin</Text>
                  {!detailedFlowsheetData.isAdmissionDischarged && <Edit3 size={11} color="#7D3BFF" />}
                </View>
                <Text style={styles.kpiVal}>
                  {(() => {
                    const val = getResolvedAdmissionTsb(detailedAdmission);
                    return val != null ? `${val.toFixed(1)} mg/dL` : '';
                  })()}
                </Text>
              </TouchableOpacity>
              <View style={styles.kpiDivider} />
              <View style={styles.kpiCol}>
                <Text style={styles.kpiLabel}>Latest Bilirubin</Text>
                <Text style={[styles.kpiVal, { color: '#7D3BFF' }]}>
                  {detailedFlowsheetData.latestReading ? `${detailedFlowsheetData.latestReading.value.toFixed(1)} mg/dL` : '--'}
                </Text>
              </View>
            </View>

            {/* Quick Actions Row or Locked Banner */}
            {!detailedFlowsheetData.isAdmissionDischarged ? (
              <View style={styles.flowsheetActionRow}>
                <TouchableOpacity
                  style={styles.actionBtnPt}
                  onPress={() => handleOpenLogPt(detailedAdmission)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Clock size={15} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>+ Log PT Time</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnBili}
                  onPress={() => handleOpenBiliModal(detailedAdmission)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <FlaskConical size={15} color="#7D3BFF" />
                  <Text style={styles.actionBtnBiliText}>+ Add Bilirubin</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.dischargedFlowsheetBanner}>
                <Text style={styles.dischargedFlowsheetBannerText}>
                  🔒 Patient Discharged • Treatment records are locked and read-only.
                </Text>
              </View>
            )}

            {/* The Unified Clinical Flowsheet Table */}
            <View style={styles.tableCard}>
              {/* Card Header: 1 clean edit pencil for the whole card */}
              <View style={styles.tableCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tableCardTitle}>Clinical Flowsheet</Text>
                  <Text style={styles.tableCardSub}>Hourly treatment and lab observations</Text>
                </View>
                {!detailedFlowsheetData.isAdmissionDischarged && (
                  <TouchableOpacity
                    style={styles.cardEditPencilBtn}
                    onPress={() => setManageRecordsModalVisible(true)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Edit3 size={14} color="#7D3BFF" />
                    <Text style={styles.cardEditText}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Table Header: 3 clean, spacious, dynamic columns */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thText, { flex: 1.25 }]}>DATE & TIME</Text>
                <Text style={[styles.thText, { flex: 1.0, textAlign: 'center' }]}>PT DURATION</Text>
                <Text style={[styles.thText, { flex: 1.0, textAlign: 'center' }]}>BILIRUBIN</Text>
              </View>

              {/* Table Rows */}
              {detailedFlowsheetData.flowsheetRows.length === 0 ? (
                <View style={styles.tableEmpty}>
                  <Text style={styles.tableEmptyIcon}>📋</Text>
                  <Text style={styles.tableEmptyTitle}>No Entries Recorded</Text>
                  <Text style={styles.tableEmptySub}>
                    Use the buttons above to log phototherapy hours or record bilirubin readings.
                  </Text>
                </View>
              ) : (
                detailedFlowsheetData.flowsheetRows.map((row, idx) => (
                  <View
                    key={row.id + '_' + idx}
                    style={[styles.tableDataRow, idx % 2 === 1 && styles.tableDataRowAlt]}
                  >
                    {/* Col 1: Date & Time Interval */}
                    <View style={{ flex: 1.25, minWidth: 0, paddingRight: 6 }}>
                      <Text style={styles.tdDate}>{row.dateStr}</Text>
                      <Text style={styles.tdTime} numberOfLines={1}>
                        {row.timeRange}
                      </Text>
                    </View>

                    {/* Col 2: PT Duration */}
                    <View style={{ flex: 1.0, alignItems: 'center', justifyContent: 'center' }}>
                      {row.durationHoursText ? (
                        <TouchableOpacity
                          style={styles.ptDurationBadge}
                          onPress={!detailedFlowsheetData.isAdmissionDischarged ? () => handleEditPtSession(row) : undefined}
                          activeOpacity={!detailedFlowsheetData.isAdmissionDischarged ? 0.7 : 1}
                        >
                          <Text style={styles.ptDurationText}>{row.durationHoursText}</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.emptyCellTouch}
                          onPress={!detailedFlowsheetData.isAdmissionDischarged ? () => handleAddPtToRow(row) : undefined}
                          activeOpacity={!detailedFlowsheetData.isAdmissionDischarged ? 0.7 : 1}
                        >
                          <Text style={styles.tdDash}>—</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Col 3: Bilirubin Level (TSB flagged in small footer; TcB routine default) */}
                    <View style={{ flex: 1.0, alignItems: 'center', justifyContent: 'center' }}>
                      {row.bilirubinValue != null ? (
                        <TouchableOpacity
                          style={styles.biliTablePill}
                          onPress={!detailedFlowsheetData.isAdmissionDischarged ? () => handleEditBilirubin(row) : undefined}
                          activeOpacity={!detailedFlowsheetData.isAdmissionDischarged ? 0.7 : 1}
                        >
                          <Text style={styles.biliValText}>{row.bilirubinValue.toFixed(1)} mg/dL</Text>
                          {row.method === 'TSB' && (
                            <Text style={styles.biliMethodSubText}>TSB</Text>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.emptyCellTouch}
                          onPress={!detailedFlowsheetData.isAdmissionDischarged ? () => handleAddBiliToRow(row) : undefined}
                          activeOpacity={!detailedFlowsheetData.isAdmissionDischarged ? 0.7 : 1}
                        >
                          <Text style={styles.tdDash}>—</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Conclude Phototherapy Action or Status Notice */}
            {detailedAdmission.admissionStatus === 'under_treatment' && !detailedAdmission.stationReleased ? (
              <TouchableOpacity
                style={styles.concludeBtn}
                onPress={() => handleConcludeTreatment(detailedAdmission)}
                activeOpacity={0.8}
              >
                <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.concludeBtnText}>Conclude Phototherapy & Free Station</Text>
              </TouchableOpacity>
            ) : detailedFlowsheetData.isAdmissionDischarged ? (
              <View style={styles.concludedDischargedCard}>
                <Check size={16} color="#00A569" strokeWidth={2.5} style={{ marginRight: 6 }} />
                <Text style={styles.concludedDischargedText}>
                  Phototherapy Concluded & Patient Discharged
                </Text>
              </View>
            ) : (
              <View style={styles.concludedObservationCard}>
                <Check size={16} color="#7D3BFF" strokeWidth={2.5} style={{ marginRight: 6 }} />
                <Text style={styles.concludedObservationText}>
                  Phototherapy Concluded • Patient In Observation
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      ) : (
        // VIEW 2: MAIN LIST WITH VISUAL DAY-BAR CHART (1-SECOND SCAN)
        <View style={{ flex: 1 }}>
          {/* Standalone Header */}
          {!embedded && (
            <View style={[styles.header, { paddingTop: getScreenTopPadding(insets, 10) }]}>
              <View style={styles.headerRow}>
                {onBack && (
                  <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>←</Text>
                  </TouchableOpacity>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    Phototherapy Monitoring
                  </Text>
                  <Text style={styles.headerSubtitle} numberOfLines={1}>
                    {ptListFilter === 'active'
                      ? `${activePatients.length} Active Patients Under Treatment`
                      : 'Concluded Treatment Records'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Active vs Concluded Filter Tabs */}
          <View style={styles.ptListFilterRow}>
            <TouchableOpacity
              onPress={() => setPtListFilter('active')}
              style={[styles.filterPill, ptListFilter === 'active' && styles.filterPillActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterPillText, ptListFilter === 'active' && styles.filterPillTextActive]}>
                Active Treatment ({activePatients.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPtListFilter('concluded')}
              style={[styles.filterPill, ptListFilter === 'concluded' && styles.filterPillActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterPillText, ptListFilter === 'concluded' && styles.filterPillTextActive]}>
                Concluded History
              </Text>
            </TouchableOpacity>
          </View>

          {/* Patient List */}
          <FlatList
            data={treatedPatients}
            keyExtractor={(item) => item.id || item.admissionId}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>{ptListFilter === 'active' ? '💡' : '📋'}</Text>
                <Text style={styles.emptyTitle}>
                  {ptListFilter === 'active' ? 'No Active Sessions' : 'No Concluded Sessions'}
                </Text>
                <Text style={styles.emptySub}>
                  {ptListFilter === 'active'
                    ? 'No patients currently undergoing phototherapy in this unit.'
                    : 'No phototherapy treatment histories found.'}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const sessions = item.treatmentSessions || [];
              const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
              const totalHours = (totalMinutes / 60).toFixed(1);
              const dayWiseList = getDayWiseExposure(sessions);

              const patientReadings = readings.filter(
                (r) =>
                  (r.babyUhid && r.babyUhid === item.babyUhid) ||
                  (r.babyId && r.babyId === item.babyId)
              );
              const latestReading = patientReadings[0];
              const itemMatchingBaby = babies.find(
                (b) => (item.babyUhid && b.uhid === item.babyUhid) || (item.babyId && b.id === item.babyId)
              );
              const isItemDischarged =
                item.admissionStatus === 'discharged' ||
                itemMatchingBaby?.status === 'discharged';
              const isItemActivePt =
                item.admissionStatus === 'under_treatment' &&
                !item.stationReleased;

              const isHighlighted =
                !!targetHighlight &&
                ((item.babyUhid && item.babyUhid === targetHighlight) ||
                 (item.babyId && item.babyId === targetHighlight) ||
                 (item.admissionId && item.admissionId === targetHighlight) ||
                 (item.id && item.id === targetHighlight));

              return (
                <TouchableOpacity
                  style={[styles.card, isHighlighted && styles.cardHighlighted]}
                  onPress={() => setDetailedAdmission(item)}
                  activeOpacity={0.88}
                >
                  {/* Card Header: Station & Total Hours Badge */}
                  <View style={styles.cardHeader}>
                    <View style={styles.stationPill}>
                      <Text style={styles.stationText} numberOfLines={1}>
                        📍 {item.ptStationName || 'Station Assigned'}
                      </Text>
                    </View>
                    {isHighlighted && (
                      <View style={styles.targetBadge}>
                        <Text style={styles.targetBadgeText}>SELECTED PATIENT</Text>
                      </View>
                    )}
                    <View style={[styles.totalBadge, Number(totalHours) === 0 && { backgroundColor: '#F1F5F9' }]}>
                      <Text style={[styles.totalBadgeText, Number(totalHours) === 0 && { color: '#64748B' }]}>
                        {Number(totalHours) > 0 ? `${totalHours}h Total` : '0.0h'}
                      </Text>
                    </View>
                  </View>

                  {/* Patient Identifier */}
                  <View style={styles.patientRow}>
                    <Text style={styles.babyName} numberOfLines={1}>
                      {item.babyName}
                    </Text>
                    <Text style={styles.uhidMeta}>
                      UHID: {item.babyUhid} • Adm: {formatDateShort(item.admittedAt)}
                    </Text>
                  </View>

                  {/* Visual Day-Bar Chart (Glance in 1 Second) - Only rendered when data is present */}
                  {dayWiseList.length > 0 && (
                    <View style={styles.chartContainer}>
                      {dayWiseList.map((day, idx) => (
                        <View key={day.label + '_' + idx} style={styles.chartRow}>
                          <Text style={styles.dayLabel} numberOfLines={1}>
                            {day.label}
                          </Text>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.barFill,
                                {
                                  width: `${Math.max(day.percent, 8)}%`,
                                  backgroundColor: idx === dayWiseList.length - 1 ? '#7D3BFF' : '#94A3B8',
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.dayHoursText}>{day.hours.toFixed(1)}h</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Latest Bilirubin Status Pill */}
                  <View style={styles.biliStatusStrip}>
                    <FlaskConical size={14} color="#7D3BFF" />
                    <Text style={styles.biliStatusText} numberOfLines={1}>
                      {latestReading
                        ? `Latest Bilirubin: ${latestReading.value.toFixed(1)} mg/dL (${formatTimeShort(
                          latestReading.sampleTimestamp || latestReading.timestamp
                        )})`
                        : (() => {
                          const baseVal = getResolvedAdmissionTsb(item);
                          return baseVal != null ? `Initial Bilirubin: ${baseVal.toFixed(1)} mg/dL` : '';
                        })()}
                    </Text>
                  </View>

                  {/* Card Action Row: Quick Entry + Tap to View Detailed Table */}
                  <View style={styles.cardActionsRow}>
                    {isItemActivePt ? (
                      <>
                        <TouchableOpacity
                          style={styles.quickLogBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleOpenLogPt(item);
                          }}
                          activeOpacity={0.75}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Clock size={15} color="#7D3BFF" />
                          <Text style={styles.quickLogText}>+ Log PT</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.quickBiliBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleOpenBiliModal(item);
                          }}
                          activeOpacity={0.75}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Plus size={15} color="#00A569" />
                          <Text style={styles.quickBiliText}>+ Bilirubin</Text>
                        </TouchableOpacity>
                      </>
                    ) : !isItemDischarged ? (
                      <>
                        <View style={styles.observationItemBadge}>
                          <Text style={styles.observationItemBadgeText}>IN OBSERVATION</Text>
                        </View>

                        <TouchableOpacity
                          style={styles.quickBiliBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleOpenBiliModal(item);
                          }}
                          activeOpacity={0.75}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Plus size={15} color="#00A569" />
                          <Text style={styles.quickBiliText}>+ Bilirubin</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <View style={styles.dischargedItemBadge}>
                        <Text style={styles.dischargedItemBadgeText}>DISCHARGED</Text>
                      </View>
                    )}

                    <View style={styles.viewFlowsheetLink}>
                      <Text style={styles.viewFlowsheetText}>Flowsheet</Text>
                      <ChevronRight size={15} color="#7D3BFF" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* --------------------------------------------------------- */}
      {/* MODAL 1: LOG PHOTOTHERAPY TIME WINDOW                     */}
      {/* --------------------------------------------------------- */}
      <Modal visible={logModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {editingSessionId ? 'Edit Phototherapy Session' : 'Log Phototherapy Session'}
                </Text>
                <Text style={styles.modalSub} numberOfLines={1}>
                  {targetAdmissionForLog?.babyName} ({targetAdmissionForLog?.babyUhid})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setLogModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Date Selection Chips */}
            <Text style={styles.fieldLabel}>Session Date</Text>
            <View style={styles.chipRow}>
              {(['today', 'yesterday', 'day_before'] as const).map((opt) => {
                const label = opt === 'today' ? 'Today' : opt === 'yesterday' ? 'Yesterday' : '2 Days Ago';
                const isSel = ptDateOption === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setPtDateOption(opt)}
                    style={[styles.chip, isSel && styles.chipActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isSel && styles.chipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Time Roller (Start Time & End Time) */}
            <Text style={styles.fieldLabel}>Phototherapy Time Window</Text>
            <View style={styles.rollerMainContainer}>
              {/* Start Time Roller */}
              <View style={styles.rollerCard}>
                <Text style={styles.rollerHeader}>START TIME</Text>
                <View style={styles.rollerWheelsRow}>
                  {/* Hour */}
                  <View style={styles.rollerCol}>
                    <TouchableOpacity
                      style={styles.rollerArrowBtn}
                      onPress={() => stepStartHour(1)}
                      activeOpacity={0.6}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <ChevronUp size={20} color="#7D3BFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <View style={styles.rollerBox}>
                      <Text style={styles.rollerBoxText}>{pad2(startHour)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.rollerArrowBtn}
                      onPress={() => stepStartHour(-1)}
                      activeOpacity={0.6}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <ChevronDown size={20} color="#7D3BFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.rollerSubLabel}>HR</Text>
                  </View>

                  <Text style={styles.rollerColon}>:</Text>

                  {/* Minute */}
                  <View style={styles.rollerCol}>
                    <TouchableOpacity
                      style={styles.rollerArrowBtn}
                      onPress={() => stepStartMin(15)}
                      activeOpacity={0.6}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <ChevronUp size={20} color="#7D3BFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <View style={styles.rollerBox}>
                      <Text style={styles.rollerBoxText}>{pad2(startMin)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.rollerArrowBtn}
                      onPress={() => stepStartMin(-15)}
                      activeOpacity={0.6}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <ChevronDown size={20} color="#7D3BFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.rollerSubLabel}>MIN</Text>
                  </View>
                </View>
              </View>

              <View style={styles.rollerDivider}>
                <Text style={styles.rollerDividerArrow}>→</Text>
              </View>

              {/* End Time Roller */}
              <View style={styles.rollerCard}>
                <Text style={styles.rollerHeader}>END TIME</Text>
                <View style={styles.rollerWheelsRow}>
                  {/* Hour */}
                  <View style={styles.rollerCol}>
                    <TouchableOpacity
                      style={styles.rollerArrowBtn}
                      onPress={() => stepEndHour(1)}
                      activeOpacity={0.6}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <ChevronUp size={20} color="#7D3BFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <View style={styles.rollerBox}>
                      <Text style={styles.rollerBoxText}>{pad2(endHour)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.rollerArrowBtn}
                      onPress={() => stepEndHour(-1)}
                      activeOpacity={0.6}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <ChevronDown size={20} color="#7D3BFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.rollerSubLabel}>HR</Text>
                  </View>

                  <Text style={styles.rollerColon}>:</Text>

                  {/* Minute */}
                  <View style={styles.rollerCol}>
                    <TouchableOpacity
                      style={styles.rollerArrowBtn}
                      onPress={() => stepEndMin(15)}
                      activeOpacity={0.6}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <ChevronUp size={20} color="#7D3BFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <View style={styles.rollerBox}>
                      <Text style={styles.rollerBoxText}>{pad2(endMin)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.rollerArrowBtn}
                      onPress={() => stepEndMin(-15)}
                      activeOpacity={0.6}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <ChevronDown size={20} color="#7D3BFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.rollerSubLabel}>MIN</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Total Duration Summary & Stepper */}
            <View style={styles.durationSummaryRow}>
              <Text style={styles.fieldLabel}>Total Duration</Text>
              <Text style={styles.durationTimeSummary}>
                {pad2(startHour)}:{pad2(startMin)} – {pad2(endHour)}:{pad2(endMin)}
              </Text>
            </View>

            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => applyDurationHours(ptDurationHours - 0.5)}
              >
                <Minus size={18} color="#181829" />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{ptDurationHours.toFixed(1)} hrs</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => applyDurationHours(ptDurationHours + 0.5)}
              >
                <Plus size={18} color="#181829" />
              </TouchableOpacity>
            </View>

            <View style={styles.chipRow}>
              {[2, 4, 6, 8, 12].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[styles.presetChip, ptDurationHours === num && styles.presetChipActive]}
                  onPress={() => applyDurationHours(num)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetChipText, ptDurationHours === num && styles.presetChipTextActive]}>
                    {num}h
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveModalBtn, isLoggingPt && { opacity: 0.6 }]}
              onPress={handleSavePtLog}
              disabled={isLoggingPt}
              activeOpacity={0.8}
            >
              <Text style={styles.saveModalBtnText}>
                {isLoggingPt
                  ? 'Saving Session...'
                  : editingSessionId
                    ? 'Update Phototherapy Record'
                    : 'Save Phototherapy Record'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --------------------------------------------------------- */}
      {/* MODAL 2: ADD / EDIT BILIRUBIN READING                     */}
      {/* --------------------------------------------------------- */}
      <Modal visible={biliModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {editingReadingId ? 'Edit Bilirubin Reading' : 'Add Bilirubin Reading'}
                </Text>
                <Text style={styles.modalSub} numberOfLines={1}>
                  {targetAdmissionForBili?.babyName} ({targetAdmissionForBili?.babyUhid})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setBiliModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Bilirubin Value Input */}
            <Text style={styles.fieldLabel}>Bilirubin Value (mg/dL)</Text>
            <TextInput
              style={styles.largeInput}
              value={biliValue}
              onChangeText={setBiliValue}
              placeholder="e.g. 14.2"
              keyboardType="decimal-pad"
              autoFocus
            />

            {/* Method & Site */}
            <View style={styles.timeInputsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Method</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {(['TcB', 'TSB'] as const).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.chip, biliMethod === m && styles.chipActive]}
                      onPress={() => setBiliMethod(m)}
                    >
                      <Text style={[styles.chipText, biliMethod === m && styles.chipTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Site</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['Forehead', 'Sternum'].map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.chip, biliSite === s && styles.chipActive]}
                      onPress={() => setBiliSite(s)}
                    >
                      <Text style={[styles.chipText, biliSite === s && styles.chipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveModalBtn, isLoggingBili && { opacity: 0.6 }]}
              onPress={handleSaveBilirubin}
              disabled={isLoggingBili}
              activeOpacity={0.8}
            >
              <Text style={styles.saveModalBtnText}>
                {isLoggingBili
                  ? 'Saving Reading...'
                  : editingReadingId
                    ? 'Update Bilirubin Reading'
                    : 'Save Bilirubin Reading'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --------------------------------------------------------- */}
      {/* MODAL 3: EDIT INITIAL BILIRUBIN                          */}
      {/* --------------------------------------------------------- */}
      <Modal visible={editAdmissionTsbModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Edit Initial Bilirubin</Text>
                <Text style={styles.modalSub} numberOfLines={1}>
                  {detailedAdmission?.babyName} ({detailedAdmission?.babyUhid})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditAdmissionTsbModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Bilirubin Value Input */}
            <Text style={styles.fieldLabel}>Initial Bilirubin (mg/dL)</Text>
            <TextInput
              style={styles.largeInput}
              value={editAdmissionTsbValue}
              onChangeText={setEditAdmissionTsbValue}
              placeholder="e.g. 15.2"
              keyboardType="decimal-pad"
              autoFocus
            />
            <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>
              The initial bilirubin level recorded for this infant at admission.
            </Text>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveModalBtn}
              onPress={handleSaveAdmissionTsb}
              activeOpacity={0.8}
            >
              <Text style={styles.saveModalBtnText}>Save Initial Bilirubin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --------------------------------------------------------- */}
      {/* MODAL 4: MANAGE & EDIT ALL FLOWSHEET RECORDS AT ONCE      */}
      {/* --------------------------------------------------------- */}
      <Modal visible={manageRecordsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '82%' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Manage Flowsheet Records</Text>
                <Text style={styles.modalSub} numberOfLines={1}>
                  {detailedAdmission?.babyName} ({detailedAdmission?.babyUhid}) • {detailedAdmission?.ptStationName || 'Station'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setManageRecordsModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Section 1: Initial Bilirubin */}
              <View style={styles.manageSectionHeader}>
                <Text style={styles.manageSectionTitle}>Initial Bilirubin</Text>
              </View>
              <View style={styles.manageRecordRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.manageRecordMain}>
                    Initial Bilirubin:{' '}
                    {(() => {
                      const val = getResolvedAdmissionTsb(detailedAdmission);
                      return val != null ? `${val.toFixed(1)} mg/dL` : '';
                    })()}
                  </Text>
                  <Text style={styles.manageRecordSub}>Initial baseline from baby details</Text>
                </View>
                <TouchableOpacity
                  style={styles.manageEditItemBtn}
                  onPress={() => {
                    setManageRecordsModalVisible(false);
                    handleOpenEditAdmissionTsb();
                  }}
                  activeOpacity={0.7}
                >
                  <Edit3 size={13} color="#7D3BFF" />
                  <Text style={styles.manageEditItemText}>Edit</Text>
                </TouchableOpacity>
              </View>

              {/* Section 2: Phototherapy Sessions */}
              <View style={styles.manageSectionHeader}>
                <Text style={styles.manageSectionTitle}>
                  Phototherapy Sessions ({(detailedAdmission?.treatmentSessions || []).length})
                </Text>
              </View>
              {(detailedAdmission?.treatmentSessions || []).length === 0 ? (
                <Text style={styles.manageEmptyText}>No phototherapy sessions recorded yet.</Text>
              ) : (
                (detailedAdmission?.treatmentSessions || []).map((s, sIdx) => {
                  const sD = new Date(s.startTime);
                  const startStr = formatTimeShort(s.startTime);
                  let endStr = startStr;
                  if (s.endTime) endStr = formatTimeShort(s.endTime);
                  else if (s.durationMinutes) {
                    endStr = formatTimeShort(new Date(sD.getTime() + s.durationMinutes * 60000).toISOString());
                  }
                  const durStr = s.durationMinutes ? `${(s.durationMinutes / 60).toFixed(1)} hrs` : '< 1 hr';

                  return (
                    <View key={s.sessionId || sIdx} style={styles.manageRecordRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.manageRecordMain}>
                          {formatDateShort(s.startTime)} • {durStr}
                        </Text>
                        <Text style={styles.manageRecordSub}>
                          {startStr} – {endStr} • {s.phototherapyType || 'Phototherapy'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.manageEditItemBtn}
                        onPress={() => {
                          setManageRecordsModalVisible(false);
                          handleEditPtSession({
                            id: s.sessionId,
                            type: 'pt_session',
                            timestamp: s.startTime,
                            dateStr: formatDateShort(s.startTime),
                            timeRange: `${startStr} – ${endStr}`,
                            durationHoursText: durStr,
                            durationMinutes: s.durationMinutes || 0,
                            bilirubinValue: null,
                            operator: s.nurseName || 'Nurse Staff',
                          });
                        }}
                        activeOpacity={0.7}
                      >
                        <Edit3 size={13} color="#00A569" />
                        <Text style={[styles.manageEditItemText, { color: '#00A569' }]}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}

              {/* Section 3: Bilirubin Readings */}
              {(() => {
                const bReadings = readings.filter(
                  (r) =>
                    (detailedAdmission && r.babyUhid && r.babyUhid === detailedAdmission.babyUhid) ||
                    (detailedAdmission && r.babyId && r.babyId === detailedAdmission.babyId)
                );
                return (
                  <>
                    <View style={styles.manageSectionHeader}>
                      <Text style={styles.manageSectionTitle}>Bilirubin Readings ({bReadings.length})</Text>
                    </View>
                    {bReadings.length === 0 ? (
                      <Text style={styles.manageEmptyText}>No bilirubin readings recorded yet.</Text>
                    ) : (
                      bReadings.map((r, rIdx) => {
                        const ts = r.sampleTimestamp || r.timestamp;
                        return (
                          <View key={r.id || rIdx} style={styles.manageRecordRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.manageRecordMain}>
                                {r.value.toFixed(1)} mg/dL ({r.method || 'TcB'})
                              </Text>
                              <Text style={styles.manageRecordSub}>
                                {formatDateShort(ts)} at {formatTimeShort(ts)} • {(r as any).measurementSite || (r as any).site || 'Forehead'}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.manageEditItemBtn}
                              onPress={() => {
                                setManageRecordsModalVisible(false);
                                handleEditBilirubin({
                                  id: r.id,
                                  type: 'bilirubin_reading',
                                  timestamp: ts,
                                  dateStr: formatDateShort(ts),
                                  timeRange: formatTimeShort(ts),
                                  durationHoursText: null,
                                  durationMinutes: null,
                                  bilirubinValue: r.value,
                                  method: r.method || 'TcB',
                                  operator: r.operatorName || 'Pediatric Lab',
                                });
                              }}
                              activeOpacity={0.7}
                            >
                              <Edit3 size={13} color="#7D3BFF" />
                              <Text style={styles.manageEditItemText}>Edit</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })
                    )}
                  </>
                );
              })()}
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveModalBtn, { marginTop: 14, backgroundColor: '#F1F5F9' }]}
              onPress={() => setManageRecordsModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.saveModalBtnText, { color: '#475569' }]}>Done</Text>
            </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 18,
    color: '#181829',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: fontScale(18),
    fontWeight: '800',
    color: '#181829',
  },
  headerSubtitle: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingTop: 12,
  },
  // Baby Card Styles (Clean, sleek, with prominent action buttons)
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  stationPill: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    maxWidth: '70%',
  },
  stationText: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#7D3BFF',
  },
  totalBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  totalBadgeText: {
    fontSize: fontScale(10.5),
    fontWeight: '800',
    color: '#15803D',
  },
  patientRow: {
    marginBottom: 5,
  },
  babyName: {
    fontSize: fontScale(15),
    fontWeight: '800',
    color: '#181829',
  },
  uhidMeta: {
    fontSize: fontScale(10.5),
    color: '#64748B',
    marginTop: 1,
  },
  // Visual Day-Bar Chart
  chartContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  dayLabel: {
    width: moderateScale(105),
    fontSize: fontScale(10.5),
    fontWeight: '600',
    color: '#475569',
  },
  barTrack: {
    flex: 1,
    height: 7,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginHorizontal: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  dayHoursText: {
    width: 40,
    textAlign: 'right',
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#181829',
  },
  biliStatusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  biliStatusText: {
    fontSize: fontScale(10.5),
    fontWeight: '600',
    color: '#6B21A8',
    flex: 1,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 5,
  },
  quickLogText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#7D3BFF',
  },
  quickBiliBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 5,
  },
  quickBiliText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#00A569',
  },
  viewFlowsheetLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 2,
  },
  viewFlowsheetText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#7D3BFF',
  },
  // Flowsheet Detailed Screen Styles (Clean, tight, no wasted whitespace)
  flowsheetBody: {
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  kpiCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 1,
  },
  kpiCol: {
    alignItems: 'center',
    flex: 1,
  },
  kpiLabel: {
    fontSize: fontScale(9.5),
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  kpiVal: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#181829',
  },
  kpiDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
  flowsheetActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionBtnPt: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7D3BFF',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: fontScale(11.5),
    fontWeight: '700',
  },
  actionBtnBili: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnBiliText: {
    color: '#7D3BFF',
    fontSize: fontScale(11.5),
    fontWeight: '700',
  },
  // Table Card
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 1,
  },
  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableCardTitle: {
    fontSize: fontScale(12.5),
    fontWeight: '800',
    color: '#181829',
  },
  tableCardSub: {
    fontSize: fontScale(9.5),
    color: '#64748B',
    marginTop: 1,
  },
  cardEditPencilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    gap: 4,
  },
  cardEditText: {
    fontSize: fontScale(10.5),
    fontWeight: '700',
    color: '#7D3BFF',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
  },
  thText: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableDataRowAlt: {
    backgroundColor: '#FBFDFF',
  },
  tdDate: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#181829',
  },
  tdTime: {
    fontSize: fontScale(10),
    color: '#64748B',
    marginTop: 1,
  },
  ptDurationBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ptDurationBadgeTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  ptDurationText: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#00A569',
  },
  biliValText: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#181829',
  },
  biliTablePill: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  biliTablePillTouch: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  emptyCellTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 42,
  },
  biliMethodSubText: {
    fontSize: fontScale(9),
    fontWeight: '800',
    color: '#7D3BFF',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  tdDash: {
    fontSize: fontScale(13),
    color: '#CBD5E1',
  },
  tdOperator: {
    fontSize: fontScale(10),
    color: '#64748B',
    fontWeight: '600',
  },
  tableEmpty: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  tableEmptyIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  tableEmptyTitle: {
    fontSize: fontScale(14),
    fontWeight: '700',
    color: '#475569',
  },
  tableEmptySub: {
    fontSize: fontScale(11),
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
  },
  concludeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FC3949',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 6,
    elevation: 2,
  },
  concludeBtnText: {
    color: '#FFFFFF',
    fontSize: fontScale(13),
    fontWeight: '700',
  },
  // Manage Records Modal Styles
  manageSectionHeader: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 6,
  },
  manageSectionTitle: {
    fontSize: fontScale(11),
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  manageRecordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  manageRecordMain: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#181829',
  },
  manageRecordSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 2,
  },
  manageEditItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  manageEditItemText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#7D3BFF',
  },
  manageEmptyText: {
    fontSize: fontScale(11),
    color: '#94A3B8',
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontStyle: 'italic',
  },
  // Modals Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#181829',
  },
  modalSub: {
    fontSize: fontScale(11),
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  fieldLabel: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  subFieldLabel: {
    fontSize: fontScale(10),
    color: '#64748B',
    marginBottom: 3,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#7D3BFF',
    borderColor: '#7D3BFF',
  },
  chipText: {
    fontSize: fontScale(11),
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rollerMainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  rollerCard: {
    flex: 1,
    alignItems: 'center',
  },
  rollerHeader: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  rollerWheelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rollerCol: {
    alignItems: 'center',
    width: 44,
  },
  rollerArrowBtn: {
    width: 38,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
  },
  rollerBox: {
    width: 44,
    height: 38,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#7D3BFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  rollerBoxText: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#181829',
  },
  rollerSubLabel: {
    fontSize: fontScale(9),
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
  },
  rollerColon: {
    fontSize: fontScale(20),
    fontWeight: '800',
    color: '#7D3BFF',
    marginHorizontal: 4,
    marginBottom: 16,
  },
  rollerDivider: {
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  rollerDividerArrow: {
    fontSize: fontScale(16),
    fontWeight: '700',
    color: '#94A3B8',
  },
  durationSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 6,
  },
  durationTimeSummary: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#7D3BFF',
  },
  timeInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    fontSize: fontScale(13),
    color: '#0F172A',
  },
  largeInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: fontScale(18),
    fontWeight: '800',
    color: '#7D3BFF',
    marginBottom: 8,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    gap: 20,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#181829',
    minWidth: 70,
    textAlign: 'center',
  },
  presetChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  presetChipActive: {
    backgroundColor: '#00A569',
    borderColor: '#00A569',
  },
  presetChipText: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#475569',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  saveModalBtn: {
    backgroundColor: '#7D3BFF',
    borderRadius: 14,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  saveModalBtnText: {
    color: '#FFFFFF',
    fontSize: fontScale(13),
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: fontScale(17),
    fontWeight: '800',
    color: '#181829',
  },
  emptySub: {
    fontSize: fontScale(12),
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  ptListFilterRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  filterPillText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#7D3BFF',
  },
  cardHighlighted: {
    borderColor: '#7D3BFF',
    borderWidth: 2,
    backgroundColor: '#FAF5FF',
    shadowColor: '#7D3BFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  targetBadge: {
    backgroundColor: '#7D3BFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  targetBadgeText: {
    color: '#FFFFFF',
    fontSize: fontScale(9),
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  dischargedFlowsheetBanner: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginVertical: 10,
    alignItems: 'center',
  },
  dischargedFlowsheetBannerText: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  concludedDischargedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  concludedDischargedText: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#16A34A',
    marginLeft: 6,
  },
  concludedObservationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  concludedObservationText: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#7D3BFF',
    marginLeft: 6,
  },
  observationItemBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  observationItemBadgeText: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#7D3BFF',
    letterSpacing: 0.3,
  },
  dischargedItemBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  dischargedItemBadgeText: {
    fontSize: fontScale(10),
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.3,
  },
});
