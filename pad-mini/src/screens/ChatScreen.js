import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, Platform, Alert } from 'react-native';
import { GiftedChat, Bubble, Send } from 'react-native-gifted-chat';
import { IconButton, Avatar } from 'react-native-paper';
import { theme } from '../theme/theme';
import { ChatService } from '../services/ChatService';

export default function ChatScreen({ navigation, route }) {
  const { requestId, chatRoomId, isHelper } = route.params;
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [unsubscribeMessages, setUnsubscribeMessages] = useState(null);

  // Create persistent user IDs that match the ones from other screens
  const [persistentUser] = useState(() => {
    const existingUserId = typeof window !== 'undefined' ? 
      window.sessionStorage?.getItem('pad-mini-user-id') : null;
    
    if (existingUserId) {
      return {
        _id: existingUserId,
        name: `User ${existingUserId.slice(-4)}`,
        avatar: `https://via.placeholder.com/150/${isHelper ? 'e91e63' : '9c27b0'}/FFFFFF?text=${existingUserId.slice(-1)}`
      };
    }
    
    const newUserId = `test-user-${Math.random().toString(36).substr(2, 9)}`;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem('pad-mini-user-id', newUserId);
    }
    
    return {
      _id: newUserId,
      name: `User ${newUserId.slice(-4)}`,
      avatar: `https://via.placeholder.com/150/${isHelper ? 'e91e63' : '9c27b0'}/FFFFFF?text=${newUserId.slice(-1)}`
    };
  });

  const currentUser = persistentUser;

  useEffect(() => {
    console.log('ChatScreen: Setting up Firebase real-time messaging for chatRoomId:', chatRoomId);
    
    const setupMessagesListener = async () => {
      try {
        // Set up real-time messages listener
        const messagesUnsubscribe = ChatService.subscribeToMessages(chatRoomId, (messages) => {
          console.log(`Received ${messages.length} messages from Firebase`);
          setMessages(messages.reverse()); // GiftedChat expects newest first
        });
        
        setUnsubscribeMessages(() => messagesUnsubscribe);
      } catch (error) {
        console.error('Error setting up messages listener:', error);
        Alert.alert('Connection Error', 'Unable to connect to chat. Please check your internet connection.');
      }
    };

    setupMessagesListener();

    // Cleanup function
    return () => {
      console.log('ChatScreen: Cleaning up Firebase listeners');
      if (unsubscribeMessages) unsubscribeMessages();
    };
  }, [chatRoomId]);

  const onSend = useCallback(async (newMessages = []) => {
    try {
      // Send message to Firebase
      const message = newMessages[0];
      await ChatService.sendMessage(chatRoomId, currentUser._id, message.text);
      
      console.log('💬 Message sent to Firebase:', message.text);
    } catch (error) {
      console.error('Error sending message to Firebase:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  }, [chatRoomId, currentUser._id]);

  const handleRequestCompletion = useCallback(async () => {
    Alert.alert(
      'Mark Request as Completed',
      'Are you sure you want to mark this request as completed? This will delete the chat for both users.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Complete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Complete the chat in Firebase
              await ChatService.completeChatRoom(chatRoomId, currentUser._id);
              
              // Navigate back after a short delay
              setTimeout(() => {
                navigation.goBack();
              }, 3000);
              
              console.log('✅ Request completion initiated');
            } catch (error) {
              console.error('Error completing request:', error);
              Alert.alert('Error', 'Failed to complete request. Please try again.');
            }
          }
        }
      ]
    );
  }, [chatRoomId, currentUser._id, navigation]);

  const renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: theme.colors.primary,
          },
          left: {
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.background,
          },
        }}
        textStyle={{
          right: {
            color: '#fff',
          },
          left: {
            color: theme.colors.text,
          },
        }}
      />
    );
  };

  const renderSend = (props) => {
    return (
      <Send {...props}>
        <View style={styles.sendContainer}>
          <IconButton
            icon="send"
            size={24}
            iconColor={theme.colors.primary}
            style={styles.sendButton}
          />
        </View>
      </Send>
    );
  };

  const renderAvatar = (props) => {
    return (
      <Avatar.Text
        {...props}
        size={36}
        label={props.currentMessage.user.name.charAt(0)}
        style={[
          styles.avatar,
          { backgroundColor: theme.colors.secondary }
        ]}
      />
    );
  };

  const renderSystemMessage = (props) => {
    return (
      <View style={styles.systemMessageContainer}>
        <View style={styles.systemMessageBubble}>
          <Text style={styles.systemMessageText}>
            {props.currentMessage.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Connection Status with Completion Button */}
      <View style={[styles.statusBar, { backgroundColor: theme.colors.primaryContainer }]}>
        <View style={styles.statusContent}>
          <Text style={[styles.statusText, { color: theme.colors.primary }]}>
            💬 Private Chat • Real-time sync active
          </Text>
          <IconButton
            icon="check-circle"
            size={20}
            iconColor={theme.colors.primary}
            onPress={handleRequestCompletion}
            style={styles.completionButton}
          />
        </View>
      </View>
      
      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        onInputTextChanged={handleTyping}
        user={currentUser}
        renderBubble={renderBubble}
        renderSend={renderSend}
        renderAvatar={renderAvatar}
        isTyping={otherUserTyping}
        placeholder="Type a message..."
        alwaysShowSend
        scrollToBottom
        scrollToBottomComponent={() => (
          <View style={styles.scrollToBottomButton}>
            <IconButton icon="chevron-down" size={20} />
          </View>
        )}
        showUserAvatar
        renderSystemMessage={renderSystemMessage}
        timeTextStyle={{
          left: { color: theme.colors.placeholder },
          right: { color: '#fff' },
        }}
        messagesContainerStyle={styles.messagesContainer}
        textInputStyle={styles.textInput}
        minInputToolbarHeight={60}
        bottomOffset={Platform.OS === 'ios' ? 34 : 0}
        keyboardShouldPersistTaps="handled"
        listViewProps={{
          scrollEventThrottle: 400,
          onScroll: () => {
            // Mark messages as read when user scrolls
            console.log('💬 User is reading messages');
          }
        }}
      />
      
      {/* Safety notice at the bottom */}
      <View style={styles.safetyNotice}>
        <Text style={styles.safetyText}>
          🔒 This chat auto-deletes in 24 hours. Meet in public areas only.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  statusBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  completionButton: {
    margin: 0,
    padding: 4,
  },
  scrollToBottomButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  messagesContainer: {
    backgroundColor: theme.colors.background,
  },
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  sendButton: {
    margin: 0,
  },
  avatar: {
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.background,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 16,
    lineHeight: 20,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  systemMessageBubble: {
    backgroundColor: theme.colors.softLavender,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: '80%',
  },
  systemMessageText: {
    color: theme.colors.text,
    fontSize: 14,
    textAlign: 'center',
  },
  safetyNotice: {
    backgroundColor: theme.colors.mintGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  safetyText: {
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'center',
  },
});