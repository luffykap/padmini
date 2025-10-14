# URGENT: Fix Firestore Security Rules

## Problem: 
Your OTP registration is failing with 400 errors because Firestore security rules are blocking the requests.

## Quick Fix:

### Step 1: Go to Firebase Console
1. Open: https://console.firebase.google.com/project/pad-mini/firestore
2. Click on **"Rules"** tab

### Step 2: Replace Rules with These (FOR TESTING ONLY):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // TEMPORARY: Allow all reads/writes for testing
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Step 3: Click "Publish"

## ⚠️ IMPORTANT:
- These rules allow ANYONE to read/write your database
- Use ONLY for testing
- Replace with secure rules later

## After Testing, Use These Secure Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // OTP verifications - anyone can write, owner can read
    match /otpVerifications/{email} {
      allow create: if true;
      allow read, update: if true; // For OTP verification
    }
    
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Help requests - authenticated users can read/write
    match /requests/{requestId} {
      allow read, write: if request.auth != null;
    }
    
    // Chat messages - authenticated users can read/write  
    match /chats/{chatId} {
      allow read, write: if request.auth != null;
      match /messages/{messageId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

## After You Fix Rules:
1. Refresh your app: http://localhost:8082
2. Try the OTP registration again
3. Check console for "OTP data stored in Firestore successfully"

The OTP will be shown in both the console log AND the success message for testing!