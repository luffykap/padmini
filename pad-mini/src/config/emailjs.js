// EmailJS Configuration for sending real OTP emails
// You need to create an account at https://www.emailjs.com/ and get these values

export const EMAILJS_CONFIG = {
  // Your EmailJS User ID (found in EmailJS dashboard)
  USER_ID: "your_emailjs_user_id",
  
  // Your EmailJS Service ID (Gmail service you create)
  SERVICE_ID: "your_gmail_service_id",
  
  // Your EmailJS Template ID (OTP email template)
  TEMPLATE_ID: "your_otp_template_id"
};

// Instructions to set up EmailJS:
/*
1. Go to https://www.emailjs.com/ and create a free account
2. Create a new service:
   - Choose Gmail
   - Follow the setup to connect your Gmail account
   - Note the Service ID

3. Create a new template:
   - Use this template structure:
   
   Subject: {{subject}}
   
   Dear {{to_name}},
   
   Your OTP for Pad-Mini registration is: {{otp_code}}
   
   This OTP will expire in 10 minutes.
   
   If you didn't request this, please ignore this email.
   
   Best regards,
   Pad-Mini Team
   
   - Note the Template ID

4. Get your User ID from Account -> API Keys

5. Replace the values above with your actual IDs

6. For production, store these in environment variables
*/