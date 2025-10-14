# Safe Support - Women-Only Emergency Support Platform

A React Native mobile application designed to create a safe, trusted community for female college students to request and provide emergency support.

## 🌸 Features

- **Secure Registration**: College email verification with face recognition
- **Emergency Requests**: Quick help requests for sanitary products and other emergencies  
- **Location-Based Matching**: Connect with nearby verified helpers
- **Private Messaging**: End-to-end encrypted chat with auto-deletion
- **Privacy Controls**: Anonymous requests and safe meeting coordination
- **Safety First**: Block/report system and admin oversight

## 🛠 Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Firebase (Firestore, Auth, Storage)
- **UI Framework**: React Native Paper (Material Design)
- **Navigation**: React Navigation
- **Real-time Chat**: React Native Gifted Chat
- **Face Recognition**: Expo Face Detector
- **Maps**: React Native Maps

## 📱 Installation

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (Mac) or Android Studio
- Firebase project setup

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd safe-support
   npm install
   ```

2. **Configure Firebase:**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication, Firestore, and Storage
   - Update `src/config/firebase.js` with your config

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on device/simulator:**
   - Scan QR code with Expo Go app (iOS/Android)
   - Or press `i` for iOS simulator, `a` for Android emulator

## 🔧 Configuration

### Firebase Setup

1. **Authentication:**
   - Enable Email/Password authentication
   - Set up email verification

2. **Firestore Rules:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can only access their own data
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Help requests are visible to verified users from same college
       match /requests/{requestId} {
         allow read: if request.auth != null && 
           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.verified == true;
         allow write: if request.auth != null && request.auth.uid == resource.data.requesterId;
       }
     }
   }
   ```

3. **Storage Rules:**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /verification/{userId}/{allPaths=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
│   ├── WelcomeScreen.js
│   ├── RegisterScreen.js
│   ├── VerificationScreen.js
│   ├── HomeScreen.js
│   ├── RequestHelpScreen.js
│   ├── HelpResponseScreen.js
│   └── ChatScreen.js
├── config/             # App configuration
│   └── firebase.js
├── theme/              # UI theme and styling
│   └── theme.js
├── services/           # API and business logic
├── utils/              # Helper functions
└── context/            # React context providers
```

## 🚀 Building for Production

### Android

```bash
# Build APK
expo build:android

# Build AAB (recommended for Play Store)
expo build:android -t app-bundle
```

### iOS

```bash
# Build for App Store
expo build:ios
```

## 🔒 Security Features

- **Email Verification**: Only college domains accepted
- **Face Recognition**: Prevents fake registrations  
- **Location Privacy**: Approximate locations only
- **Auto-deleting Chats**: Messages removed after 24 hours
- **Report System**: Community moderation tools
- **End-to-end Encryption**: Secure communications

## 🎨 Design Guidelines

- **Colors**: Soft pink (#e91e63), lavender (#9c27b0), teal (#4dd0e1)
- **Typography**: Clean, readable fonts with proper contrast
- **Accessibility**: Screen reader support, proper color contrast
- **User Experience**: Intuitive navigation, minimal steps for emergency requests

## 📖 API Documentation

### Key Services

- `AuthService`: User registration, login, verification
- `RequestService`: Create, accept, manage help requests  
- `ChatService`: Real-time messaging with encryption
- `LocationService`: Safe location sharing and matching
- `NotificationService`: Push notifications for requests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Contact the development team
- Check the documentation wiki

---

**Note**: This app is designed specifically for women's safety and should only be used within trusted college communities with proper verification systems in place.