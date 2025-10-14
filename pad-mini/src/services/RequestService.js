import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc,
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDoc,
  getDocs,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import * as Location from 'expo-location';

export class RequestService {
  static async createHelpRequest(userId, requestData) {
    try {
      // Get current location and user profile
      const location = await this.getCurrentLocation();
      const userProfile = await this.getUserProfile(userId);
      
      const request = {
        requesterId: userId,
        requesterName: userProfile.name || 'A friend',
        college: userProfile.college || 'bit-bangalore.edu.in',
        helpType: requestData.helpType,
        description: requestData.description,
        urgency: requestData.urgency,
        isAnonymous: requestData.isAnonymous,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy
        },
        status: 'active', // active, accepted, completed, cancelled
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        acceptedBy: null,
        acceptedAt: null
      };

      const docRef = await addDoc(collection(db, 'requests'), request);
      return { id: docRef.id, ...request };
    } catch (error) {
      console.error('Error creating request:', error);
      throw new Error('Failed to create help request');
    }
  }

  static async getNearbyRequests(userId, radiusKm = 2, callback) {
    try {
      const userLocation = await this.getCurrentLocation();
      const userProfile = await this.getUserProfile(userId);
      
      // Query requests from same college within time limit
      // Note: Can't use orderBy with != where clause, so we'll filter and sort in memory
      const requestsQuery = query(
        collection(db, 'requests'),
        where('status', '==', 'active'),
        where('college', '==', userProfile.college),
        limit(50) // Get more to filter down locally
      );

      // Set up real-time listener
      const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
        const requests = [];
        snapshot.forEach((doc) => {
          const request = { id: doc.id, ...doc.data() };
          
          // Skip own requests
          if (request.requesterId === userId) return;
          
          // Calculate distance
          const distance = this.calculateDistance(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            request.location.latitude,
            request.location.longitude
          );

          // Only include requests within radius
          if (distance <= radiusKm) {
            request.distance = distance;
            requests.push(request);
          }
        });

        // Sort by creation time (newest first) and distance
        requests.sort((a, b) => {
          const timeA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const timeB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return timeB - timeA;
        });

        console.log(`Found ${requests.length} nearby requests`);
        
        // If callback provided, use it; otherwise this is just setting up the listener
        if (callback) {
          callback(requests.slice(0, 20)); // Limit to 20 nearby requests
        }
      }, (error) => {
        console.error('Error in real-time listener:', error);
        if (callback) {
          callback([]); // Return empty array on error
        }
      });

      return unsubscribe; // Return the unsubscribe function
    } catch (error) {
      console.error('Error setting up real-time listener:', error);
      throw new Error('Failed to fetch nearby requests');
    }
  }

  static async acceptRequest(requestId, helperId, message) {
    try {
      const requestRef = doc(db, 'requests', requestId);
      
      await updateDoc(requestRef, {
        status: 'accepted',
        acceptedBy: helperId,
        acceptedAt: serverTimestamp(),
        helperMessage: message
      });

      // Create chat room
      const chatRoom = await this.createChatRoom(requestId, helperId);
      
      return chatRoom;
    } catch (error) {
      throw new Error('Failed to accept request');
    }
  }

  static async cancelRequest(requestId, userId) {
    try {
      const requestRef = doc(db, 'requests', requestId);
      
      await updateDoc(requestRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelledBy: userId
      });
    } catch (error) {
      throw new Error('Failed to cancel request');
    }
  }

  static async completeRequest(requestId) {
    try {
      const requestRef = doc(db, 'requests', requestId);
      
      await updateDoc(requestRef, {
        status: 'completed',
        completedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error('Failed to complete request');
    }
  }

  static async createChatRoom(requestId, helperId) {
    try {
      const chatRoom = {
        requestId,
        participants: [requestId, helperId], // requester and helper IDs
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        isActive: true
      };

      const docRef = await addDoc(collection(db, 'chats'), chatRoom);
      return { id: docRef.id, ...chatRoom };
    } catch (error) {
      throw new Error('Failed to create chat room');
    }
  }

  static async getCurrentLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return location;
    } catch (error) {
      throw new Error('Failed to get current location');
    }
  }

  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in kilometers
    return d;
  }

  static deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  static async getUserProfile(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      
      // Create default profile if user doesn't exist in Firestore yet
      const defaultProfile = {
        name: `User ${userId.slice(-4)}`, // Use last 4 chars of ID as name
        college: 'bit-bangalore.edu.in',
        verified: true,
        joinedAt: new Date().toISOString()
      };
      
      // Save the profile to Firestore
      await setDoc(doc(db, 'users', userId), defaultProfile);
      console.log('Created user profile:', userId);
      
      return defaultProfile;
    } catch (error) {
      console.error('Error getting/creating user profile:', error);
      // Return fallback profile
      return {
        name: `User ${userId?.slice(-4) || 'Test'}`,
        college: 'bit-bangalore.edu.in',
        verified: true
      };
    }
  }

  // Get user's own requests with real-time updates
  static async getUserRequests(userId, callback) {
    try {
      console.log('🔍 Setting up user requests listener for userId:', userId);
      
      // Simplified query without orderBy to avoid index requirements
      const requestsQuery = query(
        collection(db, 'requests'),
        where('requesterId', '==', userId)
      );

      const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
        console.log('🔍 Firebase snapshot received, docs count:', snapshot.size);
        
        const requests = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('🔍 Found user request doc:', doc.id, data);
          requests.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            expiresAt: data.expiresAt?.toDate() || new Date()
          });
        });

        // Sort manually by createdAt (newest first)
        requests.sort((a, b) => b.createdAt - a.createdAt);
        
        console.log(`🔍 Found ${requests.length} user requests for userId ${userId}`);
        console.log('🔍 User requests data:', requests);
        callback(requests);
      }, (error) => {
        console.error('❌ Error in user requests listener:', error);
        console.error('❌ Error details:', error.code, error.message);
        callback([]);
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up user requests listener:', error);
      console.error('❌ Error details:', error.code, error.message);
      callback([]);
      return () => {}; // Return empty cleanup function
    }
  }

  // Get user requests once (no real-time listener) for manual refresh
  static async getUserRequestsOnce(userId) {
    try {
      console.log('🔍 Getting user requests once for userId:', userId);
      
      const requestsQuery = query(
        collection(db, 'requests'),
        where('requesterId', '==', userId)
      );

      const snapshot = await getDocs(requestsQuery);
      const requests = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('🔍 Found user request doc (once):', doc.id, data);
        requests.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate() || new Date()
        });
      });

      // Sort manually by createdAt (newest first)
      requests.sort((a, b) => b.createdAt - a.createdAt);
      
      console.log(`🔍 Found ${requests.length} user requests (once) for userId ${userId}`);
      return requests;
    } catch (error) {
      console.error('❌ Error getting user requests once:', error);
      return [];
    }
  }

  // Cancel a user's request
  static async cancelRequest(requestId) {
    try {
      await updateDoc(doc(db, 'requests', requestId), {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error cancelling request:', error);
      throw error;
    }
  }

  // Mark a user's request as completed
  static async completeRequest(requestId) {
    try {
      await updateDoc(doc(db, 'requests', requestId), {
        status: 'completed',
        completedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error completing request:', error);
      throw error;
    }
  }
}