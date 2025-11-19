import React, { useState } from 'react';
import { View, StyleSheet, Platform, Alert } from 'react-native';
import { 
  Button, 
  Title, 
  Paragraph, 
  Card, 
  Avatar,
  Divider,
  TextInput
} from 'react-native-paper';
import { theme } from '../theme/theme';
import { RequestService } from '../services/RequestService';
import { ChatService } from '../services/ChatService';
import { useAuth } from '../context/AuthContext';

export default function HelpResponseScreen({ navigation, route }) {
  // Use proper AuthContext hook
  const { user, userProfile } = useAuth();
  
  // Create helper user object with proper data
  const currentUser = user ? {
    uid: user.uid,
    name: userProfile?.fullName || user.displayName || `User ${user.uid.slice(-4)}`,
    college: userProfile?.college || 'bit-bangalore.edu.in',
    email: user.email
  } : null;
  
  const { requestId } = route.params;
  const [message, setMessage] = useState('');
  const [responding, setResponding] = useState(false);

  // Redirect if no user is logged in
  if (!currentUser) {
    return (
      <View style={styles.container}>
        <Card style={styles.requestCard}>
          <Card.Content>
            <Title>Authentication Required</Title>
            <Paragraph>You must be logged in to respond to help requests.</Paragraph>
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('Welcome')}
              style={{ marginTop: 16 }}
            >
              Go to Login
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  // TODO: Load actual request data from Firebase
  const requestData = {
    id: requestId,
    requesterName: 'Sarah M.',
    helpType: 'Sanitary Pads',
    description: 'Really need help, forgot to bring any today',
    urgency: 'high',
    distance: '0.2 km',
    timeAgo: '2 min ago',
    isAnonymous: false,
    estimatedLocation: 'Near Library Building'
  };

  const handleAcceptRequest = async () => {
    if (!message.trim()) {
      Alert.alert(
        'Message Required', 
        'Please write a brief message to let them know you\'re coming to help.'
      );
      return;
    }

    setResponding(true);
    try {
      // Create acceptance data for localStorage sync
      const chatRoomId = `chat-${requestId}-${user.uid}`;
      const acceptanceData = {
        id: `acceptance-${Date.now()}`,
        requestId: requestId,
        helperId: user.uid,
        helperName: user.name || `User ${user.uid.slice(-4)}`,
        message: message.trim(),
        acceptedAt: new Date().toISOString(),
        status: 'accepted',
        chatRoomId: chatRoomId
      };

      // Create chat notification for the requester
      const chatNotification = {
        id: `chat-notification-${Date.now()}`,
        type: 'chat_created',
        requestId: requestId,
        chatRoomId: chatRoomId,
        helperId: user.uid,
        helperName: user.name || `User ${user.uid.slice(-4)}`,
        message: `${user.name || 'Someone'} has accepted your help request! You can now chat privately.`,
        createdAt: new Date().toISOString()
      };

      // Sync acceptance across tabs via localStorage
      try {
        const existingAcceptances = JSON.parse(localStorage.getItem('pad-mini-acceptances') || '[]');
        existingAcceptances.push(acceptanceData);
        localStorage.setItem('pad-mini-acceptances', JSON.stringify(existingAcceptances));
        
        // Store chat notifications
        const existingNotifications = JSON.parse(localStorage.getItem('pad-mini-notifications') || '[]');
        existingNotifications.push(chatNotification);
        localStorage.setItem('pad-mini-notifications', JSON.stringify(existingNotifications));
        
        // Also update the original request to mark it as accepted
        const existingRequests = JSON.parse(localStorage.getItem('pad-mini-requests') || '[]');
        const updatedRequests = existingRequests.map(req => 
          req.id === requestId 
            ? { ...req, status: 'accepted', helperId: user.uid, helperName: user.name, chatRoomId: chatRoomId }
            : req
        );
        localStorage.setItem('pad-mini-requests', JSON.stringify(updatedRequests));
        
        // Dispatch storage events to notify other tabs
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'pad-mini-acceptances',
          newValue: JSON.stringify(existingAcceptances),
          storageArea: localStorage
        }));
        
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'pad-mini-notifications',
          newValue: JSON.stringify(existingNotifications),
          storageArea: localStorage
        }));
        
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'pad-mini-requests',
          newValue: JSON.stringify(updatedRequests),
          storageArea: localStorage
        }));
        
        console.log('Acceptance and chat creation synced via localStorage:', acceptanceData);
      } catch (localError) {
        console.error('localStorage sync failed:', localError);
      }

      if (!currentUser) {
        throw new Error('You must be logged in to accept requests');
      }

      // Accept the request through Firebase
      console.log('🔄 Accepting request with user:', currentUser.uid);
      const chatRoom = await RequestService.acceptRequest(requestId, currentUser.uid, message);
      console.log('✅ Request accepted, chat room created:', chatRoom.id);
      
      setResponding(false);
      
      // Show success message and redirect to Home
      Alert.alert(
        'Help Accepted!',
        'You\'ve accepted this request. A private chat has been created to coordinate.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home')
          }
        ],
        { cancelable: false }
      );
      
      // Auto-redirect to Home after 2 seconds
      setTimeout(() => {
        navigation.navigate('Home');
      }, 2000);
    } catch (error) {
      setResponding(false);
      console.error('❌ Error accepting request:', error);
      Alert.alert('Error', error.message || 'Failed to accept request. Please try again.');
    }
  };

  const urgencyColor = {
    low: theme.colors.safeGreen,
    medium: theme.colors.warningOrange,
    high: theme.colors.errorRed
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Request Details */}
        <Card style={styles.requestCard}>
          <Card.Content>
            <View style={styles.header}>
              <Avatar.Text 
                size={50} 
                label={requestData.isAnonymous ? 'A' : requestData.requesterName.charAt(0)}
                style={styles.avatar}
              />
              <View style={styles.headerInfo}>
                <Title style={styles.requesterName}>
                  {requestData.requesterName}
                </Title>
                <Paragraph style={styles.timeAndDistance}>
                  {requestData.timeAgo} • {requestData.distance} away
                </Paragraph>
              </View>
              <View 
                style={[
                  styles.urgencyBadge,
                  { backgroundColor: urgencyColor[requestData.urgency] }
                ]}
              >
                <Paragraph style={styles.urgencyText}>
                  {requestData.urgency.toUpperCase()}
                </Paragraph>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.requestDetails}>
              <Paragraph style={styles.helpType}>
                Needs: {requestData.helpType}
              </Paragraph>
              {requestData.description && (
                <Paragraph style={styles.description}>
                  "{requestData.description}"
                </Paragraph>
              )}
              <Paragraph style={styles.location}>
                📍 {requestData.estimatedLocation}
              </Paragraph>
            </View>
          </Card.Content>
        </Card>

        {/* Safety Guidelines */}
        <Card style={styles.safetyCard}>
          <Card.Content>
            <Title style={styles.safetyTitle}>Safety Guidelines</Title>
            <View style={styles.safetyPoints}>
              <Paragraph style={styles.safetyPoint}>
                ✓ Meet in a public, well-lit area of campus
              </Paragraph>
              <Paragraph style={styles.safetyPoint}>
                ✓ Coordinate the exact meeting spot through chat
              </Paragraph>
              <Paragraph style={styles.safetyPoint}>
                ✓ Trust your instincts - you can cancel anytime
              </Paragraph>
              <Paragraph style={styles.safetyPoint}>
                ✓ Report any inappropriate behavior immediately
              </Paragraph>
            </View>
          </Card.Content>
        </Card>

        {/* Response Message */}
        <Card style={styles.responseCard}>
          <Card.Content>
            <Title style={styles.responseTitle}>Send a message</Title>
            <Paragraph style={styles.responseSubtitle}>
              Let them know you're coming to help
            </Paragraph>
            <TextInput
              label="Your message"
              value={message}
              onChangeText={setMessage}
              style={styles.messageInput}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="Hi! I can help you with this. I'll be there in 5 minutes..."
            />
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <Button
            mode="contained"
            onPress={handleAcceptRequest}
            loading={responding}
            disabled={responding}
            style={styles.acceptButton}
            contentStyle={styles.buttonContent}
          >
            {responding ? 'Accepting...' : 'Accept & Help'}
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            disabled={responding}
          >
            Go Back
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    ...(Platform.OS === 'web' && {
      overflow: 'auto',
      height: '100vh',
      maxHeight: '100vh',
      overflowY: 'scroll',
      WebkitOverflowScrolling: 'touch',
    }),
  },
  content: {
    padding: 16,
    ...(Platform.OS === 'web' && {
      minHeight: 'calc(100vh + 200px)',
      paddingBottom: 60,
      display: 'block',
    }),
  },
  requestCard: {
    elevation: 4,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  requesterName: {
    fontSize: 18,
    marginBottom: 4,
  },
  timeAndDistance: {
    color: theme.colors.placeholder,
    fontSize: 14,
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  urgencyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    marginBottom: 16,
  },
  requestDetails: {
    gap: 8,
  },
  helpType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  description: {
    fontStyle: 'italic',
    backgroundColor: theme.colors.background,
    padding: 12,
    borderRadius: 8,
  },
  location: {
    color: theme.colors.text,
    fontWeight: '500',
  },
  safetyCard: {
    backgroundColor: theme.colors.softLavender,
    marginBottom: 16,
  },
  safetyTitle: {
    color: theme.colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  safetyPoints: {
    gap: 8,
  },
  safetyPoint: {
    fontSize: 14,
    lineHeight: 20,
  },
  responseCard: {
    marginBottom: 16,
  },
  responseTitle: {
    color: theme.colors.primary,
    marginBottom: 8,
  },
  responseSubtitle: {
    color: theme.colors.placeholder,
    marginBottom: 16,
  },
  messageInput: {
    marginBottom: 8,
  },
  actionContainer: {
    gap: 12,
    marginBottom: 20,
  },
  acceptButton: {
    backgroundColor: theme.colors.safeGreen,
    elevation: 4,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  cancelButton: {
    borderColor: theme.colors.placeholder,
  },
});