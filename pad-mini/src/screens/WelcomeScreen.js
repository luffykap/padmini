import React, { useState } from 'react';
import { View, StyleSheet, Image, Alert } from 'react-native';
import { Button, Title, Paragraph, Card, TextInput, Dialog, Portal } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme/theme';
import { AuthService } from '../services/AuthService';

export default function WelcomeScreen({ navigation }) {
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Handle sign in with email and password
  const handleSignIn = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoginLoading(true);
    try {
      await AuthService.signIn(loginEmail, loginPassword);
      setShowLoginDialog(false);
      Alert.alert('Success!', 'You are now signed in and will be redirected to the home screen.');
    } catch (error) {
      Alert.alert('Sign In Failed', error.message || 'Invalid email or password');
    } finally {
      setLoginLoading(false);
    }
  };
  // REMOVED: Auto-login was causing "Too many failed attempts" error
  // Use the normal registration flow instead, which includes a verification bypass button

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.secondary]}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          {/* Placeholder for app logo */}
          <View style={styles.logoPlaceholder}>
            <Title style={styles.logoText}>🌸</Title>
          </View>
          <Title style={styles.appTitle}>Pad-Mini</Title>
          <Paragraph style={styles.subtitle}>
            A safe space for women to help each other
          </Paragraph>
        </View>

        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Welcome!</Title>
            <Paragraph style={styles.description}>
              Join a trusted community of women in your college. Get help when you need it most, 
              and be there for others in their time of need.
            </Paragraph>
            <View style={styles.features}>
              <Paragraph style={styles.feature}>✓ Verified college students only</Paragraph>
              <Paragraph style={styles.feature}>✓ Private & secure messaging</Paragraph>
              <Paragraph style={styles.feature}>✓ Location-based emergency help</Paragraph>
              <Paragraph style={styles.feature}>✓ Anonymous support available</Paragraph>
              <Paragraph style={styles.feature}>✓ 24/7 community support</Paragraph>
              <Paragraph style={styles.feature}>✓ Safe meeting coordination</Paragraph>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('GenderVerification')}
            style={styles.joinButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.joinButtonText}
          >
            Join Pad-Mini
          </Button>
          <Button
            mode="text"
            onPress={() => setShowLoginDialog(true)}
            style={styles.loginButton}
            labelStyle={styles.loginButtonText}
          >
            Already have an account? Sign In
          </Button>
        </View>
      </View>
      
      {/* Login Dialog */}
      <Portal>
        <Dialog visible={showLoginDialog} onDismiss={() => setShowLoginDialog(false)}>
          <Dialog.Title>Sign In</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={{ marginBottom: 16 }}>
              Enter your credentials to sign in to Pad-Mini
            </Paragraph>
            <TextInput
              label="College Email"
              value={loginEmail}
              onChangeText={setLoginEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ marginBottom: 12 }}
              placeholder="yourname@bit-bangalore.edu.in"
            />
            <TextInput
              label="Password"
              value={loginPassword}
              onChangeText={setLoginPassword}
              mode="outlined"
              secureTextEntry
              style={{ marginBottom: 12 }}
            />
            <Paragraph style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>
              💡 Test accounts: test@bit-bangalore.edu.in / test123
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLoginDialog(false)}>Cancel</Button>
            <Button 
              mode="contained" 
              onPress={handleSignIn}
              loading={loginLoading}
              disabled={loginLoading}
            >
              Sign In
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 40,
    color: '#fff',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  welcomeCard: {
    marginVertical: 20,
    elevation: 8,
    borderRadius: theme.roundness,
  },
  cardTitle: {
    textAlign: 'center',
    color: theme.colors.primary,
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  features: {
    paddingLeft: 10,
  },
  feature: {
    marginBottom: 8,
    color: theme.colors.text,
  },
  buttonContainer: {
    marginBottom: 40,
  },
  joinButton: {
    backgroundColor: '#fff',
    marginBottom: 16,
    elevation: 4,
  },
  joinButtonText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  loginButton: {
    marginTop: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});