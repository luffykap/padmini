import { db } from '../config/firebase';
import { 
  doc, 
  setDoc,
  updateDoc, 
  getDoc,
  onSnapshot,
  increment,
  serverTimestamp
} from 'firebase/firestore';

/**
 * UserStatsService - Manages user impact statistics with real-time updates
 * 
 * Database Schema (userStats collection):
 * {
 *   userId: string,
 *   peopleHelped: number,        // Number of unique people this user has helped
 *   timesHelped: number,          // Total number of help requests accepted/completed
 *   communityRating: number,      // Average rating (0-5 scale)
 *   totalRatings: number,         // Total number of ratings received
 *   ratingSum: number,            // Sum of all ratings (for calculating average)
 *   requestsCreated: number,      // Number of help requests created by user
 *   requestsCompleted: number,    // Number of requests successfully completed
 *   lastUpdated: timestamp,
 *   createdAt: timestamp
 * }
 */
export class UserStatsService {
  
  /**
   * Initialize stats for a new user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Initial stats object
   */
  static async initializeUserStats(userId) {
    try {
      const statsRef = doc(db, 'userStats', userId);
      const statsSnap = await getDoc(statsRef);
      
      if (statsSnap.exists()) {
        console.log('User stats already exist for:', userId);
        return statsSnap.data();
      }
      
      const initialStats = {
        userId,
        peopleHelped: 0,
        timesHelped: 0,
        communityRating: 0,
        totalRatings: 0,
        ratingSum: 0,
        requestsCreated: 0,
        requestsCompleted: 0,
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      
      await setDoc(statsRef, initialStats);
      console.log('✅ Initialized stats for user:', userId);
      return initialStats;
    } catch (error) {
      console.error('Error initializing user stats:', error);
      throw new Error('Failed to initialize user stats');
    }
  }

  /**
   * Get user stats with real-time listener
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function to receive stats updates
   * @returns {Function} Unsubscribe function
   */
  static getUserStats(userId, callback) {
    try {
      const statsRef = doc(db, 'userStats', userId);
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(statsRef, async (snapshot) => {
        if (snapshot.exists()) {
          const stats = snapshot.data();
          
          // Calculate average rating
          const avgRating = stats.totalRatings > 0 
            ? (stats.ratingSum / stats.totalRatings).toFixed(1)
            : 0;
          
          callback({
            peopleHelped: stats.peopleHelped || 0,
            timesHelped: stats.timesHelped || 0,
            communityRating: parseFloat(avgRating),
            requestsCreated: stats.requestsCreated || 0,
            requestsCompleted: stats.requestsCompleted || 0,
            lastUpdated: stats.lastUpdated
          });
        } else {
          // Initialize if doesn't exist
          console.log('Stats not found, initializing for user:', userId);
          const initialStats = await this.initializeUserStats(userId);
          callback({
            peopleHelped: 0,
            timesHelped: 0,
            communityRating: 0,
            requestsCreated: 0,
            requestsCompleted: 0
          });
        }
      }, (error) => {
        console.error('Error in stats listener:', error);
        callback({
          peopleHelped: 0,
          timesHelped: 0,
          communityRating: 0,
          requestsCreated: 0,
          requestsCompleted: 0
        });
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up stats listener:', error);
      throw new Error('Failed to setup stats listener');
    }
  }

  /**
   * Increment request created count
   * Called when user creates a new help request
   * @param {string} userId - User ID
   */
  static async incrementRequestCreated(userId) {
    try {
      const statsRef = doc(db, 'userStats', userId);
      const statsSnap = await getDoc(statsRef);
      
      if (!statsSnap.exists()) {
        await this.initializeUserStats(userId);
      }
      
      await updateDoc(statsRef, {
        requestsCreated: increment(1),
        lastUpdated: serverTimestamp()
      });
      
      console.log('✅ Incremented requestsCreated for user:', userId);
    } catch (error) {
      console.error('Error incrementing request created:', error);
      // Don't throw - stats update failure shouldn't break request creation
    }
  }

  /**
   * Update helper stats when they accept a request
   * @param {string} helperId - Helper user ID
   * @param {string} requesterId - Requester user ID
   */
  static async incrementHelpAccepted(helperId, requesterId) {
    try {
      const statsRef = doc(db, 'userStats', helperId);
      const statsSnap = await getDoc(statsRef);
      
      if (!statsSnap.exists()) {
        await this.initializeUserStats(helperId);
      }
      
      await updateDoc(statsRef, {
        timesHelped: increment(1),
        lastUpdated: serverTimestamp()
      });
      
      console.log('✅ Incremented timesHelped for helper:', helperId);
    } catch (error) {
      console.error('Error incrementing help accepted:', error);
    }
  }

  /**
   * Update both helper and requester stats when request is completed
   * @param {string} helperId - Helper user ID
   * @param {string} requesterId - Requester user ID
   */
  static async incrementHelpCompleted(helperId, requesterId) {
    try {
      // Update helper stats
      const helperRef = doc(db, 'userStats', helperId);
      const helperSnap = await getDoc(helperRef);
      
      if (!helperSnap.exists()) {
        await this.initializeUserStats(helperId);
      }
      
      const helperData = helperSnap.data() || {};
      const currentPeopleHelped = helperData.peopleHelped || 0;
      
      // Increment peopleHelped (unique people)
      // In a production app, you'd track unique requester IDs in an array
      await updateDoc(helperRef, {
        peopleHelped: increment(1),
        lastUpdated: serverTimestamp()
      });
      
      // Update requester stats
      const requesterRef = doc(db, 'userStats', requesterId);
      const requesterSnap = await getDoc(requesterRef);
      
      if (!requesterSnap.exists()) {
        await this.initializeUserStats(requesterId);
      }
      
      await updateDoc(requesterRef, {
        requestsCompleted: increment(1),
        lastUpdated: serverTimestamp()
      });
      
      console.log('✅ Updated completion stats for helper & requester');
    } catch (error) {
      console.error('Error updating completion stats:', error);
    }
  }

  /**
   * Add a rating to a user's community rating
   * @param {string} userId - User ID being rated
   * @param {number} rating - Rating value (1-5)
   */
  static async addRating(userId, rating) {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
      
      const statsRef = doc(db, 'userStats', userId);
      const statsSnap = await getDoc(statsRef);
      
      if (!statsSnap.exists()) {
        await this.initializeUserStats(userId);
      }
      
      await updateDoc(statsRef, {
        totalRatings: increment(1),
        ratingSum: increment(rating),
        lastUpdated: serverTimestamp()
      });
      
      console.log(`✅ Added rating ${rating} for user:`, userId);
    } catch (error) {
      console.error('Error adding rating:', error);
      throw new Error('Failed to add rating');
    }
  }

  /**
   * Get user stats snapshot (one-time read)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User stats
   */
  static async getUserStatsSnapshot(userId) {
    try {
      const statsRef = doc(db, 'userStats', userId);
      const statsSnap = await getDoc(statsRef);
      
      if (statsSnap.exists()) {
        const stats = statsSnap.data();
        const avgRating = stats.totalRatings > 0 
          ? (stats.ratingSum / stats.totalRatings).toFixed(1)
          : 0;
        
        return {
          peopleHelped: stats.peopleHelped || 0,
          timesHelped: stats.timesHelped || 0,
          communityRating: parseFloat(avgRating),
          requestsCreated: stats.requestsCreated || 0,
          requestsCompleted: stats.requestsCompleted || 0
        };
      } else {
        await this.initializeUserStats(userId);
        return {
          peopleHelped: 0,
          timesHelped: 0,
          communityRating: 0,
          requestsCreated: 0,
          requestsCompleted: 0
        };
      }
    } catch (error) {
      console.error('Error getting user stats snapshot:', error);
      return {
        peopleHelped: 0,
        timesHelped: 0,
        communityRating: 0,
        requestsCreated: 0,
        requestsCompleted: 0
      };
    }
  }

  /**
   * Reset user stats (for testing/admin purposes)
   * @param {string} userId - User ID
   */
  static async resetUserStats(userId) {
    try {
      const statsRef = doc(db, 'userStats', userId);
      await setDoc(statsRef, {
        userId,
        peopleHelped: 0,
        timesHelped: 0,
        communityRating: 0,
        totalRatings: 0,
        ratingSum: 0,
        requestsCreated: 0,
        requestsCompleted: 0,
        lastUpdated: serverTimestamp(),
        resetAt: serverTimestamp()
      });
      
      console.log('✅ Reset stats for user:', userId);
    } catch (error) {
      console.error('Error resetting user stats:', error);
      throw new Error('Failed to reset user stats');
    }
  }
}
