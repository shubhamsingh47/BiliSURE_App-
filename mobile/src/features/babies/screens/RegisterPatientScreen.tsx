import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../../../theme/colors';
import { CustomHeader } from '../../../components/CustomHeader';
import { CustomInput } from '../../../components/CustomInput';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { usePatientStore } from '../../../store/usePatientStore';

interface RegisterPatientScreenProps {
  onBack: () => void;
  onSuccess: (baby: any) => void;
}

export const RegisterPatientScreen: React.FC<RegisterPatientScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [uhid, setUhid] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [doctor, setDoctor] = useState('Dr. XYZ');
  const [severity, setSeverity] = useState('normal');
  const [loading, setLoading] = useState(false);

  const { registerBaby } = usePatientStore();

  const handleRegister = async () => {
    setLoading(true);
    try {
      const created = await registerBaby({
        name: name || 'Newborn Patient',
        uhid: uhid || `UHID_${Date.now().toString().slice(-6)}`,
        weight: parseFloat(weight) || 3.1,
        height: parseFloat(height) || 48.0,
        assignedDoctor: doctor,
        severityState: (severity as any) || 'normal',
      });
      onSuccess(created);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <CustomHeader title="Register Patient" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.container}>
        <CustomInput
          placeholder="Patient’s Name"
          value={name}
          onChangeText={setName}
        />
        <CustomInput
          placeholder="UHID"
          value={uhid}
          onChangeText={setUhid}
          autoCapitalize="characters"
        />
        <CustomInput
          placeholder="Weight"
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />
        <CustomInput
          placeholder="Height"
          value={height}
          onChangeText={setHeight}
          keyboardType="numeric"
        />
        <CustomInput
          placeholder="Assigned Doctor"
          value={doctor}
          onChangeText={setDoctor}
        />
        <CustomInput
          placeholder="Severity State"
          value={severity}
          onChangeText={setSeverity}
        />

        <PrimaryButton
          title="Register"
          onPress={handleRegister}
          loading={loading}
          style={styles.registerBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    padding: 20,
    paddingTop: 10,
  },
  registerBtn: {
    marginTop: 20,
  },
});
