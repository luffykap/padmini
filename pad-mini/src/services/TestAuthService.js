// Simple test bypass for OTP verification
// This allows you to test the app flow without Firebase Auth issues

export class TestAuthService {
  static async testOTPVerification(collegeEmail, enteredOTP, appPassword) {
    // Simulate successful verification for testing
    console.log('🧪 TEST MODE: Simulating successful OTP verification');
    console.log(`Email: ${collegeEmail}`);
    console.log(`OTP: ${enteredOTP}`);
    console.log(`Password: ${appPassword}`);
    
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      user: {
        uid: 'test-user-' + Date.now(),
        email: collegeEmail
      },
      message: 'Registration successful! (Test Mode)'
    };
  }
}

// Add this to your OTPRegisterScreen for testing:
// Replace AuthService.verifyOTPAndRegister with TestAuthService.testOTPVerification