# Firebase Setup Guide for Safe Support

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name: "Safe Support" 
4. Enable Google Analytics (recommended)
5. Choose your analytics account

## Step 2: Enable Authentication

1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** authentication by clicking on it and toggling "Enable"
3. **Advanced Settings** (click the gear icon ⚙️ next to Email/Password):
   - **Email enumeration protection**: Enable this toggle
4. **Email verification** is handled in code, not in Firebase console settings
   - Our app automatically sends verification emails when users register
   - Users must verify their email before full access (implemented in AuthService.js)

### 📍 Firebase Console Navigation Help:
- **Authentication**: Left sidebar → "Authentication" 
- **Sign-in method**: Top tabs → "Sign-in method" (not "Users")
- **Email/Password**: In the providers list → click "Email/Password" row
- **Advanced Settings**: Small gear icon ⚙️ appears when you enable Email/Password
- **Templates**: Go to "Templates" tab to customize verification email design (optional)

## Step 3: Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Start in **test mode** (we'll add security rules later)
3. **Choose location for Indian users:**
   - **Recommended**: `asia-south1` (Mumbai) - Best for India
   - **Alternative**: `asia-southeast1` (Singapore) - Good for South Asia
   - **Note**: Location cannot be changed later, so choose carefully!

## Step 4: Enable Storage (Optional - Has Costs!)

⚠️ **Firebase Storage Pricing:**
- **Free tier**: 1GB storage + 10GB/month downloads
- **Paid**: $0.026/GB/month storage + $0.12/GB download
- **For face verification photos**: Could cost $5-50/month depending on usage

**Options:**
1. **Skip Storage** (Recommended for MVP):
   - Disable face verification feature temporarily
   - Use text-based verification instead
   - Add Storage later when you have budget

2. **Enable Storage** (If you have budget):
   - Go to **Storage** → **Get started** 
   - Start in **test mode**
   - Monitor usage in Firebase Console

3. **Alternative**: Use free image hosting like Cloudinary (5GB free)

## Step 5: Get Configuration Keys

1. Go to **Project Settings** → **General**
2. Scroll to "Your apps" section
3. **For React Native/Expo apps, choose "Web app"** (not Android/iOS)
   - **Why Web?** React Native uses JavaScript, same as web
   - **Expo apps** use web config even when running on mobile
   - **Same config** works for web, iOS, and Android versions
4. Click **"Web app"** → Register app: "Safe Support Web"
5. Copy the configuration object that appears

## Step 6: Update Firebase Config

Replace the placeholder config in `src/config/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## Step 7: Set Up Firestore Security Rules

Go to **Firestore** → **Rules** and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        resource.data.college == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.college;
    }
    
    // Help requests visible to verified users from same college
    match /requests/{requestId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.verified == true;
      allow create: if request.auth != null && 
        request.auth.uid == resource.data.requesterId;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.requesterId || 
         request.auth.uid == resource.data.acceptedBy);
    }
    
    // Chat messages only accessible to participants
    match /chats/{chatId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      
      match /messages/{messageId} {
        allow read, write: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      }
    }
  }
}
```

## Step 8: Storage Rules (SKIPPED - Not Using Storage)

**We're not using Firebase Storage** to avoid costs, so skip this step:
- ❌ No face verification photos
- ❌ No profile picture storage  
- ✅ Using text-based verification instead
- ✅ Saves $5-50/month in storage costs

If you decide to add Storage later, you can find the rules in the original guide.

## Step 9: Enable Push Notifications (Optional)

1. Go to **Project Settings** → **Cloud Messaging**
2. Generate **Web Push Certificates**
3. Add the certificate to your app

## Step 10: Test the Setup

1. Save your Firebase config
2. Restart the Expo development server
3. Try registering a new user
4. Check Firebase Console for:
   - New user in Authentication
   - User profile in Firestore
   - Verification photo in Storage

## Production Checklist

Before deploying:
- [ ] Switch Firestore to production mode
- [ ] Review and tighten security rules  
- [ ] Set up proper email verification templates
- [ ] Configure custom domain for auth
- [ ] Set up monitoring and alerts
- [ ] Test all security rules thoroughly
- [ ] **Budget planning**: Monitor Firebase usage and costs
- [ ] **Storage costs**: Estimate photo storage needs vs budget

## 💰 Firebase Pricing Breakdown

**Free Forever:**
- ✅ Authentication: 50,000 MAU (Monthly Active Users)
- ✅ Firestore: 50,000 reads + 20,000 writes + 1GB storage per day
- ✅ Hosting: 10GB storage + 360MB/day transfer

**Paid Services:**
- ❌ Storage: $0.026/GB/month + download costs
- ❌ Cloud Functions: Pay per invocation after free tier
- ❌ Advanced features: Analytics, A/B testing (enterprise)

## Troubleshooting

**Common Issues:**
- **Permission denied**: Check Firestore security rules
- **Network error**: Verify API keys and project ID
- **Email not sending**: Check Authentication settings
- **Face verification failing**: Ensure proper camera permissions

**Authentication Setup Issues:**
- **Can't find Email/Password**: Make sure you're in "Sign-in method" tab, not "Users" tab
- **No gear icon**: The gear ⚙️ only appears AFTER you enable Email/Password
- **Email verification not working**: 
  - Check spam folder
  - Verify your Firebase project has email sending enabled
  - Go to Authentication → Templates to customize email content
- **"Email enumeration protection"**: This prevents attackers from discovering valid emails

**Firebase Console Tips:**
- Use Chrome/Firefox for best compatibility
- Clear browser cache if Firebase console seems broken
- Make sure you're signed in with the correct Google account

**Why "Web App" for Mobile Apps?**
- **React Native = JavaScript**: Uses same config as web apps
- **Expo framework**: Built on web technologies, uses web config
- **Universal config**: Same keys work for web, iOS, and Android
- **Don't use**: Android/iOS app configs (those are for native Java/Swift apps)
- **One config**: Simpler than managing separate iOS/Android configs

**Location Selection for Indian Colleges:**
- **asia-south1 (Mumbai)**: Lowest latency for users across India
- **asia-southeast1 (Singapore)**: Good backup option for South Asian region
- **Why location matters**: Affects app performance and data residency compliance
- **Cannot be changed**: Choose carefully as this is permanent for your project

Your Safe Support app will be fully functional once Firebase is configured! 🚀