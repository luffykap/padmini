# Testing Bypass Feature

## 🔓 Verification Bypass for Testing

A **"Skip Verification (Testing)"** button has been added to the VerificationScreen to allow quick access to the Home screen during development and testing.

---

## 📍 Location

**File:** `src/screens/VerificationScreen.js`

**Where:** On the camera verification screen, below the "Verify Identity" button

---

## 🎯 How to Use

1. **Start the app:**
   ```bash
   npm start
   ```

2. **Register or login** with your account

3. **On the Verification Screen:**
   - You'll see the camera view with face detection
   - At the bottom, there are now **2 buttons:**
     - ✅ **"Verify Identity"** - Normal verification (requires face detection)
     - ⚠️ **"Skip Verification (Testing)"** - Bypass button (orange outline)

4. **Click "Skip Verification (Testing)":**
   - A confirmation dialog appears
   - Click **"Skip & Go Home"**
   - You're instantly taken to the Home screen without face verification!

---

## ✅ What It Does

When you click the bypass button:

1. **Marks account as verified** in Firestore
2. **Sets verification method** to `'bypassed_for_testing'`
3. **Navigates directly to Home** screen
4. **No camera/face detection required** 

---

## ⚙️ Technical Details

```javascript
// Added function in VerificationScreen.js
const handleBypassVerification = async () => {
  Alert.alert(
    'Skip Verification',
    'Are you sure you want to skip face verification? This is for testing only.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Skip & Go Home',
        onPress: async () => {
          await updateVerification({
            verified: true,
            verificationDate: new Date().toISOString(),
            verificationMethod: 'bypassed_for_testing',
            verificationPhoto: 'bypassed'
          });
          navigation.replace('Home');
        }
      }
    ]
  );
};
```

---

## 🎨 Button Styling

- **Orange outline** border (warning color)
- **Below main verification button**
- **Visible at all times** on camera screen
- **Clear labeling** "(Testing)" to indicate it's for development

---

## 🚨 Important Notes

### **For Development Only**
- This button is for **testing and development** purposes
- Should be **removed or disabled** before production deployment

### **Security Considerations**
- Bypassed accounts are marked with `verificationMethod: 'bypassed_for_testing'`
- You can filter these out in production Firestore rules
- Consider adding environment-based visibility:
  ```javascript
  {__DEV__ && (
    <Button onPress={handleBypassVerification}>
      Skip Verification (Testing)
    </Button>
  )}
  ```

---

## 🔧 To Remove for Production

**Option 1: Delete the button entirely**
```javascript
// Remove these lines from VerificationScreen.js:
<Button
  mode="outlined"
  onPress={handleBypassVerification}
  style={[styles.captureButton, styles.bypassButton]}
  labelStyle={{ color: theme.colors.warningOrange }}
>
  Skip Verification (Testing)
</Button>
```

**Option 2: Make it development-only**
```javascript
{__DEV__ && (
  <Button
    mode="outlined"
    onPress={handleBypassVerification}
    style={[styles.captureButton, styles.bypassButton]}
  >
    Skip Verification (Testing)
  </Button>
)}
```

---

## ✅ Testing Checklist

- [x] Bypass button appears on verification screen
- [x] Clicking shows confirmation dialog
- [x] Confirming navigates to Home screen
- [x] User is marked as verified in Firestore
- [x] Home screen loads with user data
- [x] No camera permissions required when bypassing

---

## 🎉 Quick Test Flow

```bash
1. npm start
2. Open app
3. Register new user
4. See verification screen
5. Click "Skip Verification (Testing)"
6. Confirm dialog
7. ✅ You're on Home screen!
```

---

**Happy Testing! 🚀**
