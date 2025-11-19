# 🧪 Gender Verification - Quick Test Guide

## ⚡ Quick Setup (5 Minutes)

### 1. Get Face++ API Credentials
```
https://console.faceplusplus.com/register
→ Sign up (free)
→ Copy API Key & Secret
```

### 2. Update Config
Edit: `src/services/GenderVerificationService.js`
```javascript
facePlusPlus: {
  apiKey: 'paste-your-key-here',
  apiSecret: 'paste-your-secret-here',
}
```

### 3. Test It!
```bash
npm start
# Press 'w' for web
# Register → Verify face → See result!
```

---

## 📱 Test Scenarios

### ✅ Test 1: Female User (Should Pass)
```
1. Register with female.test@bit-bangalore.edu.in
2. Complete OTP
3. Take photo of female face
4. Result: ✓ Verified! → Home screen
```

### 🚫 Test 2: Male User (Should Fail)
```
1. Register with male.test@bit-bangalore.edu.in
2. Complete OTP
3. Take photo of male face
4. Result: 🚫 Access denied (female-only message)
```

### ⏳ Test 3: Low Confidence (Manual Review)
```
1. Take photo in poor lighting
2. or at an angle
3. Result: ⏳ Pending review message
```

### ⚠️ Test 4: No Face (Retry)
```
1. Take photo of wall/object
2. Result: ⚠️ "No face detected" → Retry
```

---

## 🎯 Expected API Response

### Female Detection:
```json
{
  "success": true,
  "gender": "Female",
  "confidence": 87.5,
  "faceQuality": 92.3,
  "verified": true,
  "message": "Gender verification successful!"
}
```

### Male Detection:
```json
{
  "success": false,
  "gender": "Male",
  "confidence": 91.2,
  "verified": false,
  "error": "gender_mismatch",
  "message": "This platform is exclusively for female college students."
}
```

---

## 🔧 Configuration Quick Reference

```javascript
// In GenderVerificationService.js

femaleConfidenceThreshold: 70,  
// 50-60: Lenient (more reviews)
// 70-80: Balanced ← Recommended
// 85-95: Strict (fewer false positives)

allowManualReview: true,
// true:  Borderline → admin review
// false: Borderline → reject immediately
```

---

## 🐛 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Failed to analyze face" | Check API credentials |
| "No face detected" | Better lighting, center face |
| "Poor quality" | Retake in bright area |
| API 403 error | Verify API key/secret correct |
| API 429 error | Rate limit hit (wait or upgrade) |

---

## 📊 Firestore Verification Data

After successful verification:
```javascript
users/abc123 {
  verified: true,
  verificationDate: "2025-10-15T10:30:00Z",
  verificationMethod: "face_gender_detection",
  gender: "Female",
  genderConfidence: 87.5,
  faceQuality: 92.3
}
```

After pending review:
```javascript
users/abc123 {
  verified: false,
  pendingReview: true,
  gender: "Female",
  genderConfidence: 65.0  // Below threshold
}
```

---

## 🚀 Production Checklist

- [ ] Real Face++ API credentials added
- [ ] Confidence threshold tested (70-80%)
- [ ] Tested with 10+ female users
- [ ] Tested male rejection works
- [ ] Bypass button removed/hidden
- [ ] Firestore rules updated
- [ ] Admin review process defined
- [ ] API usage monitored

---

## 💡 Pro Tips

1. **Test with real photos** on physical device (Expo Go)
2. **Good lighting** = better accuracy
3. **Front camera** works best
4. **Clear background** helps detection
5. **Monitor API usage** in Face++ dashboard

---

## 🆘 Need Help?

**Read full guide:** `GENDER_VERIFICATION_SETUP.md`

**Files to check:**
- `src/services/GenderVerificationService.js` - API logic
- `src/screens/VerificationScreen.js` - UI integration

**API Dashboard:** https://console.faceplusplus.com/

---

**Test it now - takes 5 minutes! 🎉**
