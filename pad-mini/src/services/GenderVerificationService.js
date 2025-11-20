// Gender Detection Service for Face Verification
// Uses face-api.js (FREE, client-side, no API limits)

import * as faceapi from '@vladmandic/face-api';

// Configuration
const FACE_API_CONFIG = {
  // Gender detection thresholds
  femaleConfidenceThreshold: 0.5, // Minimum confidence (0-1) for female detection
  
  // Model loading
  modelsLoaded: false,
  modelPath: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/' // CDN for models
};

// Load face-api.js models (only once)
let modelsLoadedPromise = null;

const loadModels = async () => {
  if (FACE_API_CONFIG.modelsLoaded) return;
  
  if (!modelsLoadedPromise) {
    modelsLoadedPromise = (async () => {
      try {
        console.log('📦 Loading face-api.js models...');
        const modelPath = FACE_API_CONFIG.modelPath;
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
          faceapi.nets.ageGenderNet.loadFromUri(modelPath),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
        ]);
        
        FACE_API_CONFIG.modelsLoaded = true;
        console.log('✅ Face-api.js models loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load models:', error);
        modelsLoadedPromise = null;
        throw error;
      }
    })();
  }
  
  return modelsLoadedPromise;
};

/**
 * Analyze face image for gender detection using face-api.js
 * @param {string} imageUri - Local URI of the captured image
 * @param {string} base64Image - Base64 encoded image data
 * @returns {Promise<Object>} - Analysis result with gender, confidence, and verification status
 */
export const analyzeFaceGender = async (imageUri, base64Image) => {
  try {
    console.log('🔍 Starting face gender analysis with face-api.js (FREE)...');
    
    // Load models if not already loaded
    await loadModels();
    
    // Client-side detection (FREE, no API limits)
    return await analyzeFaceClientSide(base64Image);
  } catch (error) {
    console.error('Face analysis error:', error);
    throw new Error('Failed to analyze face. Please try again.');
  }
};

/**
 * Client-side analysis using face-api.js (FREE)
 */
const analyzeFaceClientSide = async (base64Image) => {
  try {
    console.log('🖼️ Analyzing face with face-api.js...');
    
    // Create image element from base64
    const img = await createImageFromBase64(base64Image);
    
    // Detect face with gender and age
    const detection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withAgeAndGender();
    
    if (!detection) {
      throw new Error('No face detected in the image. Please ensure your face is clearly visible.');
    }
    
    const { gender, genderProbability } = detection;
    const confidence = genderProbability * 100; // Convert to percentage
    
    console.log(`🎭 Detected gender: ${gender} (${confidence.toFixed(1)}% confidence)`);
    
    // Check if female with sufficient confidence
    const isFemale = gender === 'female';
    const isVerified = isFemale && genderProbability >= FACE_API_CONFIG.femaleConfidenceThreshold;
    
    return {
      success: true,
      verified: isVerified,
      gender: gender,
      confidence: confidence,
      genderProbability: genderProbability,
      age: Math.round(detection.age),
      message: isVerified 
        ? 'Gender verification successful! You are verified as female.'
        : isFemale
          ? `Gender detected as female, but confidence (${confidence.toFixed(1)}%) is below threshold. Please try again with better lighting.`
          : 'This app is exclusively for female students. Gender verification failed.',
      details: {
        faceDetected: true,
        detectionBox: detection.detection.box,
        landmarks: detection.landmarks ? 68 : 0
      }
    };
  } catch (error) {
    console.error('Client-side face analysis error:', error);
    throw error;
  }
};

/**
 * Create image element from base64 data (for web/React Native)
 */
const createImageFromBase64 = async (base64Image) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image'));
    img.src = `data:image/jpeg;base64,${base64Image}`;
  });
};

export const GenderVerificationService = {
  analyzeFaceGender,
  loadModels
};
