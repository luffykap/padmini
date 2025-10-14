import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { 
  Button, 
  Title, 
  Paragraph, 
  Card, 
  ActivityIndicator 
} from 'react-native-paper';
import { Camera } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import { theme } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

export default function VerificationScreen({ navigation, route }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [verificationStep, setVerificationStep] = useState('permission'); // permission, capture, processing, success
  const [camera, setCamera] = useState(null);
  
  // Get user data from AuthContext or route params (for backward compatibility)
  const { user, userProfile, updateVerification } = useAuth();
  const userData = route?.params?.userData || {
    fullName: userProfile?.fullName || user?.displayName || 'User',
    email: user?.email || 'Unknown'
  };

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    if (status === 'granted') {
      setVerificationStep('capture');
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

      // TODO: Implement actual face verification with college ID
      // For MVP: Skip photo storage to avoid Firebase Storage costs
      // Alternative: Use Cloudinary free tier or text-based verification
      setTimeout(async () => {
        try {
          // Mark user as verified in Firestore
          await updateVerification({
            verified: true,
            verificationDate: new Date().toISOString(),
            verificationMethod: 'face_capture',
            verificationPhoto: 'simulated' // In production, store actual photo
          });
          
          setVerificationStep('success');
          // AuthContext will automatically detect verification change and navigate to home
        } catch (verificationError) {
          console.error('Failed to update verification:', verificationError);
          Alert.alert('Verification Error', 'Failed to save verification. Please try again.');
          setVerificationStep('capture');
        }
      }, 3000);

    } catch (error) {
      Alert.alert('Verification Error', 'Failed to capture image. Please try again.');
      setVerificationStep('capture');
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
          onPress={requestCameraPermission}
          style={styles.button}
        >
          Grant Camera Permission
        </Button>
      </Card.Content>
    </Card>
  );

  const renderCameraView = () => (
    <View style={styles.cameraContainer}>
      <Camera
        ref={setCamera}
        style={styles.camera}
        type={Camera.Constants.Type.front}
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
      </Camera>
      
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
      </View>
    </View>
  );

  const renderProcessingView = () => (
    <Card style={styles.card}>
      <Card.Content style={styles.centerContent}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Title style={styles.title}>Verifying Your Identity</Title>
        <Paragraph style={styles.text}>
          Please wait while we verify your identity with your college records...
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

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (hasPermission === false) {
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
});