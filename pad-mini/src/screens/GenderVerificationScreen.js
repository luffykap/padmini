import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import { 
  Button, 
  Title, 
  Paragraph, 
  Card,
  ActivityIndicator,
  Surface,
  IconButton,
  Dialog,
  Portal
} from 'react-native-paper';
import { theme } from '../theme/theme';
import { analyzeFaceGender, validateCapturedImage } from '../services/GenderVerificationService';

export default function GenderVerificationScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const cameraRef = useRef(null);
  
  // Result dialog state
  const [resultDialog, setResultDialog] = useState({
    visible: false,
    title: '',
    message: '',
    type: '', // 'success', 'denied', 'review', 'error'
    result: null
  });

  useEffect(() => {
    if (permission === null) {
      requestPermission();
    }
  }, [permission]);

  const handleFacesDetected = ({ faces }) => {
    setFaceDetected(faces.length === 1);
  };

  const captureAndVerify = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    // Note: Face detection might not work on web, so we proceed anyway
    // The API will validate the photo quality and face presence
    
    try {
      setIsAnalyzing(true);

      // Capture photo
      console.log('📸 Capturing photo...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      console.log('✅ Photo captured:', photo.uri);
      setCapturedPhoto(photo);

      // Validate image
      console.log('🔍 Validating image...');
      const validation = validateCapturedImage(photo);
      if (!validation.valid) {
        console.log('❌ Validation failed:', validation.error);
        Alert.alert('Invalid Image', validation.error);
        setIsAnalyzing(false);
        setCapturedPhoto(null);
        return;
      }

      // Analyze gender
      console.log('🌐 Calling Face++ API...');
      const result = await analyzeFaceGender(photo.uri, photo.base64);

      console.log('📊 API Result:', JSON.stringify(result, null, 2));
      setIsAnalyzing(false);

      // Handle different results
      if (result.success && result.verified) {
        // Female verified - proceed to registration
        console.log('✅ FEMALE VERIFIED - Showing success dialog');
        setResultDialog({
          visible: true,
          title: '✅ Verification Successful',
          message: result.message || 'Welcome to Pad-Mini! You can now proceed with registration.',
          type: 'success',
          result: result
        });
      } else if (result.error === 'gender_mismatch') {
        // Male detected - deny access
        console.log('🚫 MALE DETECTED - Access denied');
        setResultDialog({
          visible: true,
          title: '🚫 Access Denied',
          message: result.message || 'This platform is exclusively for female college students. Access denied.',
          type: 'denied',
          result: result
        });
      } else if (result.requiresManualReview) {
        // Borderline case - needs manual review
        console.log('⏳ MANUAL REVIEW REQUIRED');
        setResultDialog({
          visible: true,
          title: '⏳ Manual Review Required',
          message: 'Your verification needs manual review. You can still register, but account activation may take 24-48 hours.',
          type: 'review',
          result: result
        });
      } else {
        // Other errors (no face, multiple faces, poor quality)
        console.log('⚠️ VERIFICATION ERROR:', result.error, result.message);
        setResultDialog({
          visible: true,
          title: 'Verification Failed',
          message: result.message || 'Unable to verify. Please try again.',
          type: 'error',
          result: result
        });
      }

    } catch (error) {
      setIsAnalyzing(false);
      setCapturedPhoto(null);
      console.error('❌ VERIFICATION ERROR:', error);
      console.error('Error stack:', error.stack);
      Alert.alert(
        'Verification Error',
        `Failed to verify: ${error.message}\n\nPlease check your internet connection and try again.`,
        [
          { text: 'Retry', onPress: () => setCapturedPhoto(null) },
          { text: 'Cancel', style: 'cancel', onPress: () => navigation.goBack() }
        ]
      );
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setIsAnalyzing(false);
  };

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Camera Permission Required</Title>
            <Paragraph style={styles.paragraph}>
              We need camera access to verify your gender for platform safety.
              This is a one-time verification.
            </Paragraph>
            <Button 
              mode="contained" 
              onPress={requestPermission}
              style={styles.button}
            >
              Grant Permission
            </Button>
            <Button 
              mode="text" 
              onPress={() => navigation.goBack()}
              style={styles.button}
            >
              Go Back
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Instructions Card */}
      <Card style={styles.instructionsCard}>
        <Card.Content>
          <Title style={styles.title}>Gender Verification</Title>
          <Paragraph style={styles.paragraph}>
            🔒 This platform is exclusively for female college students.
          </Paragraph>
          <Paragraph style={styles.paragraph}>
            📸 Please position your face in the frame. We'll verify your gender using facial recognition.
          </Paragraph>
          <Paragraph style={styles.instructionText}>
            {faceDetected ? '✅ Face detected - Ready to capture!' : '💡 Tip: Face detection may not work on web. Click "Capture & Verify" when ready.'}
          </Paragraph>
        </Card.Content>
      </Card>

      {/* Camera or Captured Photo */}
      <Surface style={styles.cameraContainer}>
        {capturedPhoto ? (
          <View style={styles.photoPreview}>
            <Image 
              source={{ uri: capturedPhoto.uri }} 
              style={styles.previewImage}
            />
            {isAnalyzing && (
              <View style={styles.analyzingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Paragraph style={styles.analyzingText}>
                  Analyzing...
                </Paragraph>
              </View>
            )}
          </View>
        ) : (
          <CameraView
            ref={cameraRef}
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
              <View style={[
                styles.faceFrame,
                faceDetected && styles.faceFrameDetected
              ]} />
            </View>
          </CameraView>
        )}
      </Surface>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {capturedPhoto ? (
          <>
            <Button
              mode="outlined"
              onPress={retakePhoto}
              disabled={isAnalyzing}
              style={styles.button}
            >
              Retake Photo
            </Button>
            {isAnalyzing && (
              <Paragraph style={styles.analyzingInfo}>
                Please wait while we verify...
              </Paragraph>
            )}
          </>
        ) : (
          <Button
            mode="contained"
            onPress={captureAndVerify}
            disabled={isAnalyzing}
            style={styles.button}
            icon="camera"
          >
            Capture & Verify
          </Button>
        )}
        
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          disabled={isAnalyzing}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
      </View>

      {/* Privacy Notice */}
      <Card style={styles.privacyCard}>
        <Card.Content>
          <Paragraph style={styles.privacyText}>
            🔐 Your photo is analyzed securely and not stored permanently. 
            We only save verification status, not images.
          </Paragraph>
        </Card.Content>
      </Card>

      {/* Result Dialog */}
      <Portal>
        <Dialog 
          visible={resultDialog.visible} 
          onDismiss={() => setResultDialog({ ...resultDialog, visible: false })}
        >
          <Dialog.Title style={styles.dialogTitle}>{resultDialog.title}</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={styles.dialogMessage}>{resultDialog.message}</Paragraph>
            
            {resultDialog.type === 'success' && resultDialog.result && (
              <View style={styles.resultDetails}>
                <Paragraph style={styles.resultText}>
                  ✓ Gender: {resultDialog.result.gender}
                </Paragraph>
                <Paragraph style={styles.resultText}>
                  ✓ Confidence: {resultDialog.result.confidence?.toFixed(1)}%
                </Paragraph>
              </View>
            )}
            
            {resultDialog.type === 'review' && resultDialog.result && (
              <View style={styles.resultDetails}>
                <Paragraph style={styles.resultText}>
                  Confidence: {resultDialog.result.confidence?.toFixed(1)}%
                </Paragraph>
                <Paragraph style={styles.resultText}>
                  Status: Pending Review
                </Paragraph>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            {resultDialog.type === 'success' && (
              <Button 
                mode="contained"
                onPress={() => {
                  setResultDialog({ ...resultDialog, visible: false });
                  navigation.navigate('Register', { 
                    genderVerified: true,
                    verificationData: {
                      gender: resultDialog.result.gender,
                      confidence: resultDialog.result.confidence,
                      verificationPhoto: capturedPhoto?.uri
                    }
                  });
                }}
              >
                Continue to Register
              </Button>
            )}
            
            {resultDialog.type === 'denied' && (
              <Button 
                mode="contained"
                onPress={() => {
                  setResultDialog({ ...resultDialog, visible: false });
                  setCapturedPhoto(null);
                  navigation.goBack();
                }}
              >
                Go Back
              </Button>
            )}
            
            {resultDialog.type === 'review' && (
              <>
                <Button 
                  onPress={() => {
                    setResultDialog({ ...resultDialog, visible: false });
                    setCapturedPhoto(null);
                  }}
                >
                  Retake Photo
                </Button>
                <Button 
                  mode="contained"
                  onPress={() => {
                    setResultDialog({ ...resultDialog, visible: false });
                    navigation.navigate('Register', { 
                      genderVerified: true,
                      pendingReview: true,
                      verificationData: {
                        gender: resultDialog.result.gender,
                        confidence: resultDialog.result.confidence,
                        verificationPhoto: capturedPhoto?.uri
                      }
                    });
                  }}
                >
                  Continue Anyway
                </Button>
              </>
            )}
            
            {resultDialog.type === 'error' && (
              <Button 
                mode="contained"
                onPress={() => {
                  setResultDialog({ ...resultDialog, visible: false });
                  setCapturedPhoto(null);
                }}
              >
                Try Again
              </Button>
            )}
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  instructionsCard: {
    marginBottom: 16,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    marginBottom: 8,
    color: theme.colors.text,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    color: theme.colors.primary,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    marginBottom: 16,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceFrame: {
    width: 280,
    height: 380,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 190,
  },
  faceFrameDetected: {
    borderColor: '#4CAF50',
  },
  photoPreview: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 12,
  },
  cancelButton: {
    marginTop: 8,
  },
  analyzingInfo: {
    textAlign: 'center',
    color: theme.colors.primary,
    fontSize: 14,
    marginTop: 8,
  },
  privacyCard: {
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  privacyText: {
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'center',
  },
  card: {
    padding: 16,
    elevation: 4,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dialogMessage: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  resultDetails: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
});
