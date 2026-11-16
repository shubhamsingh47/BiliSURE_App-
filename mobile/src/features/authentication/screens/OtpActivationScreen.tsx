import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react-native';
import { COLORS } from '../../../theme/colors';
import { PrimaryButton } from '../../../components/PrimaryButton';

interface OtpActivationScreenProps {
  onBack: () => void;
  onActivateSuccess: () => void;
  emailOrPhone?: string;
}

export const OtpActivationScreen: React.FC<OtpActivationScreenProps> = ({
  onBack,
  onActivateSuccess,
  emailOrPhone = 'priya.sharma@bilisure.district.org',
}) => {
  const [otp, setOtp] = useState(['4', '8', '2', '9', '1', '5']);
  const [loading, setLoading] = useState(false);

  const handleVerify = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onActivateSuccess();
    }, 600);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.iconCircle}>
          <ShieldCheck size={36} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Account Activation</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit verification code sent to your registered clinical credential:
        </Text>
        <Text style={styles.emailText}>{emailOrPhone}</Text>

        {/* 6-Box OTP Display */}
        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <View key={index} style={styles.otpBox}>
              <Text style={styles.otpDigit}>{digit}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity activeOpacity={0.7} style={styles.resendRow}>
          <RefreshCw size={14} color={COLORS.primary} />
          <Text style={styles.resendText}>Resend Security Code</Text>
        </TouchableOpacity>

        <PrimaryButton
          title="Verify & Activate Device"
          onPress={handleVerify}
          loading={loading}
          style={styles.verifyBtn}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 28,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 28,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  verifyBtn: {
    marginTop: 8,
  },
});
