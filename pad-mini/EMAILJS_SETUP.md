# 📧 EmailJS Setup Guide for Real OTP Email Delivery

This guide will help you set up real email delivery for OTP (One-Time Password) verification in Pad-Mini.

## 🌟 Why EmailJS?

- **No Backend Required**: Works directly from the browser
- **Free Tier**: 200 emails/month at no cost
- **Easy Setup**: Quick integration with Gmail
- **Secure**: Uses OAuth2 for Gmail authentication

## 🚀 Step-by-Step Setup

### 1. Create EmailJS Account

1. Go to **https://www.emailjs.com/**
2. Click **"Sign Up"** and create a free account
3. Verify your email address

### 2. Set up Gmail Service

1. In your EmailJS dashboard, click **"Email Services"**
2. Click **"Add New Service"**
3. Select **"Gmail"**
4. Click **"Connect Account"** and authorize with your Gmail
5. **Copy the Service ID** (looks like `service_abc123`)

### 3. Create Email Template

1. Go to **"Email Templates"** in the dashboard
2. Click **"Create New Template"**
3. Use this template content:

```
Subject: {{subject}}

Dear {{to_name}},

Your OTP for Pad-Mini registration is: {{otp_code}}

This OTP will expire in 10 minutes.

If you didn't request this, please ignore this email.

Best regards,
{{from_name}}
```

4. **Copy the Template ID** (looks like `template_xyz789`)

### 4. Get Your User ID

1. Go to **"Account"** → **"General"**
2. **Copy your User ID** (looks like `user_def456`)

### 5. Update Configuration

Edit the file `src/config/emailjs.js`:

```javascript
export const EMAILJS_CONFIG = {
  USER_ID: "user_def456",           // Your User ID
  SERVICE_ID: "service_abc123",     // Your Gmail Service ID  
  TEMPLATE_ID: "template_xyz789"    // Your Template ID
};
```

### 6. Test Email Delivery

1. Start your app: `npm start`
2. Go to registration and use your own email
3. Check your inbox (and spam folder)
4. You should receive a real OTP email!

## 📊 EmailJS Free Plan Limits

- **200 emails/month**: Perfect for development and testing
- **No credit card required**
- **No setup fees**
- **Reliable delivery**

## 🔧 Troubleshooting

### Emails going to spam?
- Check your Gmail spam folder
- Add your sending email to contacts

### Template not working?
- Make sure all template variables match: `{{to_name}}`, `{{otp_code}}`, `{{subject}}`, `{{from_name}}`
- Test the template in EmailJS dashboard first

### Service connection issues?
- Re-authorize your Gmail account in EmailJS
- Make sure your Gmail account allows third-party apps

## 🛡️ Security Notes

- EmailJS uses OAuth2 for secure Gmail access
- Your Gmail password is never shared with EmailJS
- You can revoke access anytime in your Google Account settings

## 📞 Support

If you need help:
- Check EmailJS documentation: https://www.emailjs.com/docs/
- Join EmailJS Discord community
- Check your browser console for error messages

---

**🎉 Once configured, your users will receive real OTP emails directly to their Gmail inbox!**