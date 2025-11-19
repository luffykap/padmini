# 🔒 URGENT: Fix Firestore Security Rules

## ❌ Current Errors:

1. **"Missing or insufficient permissions"** when accepting requests
2. **Firestore 400 errors** when creating chat rooms
3. **OTP registration failing** (if applicable)

---

## ✅ Quick Fix:

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

## ✅ Better Rules (Balanced Security):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function
    function isSignedIn() {
      return request.auth != null;
    }
    
    // OTPs - needed for registration
    match /otps/{otpId} {
      allow read, create: if true; // Anyone can verify OTPs
    }
    
    // Users - can read others, write own
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && request.auth.uid == userId;
    }
    
    // Requests - authenticated users can read/write
    match /requests/{requestId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      // Allow update if user is requester OR helper
      allow update: if isSignedIn() && (
        resource.data.requesterId == request.auth.uid ||
        request.resource.data.acceptedBy == request.auth.uid ||
        resource.data.acceptedBy == request.auth.uid
      );
      allow delete: if isSignedIn() && resource.data.requesterId == request.auth.uid;
    }
    
    // Chats - participants only
    match /chats/{chatId} {
      allow read, write: if isSignedIn() && (
        request.auth.uid in resource.data.participants ||
        request.auth.uid in request.resource.data.participants
      );
      allow create: if isSignedIn(); // Anyone can create when accepting request
      
      match /messages/{messageId} {
        allow read, create: if isSignedIn();
      }
    }
    
    // Notifications
    match /notifications/{notifId} {
      allow read, write: if isSignedIn();
    }
  }
}
```

---

## 🚀 After You Update Rules:
1. Refresh your app: http://localhost:8082
2. Try the OTP registration again
3. Check console for "OTP data stored in Firestore successfully"

The OTP will be shown in both the console log AND the success message for testing!