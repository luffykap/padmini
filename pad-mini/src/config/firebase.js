import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyAh7Fp5DYi_6aAKQflC5crHaNVe0QzNUuY",
  authDomain: "pad-mini.firebaseapp.com",
  projectId: "pad-mini",
  storageBucket: "pad-mini.firebasestorage.app",
  messagingSenderId: "232025323671",
  appId: "1:232025323671:web:9a090f58a7db4d055191d2",
  measurementId: "G-6GNC08LY8R"
};

// VAPID key for Web Push notifications
export const vapidKey = "BDLchp3Z6JPNnEDtXNjj0xOjcpKtlr_edFe4jJ4Kdii7S3mGhsv7fAhFKS4S1GajD0v-vrcT_Mbv7g51TrRRU9I";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;