# Safe Support - Women-Only Emergency Support Platform

A React Native mobile application designed to create a safe, trusted community for female college students to request and provide emergency support.

## Project Status: ✅ COMPLETE

### Features Implemented
- ✅ User Registration & Verification with college email validation
- ✅ Face verification using Expo Camera and Face Detector
- ✅ Location-based emergency help requests
- ✅ Real-time nearby request matching  
- ✅ Private encrypted chat system with auto-deletion
- ✅ Safety controls (anonymous requests, block/report)
- ✅ Material Design UI with warm, safe color scheme
- ✅ Firebase backend integration ready

### Tech Stack
- **Frontend**: React Native + Expo SDK 51
- **UI Framework**: React Native Paper (Material Design)
- **Navigation**: React Navigation v6
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Real-time Features**: Firebase real-time listeners
- **Location**: Expo Location
- **Camera/Face Detection**: Expo Camera + Face Detector
- **Chat**: React Native Gifted Chat
- **State Management**: React Context API

### Development Setup
```bash
# Start development server
npm start

# Launch on web
npm run web

# Launch on iOS simulator  
npm run ios

# Launch on Android emulator
npm run android
```

### Firebase Configuration Required
Update `src/config/firebase.js` with your Firebase project credentials:
- Authentication (Email/Password)
- Firestore Database 
- Cloud Storage
- Push Notifications

### Security Features
- College email domain validation (.edu)
- Face verification for account creation
- Location privacy (approximate coordinates)
- End-to-end encrypted messaging
- Auto-deleting chats (24 hours)
- Community reporting system

### Production Deployment
- Replace placeholder assets in `/assets/` 
- Configure Firebase security rules
- Set up push notification certificates
- Test face verification accuracy
- Enable app store deployment

The app is ready for development and testing. All core features are implemented with proper error handling, security measures, and responsive design.
