# Pad-Mini Architecture

This document provides a high-level view of the Pad-Mini app architecture, the main data flows, and how the codebase maps to the architecture.

---

## 🏗️ System Overview

```mermaid
flowchart LR
  subgraph Client[React Native App (Expo)]
    UI[React Native + React Native Paper]
    Nav[React Navigation]
    Ctx[Auth Context]
    Svc[Services Layer]
  end

  subgraph Firebase[Firebase Backend]
    Auth[Auth (Email/Password)]
    FS[(Firestore)]
    Storage[Storage]
    FCM[Cloud Messaging]
  end

  subgraph Integrations[External Services]
    EmailJS[EmailJS (OTP Email Delivery)]
    ExpoAPIs[Expo APIs (Camera, Location)]
  end

  UI --> Nav
  UI --> Ctx
  Ctx --> Svc
  Svc --> Auth
  Svc --> FS
  Svc --> Storage
  Svc --> FCM
  Svc -. optional .-> EmailJS
  UI --> ExpoAPIs
```

- Client app built with React Native (Expo) uses a Services layer to interact with Firebase.
- Firestore onSnapshot listeners provide real-time updates (requests, chats, statuses).
- EmailJS is optional for OTP email delivery (console OTP for dev).
- Expo APIs provide Camera (face detection), Location, etc.

---

## 🧭 Primary Flows

### 1) Registration + OTP + Verification

```mermaid
sequenceDiagram
  participant U as User
  participant App as Pad-Mini App
  participant Auth as Firebase Auth
  participant FS as Firestore
  participant Email as EmailJS (optional)

  U->>App: Register with college email
  App->>Auth: createUserWithEmailAndPassword
  Auth-->>App: uid
  App->>FS: users/{uid} (profile draft)
  App->>FS: otps/{uid} (code, expiry)
  alt Email delivery enabled
    App->>Email: send(otp_code, to_email)
    Email-->>U: OTP email
  else Dev mode
    App-->>U: Show OTP in console
  end
  U->>App: Submit OTP
  App->>FS: validate OTP
  App->>FS: mark users/{uid}.otpVerified = true
  U->>App: Face verify or Skip (testing)
  App->>FS: users/{uid}.verified = true
  App->>Nav: Navigate Home
```

### 2) Help Request → Accept → Chat

```mermaid
sequenceDiagram
  participant A as Requester (A)
  participant B as Helper (B)
  participant App as App (on both devices)
  participant FS as Firestore

  A->>App: Create Help Request
  App->>FS: requests/{requestId}
  FS-->>App: onSnapshot (nearby list updates)
  B->>App: Accept Request
  App->>FS: update requests/{id}.status = accepted, acceptedBy = B
  FS-->>App: onSnapshot (status updates to A)
  A->>App: Open Chat
  B->>App: Open Chat
  App->>FS: chats/{chatId}/messages (add message)
  FS-->>App: onSnapshot (real-time chat)
  A->>App: Mark Complete
  App->>FS: update requests/{id}.status = completed
```

---

## 🗃️ Firestore Data Model (Simplified)

```mermaid
erDiagram
  USERS ||--o{ REQUESTS : creates
  USERS ||--o{ CHATS : participates
  CHATS ||--o{ MESSAGES : contains

  USERS {
    string uid PK
    string fullName
    string email
    string college
    bool otpVerified
    bool verified
    string verificationMethod
    timestamp verificationDate
  }

  REQUESTS {
    string id PK
    string requesterId FK
    string helpType
    string description
    number lat
    number lng
    string urgency
    string status "open|accepted|completed"
    string acceptedBy FK
    timestamp createdAt
    bool isAnonymous
  }

  CHATS {
    string id PK
    string requestId FK
    string userAId FK
    string userBId FK
    timestamp createdAt
  }

  MESSAGES {
    string id PK
    string chatId FK
    string senderId FK
    string text
    timestamp createdAt
  }

  OTPS {
    string uid PK
    string code
    timestamp expiresAt
  }
```

---

## 📁 Code Map

- `App.js` / `src/index.js` – App bootstrap, navigation root
- `src/context/AuthContext.js` – Auth state, user profile, verification updates
- `src/services/AuthService.js` – Firebase Auth, OTP create/verify
- `src/services/RequestService.js` – Requests CRUD + listeners
- `src/services/ChatService.js` – Chats + messages listeners
- `src/screens/WelcomeScreen.js` – Landing + Sign-in dialog
- `src/screens/OTPRegisterScreen.js` – Registration + OTP steps
- `src/screens/VerificationScreen.js` – Face verify + testing bypass
- `src/screens/HomeScreen.js` – Feed, active requests, stats
- `src/screens/RequestHelpScreen.js` – Create help request
- `src/screens/HelpResponseScreen.js` – Accept/help flow
- `src/screens/ChatScreen.js` – Real-time chat (Gifted Chat)
- `src/config/firebase.js` – Firebase config/init
- `src/config/emailjs.js` – EmailJS config (optional)
- `src/theme/theme.js` – Material theme

---

## 🔄 Real-Time Listeners

- Nearby Requests: `RequestService.getNearbyRequests(..., onSnapshotCb)`
- My Requests: `RequestService.getUserRequests(..., onSnapshotCb)`
- Chat Messages: `ChatService.subscribeToMessages(chatId, onSnapshotCb)`
- Notifications: `NotificationService` (placeholder / extendable)

---

## 🔐 Security & Privacy

- College domain validation (e.g., `@bit-bangalore.edu.in`)
- OTP verification before activation
- Face verification step or explicit dev bypass
- Anonymous request option
- Encrypted chat with auto-deletion policy (24h)
- Firestore rules restrict access by user and college

---

## 🚀 Environments

- Dev: OTP shown in console, verification bypass available
- Prod: EmailJS enabled, camera verification required, stricter rules

---

## 🧭 Next Steps

- Add push notifications (FCM)
- Add proximity-based ranking for matches
- Harden Firestore rules for production
- Add background location permission flow (opt-in)
```
