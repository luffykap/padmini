import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  TextInput, 
  Button, 
  Title, 
  Paragraph, 
  Card, 
  HelperText,
  Checkbox 
} from 'react-native-paper';
import { theme } from '../theme/theme';

export default function RegisterScreen({ navigation, route }) {
  // Get gender verification data from previous screen
  const { genderVerified, verificationData, pendingReview } = route.params || {};
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    studentId: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    // Check if email is from @bit-bangalore.edu.in domain only
    const collegeEmailPattern = /^[^\s@]+@bit-bangalore\.edu\.in$/;
    return collegeEmailPattern.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'College email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please use your official BIT Bangalore email (@bit-bangalore.edu.in)';
    }

    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      setLoading(false);
      navigation.navigate('OTPRegister', { 
        userData: formData,
        genderVerified: genderVerified,
        verificationData: verificationData,
        pendingReview: pendingReview
      });
    } catch (error) {
      setLoading(false);
      Alert.alert('Registration Error', error.message);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {genderVerified && (
          <Card style={[styles.card, styles.verificationCard]}>
            <Card.Content>
              <Title style={styles.verificationTitle}>✅ Gender Verified</Title>
              <Paragraph style={styles.verificationText}>
                {pendingReview 
                  ? 'Pending manual review - You can continue registration'
                  : `Verified as ${verificationData?.gender} (${verificationData?.confidence?.toFixed(1)}% confidence)`}
              </Paragraph>
            </Card.Content>
          </Card>
        )}
        
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Create Your Account</Title>
            <Paragraph style={styles.subtitle}>
              Join the safe support community at your college
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
              label="College Email"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              error={!!errors.email}
              style={styles.input}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="yourname@bit-bangalore.edu.in"
            />
            <HelperText type="error" visible={!!errors.email}>
              {errors.email}
            </HelperText>

            <TextInput
              label="Student ID"
              value={formData.studentId}
              onChangeText={(value) => updateFormData('studentId', value)}
              error={!!errors.studentId}
              style={styles.input}
              mode="outlined"
              placeholder="Your college student ID"
            />
            <HelperText type="error" visible={!!errors.studentId}>
              {errors.studentId}
            </HelperText>

            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              error={!!errors.password}
              style={styles.input}
              mode="outlined"
              secureTextEntry
            />
            <HelperText type="error" visible={!!errors.password}>
              {errors.password}
            </HelperText>

            <TextInput
              label="Confirm Password"
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

            <View style={styles.checkboxContainer}>
              <Checkbox
                status={formData.agreeToTerms ? 'checked' : 'unchecked'}
                onPress={() => updateFormData('agreeToTerms', !formData.agreeToTerms)}
                color={theme.colors.primary}
              />
              <Paragraph style={styles.checkboxText}>
                I agree to the Terms of Service and Privacy Policy
              </Paragraph>
            </View>
            <HelperText type="error" visible={!!errors.agreeToTerms}>
              {errors.agreeToTerms}
            </HelperText>

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.registerButton}
              contentStyle={styles.buttonContent}
            >
              {loading ? 'Creating Account...' : 'Continue to Verification'}
            </Button>
          </Card.Content>
        </Card>
      </View>
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
  },
  card: {
    elevation: 4,
    borderRadius: theme.roundness,
  },
  title: {
    textAlign: 'center',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: theme.colors.text,
  },
  input: {
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  checkboxText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  registerButton: {
    marginTop: 24,
    elevation: 4,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  verificationCard: {
    backgroundColor: '#E8F5E9',
    marginBottom: 16,
  },
  verificationTitle: {
    color: '#2E7D32',
    fontSize: 18,
    textAlign: 'center',
  },
  verificationText: {
    color: '#1B5E20',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});