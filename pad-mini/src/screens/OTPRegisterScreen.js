import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Title, 
  Paragraph,
  HelperText,
  ActivityIndicator
} from 'react-native-paper';
import { AuthService } from '../services/AuthService';
import { EmailService } from '../services/EmailService';
import { theme } from '../theme/theme';

export function OTPRegisterScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1: Email & Details, 2: OTP Verification
  const [loading, setLoading] = useState(false);
  
  // Debug navigation
  console.log('🧭 OTPRegisterScreen loaded, navigation available:', !!navigation);
  
  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    collegeEmail: '',
    otp: '',
    appPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateEmail = (email) => {
    const collegeEmailPattern = /^[^\s@]+@bit-bangalore\.edu\.in$/;
    return collegeEmailPattern.test(email);
  };

  // REMOVED: Auto-login was causing "Too many failed attempts" error
  // Use the verification screen's bypass button instead

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    }

    if (!formData.collegeEmail.trim()) {
      newErrors.collegeEmail = 'BIT Bangalore college email is required';
    } else if (!validateEmail(formData.collegeEmail)) {
      newErrors.collegeEmail = 'Please use your official BIT Bangalore email (@bit-bangalore.edu.in)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (formData.otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits';
    }

    if (!formData.appPassword) {
      newErrors.appPassword = 'App password is required';
    } else if (formData.appPassword.length < 6) {
      newErrors.appPassword = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.appPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validateStep1()) return;

    setLoading(true);
    try {
      console.log('🚀 Sending OTP request...');
      const result = await AuthService.sendOTPToCollegeEmail(
        formData.collegeEmail,
        formData.fullName,
        formData.studentId
      );

      console.log('✅ OTP Response:', result);

      // Automatically move to step 2
      setStep(2);
      
      // Show OTP in alert popup for easy access
      Alert.alert(
        '✅ OTP Generated!', 
        `Your OTP has been generated.\n\n🔢 YOUR OTP: ${result.otp}\n\n⏰ Valid for 10 minutes\n\n💡 Also check browser console for details`,
        [{ text: 'Continue' }]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      // Use real AuthService for proper Firebase authentication
      const result = await AuthService.verifyOTPAndRegister(
        formData.collegeEmail,
        formData.otp,
        formData.appPassword
      );

      // Navigate immediately after success
      console.log('✅ Registration successful, authentication state will update automatically...');
      // Remove manual navigation - let AuthContext handle the navigation
      // The App component will automatically switch to the main app stack when user is authenticated
      
      // Show success message
      Alert.alert(
        'Welcome to Pad-Mini!', 
        '🎉 Registration completed successfully!\n\nYou can now:\n• Request emergency help\n• Help other students\n• Chat securely',
        [{ text: 'Got it!' }]
      );
      
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.title}>Register with College Email</Title>
        <Paragraph style={styles.subtitle}>
          We'll send an OTP to your BIT Bangalore college email to verify your identity
        </Paragraph>

        <TextInput
          label="Full Name"
          value={formData.fullName}
          onChangeText={(value) => updateFormData('fullName', value)}
          error={!!errors.fullName}
          style={styles.input}
          mode="outlined"
        />
        <HelperText type="error" visible={!!errors.fullName}>
          {errors.fullName}
        </HelperText>

        <TextInput
          label="Student ID"
          value={formData.studentId}
          onChangeText={(value) => updateFormData('studentId', value)}
          error={!!errors.studentId}
          style={styles.input}
          mode="outlined"
        />
        <HelperText type="error" visible={!!errors.studentId}>
          {errors.studentId}
        </HelperText>

        <TextInput
          label="BIT Bangalore College Email"
          value={formData.collegeEmail}
          onChangeText={(value) => updateFormData('collegeEmail', value)}
          error={!!errors.collegeEmail}
          style={styles.input}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="yourname@bit-bangalore.edu.in"
        />
        <HelperText type="error" visible={!!errors.collegeEmail}>
          {errors.collegeEmail}
        </HelperText>

        <Button
          mode="contained"
          onPress={handleSendOTP}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Send OTP to College Email
        </Button>

        {/* EmailJS Setup Instructions */}
        <Button
          mode="outlined"
          onPress={() => {
            Alert.alert(
              '📧 Setup Real Email Delivery',
              'To receive OTP emails directly in your Gmail inbox:\n\n' +
              '1. Check EMAILJS_SETUP.md file\n' +
              '2. Or check browser console for setup guide\n\n' +
              'For now, OTP will be shown in console.',
              [
                { text: 'Show Setup Guide', onPress: () => console.log(EmailService.getSetupInstructions()) },
                { text: 'OK' }
              ]
            );
          }}
          style={[styles.button, { marginTop: 8 }]}
          icon="email-outline"
        >
          📧 Setup Real Email Delivery
        </Button>

        {/* Debug/Manual navigation button */}
        <Button
          mode="text"
          onPress={() => setStep(2)}
          style={styles.backButton}
        >
          Skip to Step 2 (for testing)
        </Button>
      </Card.Content>
    </Card>
  );

  const renderStep2 = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.title}>Verify OTP</Title>
        <Paragraph style={styles.subtitle}>
          Enter the 6-digit OTP sent to {formData.collegeEmail}
        </Paragraph>

        <TextInput
          label="Enter OTP"
          value={formData.otp}
          onChangeText={(value) => updateFormData('otp', value)}
          error={!!errors.otp}
          style={styles.input}
          mode="outlined"
          keyboardType="numeric"
          maxLength={6}
          placeholder="123456"
        />
        <HelperText type="error" visible={!!errors.otp}>
          {errors.otp}
        </HelperText>

        <TextInput
          label="Create App Password"
          value={formData.appPassword}
          onChangeText={(value) => updateFormData('appPassword', value)}
          error={!!errors.appPassword}
          style={styles.input}
          mode="outlined"
          secureTextEntry
          placeholder="Choose a strong password for this app"
        />
        <HelperText type="error" visible={!!errors.appPassword}>
          {errors.appPassword}
        </HelperText>

        <TextInput
          label="Confirm App Password"
          value={formData.confirmPassword}
          onChangeText={(value) => updateFormData('confirmPassword', value)}
          error={!!errors.confirmPassword}
          style={styles.input}
          mode="outlined"
          secureTextEntry
        />
        <HelperText type="error" visible={!!errors.confirmPassword}>
          {errors.confirmPassword}
        </HelperText>

        <Button
          mode="contained"
          onPress={handleVerifyAndRegister}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Verify & Complete Registration
        </Button>

        <Button
          mode="text"
          onPress={() => setStep(1)}
          style={styles.backButton}
        >
          Back to Edit Details
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Debug step indicator */}
      <Text style={styles.stepIndicator}>Step {step} of 2</Text>
      {step === 1 ? renderStep1() : renderStep2()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  card: {
    elevation: 4,
    backgroundColor: 'white',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: theme.colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: theme.colors.text,
    fontSize: 16,
  },
  input: {
    marginBottom: 4,
    backgroundColor: 'white',
  },
  button: {
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 4,
  },
  backButton: {
    marginTop: 8,
  },
  stepIndicator: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.colors.primary,
  },
});