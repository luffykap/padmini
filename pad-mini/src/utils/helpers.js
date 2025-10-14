// Validation utilities for the app

export const ValidationUtils = {
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validateCollegeEmail: (email) => {
    const collegeEmailPattern = /^[^\s@]+@[^\s@]+\.edu$/;
    return collegeEmailPattern.test(email);
  },

  validatePassword: (password) => {
    return password && password.length >= 6;
  },

  validateStudentId: (studentId) => {
    return studentId && studentId.trim().length > 0;
  },

  validateFullName: (name) => {
    return name && name.trim().length >= 2;
  },

  validateHelpRequest: (requestData) => {
    const errors = {};

    if (!requestData.helpType) {
      errors.helpType = 'Please select what type of help you need';
    }

    if (!requestData.urgency) {
      errors.urgency = 'Please select urgency level';
    }

    if (requestData.description && requestData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

export const FormatUtils = {
  formatDistance: (distanceKm) => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
  },

  formatTimeAgo: (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 24 * 60) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / (24 * 60));
      return `${days}d ago`;
    }
  },

  formatChatTime: (timestamp) => {
    const time = new Date(timestamp);
    return time.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  },

  anonymizeName: (fullName) => {
    if (!fullName) return 'Anonymous';
    const parts = fullName.split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0) + '.';
    }
    return parts[0] + ' ' + parts[parts.length - 1].charAt(0) + '.';
  }
};

export const SecurityUtils = {
  sanitizeMessage: (message) => {
    // Remove any potentially harmful content
    return message
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: urls
      .trim();
  },

  maskEmail: (email) => {
    const [username, domain] = email.split('@');
    const maskedUsername = username.length > 3 
      ? username.substring(0, 2) + '*'.repeat(username.length - 2)
      : username;
    return `${maskedUsername}@${domain}`;
  },

  generateChatId: (userId1, userId2) => {
    // Create a consistent chat ID regardless of order
    const sortedIds = [userId1, userId2].sort();
    return `${sortedIds[0]}_${sortedIds[1]}`;
  }
};

export const LocationUtils = {
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d;
  },

  getApproximateLocation: (lat, lon, radiusKm = 0.1) => {
    // Add some randomness to protect exact location
    const randomLat = lat + (Math.random() - 0.5) * (radiusKm / 111.32);
    const randomLon = lon + (Math.random() - 0.5) * (radiusKm / (111.32 * Math.cos(lat * Math.PI / 180)));
    
    return {
      latitude: randomLat,
      longitude: randomLon
    };
  }
};