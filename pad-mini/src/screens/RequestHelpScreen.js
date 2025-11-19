import React, { useState, useContext } from 'react';
import { View, StyleSheet, Platform, Alert } from 'react-native';
import { 
  TextInput, 
  Button, 
  Title, 
  Paragraph, 
  Card, 
  RadioButton,
  Switch,
  HelperText
} from 'react-native-paper';
import { theme } from '../theme/theme';
import { RequestService } from '../services/RequestService';
import { useAuth } from '../context/AuthContext';

export default function RequestHelpScreen({ navigation }) {
  const { user, userProfile } = useAuth();

  // Use the authenticated user
  const currentUser = user ? {
    uid: user.uid,
    name: userProfile?.fullName || user.displayName || `User ${user.uid.slice(-4)}`,
    college: userProfile?.college || 'bit-bangalore.edu.in',
    email: user.email
  } : null;

  // Early return if no authenticated user
  if (!currentUser) {
    Alert.alert('Authentication Required', 'Please log in to continue.');
    navigation.goBack();
    return null;
  }
  
  const [requestData, setRequestData] = useState({
    helpType: 'pads',
    description: '',
    urgency: 'medium',
    isAnonymous: false,
    location: 'current' // current, custom
  });
  const [loading, setLoading] = useState(false);

  const helpTypes = [
    { value: 'pads', label: 'Sanitary Pads', icon: '🩸' },
    { value: 'tampons', label: 'Tampons', icon: '🩸' },
    { value: 'emergency', label: 'General Emergency', icon: '🆘' },
    { value: 'safety', label: 'Safety Concern', icon: '🚨' },
    { value: 'other', label: 'Other', icon: '💝' }
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low - Can wait', color: theme.colors.safeGreen },
    { value: 'medium', label: 'Medium - Needed soon', color: theme.colors.warningOrange },
    { value: 'high', label: 'High - Urgent!', color: theme.colors.errorRed }
  ];

  const handleSubmitRequest = async () => {
    // Validation: Only check required fields (helpType and urgency have defaults)
    if (!requestData.helpType || !requestData.urgency) {
      Alert.alert('Missing Information', 'Please select what you need and urgency level.');
      return;
    }

    setLoading(true);
    try {
      console.log('Posting request to Firebase...', { user: currentUser.uid, requestData });
      
      // Create request in Firebase Firestore
      const newRequest = await RequestService.createHelpRequest(currentUser.uid, requestData);
      console.log('Request created in Firebase:', newRequest.id);
      
      // Reset loading state
      setLoading(false);
      
      // Show success message and redirect to Home (My Requests tab)
      Alert.alert(
        'Request Sent!',
        'Your request has been posted and nearby verified students will be notified!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home')
          }
        ],
        { cancelable: false }
      );
      
      // Auto-redirect after 2 seconds even if alert is dismissed
      setTimeout(() => {
        navigation.navigate('Home');
      }, 2000);
      
    } catch (error) {
      setLoading(false);
      console.error('Error submitting request:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to send request. Please check your location permissions and try again.'
      );
    }
  };

  const updateRequestData = (field, value) => {
    setRequestData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Request Help</Title>
            <Paragraph style={styles.subtitle}>
              Let nearby verified students know what you need
            </Paragraph>

            {/* Help Type Selection */}
            <View style={styles.section}>
              <Paragraph style={styles.sectionTitle}>What do you need?</Paragraph>
              <RadioButton.Group
                onValueChange={(value) => updateRequestData('helpType', value)}
                value={requestData.helpType}
              >
                {helpTypes.map((type) => (
                  <View key={type.value} style={styles.radioItem}>
                    <RadioButton value={type.value} color={theme.colors.primary} />
                    <Paragraph style={styles.radioLabel}>
                      {type.icon} {type.label}
                    </Paragraph>
                  </View>
                ))}
              </RadioButton.Group>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <TextInput
                label="Brief description (optional)"
                value={requestData.description}
                onChangeText={(value) => updateRequestData('description', value)}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
                placeholder="Any specific details that might help..."
              />
            </View>

            {/* Urgency Level */}
            <View style={styles.section}>
              <Paragraph style={styles.sectionTitle}>How urgent is this?</Paragraph>
              <RadioButton.Group
                onValueChange={(value) => updateRequestData('urgency', value)}
                value={requestData.urgency}
              >
                {urgencyLevels.map((level) => (
                  <View key={level.value} style={styles.radioItem}>
                    <RadioButton value={level.value} color={level.color} />
                    <Paragraph style={[styles.radioLabel, { color: level.color }]}>
                      {level.label}
                    </Paragraph>
                  </View>
                ))}
              </RadioButton.Group>
            </View>

            {/* Privacy Options */}
            <View style={styles.section}>
              <View style={styles.switchContainer}>
                <View style={styles.switchInfo}>
                  <Paragraph style={styles.switchLabel}>Send anonymously</Paragraph>
                  <HelperText type="info">
                    Your name won't be shown, just "A friend needs help"
                  </HelperText>
                </View>
                <Switch
                  value={requestData.isAnonymous}
                  onValueChange={(value) => updateRequestData('isAnonymous', value)}
                  color={theme.colors.primary}
                />
              </View>
            </View>

            {/* Safety Notice */}
            <Card style={styles.safetyCard}>
              <Card.Content>
                <Paragraph style={styles.safetyText}>
                  🔒 Your location is only shared with verified students from your college. 
                  You can cancel this request anytime.
                </Paragraph>
              </Card.Content>
            </Card>

            <Button
              mode="contained"
              onPress={handleSubmitRequest}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              contentStyle={styles.buttonContent}
            >
              {loading ? 'Sending Request...' : 'Send Help Request'}
            </Button>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    ...(Platform.OS === 'web' && {
      overflow: 'auto',
      height: '100vh',
      maxHeight: '100vh',
      overflowY: 'scroll',
      overflowX: 'hidden', // Prevent horizontal scroll
      WebkitOverflowScrolling: 'touch',
    }),
  },
  content: {
    width: '100%',
    maxWidth: 900, // Centered container max width
    alignSelf: 'center',
    padding: 16,
    ...(Platform.OS === 'web' && {
      minHeight: 'calc(100vh + 200px)',
      paddingBottom: 60,
      display: 'block',
      boxSizing: 'border-box',
    }),
  },
  card: {
    elevation: 4,
    borderRadius: theme.roundness,
    width: '100%',
    maxWidth: '100%', // Ensure card doesn't overflow
  },
  title: {
    textAlign: 'center',
    color: theme.colors.primary,
    marginBottom: 8,
    fontSize: 24,
    ...(Platform.OS === 'web' && {
      '@media (max-width: 600px)': {
        fontSize: 20,
      },
    }),
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: theme.colors.text,
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: theme.colors.text,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
    flexWrap: 'wrap', // Allow wrapping on small screens
  },
  radioLabel: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    minWidth: 150, // Ensure readable width
  },
  input: {
    marginBottom: 8,
    width: '100%',
    maxWidth: '100%', // Prevent overflow
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    flexWrap: 'wrap', // Wrap on very small screens
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
    minWidth: 200, // Ensure readable width
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  safetyCard: {
    backgroundColor: theme.colors.mintGreen,
    marginBottom: 24,
    width: '100%',
    maxWidth: '100%',
  },
  safetyText: {
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    elevation: 4,
    width: '100%',
    maxWidth: '100%',
  },
  buttonContent: {
    paddingVertical: 8,
  },
});