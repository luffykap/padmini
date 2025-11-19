# Pad-Mini Project Development Flow

This document outlines the recommended step-by-step approach to building the Pad-Mini women's safety app from scratch.

---

## 📊 Project Timeline Overview

**Total Estimated Time:** ~120-140 hours (3-4 weeks full-time)

### Phase Breakdown:
1. **Setup** (4.5 hours) - Project initialization, Firebase, folder structure
2. **Authentication** (11 hours) - User registration and login system
3. **Email Verification** (8 hours) - OTP generation and validation
4. **Face Verification** (13.5 hours) - Gender-based access control
5. **Core Features** (24 hours) - Help requests, location, matching
6. **Chat System** (14 hours) - Real-time messaging
7. **Privacy & Safety** (10 hours) - Security features
8. **UI/UX Polish** (10 hours) - Loading, errors, animations
9. **Testing** (18 hours) - Unit, integration, manual tests
10. **Deployment** (13 hours) - Production builds and store submission
11. **Documentation** (8 hours) - README, architecture, guides
12. **Optional Enhancements** (19 hours) - Notifications, ratings, analytics

---

## 🎯 Development Phases

### **Phase 1: Setup & Foundation** (Week 1, Days 1-2)

#### 1.1 Project Initialization (2h)
```bash
npx create-expo-app pad-mini
cd pad-mini
npm install @react-navigation/native @react-navigation/stack
npm install react-native-paper react-native-safe-area-context
```
- Setup Expo project
- Install navigation and UI libraries
- Configure package.json

#### 1.2 Firebase Setup (1h)
- Create Firebase project at console.firebase.google.com
- Enable Email/Password Authentication
- Create Firestore database
- Enable Firebase Storage
- Copy config to `src/config/firebase.js`

#### 1.3 Project Structure (30m)
```
src/
├── screens/       # All screen components
├── services/      # Business logic and Firebase
├── components/    # Reusable UI components
├── context/       # React Context providers
├── config/        # Configuration files
├── theme/         # Design system
└── utils/         # Helper functions
```

#### 1.4 Theme Configuration (1h)
- Create `src/theme/theme.js`
- Define color palette (pink, lavender, teal)
- Setup React Native Paper theme
- Define typography and spacing

---

### **Phase 2: Authentication System** (Week 1, Days 2-3)

#### 2.1 Welcome Screen (2h)
- Landing page with app branding
- "Get Started" button → Registration
- "Sign In" link → Login dialog
- Gradient background

#### 2.2 Basic Auth Service (2h)
```javascript
// src/services/AuthService.js
- signUp(email, password)
- signIn(email, password)
- signOut()
- getCurrentUser()
```

#### 2.3 Auth Context (2h)
- Create `AuthContext.js` for global auth state
- Manage user, loading, error states
- Auto-navigate based on auth/verification status

#### 2.4 Registration Screen (3h)
- Full name input
- College email validation (`@college.edu`)
- Password creation with strength meter
- Terms acceptance checkbox

---

### **Phase 3: Email Verification** (Week 1, Day 4)

#### 3.1 OTP Generation (2h)
- Generate 6-digit random code
- Store in Firestore `/otps/{uid}`
- Set 10-minute expiry timestamp
- Console log OTP for development

#### 3.2 EmailJS Integration (1h) - **Optional**
- Create EmailJS account
- Connect Gmail service
- Create OTP email template
- Configure `src/config/emailjs.js`

#### 3.3 OTP Verification Screen (3h)
- 6-digit OTP input fields
- Resend OTP button (rate-limited)
- Timer countdown display
- Validation and error handling

#### 3.4 Email Verification Logic (2h)
- Validate OTP against Firestore
- Check expiry timestamp
- Update user profile: `otpVerified: true`
- Navigate to face verification

---

### **Phase 4: Face & Gender Verification** (Week 1-2, Days 5-6)

#### 4.1 Camera Permissions (1h)
- Request camera access
- Handle permission denial gracefully
- Show permission rationale dialog

#### 4.2 Face Detection Setup (2h)
```bash
expo install expo-camera expo-face-detector
```
- Configure expo-face-detector
- Detect single face in frame
- Real-time feedback overlay

#### 4.3 Gender Verification Service (4h)
**Option A: API Integration**
- Face++ API or AWS Rekognition
- Send captured image for gender analysis
- Parse and validate response

**Option B: ML Model**
- TensorFlow.js face gender model
- Local inference (better privacy)
- Fallback to manual review

#### 4.4 Verification Screen UI (3h)
- Front camera view
- Oval face frame overlay
- "Position face in frame" instruction
- Face detected indicator (green/red)
- Capture button

#### 4.5 Verification Flow (3h)
1. Capture photo when face detected
2. Send to gender verification service
3. Check result: female → approve, male → deny
4. Update Firestore: `verified: true, gender: 'female'`
5. Navigate to Home screen

#### 4.6 Testing Bypass (30m)
- Add "Skip Verification (Testing)" button
- Only show in development mode
- Direct navigation to Home for testing

---

### **Phase 5: Core Features** (Week 2, Days 1-3)

#### 5.1 Home Screen Layout (3h)
- Tab navigation: Nearby / My Requests / Chats
- User stats card (helped count, rating)
- FAB for creating new request
- Real-time updates indicator

#### 5.2 Request Service (4h)
```javascript
// src/services/RequestService.js
- createRequest(data)
- getNearbyRequests(location, radius)
- acceptRequest(requestId, helperId)
- completeRequest(requestId)
- Real-time listeners with onSnapshot
```

#### 5.3 Location Integration (2h)
```bash
expo install expo-location
```
- Request location permissions
- Get current coordinates
- Calculate distance between points
- Privacy: use approximate coordinates

#### 5.4 Request Help Screen (4h)
- Help type selector (pads, emergency, other)
- Description textarea
- Urgency level (low, medium, high)
- Anonymous option toggle
- Location preview (optional map)
- Submit button

#### 5.5 Nearby Requests Feed (4h)
- Real-time list of open requests
- Distance indicator (0.5 km away)
- Time ago (2 mins ago)
- Help type badge
- Filter by urgency
- Pull to refresh

#### 5.6 Request Accept Flow (3h)
- "I can help" button
- Confirm dialog
- Update request status: `accepted`
- Notify requester
- Create chat room
- Navigate to chat

---

### **Phase 6: Chat System** (Week 2, Days 4-5)

#### 6.1 Chat Service (3h)
```javascript
// src/services/ChatService.js
- createChat(requestId, userAId, userBId)
- sendMessage(chatId, message)
- subscribeToMessages(chatId, callback)
- deleteChat(chatId) // After 24h
```

#### 6.2 Gifted Chat Integration (2h)
```bash
npm install react-native-gifted-chat
```
- Configure GiftedChat component
- Custom message bubbles
- Typing indicators
- Image sharing (optional)

#### 6.3 Chat Screen (4h)
- Real-time message sync
- User avatars and names
- Timestamp display
- Message status (sent, delivered)
- Keyboard handling

#### 6.4 Chat Encryption (3h) - **Optional**
- End-to-end encryption with crypto-js
- Encrypt before sending
- Decrypt on receive
- Store encrypted in Firestore

#### 6.5 Auto-Delete Messages (2h)
- Cloud Function or client-side logic
- Delete messages after 24 hours
- Delete entire chat after completion + 24h
- Notification before deletion

---

### **Phase 7: Privacy & Safety** (Week 3, Days 1-2)

#### 7.1 Anonymous Requests (2h)
- Toggle in request creation form
- Hide requester name/photo
- Show as "Anonymous User"
- Still track internally for safety

#### 7.2 Block/Report System (3h)
- Block user button in chat
- Report inappropriate behavior
- Store reports in Firestore
- Admin review dashboard (future)

#### 7.3 Location Privacy (2h)
- Round coordinates to 2 decimal places
- Show approximate area only
- Meeting coordination via chat
- Never expose exact home location

#### 7.4 Firestore Security Rules (3h)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Requests visible to verified, same-college users
    match /requests/{requestId} {
      allow read: if isVerifiedAndSameCollege();
      allow create: if isVerified();
      allow update: if isOwnerOrHelper();
    }
    
    // Messages only visible to chat participants
    match /chats/{chatId}/messages/{messageId} {
      allow read, write: if isChatParticipant(chatId);
    }
  }
}
```

---

### **Phase 8: UI/UX Polish** (Week 3, Day 3)

#### 8.1 Loading States (2h)
- Skeleton screens for lists
- Spinner for async operations
- Progress indicators
- Disable buttons during loading

#### 8.2 Error Handling (3h)
- User-friendly error messages
- Retry mechanisms
- Offline detection
- Network error handling

#### 8.3 Pull to Refresh (1h)
- Add RefreshControl to all ScrollViews
- Reload data from Firestore
- Update cache
- Success feedback

#### 8.4 Animations (2h)
- Fade in/out transitions
- Slide animations for modals
- Button press feedback
- List item animations

#### 8.5 Accessibility (2h)
- Screen reader labels
- Color contrast (WCAG AA)
- Focus management
- Keyboard navigation

---

### **Phase 9: Testing** (Week 3, Days 4-5)

#### 9.1 Unit Tests (4h)
```bash
npm install --save-dev jest @testing-library/react-native
```
- Test AuthService methods
- Test RequestService CRUD
- Test utility functions
- Mock Firebase calls

#### 9.2 Integration Tests (4h)
- Test registration flow end-to-end
- Test request creation → accept → chat
- Test OTP verification flow
- Test error scenarios

#### 9.3 Manual Testing (4h)
- Web browser testing
- Android device/emulator
- iOS simulator (if Mac)
- Different user scenarios
- Edge cases

#### 9.4 Bug Fixes (6h)
- Fix issues from testing
- Handle edge cases
- Performance optimization
- Memory leak checks

---

### **Phase 10: Deployment** (Week 4, Days 1-2)

#### 10.1 Environment Config (2h)
- Separate Firebase projects (dev/prod)
- Environment variables
- API keys management
- Production vs development flags

#### 10.2 Production Build (2h)
```json
// app.json
{
  "expo": {
    "name": "Pad-Mini",
    "slug": "pad-mini",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png"
    }
  }
}
```
- Design app icon
- Create splash screen
- Configure app.json

#### 10.3 Android Build (2h)
```bash
eas build --platform android
```
- Setup EAS Build
- Generate APK for testing
- Generate AAB for Play Store
- Test installation

#### 10.4 iOS Build (3h)
```bash
eas build --platform ios
```
- Apple Developer account required
- Configure provisioning profiles
- Generate IPA
- Test on TestFlight

#### 10.5 Store Submission (4h)
- Google Play Console setup
- App Store Connect setup
- Screenshots and descriptions
- Privacy policy
- Submit for review

---

### **Phase 11: Documentation** (Week 4, Day 3)

#### 11.1 README (2h)
- Project overview
- Installation instructions
- Running locally
- Environment setup
- Contributing guidelines

#### 11.2 Architecture Docs (2h)
- System diagram (already created!)
- Data flow diagrams
- Firebase schema
- Service layer explanation

#### 11.3 API Documentation (2h)
- Document all service methods
- Parameter descriptions
- Return types
- Usage examples

#### 11.4 User Guide (2h)
- How to register
- How to request help
- How to offer help
- Safety tips
- FAQ

---

### **Phase 12: Optional Enhancements** (Post-Launch)

#### 12.1 Push Notifications (4h)
- Firebase Cloud Messaging
- Notify when request accepted
- Notify when new message
- In-app notification settings

#### 12.2 In-App Rating (3h)
- Rate helper after completion
- 5-star rating system
- Optional comment
- Display average rating

#### 12.3 Analytics (2h)
- Firebase Analytics
- Track user actions
- Conversion funnels
- Crash reporting

#### 12.4 Offline Support (6h)
- Cache recent requests
- Queue messages when offline
- Sync when back online
- Offline indicator

#### 12.5 Multi-Language (4h)
- i18n library integration
- Support Hindi, English, etc.
- RTL support
- Language selector

---

## 📈 Critical Path

**Must-Have for MVP:**
1. Setup → Auth → Email Verification → Face Verification → Core Features → Chat

**Can Be Added Later:**
- Encryption, analytics, notifications, ratings, offline support

**Development vs Production:**
- Dev: Console OTP, verification bypass, relaxed security
- Prod: Email OTP, strict verification, hardened Firestore rules

---

## 🚀 Quick Start Checklist

- [ ] Phase 1: Setup (0.5 day)
- [ ] Phase 2: Auth (1 day)
- [ ] Phase 3: Email Verification (1 day)
- [ ] Phase 4: Face Verification (2 days)
- [ ] Phase 5: Core Features (3 days)
- [ ] Phase 6: Chat (2 days)
- [ ] Phase 7: Privacy (1.5 days)
- [ ] Phase 8: Polish (1 day)
- [ ] Phase 9: Testing (2 days)
- [ ] Phase 10: Deployment (2 days)
- [ ] Phase 11: Documentation (1 day)

**Total: ~17 days** (3.5 weeks with buffer)

---

## 💡 Pro Tips

1. **Start with web browser** for fast development
2. **Use Firebase emulator** for local testing
3. **Implement feature flags** for gradual rollout
4. **Test on real devices** early and often
5. **Get user feedback** before full launch
6. **Have a rollback plan** for production issues

**Good luck building Pad-Mini! 🌸**
