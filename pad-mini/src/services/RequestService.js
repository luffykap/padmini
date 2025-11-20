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
import { NotificationService } from './NotificationService';
import { UserStatsService } from './UserStatsService';

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
      
      // Update user stats - increment requests created
      await UserStatsService.incrementRequestCreated(userId);
      
      // Notify nearby users (they'll receive if app is open/background)
      await this.notifyNearbyUsers(request, location);
      
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
        
        // Detect new requests and send notifications
        if (callback) {
          // Check for new requests (created in last 10 seconds)
          const now = new Date();
          const newRequests = requests.filter(req => {
            const createdAt = req.createdAt?.toDate?.() || new Date(req.createdAt);
            const ageInSeconds = (now - createdAt) / 1000;
            return ageInSeconds < 10; // New request in last 10 seconds
          });
          
          // Send notification for each new request
          newRequests.forEach(req => {
            NotificationService.notifyHelpRequest(
              req.helpType,
              req.distance.toFixed(1)
            );
          });
          
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
      console.log('🔄 Accepting request:', { requestId, helperId, message });
      const requestRef = doc(db, 'requests', requestId);
      
      // First, get the request to find the requester ID
      const requestSnap = await getDoc(requestRef);
      if (!requestSnap.exists()) {
        throw new Error('Request not found');
      }
      
      const requestData = requestSnap.data();
      const requesterId = requestData.requesterId; // Field is 'requesterId', not 'userId'
      
      console.log('📋 Request data:', { requesterId, requestId, helperId, requestData });
      
      // Create chat room with correct parameters FIRST
      console.log('✅ Request accepted, creating chat room...');
      const chatRoom = await this.createChatRoom(requestId, requesterId, helperId);
      console.log('✅ Chat room created:', chatRoom.id);
      
      // Update request with chat room ID
      await updateDoc(requestRef, {
        status: 'accepted',
        acceptedBy: helperId,
        acceptedAt: serverTimestamp(),
        helperMessage: message || '',
        chatRoomId: chatRoom.id // Store the actual chat room ID
      });

      console.log('✅ Request updated with chatRoomId');
      
      // Update helper stats - increment times helped
      await UserStatsService.incrementHelpAccepted(helperId, requesterId);
      
      // Notify requester that help is coming
      const helperProfile = await this.getUserProfile(helperId);
      await NotificationService.notifyRequestAccepted(helperProfile.name || 'Someone');
      
      return chatRoom;
    } catch (error) {
      console.error('❌ Error in acceptRequest:', error);
      throw new Error(`Failed to accept request: ${error.message}`);
    }
  }

  static async createChatRoom(requestId, requesterId, helperId) {
    try {
      console.log('📝 Creating chat room:', { requestId, requesterId, helperId });
      
      const chatRoom = {
        requestId,
        requesterId,
        helperId,
        participants: [requesterId, helperId], // requester and helper IDs
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        isActive: true,
        lastMessageAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'chats'), chatRoom);
      console.log('✅ Chat room created with ID:', docRef.id);
      
      // Send welcome message using ChatService
      const ChatService = require('./ChatService').ChatService;
      await ChatService.sendMessage(docRef.id, 'system', 
        '💬 Private chat created! Please coordinate a safe meeting spot. This chat will auto-delete after 24 hours for privacy.',
        'system'
      );
      
      return { id: docRef.id, ...chatRoom };
    } catch (error) {
      console.error('❌ Error creating chat room:', error);
      throw new Error(`Failed to create chat room: ${error.message}`);
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

  // Mark a user's request as completed - updates status and deactivates chat
  static async completeRequest(requestId) {
    try {
      console.log('✅ Marking request as completed:', requestId);
      
      // Get the request to find associated chat
      const requestRef = doc(db, 'requests', requestId);
      const requestSnap = await getDoc(requestRef);
      
      if (!requestSnap.exists()) {
        throw new Error('Request not found');
      }
      
      const requestData = requestSnap.data();
      
      // Update request status to completed
      await updateDoc(requestRef, {
        status: 'completed',
        completedAt: serverTimestamp()
      });
      
      console.log('✅ Request marked as completed');
      
      // Update stats for both helper and requester
      if (requestData.acceptedBy && requestData.requesterId) {
        await UserStatsService.incrementHelpCompleted(
          requestData.acceptedBy,  // helperId
          requestData.requesterId   // requesterId
        );
        console.log('✅ Updated completion stats for helper & requester');
      }
      
      // Deactivate associated chat if it exists
      if (requestData.chatRoomId) {
        console.log('🔒 Deactivating chat room:', requestData.chatRoomId);
        try {
          const chatRef = doc(db, 'chats', requestData.chatRoomId);
          await updateDoc(chatRef, {
            isActive: false,
            completedAt: serverTimestamp()
          });
          console.log('✅ Chat room deactivated');
        } catch (chatError) {
          console.error('Error deactivating chat:', chatError);
          // Don't throw - request is still completed even if chat update fails
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error completing request:', error);
      throw error;
    }
  }

  // Delete a completed request and its chat (optional cleanup - not used by default)
  static async deleteCompletedRequest(requestId) {
    try {
      console.log('🗑️ Deleting completed request:', requestId);
      
      // Get the request to find associated chat
      const requestRef = doc(db, 'requests', requestId);
      const requestSnap = await getDoc(requestRef);
      
      if (!requestSnap.exists()) {
        throw new Error('Request not found');
      }
      
      const requestData = requestSnap.data();
      
      // Delete associated chat room if it exists
      if (requestData.chatRoomId) {
        console.log('🗑️ Deleting chat room:', requestData.chatRoomId);
        
        // Delete all messages in the chat
        const messagesQuery = query(
          collection(db, 'chats', requestData.chatRoomId, 'messages')
        );
        const messagesSnap = await getDocs(messagesQuery);
        
        const deletePromises = messagesSnap.docs.map(msgDoc => 
          deleteDoc(doc(db, 'chats', requestData.chatRoomId, 'messages', msgDoc.id))
        );
        await Promise.all(deletePromises);
        
        // Delete the chat room itself
        await deleteDoc(doc(db, 'chats', requestData.chatRoomId));
        console.log('✅ Chat room deleted');
      }
      
      // Delete the request
      await deleteDoc(requestRef);
      console.log('✅ Request deleted');
      
      return true;
    } catch (error) {
      console.error('Error completing request:', error);
      throw error;
    }
  }

  // Helper method to notify nearby users about new help request
  static async notifyNearbyUsers(request, requesterLocation) {
    try {
      // This is a simple local notification approach
      // In a production app, you'd want to:
      // 1. Store user push tokens in Firestore
      // 2. Query nearby users based on their last known location
      // 3. Send push notifications via Expo's push service
      
      // For now, notifications are sent when users have the real-time listener active
      console.log('📢 Help request created - nearby users will be notified via real-time listener');
    } catch (error) {
      console.error('Error notifying nearby users:', error);
      // Don't throw - notification failure shouldn't prevent request creation
    }
  }
}