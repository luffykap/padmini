# TEMPORARY Firestore Rules for Testing

## URGENT: Apply These Rules to Fix All Permission Errors

These are **TEMPORARY** rules that allow full access for testing. Use only for debugging!

### Step 1: Go to Firebase Console
1. Open: https://console.firebase.google.com/project/pad-mini/firestore
2. Click on **"Rules"** tab

### Step 2: Replace ALL rules with these TEMPORARY ones:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // TEMPORARY: Allow all operations for testing
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Step 3: Click "Publish"

## ⚠️ IMPORTANT WARNING:
- These rules allow ANYONE to read/write your entire database
- Use ONLY for testing and debugging
- Never use in production
- Replace with secure rules after testing

## After Testing Works, Use These Secure Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // OTP verifications
    match /otpVerifications/{email} {
      allow create, read, update: if true;
    }
    
    // Users - own data only
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }
    
    // Requests - authenticated users
    match /requests/{requestId} {
      allow create, read: if request.auth != null;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.requesterId || 
         request.auth.uid == resource.data.helperId);
      allow delete: if request.auth != null && request.auth.uid == resource.data.requesterId;
    }
    
    // Chats - authenticated users
    match /chats/{chatId} {
      allow read, write: if request.auth != null;
      match /messages/{messageId} {
        allow read, write: if request.auth != null;
      }
    }
    
    // Reports
    match /reports/{reportId} {
      allow create: if request.auth != null;
    }
  }
}
```

## Next Steps:
1. Apply the temporary permissive rules above
2. Test creating and viewing requests
3. Once working, replace with secure rules
4. Test again to ensure secure rules work properly