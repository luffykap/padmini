import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';

export class ChatService {
  static async createChatRoom(requestId, requesterId, helperId) {
    try {
      const chatRoom = {
        requestId,
        requesterId,
        helperId,
        participants: [requesterId, helperId],
        createdAt: serverTimestamp(),
        isActive: true,
        lastMessageAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'chats'), chatRoom);
      
      // Send welcome message
      await this.sendMessage(docRef.id, 'system', 
        '💬 Private chat created! Please coordinate a safe meeting spot. This chat will auto-delete after 24 hours for privacy.',
        'system'
      );
      
      return { id: docRef.id, ...chatRoom };
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw new Error('Failed to create chat room');
    }
  }

  static async sendMessage(chatRoomId, senderId, text, messageType = 'text') {
    try {
      const message = {
        chatRoomId,
        senderId,
        text,
        messageType, // 'text', 'system', 'completion'
        createdAt: serverTimestamp(),
        timestamp: Date.now() // For client-side sorting
      };

      const docRef = await addDoc(collection(db, 'messages'), message);
      
      // Update chat room's last message time
      await updateDoc(doc(db, 'chats', chatRoomId), {
        lastMessageAt: serverTimestamp()
      });

      return { id: docRef.id, ...message };
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  static subscribeToMessages(chatRoomId, callback) {
    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('chatRoomId', '==', chatRoomId),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
          const message = { id: doc.id, ...doc.data() };
          
          // Format for GiftedChat
          const formattedMessage = {
            _id: message.id,
            text: message.text,
            createdAt: message.createdAt?.toDate() || new Date(message.timestamp || Date.now()),
            user: {
              _id: message.senderId,
              name: message.senderId === 'system' ? 'System' : `User ${message.senderId.slice(-4)}`,
              avatar: message.senderId === 'system' ? '🤖' : undefined
            },
            system: message.messageType === 'system'
          };
          
          messages.push(formattedMessage);
        });

        console.log(`Loaded ${messages.length} messages for chat ${chatRoomId}`);
        callback(messages);
      }, (error) => {
        console.error('Error in messages listener:', error);
        callback([]);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up messages listener:', error);
      throw new Error('Failed to subscribe to messages');
    }
  }

  static async getUserChats(userId, callback) {
    try {
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId),
        where('isActive', '==', true),
        orderBy('lastMessageAt', 'desc')
      );

      const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
        const chats = [];
        snapshot.forEach((doc) => {
          const chat = { id: doc.id, ...doc.data() };
          
          // Determine user role
          const isRequester = chat.requesterId === userId;
          const otherUserId = isRequester ? chat.helperId : chat.requesterId;
          
          chats.push({
            id: chat.id,
            chatRoomId: chat.id,
            requestId: chat.requestId,
            isRequester,
            isHelper: !isRequester,
            otherUserId,
            lastMessageAt: chat.lastMessageAt,
            createdAt: chat.createdAt
          });
        });

        console.log(`Found ${chats.length} active chats for user ${userId}`);
        callback(chats);
      }, (error) => {
        console.error('Error in chats listener:', error);
        callback([]);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up chats listener:', error);
      throw new Error('Failed to get user chats');
    }
  }

  static async completeChatRoom(chatRoomId, completedBy) {
    try {
      // Mark chat as inactive
      await updateDoc(doc(db, 'chats', chatRoomId), {
        isActive: false,
        completedAt: serverTimestamp(),
        completedBy
      });

      // Send completion message
      await this.sendMessage(chatRoomId, 'system', 
        '✅ Request marked as completed! This chat will remain open for 5 minutes, then auto-delete for privacy.',
        'completion'
      );

      // Delete all messages after 5 minutes (300000 milliseconds)
      setTimeout(async () => {
        try {
          const messagesQuery = query(
            collection(db, 'messages'),
            where('chatRoomId', '==', chatRoomId)
          );
          
          const messagesSnapshot = await getDocs(messagesQuery);
          const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deletePromises);
          
          // Delete the chat room itself
          await deleteDoc(doc(db, 'chats', chatRoomId));
          
          console.log('✅ Chat room and messages deleted successfully after 5 minutes');
        } catch (error) {
          console.error('❌ Error deleting chat data:', error);
        }
      }, 300000); // 5 minutes = 300000 milliseconds

    } catch (error) {
      console.error('Error completing chat room:', error);
      throw new Error('Failed to complete chat');
    }
  }

  static async createChatNotification(requestId, requesterId, helperId, chatRoomId) {
    try {
      // Create notification for requester
      const requesterNotification = {
        userId: requesterId,
        type: 'chat_created',
        requestId,
        chatRoomId,
        helperId,
        message: 'Someone accepted your help request! You can now chat privately.',
        createdAt: serverTimestamp(),
        read: false
      };

      // Create notification for helper
      const helperNotification = {
        userId: helperId,
        type: 'chat_created',
        requestId,
        chatRoomId,
        requesterId,
        message: 'Chat created! You can now coordinate with the person who needs help.',
        createdAt: serverTimestamp(),
        read: false
      };

      await addDoc(collection(db, 'notifications'), requesterNotification);
      await addDoc(collection(db, 'notifications'), helperNotification);

      console.log('Chat notifications created');
    } catch (error) {
      console.error('Error creating chat notifications:', error);
    }
  }

  static subscribeToNotifications(userId, callback) {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        const notifications = [];
        snapshot.forEach((doc) => {
          notifications.push({ id: doc.id, ...doc.data() });
        });

        console.log(`Found ${notifications.length} unread notifications for user ${userId}`);
        callback(notifications);
      }, (error) => {
        console.error('Error in notifications listener:', error);
        callback([]);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up notifications listener:', error);
      throw new Error('Failed to subscribe to notifications');
    }
  }
}