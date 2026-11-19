import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Check,
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { fontScale, moderateScale } from '../theme/responsive';

interface BirthDateTimePickerModalProps {
  visible: boolean;
  value?: string; // Format: "DD/MM/YYYY HH:MM" or ISO string
  onClose: () => void;
  onConfirm: (formattedStr: string, dateObj: Date) => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const pad2 = (n: number) => String(n).padStart(2, '0');

const parseDateTimeString = (str?: string): Date => {
  const now = new Date();
  if (!str || !str.trim()) return now;

  const trimmed = str.trim();
  // Support DD/MM/YYYY HH:MM or DD-MM-YYYY HH:MM
  const match = trimmed.match(
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?)?/
  );
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    let hours = match[4] ? parseInt(match[4], 10) : now.getHours();
    const minutes = match[5] ? parseInt(match[5], 10) : now.getMinutes();
    const ampm = match[6]?.toUpperCase();

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const parsed = new Date(year, month, day, hours, minutes, 0, 0);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  const direct = new Date(trimmed);
  if (!isNaN(direct.getTime())) return direct;

  return now;
};

export const BirthDateTimePickerModal: React.FC<BirthDateTimePickerModalProps> = ({
  visible,
  value,
  onClose,
  onConfirm,
}) => {
  const [activeTab, setActiveTab] = useState<'date' | 'time'>('date');

  // Currently selected date & time parts
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());
  const [selectedMinute, setSelectedMinute] = useState<number>(new Date().getMinutes());

  // Currently viewing month in calendar
  const [viewYear, setViewYear] = useState<number>(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(new Date().getMonth());

  // Synchronize internal state whenever modal opens or value changes
  useEffect(() => {
    if (visible) {
      const d = parseDateTimeString(value);
      setSelectedYear(d.getFullYear());
      setSelectedMonth(d.getMonth());
      setSelectedDay(d.getDate());
      setSelectedHour(d.getHours());
      setSelectedMinute(d.getMinutes());

      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setActiveTab('date');
    }
  }, [visible, value]);

  const today = useMemo(() => new Date(), []);
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  // Calendar calculations for current viewing month
  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells: Array<{ day: number | null; isCurrentMonth: boolean; isFuture: boolean }> = [];

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: null, isCurrentMonth: false, isFuture: false });
    }

    // Days of current month
    for (let d = 1; d <= totalDays; d++) {
      const cellDate = new Date(viewYear, viewMonth, d, 23, 59, 59);
      const isFuture = cellDate.getTime() > today.getTime();
      cells.push({ day: d, isCurrentMonth: true, isFuture });
    }

    return cells;
  }, [viewYear, viewMonth, today]);

  // Check if viewing current or future month
  const canGoNextMonth = useMemo(() => {
    if (viewYear < todayYear) return true;
    if (viewYear === todayYear && viewMonth < todayMonth) return true;
    return false;
  }, [viewYear, viewMonth, todayYear, todayMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (!canGoNextMonth) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Quick Date Selectors
  const handleSelectQuickDate = (offsetDays: number) => {
    const target = new Date(todayYear, todayMonth, todayDay - offsetDays);
    setSelectedYear(target.getFullYear());
    setSelectedMonth(target.getMonth());
    setSelectedDay(target.getDate());

    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
  };

  // Steppers for Time
  const stepHour = (delta: number) => {
    setSelectedHour((prev) => (prev + delta + 24) % 24);
  };

  const stepMinute = (delta: number) => {
    setSelectedMinute((prev) => (prev + delta + 60) % 60);
  };

  const toggleAmPm = (target: 'AM' | 'PM') => {
    if (target === 'AM' && selectedHour >= 12) {
      setSelectedHour(selectedHour - 12);
    } else if (target === 'PM' && selectedHour < 12) {
      setSelectedHour(selectedHour + 12);
    }
  };

  const setTimeToNow = () => {
    const n = new Date();
    setSelectedHour(n.getHours());
    setSelectedMinute(n.getMinutes());
  };

  // Format 12-hour components
  const display12Hour = selectedHour === 0 ? 12 : selectedHour > 12 ? selectedHour - 12 : selectedHour;
  const ampm = selectedHour >= 12 ? 'PM' : 'AM';

  // Preview formatted output
  const previewFormattedStr = useMemo(() => {
    return `${pad2(selectedDay)}/${pad2(selectedMonth + 1)}/${selectedYear} ${pad2(selectedHour)}:${pad2(selectedMinute)}`;
  }, [selectedDay, selectedMonth, selectedYear, selectedHour, selectedMinute]);

  const handleConfirmSelection = () => {
    const finalDate = new Date(selectedYear, selectedMonth, selectedDay, selectedHour, selectedMinute, 0, 0);
    onConfirm(previewFormattedStr, finalDate);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <View style={styles.iconCircle}>
                <CalendarIcon size={18} color="#7D3BFF" strokeWidth={2.2} />
              </View>
              <View>
                <Text style={styles.titleText}>Date & Time of Birth</Text>
                <Text style={styles.subtitleText}>Select neonate birth timestamp</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Segmented Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveTab('date')}
              style={[styles.tabBtn, activeTab === 'date' && styles.tabBtnActive]}
            >
              <CalendarIcon size={15} color={activeTab === 'date' ? '#FFFFFF' : '#64748B'} strokeWidth={2.2} />
              <Text style={[styles.tabText, activeTab === 'date' && styles.tabTextActive]}>
                {`${pad2(selectedDay)} ${MONTH_NAMES[selectedMonth].slice(0, 3)}`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveTab('time')}
              style={[styles.tabBtn, activeTab === 'time' && styles.tabBtnActive]}
            >
              <Clock size={15} color={activeTab === 'time' ? '#FFFFFF' : '#64748B'} strokeWidth={2.2} />
              <Text style={[styles.tabText, activeTab === 'time' && styles.tabTextActive]}>
                {`${pad2(display12Hour)}:${pad2(selectedMinute)} ${ampm}`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab 1: Interactive Date & Calendar View */}
          {activeTab === 'date' ? (
            <View style={styles.calendarBody}>
              {/* Quick Select Chips */}
              <View style={styles.quickChipsRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelectQuickDate(0)}
                  style={[
                    styles.chip,
                    selectedYear === todayYear && selectedMonth === todayMonth && selectedDay === todayDay && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedYear === todayYear && selectedMonth === todayMonth && selectedDay === todayDay && styles.chipTextActive,
                    ]}
                  >
                    Today
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelectQuickDate(1)}
                  style={[
                    styles.chip,
                    (() => {
                      const y = new Date(todayYear, todayMonth, todayDay - 1);
                      return selectedYear === y.getFullYear() && selectedMonth === y.getMonth() && selectedDay === y.getDate();
                    })() && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      (() => {
                        const y = new Date(todayYear, todayMonth, todayDay - 1);
                        return selectedYear === y.getFullYear() && selectedMonth === y.getMonth() && selectedDay === y.getDate();
                      })() && styles.chipTextActive,
                    ]}
                  >
                    Yesterday
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelectQuickDate(2)}
                  style={[
                    styles.chip,
                    (() => {
                      const d2 = new Date(todayYear, todayMonth, todayDay - 2);
                      return selectedYear === d2.getFullYear() && selectedMonth === d2.getMonth() && selectedDay === d2.getDate();
                    })() && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      (() => {
                        const d2 = new Date(todayYear, todayMonth, todayDay - 2);
                        return selectedYear === d2.getFullYear() && selectedMonth === d2.getMonth() && selectedDay === d2.getDate();
                      })() && styles.chipTextActive,
                    ]}
                  >
                    2d ago
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Month Navigation */}
              <View style={styles.monthNavRow}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <ChevronLeft size={20} color="#1E293B" />
                </TouchableOpacity>

                <Text style={styles.monthNavTitle}>
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </Text>

                <TouchableOpacity
                  onPress={handleNextMonth}
                  disabled={!canGoNextMonth}
                  style={[styles.monthNavBtn, !canGoNextMonth && { opacity: 0.25 }]}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <ChevronRight size={20} color="#1E293B" />
                </TouchableOpacity>
              </View>

              {/* Weekday Labels */}
              <View style={styles.weekdayRow}>
                {WEEKDAY_NAMES.map((w, idx) => (
                  <Text key={w + '_' + idx} style={styles.weekdayText}>
                    {w}
                  </Text>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.daysGrid}>
                {calendarCells.map((cell, index) => {
                  if (!cell.day) {
                    return <View key={'empty_' + index} style={styles.dayCellEmpty} />;
                  }

                  const isSelected =
                    selectedYear === viewYear &&
                    selectedMonth === viewMonth &&
                    selectedDay === cell.day;

                  const isTodayCell =
                    todayYear === viewYear &&
                    todayMonth === viewMonth &&
                    todayDay === cell.day;

                  return (
                    <TouchableOpacity
                      key={'day_' + cell.day}
                      disabled={cell.isFuture}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedYear(viewYear);
                        setSelectedMonth(viewMonth);
                        setSelectedDay(cell.day!);
                      }}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                        !isSelected && isTodayCell && styles.dayCellToday,
                        cell.isFuture && styles.dayCellDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.dayTextSelected,
                          !isSelected && isTodayCell && styles.dayTextToday,
                          cell.isFuture && styles.dayTextDisabled,
                        ]}
                      >
                        {cell.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            /* Tab 2: Clean Time Stepper View */
            <View style={styles.timeBody}>
              {/* Quick Time Preset Chips */}
              <View style={styles.quickChipsRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={setTimeToNow}
                  style={styles.chip}
                >
                  <Text style={styles.chipText}>Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedHour(8);
                    setSelectedMinute(0);
                  }}
                  style={styles.chip}
                >
                  <Text style={styles.chipText}>08:00 AM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedHour(14);
                    setSelectedMinute(0);
                  }}
                  style={styles.chip}
                >
                  <Text style={styles.chipText}>02:00 PM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedHour(20);
                    setSelectedMinute(0);
                  }}
                  style={styles.chip}
                >
                  <Text style={styles.chipText}>08:00 PM</Text>
                </TouchableOpacity>
              </View>

              {/* Roller / Stepper Card */}
              <View style={styles.stepperCard}>
                <View style={styles.stepperRow}>
                  {/* Hours */}
                  <View style={styles.rollerCol}>
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={() => stepHour(1)}
                      style={styles.stepBtn}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <ChevronUp size={20} color="#7D3BFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <View style={styles.rollerDisplay}>
                      <Text style={styles.rollerDisplayText}>{pad2(display12Hour)}</Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={() => stepHour(-1)}
                      style={styles.stepBtn}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <ChevronDown size={20} color="#7D3BFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.rollerSubLabel}>HOUR</Text>
                  </View>

                  <Text style={styles.colonSeparator}>:</Text>

                  {/* Minutes */}
                  <View style={styles.rollerCol}>
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={() => stepMinute(5)}
                      style={styles.stepBtn}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <ChevronUp size={20} color="#7D3BFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <View style={styles.rollerDisplay}>
                      <Text style={styles.rollerDisplayText}>{pad2(selectedMinute)}</Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={() => stepMinute(-5)}
                      style={styles.stepBtn}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <ChevronDown size={20} color="#7D3BFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.rollerSubLabel}>MIN</Text>
                  </View>

                  {/* AM / PM Selector */}
                  <View style={styles.ampmCol}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => toggleAmPm('AM')}
                      style={[styles.ampmBtn, ampm === 'AM' && styles.ampmBtnActive]}
                    >
                      <Text style={[styles.ampmBtnText, ampm === 'AM' && styles.ampmBtnTextActive]}>
                        AM
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => toggleAmPm('PM')}
                      style={[styles.ampmBtn, ampm === 'PM' && styles.ampmBtnActive]}
                    >
                      <Text style={[styles.ampmBtnText, ampm === 'PM' && styles.ampmBtnTextActive]}>
                        PM
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Bottom Live Summary & Confirm */}
          <View style={styles.summaryBar}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Selected Birth Time:</Text>
              <Text style={styles.summaryValue}>{previewFormattedStr}</Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleConfirmSelection}
              style={styles.confirmBtn}
            >
              <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.confirmBtnText}>Confirm Date & Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(16),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(24),
    padding: moderateScale(18),
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(14),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  iconCircle: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: fontScale(16),
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  subtitleText: {
    fontSize: fontScale(11.5),
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    padding: moderateScale(4),
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(14),
    padding: 3,
    gap: 4,
    marginBottom: moderateScale(14),
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(11),
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#7D3BFF',
    shadowColor: '#7D3BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  calendarBody: {
    marginBottom: moderateScale(10),
  },
  quickChipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  chip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(14),
  },
  chipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#7D3BFF',
  },
  chipText: {
    fontSize: fontScale(11.5),
    fontWeight: '700',
    color: '#475569',
  },
  chipTextActive: {
    color: '#7D3BFF',
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(6),
    marginBottom: moderateScale(10),
  },
  monthNavBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavTitle: {
    fontSize: fontScale(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: moderateScale(6),
  },
  weekdayText: {
    width: moderateScale(34),
    textAlign: 'center',
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#94A3B8',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: '14.28%',
    height: moderateScale(36),
  },
  dayCell: {
    width: '14.28%',
    height: moderateScale(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: '#7D3BFF',
    borderRadius: moderateScale(18),
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#7D3BFF',
    borderRadius: moderateScale(18),
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: fontScale(13),
    fontWeight: '600',
    color: '#1E293B',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayTextToday: {
    color: '#7D3BFF',
    fontWeight: '800',
  },
  dayTextDisabled: {
    color: '#CBD5E1',
  },
  timeBody: {
    paddingVertical: moderateScale(6),
    marginBottom: moderateScale(10),
  },
  stepperCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(12),
    marginVertical: moderateScale(8),
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(12),
  },
  rollerCol: {
    alignItems: 'center',
    width: moderateScale(62),
  },
  stepBtn: {
    width: moderateScale(34),
    height: moderateScale(30),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
    borderRadius: moderateScale(10),
    marginVertical: 2,
  },
  rollerDisplay: {
    width: moderateScale(58),
    height: moderateScale(48),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    borderColor: '#7D3BFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    shadowColor: '#7D3BFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  rollerDisplayText: {
    fontSize: fontScale(22),
    fontWeight: '800',
    color: '#7D3BFF',
  },
  rollerSubLabel: {
    fontSize: fontScale(9.5),
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 4,
  },
  colonSeparator: {
    fontSize: fontScale(26),
    fontWeight: '900',
    color: '#7D3BFF',
    marginBottom: moderateScale(14),
  },
  ampmCol: {
    gap: moderateScale(8),
    marginLeft: moderateScale(6),
  },
  ampmBtn: {
    width: moderateScale(48),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ampmBtnActive: {
    backgroundColor: '#7D3BFF',
    shadowColor: '#7D3BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  ampmBtnText: {
    fontSize: fontScale(12),
    fontWeight: '800',
    color: '#64748B',
  },
  ampmBtnTextActive: {
    color: '#FFFFFF',
  },
  summaryBar: {
    backgroundColor: '#F5F3FF',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginBottom: moderateScale(14),
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: fontScale(11.5),
    fontWeight: '600',
    color: '#6D28D9',
  },
  summaryValue: {
    fontSize: fontScale(13),
    fontWeight: '800',
    color: '#7D3BFF',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: fontScale(13),
    fontWeight: '700',
    color: '#475569',
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#7D3BFF',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#7D3BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmBtnText: {
    fontSize: fontScale(13.5),
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
