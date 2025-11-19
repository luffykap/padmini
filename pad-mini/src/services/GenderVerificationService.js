// Gender Detection Service for Face Verification
// Uses Face++ API (free tier: 1000 calls/month) or Face-api.js (client-side)

import * as FileSystem from 'expo-file-system';

// Configuration
const FACE_API_CONFIG = {
  // Option 1: Face++ API (Recommended for production)
  facePlusPlus: {
    apiKey: 'HsgpzpJ0mdDg9RixHSdf-h1bwu2wxvMg', // Get from https://console.faceplusplus.com
    apiSecret: 'TO0QMLnSLC0hKE6kCQgFn1EfdyBAocuF', // Get from https://console.faceplusplus.com
    endpoint: 'https://api-us.faceplusplus.com/facepp/v3/detect'
  },
  
  // Option 2: Face-api.js (Client-side, no API key needed)
  // Will be loaded in the component
  useFaceApiJs: false, // Set to true to use client-side detection
  
  // Gender detection thresholds
  femaleConfidenceThreshold: 70, // Minimum confidence % for female detection
  allowManualReview: true // Allow admin review if confidence is borderline
};

/**
 * Analyze face image for gender detection
 * @param {string} imageUri - Local URI of the captured image
 * @param {string} base64Image - Base64 encoded image data
 * @returns {Promise<Object>} - Analysis result with gender, confidence, and verification status
 */
export const analyzeFaceGender = async (imageUri, base64Image) => {
  try {
    console.log('🔍 Starting face gender analysis...');
    
    if (FACE_API_CONFIG.useFaceApiJs) {
      // Client-side detection (recommended for privacy)
      return await analyzeFaceClientSide(imageUri);
    } else {
      // Server-side detection (more accurate)
      return await analyzeFaceWithAPI(base64Image);
    }
  } catch (error) {
    console.error('Face analysis error:', error);
    throw new Error('Failed to analyze face. Please try again.');
  }
};

/**
 * Server-side analysis using Face++ API
 */
const analyzeFaceWithAPI = async (base64Image) => {
  try {
    const formData = new FormData();
    formData.append('api_key', FACE_API_CONFIG.facePlusPlus.apiKey);
    formData.append('api_secret', FACE_API_CONFIG.facePlusPlus.apiSecret);
    formData.append('image_base64', base64Image);
    formData.append('return_attributes', 'gender,age,smiling,headpose,facequality');

    const response = await fetch(FACE_API_CONFIG.facePlusPlus.endpoint, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    if (!response.ok || data.error_message) {
      throw new Error(data.error_message || 'API request failed');
    }

    // Check if face was detected
    if (!data.faces || data.faces.length === 0) {
      return {
        success: false,
        error: 'No face detected',
        message: 'Please ensure your face is clearly visible and well-lit'
      };
    }

    if (data.faces.length > 1) {
      return {
        success: false,
        error: 'Multiple faces detected',
        message: 'Please ensure only one person is in the frame'
      };
    }

    const faceData = data.faces[0];
    const attributes = faceData.attributes;
    
    // Extract gender information
    const gender = attributes.gender.value; // 'Male' or 'Female'
    const confidence = parseFloat(attributes.gender.confidence);
    
    // Check face quality
    const faceQuality = attributes.facequality?.value || 100;
    
    console.log(`📊 Gender Detection: ${gender} (${confidence.toFixed(1)}% confidence)`);
    console.log(`📸 Face Quality: ${faceQuality.toFixed(1)}`);

    // Determine verification result
    const isFemale = gender === 'Female';
    const meetsConfidenceThreshold = confidence >= FACE_API_CONFIG.femaleConfidenceThreshold;
    const goodQuality = faceQuality > 70;

    if (isFemale && meetsConfidenceThreshold && goodQuality) {
      return {
        success: true,
        gender: 'Female',
        confidence: confidence,
        faceQuality: faceQuality,
        verified: true,
        message: 'Gender verification successful! Welcome to Pad-Mini.'
      };
    } else if (isFemale && !meetsConfidenceThreshold && FACE_API_CONFIG.allowManualReview) {
      return {
        success: false,
        gender: 'Female',
        confidence: confidence,
        requiresManualReview: true,
        message: `Verification needs manual review. Confidence: ${confidence.toFixed(1)}%`,
        pendingVerification: true
      };
    } else if (!isFemale) {
      return {
        success: false,
        gender: gender,
        confidence: confidence,
        verified: false,
        error: 'gender_mismatch',
        message: 'This platform is exclusively for female college students. Access denied.'
      };
    } else if (!goodQuality) {
      return {
        success: false,
        error: 'poor_quality',
        message: 'Image quality is too low. Please retake in better lighting.'
      };
    }

  } catch (error) {
    console.error('Face++ API error:', error);
    throw error;
  }
};

/**
 * Client-side analysis using face-api.js (privacy-focused)
 * Requires face-api.js models to be loaded
 */
const analyzeFaceClientSide = async (imageUri) => {
  // Note: This requires face-api.js library
  // Install: npm install face-api.js
  // Load models in App.js initialization
  
  try {
    // This is a placeholder - actual implementation would use face-api.js
    console.log('⚠️ Client-side gender detection requires face-api.js setup');
    
    // For now, return a simulated result
    // In production, you would:
    // 1. Load the image
    // 2. Detect faces
    // 3. Run gender classification model
    // 4. Return results
    
    return {
      success: false,
      error: 'not_implemented',
      message: 'Client-side detection not yet configured. Please use API-based detection.',
      requiresSetup: true
    };
  } catch (error) {
    console.error('Client-side analysis error:', error);
    throw error;
  }
};

/**
 * Validate captured image before analysis
 */
export const validateCapturedImage = (photo) => {
  if (!photo || !photo.uri) {
    return {
      valid: false,
      error: 'Invalid photo captured'
    };
  }

  // Check image dimensions (optional)
  if (photo.width < 400 || photo.height < 400) {
    return {
      valid: false,
      error: 'Image resolution too low. Please retake.'
    };
  }

  return { valid: true };
};

/**
 * Handle verification result and update user profile
 */
export const processVerificationResult = async (result, updateVerification) => {
  if (result.success && result.verified) {
    // Verification successful
    await updateVerification({
      verified: true,
      verificationDate: new Date().toISOString(),
      verificationMethod: 'face_gender_detection',
      gender: result.gender,
      genderConfidence: result.confidence,
      faceQuality: result.faceQuality
    });
    
    return {
      success: true,
      message: result.message,
      canProceed: true
    };
  } else if (result.requiresManualReview) {
    // Needs admin review
    await updateVerification({
      verified: false,
      pendingReview: true,
      verificationDate: new Date().toISOString(),
      verificationMethod: 'face_gender_detection_pending',
      gender: result.gender,
      genderConfidence: result.confidence
    });
    
    return {
      success: false,
      message: result.message,
      requiresManualReview: true
    };
  } else {
    // Verification failed
    return {
      success: false,
      message: result.message || 'Verification failed',
      error: result.error,
      canRetry: result.error !== 'gender_mismatch'
    };
  }
};

export default {
  analyzeFaceGender,
  validateCapturedImage,
  processVerificationResult,
  FACE_API_CONFIG
};
