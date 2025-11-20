/**
 * Production Configuration
 * 
 * Set to false to disable all console.log statements in production
 */

const IS_PRODUCTION = true;

// Override console methods in production
if (IS_PRODUCTION) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  // Keep console.warn and console.error for critical issues
}

export const config = {
  IS_PRODUCTION,
  
  // App settings
  APP_NAME: 'Pad-Mini',
  APP_VERSION: '1.0.0',
  
  // Feature flags
  ENABLE_ANALYTICS: IS_PRODUCTION,
  ENABLE_ERROR_REPORTING: IS_PRODUCTION,
  ENABLE_VERBOSE_LOGGING: !IS_PRODUCTION,
  
  // Request settings
  DEFAULT_RADIUS_KM: 2,
  REQUEST_EXPIRY_HOURS: 24,
  CHAT_EXPIRY_HOURS: 24,
  
  // Notification settings
  ENABLE_NOTIFICATIONS: true,
  NEW_REQUEST_NOTIFICATION_WINDOW_SECONDS: 10,
  
  // Stats settings
  ENABLE_REAL_TIME_STATS: true,
  
  // Location settings
  LOCATION_ACCURACY: 'balanced', // 'low', 'balanced', 'high'
  
  // UI settings
  MAX_NEARBY_REQUESTS: 20,
  MAX_MY_REQUESTS: 10,
  SHOW_DEBUG_INFO: !IS_PRODUCTION,
};

export default config;
