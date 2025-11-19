import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { 
  Button, 
  Title, 
  Paragraph, 
  Card, 
  ActivityIndicator 
} from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import { theme } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import GenderVerificationService from '../services/GenderVerificationService';

export default function VerificationScreen({ navigation, route }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [faceDetected, setFaceDetected] = useState(false);
  const [verificationStep, setVerificationStep] = useState('permission'); // permission, capture, processing, success
  const [camera, setCamera] = useState(null);
  
  // Get user data from AuthContext or route params (for backward compatibility)
  const { user, userProfile, updateVerification } = useAuth();
  const userData = route?.params?.userData || {
    fullName: userProfile?.fullName || user?.displayName || 'User',
    email: user?.email || 'Unknown'
  };
  
  // Get gender verification data if it was already done
  const { genderVerified, verificationData, pendingReview } = route?.params || {};

  useEffect(() => {
    // If gender verification was already done in GenderVerificationScreen, skip face verification
    if (genderVerified && verificationData) {
      handleAlreadyVerified();
    } else if (permission === null) {
      requestPermission();
    } else if (permission?.granted) {
      setVerificationStep('capture');
    }
  }, [permission, genderVerified]);

  const handleAlreadyVerified = async () => {
    try {
      // Update user verification with existing gender data
      await updateVerification({
        verified: true,
        verificationDate: new Date().toISOString(),
        verificationMethod: 'gender_verification_at_registration',
        gender: verificationData.gender,
        genderConfidence: verificationData.confidence,
        pendingReview: pendingReview || false
      });

      // Navigate to home
      navigation.replace('Home');
    } catch (error) {
      console.error('Error updating verification:', error);
      Alert.alert('Error', 'Failed to update verification. Please try again.');
    }
  };

  const handleFacesDetected = ({ faces }) => {
    if (faces.length === 1) {
      setFaceDetected(true);
    } else {
      setFaceDetected(false);
    }
  };

  const captureAndVerify = async () => {
    if (!camera || !faceDetected) {
      Alert.alert(
        'Face Not Detected', 
        'Please ensure your face is clearly visible in the camera frame.'
      );
      return;
    }

    setVerificationStep('processing');
    
    try {
      // Take photo for verification
      const photo = await camera.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      // Validate captured image
      const validation = GenderVerificationService.validateCapturedImage(photo);
      if (!validation.valid) {
        Alert.alert('Image Quality Issue', validation.error);
        setVerificationStep('capture');
        return;
      }

      console.log('📸 Photo captured, analyzing gender...');

      // Analyze face for gender detection
      const analysisResult = await GenderVerificationService.analyzeFaceGender(
        photo.uri,
        photo.base64
      );

      console.log('📊 Analysis result:', analysisResult);

      // Process verification result
      const verificationResult = await GenderVerificationService.processVerificationResult(
        analysisResult,
        updateVerification
      );

      if (verificationResult.success) {
        // Female verified - proceed to home
        Alert.alert(
          '✓ Verification Successful!',
          verificationResult.message,
          [{ 
            text: 'Continue',
            onPress: () => setVerificationStep('success')
          }]
        );
      } else if (verificationResult.requiresManualReview) {
        // Pending admin review
        Alert.alert(
          '⏳ Manual Review Required',
          verificationResult.message + '\n\nYou will receive an email once your verification is approved (usually within 24 hours).',
          [{ 
            text: 'OK',
            onPress: () => navigation.replace('Welcome')
          }]
        );
      } else if (verificationResult.error === 'gender_mismatch') {
        // Not female - access denied
        Alert.alert(
          '🚫 Access Denied',
          verificationResult.message,
          [{ 
            text: 'OK',
            onPress: () => navigation.replace('Welcome')
          }]
        );
      } else {
        // Other errors - allow retry
        Alert.alert(
          'Verification Failed',
          verificationResult.message + (verificationResult.canRetry ? '\n\nPlease try again.' : ''),
          [{ 
            text: 'OK',
            onPress: () => setVerificationStep('capture')
          }]
        );
      }

    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert(
        'Verification Error', 
        'Failed to verify face. Please check your internet connection and try again.',
        [{ 
          text: 'Retry',
          onPress: () => setVerificationStep('capture')
        }]
      );
    }
  };

  const renderPermissionView = () => (
    <Card style={styles.card}>
      <Card.Content style={styles.centerContent}>
        <Title style={styles.title}>Camera Permission Required</Title>
        <Paragraph style={styles.text}>
          We need access to your camera for face verification to ensure the safety 
          and security of our community.
        </Paragraph>
        <Button 
          mode="contained" 
          onPress={requestPermission}
          style={styles.button}
        >
          Grant Camera Permission
        </Button>
      </Card.Content>
    </Card>
  );

  const handleBypassVerification = async () => {
    Alert.alert(
      'Skip Verification',
      'Are you sure you want to skip face verification? This is for testing only.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip & Go Home',
          onPress: async () => {
            try {
              await updateVerification({
                verified: true,
                verificationDate: new Date().toISOString(),
                verificationMethod: 'bypassed_for_testing',
                verificationPhoto: 'bypassed'
              });
              // Navigate directly to Home
              navigation.replace('Home');
            } catch (error) {
              console.error('Failed to bypass verification:', error);
              Alert.alert('Error', 'Failed to skip verification');
            }
          }
        }
      ]
    );
  };

  const renderCameraView = () => (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={setCamera}
        style={styles.camera}
        facing="front"
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.fast,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
          runClassifications: FaceDetector.FaceDetectorClassifications.none,
          minDetectionInterval: 100,
          tracking: true,
        }}
      >
        <View style={styles.cameraOverlay}>
          <View style={styles.faceFrame} />
          <View style={styles.instructionContainer}>
            <Paragraph style={styles.instruction}>
              Position your face within the frame
            </Paragraph>
            <View style={styles.statusContainer}>
              <Paragraph style={[
                styles.status,
                { color: faceDetected ? theme.colors.safeGreen : theme.colors.warningOrange }
              ]}>
                {faceDetected ? '✓ Face detected' : '⚠ Position your face in frame'}
              </Paragraph>
            </View>
          </View>
        </View>
      </CameraView>
      
      <View style={styles.captureContainer}>
        <Button
          mode="contained"
          onPress={captureAndVerify}
          disabled={!faceDetected}
          style={[
            styles.captureButton,
            { backgroundColor: faceDetected ? theme.colors.primary : theme.colors.placeholder }
          ]}
        >
          Verify Identity
        </Button>
        
        <Button
          mode="outlined"
          onPress={handleBypassVerification}
          style={[styles.captureButton, styles.bypassButton]}
          labelStyle={{ color: theme.colors.warningOrange }}
        >
          Skip Verification (Testing)
        </Button>
      </View>
    </View>
  );

  const renderProcessingView = () => (
    <Card style={styles.card}>
      <Card.Content style={styles.centerContent}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Title style={styles.title}>Analyzing Face...</Title>
        <Paragraph style={styles.text}>
          • Detecting face{'\n'}
          • Verifying gender{'\n'}
          • Checking image quality{'\n\n'}
          This ensures our platform remains a safe space for female college students only.
        </Paragraph>
      </Card.Content>
    </Card>
  );

  const renderSuccessView = () => (
    <Card style={styles.card}>
      <Card.Content style={styles.centerContent}>
        <Title style={[styles.title, { color: theme.colors.safeGreen }]}>
          ✓ Verification Successful!
        </Title>
        <Paragraph style={styles.text}>
          Welcome to Safe Support, {userData.fullName}! 
          Your account has been verified and activated.
        </Paragraph>
      </Card.Content>
    </Card>
  );

  const renderContent = () => {
    switch (verificationStep) {
      case 'permission':
        return renderPermissionView();
      case 'capture':
        return renderCameraView();
      case 'processing':
        return renderProcessingView();
      case 'success':
        return renderSuccessView();
      default:
        return renderPermissionView();
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        {renderPermissionView()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    elevation: 4,
    borderRadius: theme.roundness,
  },
  centerContent: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    textAlign: 'center',
    color: theme.colors.primary,
    marginBottom: 16,
  },
  text: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  button: {
    marginTop: 16,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  faceFrame: {
    width: 250,
    height: 300,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 20,
    marginTop: 50,
    borderStyle: 'dashed',
  },
  instructionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: theme.roundness,
    marginBottom: 100,
  },
  instruction: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 10,
  },
  statusContainer: {
    alignItems: 'center',
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  captureContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  bypassButton: {
    marginTop: 10,
    borderColor: theme.colors.warningOrange,
  },
});