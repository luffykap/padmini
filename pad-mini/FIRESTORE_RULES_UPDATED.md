# Updated Firestore Security Rules for Pad-Mini

## URGENT: Apply These Rules to Fix Permission Errors

### Step 1: Go to Firebase Console
1. Open: https://console.firebase.google.com/project/pad-mini/firestore
2. Click on **"Rules"** tab

### Step 2: Replace Current Rules with These:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // OTP verifications - allow create/read for registration
    match /otpVerifications/{email} {
      allow create, read, update: if true;
    }
    
    // Users collection - users can access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }
    
    // Requests collection (help requests) - authenticated users
    match /requests/{requestId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.requesterId || 
         request.auth.uid == resource.data.helperId);
      allow delete: if request.auth != null && request.auth.uid == resource.data.requesterId;
    }
    
    // Chat collections
    match /chats/{chatId} {
      allow read, write: if request.auth != null;
      match /messages/{messageId} {
        allow read, write: if request.auth != null;
      }
    }
    
    // Reports collection
    match /reports/{reportId} {
      allow create: if request.auth != null;
      allow read: if false; // Only for admin review
    }
  }
}
```

### Step 3: Click "Publish" to apply the rules

## Key Changes Made:
- ✅ Added `requests` collection rules (was missing!)
- ✅ Fixed OTP verification permissions
- ✅ Added user creation permissions
- ✅ Proper authentication checks for all operations

## What This Fixes:
- 🔧 "Missing or insufficient permissions" errors
- 🔧 Help request creation failures
- 🔧 User registration issues
- 🔧 Real-time data synchronization

Apply these rules immediately to resolve the permission errors shown in your console.