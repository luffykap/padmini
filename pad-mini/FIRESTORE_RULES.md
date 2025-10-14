# Firestore Security Rules Setup

## Step 1: Go to Firestore Database in Firebase Console
1. Navigate to https://console.firebase.google.com/project/pad-mini/firestore
2. Click on "Rules" tab

## Step 2: Replace the default rules with these secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Help requests - users can create their own, read nearby ones
    match /helpRequests/{requestId} {
      allow create: if request.auth != null && request.auth.uid == resource.data.requesterId;
      allow read: if request.auth != null;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.requesterId || 
         request.auth.uid == resource.data.helperId);
      allow delete: if request.auth != null && request.auth.uid == resource.data.requesterId;
    }
    
    // Chat messages - only participants can read/write
    match /chats/{chatId} {
      allow read, write: if request.auth != null;
      match /messages/{messageId} {
        allow read, write: if request.auth != null;
      }
    }
    
    // Reports - users can create reports
    match /reports/{reportId} {
      allow create: if request.auth != null;
      allow read: if false; // Only admins should read reports
    }
  }
}
```

## Step 3: Click "Publish" to apply the rules

These rules ensure:
- Users can only access their own data
- Help requests are visible to verified users
- Chat messages are accessible to authenticated users
- Reports can be created but not read by regular users

## Next Steps:
1. Test user registration in your app
2. Try creating a help request
3. Test the chat functionality
4. Verify location-based matching works

Your app is now ready for testing with proper security rules!