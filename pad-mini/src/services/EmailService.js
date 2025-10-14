// Email Service for sending OTP to college emails
// Real email implementation using EmailJS
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../config/emailjs';

export class EmailService {
  // Initialize EmailJS
  static init() {
    if (EMAILJS_CONFIG.USER_ID && EMAILJS_CONFIG.USER_ID !== "your_emailjs_user_id") {
      emailjs.init(EMAILJS_CONFIG.USER_ID);
      return true;
    }
    return false;
  }

  // Send real OTP email using EmailJS
  static async sendOTPEmail(email, otp, studentName) {
    try {
      // Check if EmailJS is configured
      const isConfigured = this.init();
      
      if (!isConfigured) {
        // Fallback to console logging if EmailJS not configured
        console.log(`
=== SIMULATED EMAIL (EmailJS not configured) ===
To: ${email}
Subject: BIT Pad-Mini - Email Verification OTP

Dear ${studentName},

Your OTP for Pad-Mini registration is: ${otp}

This OTP will expire in 10 minutes.

If you didn't request this, please ignore this email.

Best regards,
Pad-Mini Team

🔧 To enable real email delivery:
1. Go to https://www.emailjs.com/
2. Set up Gmail service
3. Create OTP template
4. Update src/config/emailjs.js with your credentials
=====================================================
        `);

        return {
          success: true,
          message: 'OTP shown in console (EmailJS not configured). Check console for setup instructions.',
          isSimulated: true
        };
      }

      // Send real email via EmailJS
      const templateParams = {
        to_email: email,
        to_name: studentName,
        subject: 'BIT Pad-Mini - Email Verification OTP',
        otp_code: otp,
        from_name: 'Pad-Mini Team'
      };

      console.log('📧 Sending real email via EmailJS to:', email);

      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams
      );

      console.log('✅ Email sent successfully:', response);

      return {
        success: true,
        message: `OTP sent to ${email}. Please check your email inbox and spam folder.`,
        isSimulated: false,
        emailResponse: response
      };

    } catch (error) {
      console.error('❌ Failed to send email:', error);
      
      // Fallback to console if email fails
      console.log(`
=== EMAIL FAILED - SHOWING OTP IN CONSOLE ===
To: ${email}
Your OTP: ${otp}
Error: ${error.message}

Please use this OTP to continue registration.
===============================================
      `);

      return {
        success: true,
        message: `Email failed to send. Your OTP is: ${otp}. Please use this to continue.`,
        isSimulated: true,
        error: error.message
      };
    }
  }

  // Setup instructions for EmailJS
  static getSetupInstructions() {
    return `
📧 EMAILJS SETUP GUIDE FOR REAL EMAIL DELIVERY:

1. 🌐 CREATE EMAILJS ACCOUNT:
   - Go to https://www.emailjs.com/
   - Sign up for a free account (up to 200 emails/month)

2. 📮 CREATE GMAIL SERVICE:
   - In EmailJS dashboard, go to "Email Services"
   - Click "Add New Service"
   - Choose "Gmail"
   - Follow OAuth setup to connect your Gmail
   - Note the Service ID (e.g., "service_abc123")

3. 📄 CREATE EMAIL TEMPLATE:
   - Go to "Email Templates"
   - Click "Create New Template"
   - Use this template:

   Subject: {{subject}}
   
   Dear {{to_name}},
   
   Your OTP for Pad-Mini registration is: {{otp_code}}
   
   This OTP will expire in 10 minutes.
   
   If you didn't request this, please ignore this email.
   
   Best regards,
   {{from_name}}

   - Note the Template ID (e.g., "template_xyz789")

4. 🔑 GET API CREDENTIALS:
   - Go to "Account" -> "General"
   - Find your User ID (e.g., "user_def456")

5. ⚙️ UPDATE CONFIGURATION:
   - Edit src/config/emailjs.js
   - Replace placeholders with your actual IDs

6. 🎯 TEST EMAIL DELIVERY:
   - Use your own email address first
   - Check spam folder if needed

📝 Free EmailJS Plan Limits:
- 200 emails per month
- No credit card required
- Perfect for development and small apps
`;
  }
  }
