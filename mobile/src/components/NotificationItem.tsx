import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Bell, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

export type NotificationType = 'referral_incoming' | 'referral_accepted' | 'patient_arrival' | 'station_alert' | 'clinical_alert' | 'discharge_ready';

interface NotificationItemProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  id,
  type,
  title,
  message,
  timestamp,
  isRead = false,
  onPress,
  style,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'referral_incoming':
      case 'referral_accepted':
        return <ArrowRight size={18} color={COLORS.primary} />;
      case 'clinical_alert':
        return <AlertTriangle size={18} color={COLORS.critical} />;
      case 'patient_arrival':
      case 'discharge_ready':
        return <CheckCircle2 size={18} color={COLORS.normal} />;
      case 'station_alert':
      default:
        return <Bell size={18} color={COLORS.primary} />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'clinical_alert':
        return COLORS.criticalLight;
      case 'patient_arrival':
      case 'discharge_ready':
        return COLORS.normalLight;
      case 'referral_incoming':
      case 'referral_accepted':
      default:
        return COLORS.primaryBg;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={[
        styles.card,
        !isRead && styles.cardUnread,
        style,
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: getIconBg() }]}>
        {getIcon()}
      </View>

      <View style={styles.contentCol}>
        <View style={styles.topRow}>
          <Text style={[styles.title, !isRead && styles.titleUnread]} numberOfLines={1}>
            {title}
          </Text>
          {!isRead && <View style={styles.unreadDot} />}
        </View>

        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>

        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  cardUnread: {
    borderColor: COLORS.primaryLight,
    backgroundColor: '#FAF5FF',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentCol: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  titleUnread: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 6,
  },
  message: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
  },
});
