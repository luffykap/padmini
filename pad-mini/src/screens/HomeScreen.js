import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, Platform, RefreshControl, Text, Alert } from 'react-native';
import { 
  Button, 
  Title, 
  Paragraph, 
  Card, 
  Badge,
  Avatar,
  Divider,
  ActivityIndicator,
  FAB,
  IconButton,
  Dialog,
  Portal
} from 'react-native-paper';
import { theme } from '../theme/theme';
import { RequestService } from '../services/RequestService';
import { ChatService } from '../services/ChatService';
import { UserStatsService } from '../services/UserStatsService';
import { AuthContext, useAuth } from '../context/AuthContext';

export default function HomeScreen({ navigation }) {
  const { user, userProfile, signOut } = useAuth();
  
  // Use the authenticated user instead of test user
  const currentUser = user ? {
    uid: user.uid,
    name: userProfile?.fullName || user.displayName || `User ${user.uid.slice(-4)}`,
    college: userProfile?.college || 'bit-bangalore.edu.in',
    email: user.email
  } : null;

  // Early return if no authenticated user
  if (!currentUser) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Paragraph style={styles.loadingText}>Loading user...</Paragraph>
      </View>
    );
  }
  
  const [activeRequests, setActiveRequests] = useState([]);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [chatNotifications, setChatNotifications] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    peopleHelped: 0,
    timesHelped: 0,
    communityRating: 0,
    requestsCreated: 0,
    requestsCompleted: 0
  });
  
  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });
  
  // Tab State
  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'other'

  // Firebase unsubscribe functions
  const [unsubscribeRequests, setUnsubscribeRequests] = useState(null);
  const [unsubscribeMyRequests, setUnsubscribeMyRequests] = useState(null);
  const [unsubscribeChats, setUnsubscribeChats] = useState(null);
  const [unsubscribeNotifications, setUnsubscribeNotifications] = useState(null);
  const [unsubscribeStats, setUnsubscribeStats] = useState(null);

  useEffect(() => {
    console.log('HomeScreen: Setting up Firebase real-time listeners for user:', currentUser.uid);
    
    const setupFirebaseListeners = async () => {
      try {
        setLoading(true);

        // 1. Set up nearby requests listener
        const requestsUnsubscribe = await RequestService.getNearbyRequests(currentUser.uid, 2, (requests) => {
          console.log(`Received ${requests.length} nearby requests from Firebase`);
          
          const formattedRequests = requests.map(request => ({
            id: request.id,
            requesterName: request.isAnonymous ? 'Anonymous' : request.requesterName || 'A friend',
            helpType: formatHelpType(request.helpType),
            distance: `${request.distance?.toFixed(1) || '0.1'} km`,
            timeAgo: formatTimeAgo(request.createdAt),
            isAnonymous: request.isAnonymous,
            urgency: request.urgency,
            isAccepted: request.status === 'accepted',
            helperName: request.acceptedBy ? `Helper ${request.acceptedBy.slice(-4)}` : null,
            helperId: request.acceptedBy || null,
            status: request.status
          }));
          
          setNearbyRequests(formattedRequests);
          setLoading(false);
        });
        setUnsubscribeRequests(() => requestsUnsubscribe);

        // 2. Set up user's own requests listener  
        const myRequestsUnsubscribe = await RequestService.getUserRequests(currentUser.uid, (requests) => {
          console.log(`🔍 DEBUG: Received ${requests.length} user's own requests from Firebase`);
          console.log('🔍 DEBUG: Raw requests with status:', requests.map(r => ({ id: r.id, status: r.status })));
          
          const formattedMyRequests = requests.map(request => ({
            id: request.id,
            helpType: formatHelpType(request.helpType),
            description: request.description,
            timeAgo: formatTimeAgo(request.createdAt),
            urgency: request.urgency,
            status: request.status,
            isAnonymous: request.isAnonymous,
            acceptedBy: request.acceptedBy,
            helperName: request.acceptedBy ? `Helper ${request.acceptedBy.slice(-4)}` : null,
            expiresAt: request.expiresAt
          }));
          
          console.log('🔍 DEBUG: Formatted my requests with status:', formattedMyRequests.map(r => ({ id: r.id, status: r.status })));
          
          // Limit to last 2 requests only
          const recentRequests = formattedMyRequests.slice(0, 2);
          console.log('🔍 DEBUG: Limited to recent 2 requests:', recentRequests.length);
          
          setMyRequests(recentRequests);
        });
        setUnsubscribeMyRequests(() => myRequestsUnsubscribe);

        // 3. Set up user chats listener
        const chatsUnsubscribe = await ChatService.getUserChats(currentUser.uid, (chats) => {
          console.log(`Received ${chats.length} active chats from Firebase`);
          setActiveChats(chats);
        });
        setUnsubscribeChats(() => chatsUnsubscribe);

        // 3. Set up notifications listener
        const notificationsUnsubscribe = await ChatService.subscribeToNotifications(currentUser.uid, (notifications) => {
          console.log(`Received ${notifications.length} notifications from Firebase`);
          setChatNotifications(notifications);
        });
        setUnsubscribeNotifications(() => notificationsUnsubscribe);

        // 4. Set up real-time user stats listener
        const statsUnsubscribe = UserStatsService.getUserStats(currentUser.uid, (stats) => {
          console.log('📊 Received real-time stats update:', stats);
          setUserStats(stats);
        });
        setUnsubscribeStats(() => statsUnsubscribe);

      } catch (error) {
        console.error('Error setting up Firebase listeners:', error);
        setLoading(false);
        Alert.alert('Connection Error', 'Unable to connect to Firebase. Please check your internet connection.');
      }
    };

    setupFirebaseListeners();

    // Cleanup function
    return () => {
      console.log('HomeScreen: Cleaning up Firebase listeners');
      if (unsubscribeRequests) unsubscribeRequests();
      if (unsubscribeMyRequests) unsubscribeMyRequests();
      if (unsubscribeChats) unsubscribeChats();
      if (unsubscribeNotifications) unsubscribeNotifications();
      if (unsubscribeStats) unsubscribeStats();
    };
  }, [currentUser.uid]);

    const loadChatNotifications = () => {
      try {
        const notifications = JSON.parse(localStorage.getItem('pad-mini-notifications') || '[]');
        const myRequests = JSON.parse(localStorage.getItem('pad-mini-requests') || '[]');
        const acceptances = JSON.parse(localStorage.getItem('pad-mini-acceptances') || '[]');
        
        // Get notifications for requests created by this user (as requester)
        const myRequestIds = new Set(myRequests.filter(req => req.requesterId === user.uid).map(req => req.id));
        const requesterNotifications = notifications.filter(notif => 
          myRequestIds.has(notif.requestId) && notif.type === 'chat_created'
        );
        
        // Get notifications for requests where this user is the helper
        const myHelperAcceptances = acceptances.filter(acc => acc.helperId === user.uid);
        const helperNotifications = myHelperAcceptances.map(acc => ({
          id: `helper-chat-${acc.id}`,
          type: 'chat_created',
          requestId: acc.requestId,
          chatRoomId: acc.chatRoomId,
          helperId: acc.helperId,
          helperName: acc.helperName,
          message: `You can now chat with the person you're helping!`,
          createdAt: acc.acceptedAt
        }));
        
        // Combine both types of notifications
        const allRelevantNotifications = [...requesterNotifications, ...helperNotifications];
        
        console.log(`Found ${allRelevantNotifications.length} chat notifications for user (${requesterNotifications.length} as requester, ${helperNotifications.length} as helper)`);
        setChatNotifications(allRelevantNotifications);
      } catch (error) {
        console.error('Error loading chat notifications:', error);
      }
    };

    const loadActiveChats = () => {
      try {
        const acceptances = JSON.parse(localStorage.getItem('pad-mini-acceptances') || '[]');
        const myRequests = JSON.parse(localStorage.getItem('pad-mini-requests') || '[]');
        
        // Get chats where I'm the helper (excluding completed ones)
        const myHelperChats = acceptances.filter(acc => 
          acc.helperId === user.uid && acc.status !== 'completed'
        );
        
        // Get chats where I'm the requester (my requests that have been accepted, excluding completed)
        const myRequestIds = new Set(myRequests.filter(req => 
          req.requesterId === user.uid && req.status !== 'completed'
        ).map(req => req.id));
        const myRequesterChats = acceptances.filter(acc => 
          myRequestIds.has(acc.requestId) && acc.status !== 'completed'
        );
        
        // Combine both types of chats and remove duplicates
        const allMyChats = [...myHelperChats];
        myRequesterChats.forEach(chat => {
          if (!allMyChats.find(existing => existing.id === chat.id)) {
            allMyChats.push({
              ...chat,
              isRequester: true // Mark this as a chat where I'm the requester
            });
          }
        });
        
        console.log(`Found ${allMyChats.length} active chats for user (${myHelperChats.length} as helper, ${myRequesterChats.length} as requester)`);
        setActiveChats(allMyChats);
      } catch (error) {
        console.error('Error loading active chats:', error);
      }
    };

    const loadLocalRequests = () => {
      try {
        const localRequests = JSON.parse(localStorage.getItem('pad-mini-requests') || '[]');
        const acceptances = JSON.parse(localStorage.getItem('pad-mini-acceptances') || '[]');
        
        // Create a map of accepted request IDs
        const acceptedRequestIds = new Set(acceptances.map(acc => acc.requestId));
        
        // Filter out own requests and format them
        const otherUserRequests = localRequests
          .filter(req => req.requesterId !== user.uid)
          .slice(0, 10) // Limit to 10 requests
          .map(request => {
            const isAccepted = acceptedRequestIds.has(request.id) || request.status === 'accepted';
            return {
              id: request.id,
              requesterName: request.isAnonymous ? 'Anonymous' : request.requesterName || 'A friend',
              helpType: formatHelpType(request.helpType),
              distance: `${request.distance?.toFixed(1) || '0.1'} km`,
              timeAgo: formatTimeAgo(request.createdAt),
              isAnonymous: request.isAnonymous,
              urgency: request.urgency,
              isAccepted: isAccepted,
              helperName: request.helperName || null,
              helperId: request.helperId || null
            };
          });

        console.log(`Loaded ${otherUserRequests.length} requests from localStorage`);
        setNearbyRequests(otherUserRequests);
        setLoading(false);
      } catch (error) {
        console.error('Error loading local requests:', error);
      }
    };

    // This block was causing the error. It's now correctly wrapped in a useEffect.
    useEffect(() => {
        // Load initial local data
        loadLocalRequests();
        loadChatNotifications();
        loadActiveChats();

        const handleStorageChange = () => {
            console.log('Storage changed, reloading local data...');
            loadLocalRequests();
            loadChatNotifications();
            loadActiveChats();
        };

        // Listen for storage changes from other tabs
        window.addEventListener('storage', handleStorageChange);

        // Cleanup function
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [user]); // Rerun if user changes


  const refreshRequests = () => {
    console.log('Manual refresh triggered...');
    setLoading(true);
    
    // Load from localStorage immediately
    try {
      const localRequests = JSON.parse(localStorage.getItem('pad-mini-requests') || '[]');
      const acceptances = JSON.parse(localStorage.getItem('pad-mini-acceptances') || '[]');
      
      // Create a map of accepted request IDs
      const acceptedRequestIds = new Set(acceptances.map(acc => acc.requestId));
      
      const otherUserRequests = localRequests
        .filter(req => req.requesterId !== user.uid)
        .slice(0, 10)
        .map(request => {
          const isAccepted = acceptedRequestIds.has(request.id) || request.status === 'accepted';
          return {
            id: request.id,
            requesterName: request.isAnonymous ? 'Anonymous' : request.requesterName || 'A friend',
            helpType: formatHelpType(request.helpType),
            distance: `${request.distance?.toFixed(1) || '0.1'} km`,
            timeAgo: formatTimeAgo(request.createdAt),
            isAnonymous: request.isAnonymous,
            urgency: request.urgency,
            isAccepted: isAccepted,
            helperName: request.helperName || null,
            helperId: request.helperId || null
          };
        });

      console.log(`Manual refresh: loaded ${otherUserRequests.length} requests`);
      setNearbyRequests(otherUserRequests);
    } catch (error) {
      console.error('Error during manual refresh:', error);
    }
    
    // Also refresh active chats
    loadActiveChats();
    
    setLoading(false);
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      
      // Try to load real requests from Firebase with real-time sync
      try {
        console.log('Loading real-time requests for user:', user.uid);
        
        // Set up real-time listener for nearby requests
        const unsubscribe = await RequestService.getNearbyRequests(user.uid);
        
        // Note: The Firebase listener will update nearbyRequests in real-time
        console.log('Real-time listener established');
        
        setLoading(false);
        return unsubscribe; // Return cleanup function
      } catch (firebaseError) {
        console.log('Firebase error, using fallback data:', firebaseError);
        
        // Fallback to mock data if Firebase fails
        setNearbyRequests([
          {
            id: '1',
            requesterName: 'Sarah M.',
            helpType: 'Sanitary Pads',
            distance: '0.2 km',
            timeAgo: '2 min ago',
            isAnonymous: false,
            urgency: 'high'
          },
          {
            id: '2',
            requesterName: 'Anonymous',
            helpType: 'Emergency Support',
            distance: '0.5 km',
            timeAgo: '5 min ago',
            isAnonymous: true,
            urgency: 'medium'
          }
        ]);
        
        setLoading(false);
      }

      setActiveRequests([
        {
          id: '3',
          type: 'sent',
          helpType: 'Sanitary Pads',
          status: 'accepted',
          helperName: 'Maya K.',
          timeAgo: '10 min ago'
        }
      ]);
      
    } catch (error) {
      console.error('Error loading requests:', error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const formatHelpType = (type) => {
    const types = {
      'pads': 'Sanitary Pads',
      'tampons': 'Tampons',
      'emergency': 'General Emergency',
      'safety': 'Safety Concern',
      'other': 'Other'
    };
    return types[type] || type;
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const created = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return created.toLocaleDateString();
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      // Navigate to the help response screen for detailed acceptance
      navigation.navigate('HelpResponse', { requestId });
    } catch (error) {
      console.error('Error navigating to help response:', error);
    }
  };

  const handleCompleteRequest = async (requestId) => {
    setConfirmDialog({
      visible: true,
      title: 'Mark as Completed',
      message: 'Mark this request as completed? This will close the chat and update the request status.',
      confirmText: 'Yes, Complete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          console.log('✅ Completing request:', requestId);
          
          // Call completeRequest which will:
          // 1. Update request status to 'completed'
          // 2. Deactivate the associated chat (isActive = false)
          await RequestService.completeRequest(requestId);
          
          console.log('✅ Request completed in Firebase');
          
          // The Firebase real-time listeners will automatically:
          // - Remove the chat from activeChats (filtered by isActive: true)
          // - Update the request in myRequests/nearbyRequests
          
          setConfirmDialog({ ...confirmDialog, visible: false });
          
          // Show success message
          Alert.alert(
            'Request Completed',
            'The request has been marked as completed and the chat has been closed.',
            [{ text: 'OK' }]
          );
          
        } catch (error) {
          console.error('❌ Error completing request:', error);
          Alert.alert('Error', 'Failed to complete request. Please try again.');
          setConfirmDialog({ ...confirmDialog, visible: false });
        }
      }
    });
  };

  const renderMyRequest = (request) => (
    <Card key={request.id} style={[
      styles.requestCard,
      { 
        backgroundColor: request.status === 'completed' ? '#e8f5e8' : 
                        request.status === 'cancelled' ? '#ffeaea' : 
                        theme.colors.primaryContainer,
        borderLeftWidth: 4,
        borderLeftColor: request.status === 'completed' ? theme.colors.safeGreen :
                        request.status === 'cancelled' ? theme.colors.error :
                        theme.colors.primary
      }
    ]}>
      <Card.Content>
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <View style={styles.nameContainer}>
              <Avatar.Text 
                size={40} 
                label="Me"
                style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
              />
              <View style={styles.nameAndDistance}>
                <Title style={styles.requesterName}>
                  {request.isAnonymous ? 'My Anonymous Request' : 'My Request'}
                </Title>
                <Paragraph style={styles.distance}>
                  {request.timeAgo} • Status: {request.status}
                </Paragraph>
              </View>
            </View>
            <Badge 
              style={[
                styles.urgencyBadge,
                { backgroundColor: request.urgency === 'high' ? theme.colors.errorRed : 
                  request.urgency === 'medium' ? theme.colors.warningOrange : theme.colors.safeGreen }
              ]}
            >
              {request.urgency}
            </Badge>
          </View>
          
          <Paragraph style={styles.helpType}>
            🆘 {request.helpType}
          </Paragraph>
          
          {request.description && (
            <Paragraph style={[styles.helpType, { fontStyle: 'italic', marginTop: 4, fontSize: 12 }]}>
              "{request.description}"
            </Paragraph>
          )}

          {request.status === 'accepted' && request.helperName && (
            <Paragraph style={[styles.helpType, { color: theme.colors.safeGreen, marginTop: 4 }]}>
              ✅ Being helped by {request.helperName}
            </Paragraph>
          )}
          
          {/* Conditional rendering based on request status */}
          
          {/* ACTIVE REQUESTS: Show Complete + Cancel buttons */}
          {request.status === 'active' && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Button
                mode="outlined"
                onPress={() => {
                  setConfirmDialog({
                    visible: true,
                    title: 'Cancel Request',
                    message: 'Are you sure you want to cancel this help request?',
                    confirmText: 'Yes, Cancel',
                    cancelText: 'No',
                    onConfirm: async () => {
                      try {
                        await RequestService.cancelRequest(request.id);
                        setConfirmDialog({ ...confirmDialog, visible: false });
                      } catch (error) {
                        console.error('Cancel error:', error);
                        Alert.alert('Error', 'Failed to cancel request');
                        setConfirmDialog({ ...confirmDialog, visible: false });
                      }
                    }
                  });
                }}
                style={{ borderColor: theme.colors.error, flex: 1 }}
                textColor={theme.colors.error}
              >
                ❌ Cancel
              </Button>
              <Button
                mode="contained"
                onPress={() => {
                  setConfirmDialog({
                    visible: true,
                    title: 'Mark as Completed',
                    message: 'Mark this request as completed?',
                    confirmText: 'Yes, Complete',
                    cancelText: 'Cancel',
                    onConfirm: async () => {
                      try {
                        await RequestService.completeRequest(request.id);
                        setConfirmDialog({ ...confirmDialog, visible: false });
                      } catch (error) {
                        console.error('Complete error:', error);
                        Alert.alert('Error', 'Failed to complete request');
                        setConfirmDialog({ ...confirmDialog, visible: false });
                      }
                    }
                  });
                }}
                style={{ backgroundColor: theme.colors.safeGreen, flex: 1 }}
              >
                ✅ Complete
              </Button>
            </View>
          )}

          {/* ACCEPTED REQUESTS: Show Chat + Complete buttons */}
          {request.status === 'accepted' && request.chatRoomId && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Chat', { 
                  requestId: request.id,
                  chatRoomId: request.chatRoomId,
                  isHelper: false 
                })}
                style={{ backgroundColor: theme.colors.primary, flex: 1 }}
              >
                💬 Chat
              </Button>
              <Button
                mode="contained"
                onPress={() => {
                  setConfirmDialog({
                    visible: true,
                    title: 'Mark Complete',
                    message: 'Mark this request as completed?',
                    confirmText: 'Yes, Complete',
                    cancelText: 'No',
                    onConfirm: async () => {
                      try {
                        await RequestService.completeRequest(request.id);
                        setConfirmDialog({ ...confirmDialog, visible: false });
                      } catch (error) {
                        Alert.alert('Error', 'Failed to complete');
                        setConfirmDialog({ ...confirmDialog, visible: false });
                      }
                    }
                  });
                }}
                style={{ backgroundColor: theme.colors.safeGreen, flex: 1 }}
              >
                ✅ Complete
              </Button>
            </View>
          )}

          {/* COMPLETED REQUESTS: Show completion banner only */}
          {request.status === 'completed' && (
            <View style={[styles.statusMessageContainer, { backgroundColor: '#d4edda', borderColor: theme.colors.safeGreen, marginTop: 12 }]}>
              <Paragraph style={[styles.statusMessage, { color: theme.colors.safeGreen }]}>
                ✅ Request Completed - Thank you for using our service!
              </Paragraph>
            </View>
          )}

          {/* CANCELLED REQUESTS: Show cancellation banner only */}
          {request.status === 'cancelled' && (
            <View style={[styles.statusMessageContainer, { backgroundColor: '#f8d7da', borderColor: theme.colors.error, marginTop: 12 }]}>
              <Paragraph style={[styles.statusMessage, { color: theme.colors.error }]}>
                ❌ Request Cancelled
              </Paragraph>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderNearbyRequest = (request) => (
    <Card key={request.id} style={[
      styles.requestCard,
      request.isAccepted && { backgroundColor: theme.colors.surface, opacity: 0.7 }
    ]}>
      <Card.Content>
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <View style={styles.nameContainer}>
              <Avatar.Text 
                size={40} 
                label={request.isAnonymous ? 'A' : request.requesterName.charAt(0)}
                style={styles.avatar}
              />
              <View style={styles.nameAndDistance}>
                <Title style={[
                  styles.requesterName,
                  request.isAccepted && { color: theme.colors.disabled }
                ]}>
                  {request.requesterName}
                </Title>
                <Paragraph style={[
                  styles.distance,
                  request.isAccepted && { color: theme.colors.disabled }
                ]}>
                  {request.distance} away • {request.timeAgo}
                </Paragraph>
              </View>
            </View>
            <Badge 
              style={[
                styles.urgencyBadge,
                request.isAccepted 
                  ? { backgroundColor: theme.colors.surfaceVariant }
                  // ... rest of the styles
                  : { backgroundColor: request.urgency === 'high' ? theme.colors.errorRed : theme.colors.warningOrange }
              ]}
            >
              {request.isAccepted ? 'helped' : request.urgency}
            </Badge>
          </View>
          
          <Paragraph style={[
            styles.helpType,
            request.isAccepted && { color: theme.colors.disabled }
          ]}>
            Needs: {request.helpType}
          </Paragraph>
          
          {request.isAccepted && request.helperName && (
            <Paragraph style={[styles.helpType, { fontStyle: 'italic', marginTop: 4 }]}>
              Being helped by {request.helperName} ✅
            </Paragraph>
          )}
          
          <View style={styles.requestActions}>
            {request.isAccepted ? (
              // Show different options based on user relationship to the request
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {request.helperId === user.uid && request.chatRoomId && (
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('Chat', { 
                      requestId: request.id,
                      chatRoomId: request.chatRoomId,
                      isHelper: true 
                    })}
                    style={[styles.acceptButton, { backgroundColor: theme.colors.primary, flex: 1 }]}
                    contentStyle={styles.buttonContent}
                  >
                    💬 Open Chat
                  </Button>
                )}
                <Button
                  mode="outlined"
                  style={[styles.acceptButton, { flex: request.helperId === user.uid ? 1 : undefined }]}
                  contentStyle={styles.buttonContent}
                  disabled
                >
                  {request.helperId === user.uid ? 'You\'re Helping' : 'Already Helped'}
                </Button>
              </View>
            ) : (
              <Button
                mode="contained"
                onPress={() => handleAcceptRequest(request.id)}
                style={styles.acceptButton}
                contentStyle={styles.buttonContent}
              >
                Accept & Help
              </Button>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderActiveRequest = (request) => (
    <Card key={request.id} style={styles.activeCard}>
      <Card.Content>
        <View style={styles.activeHeader}>
          <Title style={styles.activeTitle}>
            {request.type === 'sent' ? 'Your Request' : 'Helping Someone'}
          </Title>
          <Badge style={styles.statusBadge}>
            {request.status}
          </Badge>
        </View>
        <Paragraph style={styles.activeDetails}>
          {request.type === 'sent' 
            ? `${request.helperName} is coming to help with ${request.helpType}`
            : `You're helping with ${request.helpType}`
          }
        </Paragraph>
        {request.chatRoomId && (
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Chat', { 
              requestId: request.id,
              chatRoomId: request.chatRoomId,
              isHelper: request.type !== 'sent'
            })}
            style={styles.chatButton}
          >
            Open Chat
          </Button>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.scrollContainer}>
        <View style={styles.content}>
        
        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Paragraph style={styles.loadingText}>Loading your dashboard...</Paragraph>
          </View>
        )}
        
        {/* User Stats */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.statsTitle}>Your Impact</Title>
            <Paragraph style={styles.userInfo}>
              {currentUser.name}
            </Paragraph>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Title style={styles.statNumber}>{userStats.peopleHelped}</Title>
                <Paragraph style={styles.statLabel}>People Helped</Paragraph>
              </View>
              <View style={styles.statItem}>
                <Title style={styles.statNumber}>{userStats.timesHelped}</Title>
                <Paragraph style={styles.statLabel}>Times Helped</Paragraph>
              </View>
              <View style={styles.statItem}>
                <Title style={styles.statNumber}>{userStats.communityRating}</Title>
                <Paragraph style={styles.statLabel}>Community Rating</Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Chat Access - Show ongoing chats */}
        {activeChats.length > 0 && (
          <View style={styles.section}>
            <Title style={styles.sectionTitle}>💬 Your Active Chats</Title>
            {activeChats.map(chat => (
              <Card key={chat.id} style={[styles.requestCard, { backgroundColor: theme.colors.primaryContainer }]}>
                <Card.Content>
                  <View style={styles.requestHeader}>
                    <View style={{ flex: 1 }}>
                      <Paragraph style={styles.helpType}>
                        {chat.isRequester ? '🆘' : '💼'} Chat for request #{chat.requestId.slice(-4)}
                        {chat.isRequester && <Text style={{ fontSize: 12, fontStyle: 'italic' }}> (your request)</Text>}
                      </Paragraph>
                    </View>
                    <View style={[styles.requestActions, { flexDirection: 'row', gap: 8 }]}>
                      <Button
                        mode="contained"
                        onPress={() => navigation.navigate('Chat', { 
                          requestId: chat.requestId,
                          chatRoomId: chat.chatRoomId,
                          isHelper: !chat.isRequester // If I'm the requester, I'm not the helper
                        })}
                        style={[styles.acceptButton, { backgroundColor: theme.colors.primary }]}
                        contentStyle={styles.buttonContent}
                      >
                        Continue Chat
                      </Button>
                      <Button
                        mode="outlined"
                        onPress={() => handleCompleteRequest(chat.requestId)}
                        style={[styles.acceptButton, { borderColor: theme.colors.safeGreen }]}
                        contentStyle={styles.buttonContent}
                        textColor={theme.colors.safeGreen}
                      >
                        ✅ Complete
                      </Button>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {/* Request Help Button */}
        <Card style={styles.requestButtonCard}>
          <Card.Content>
            <Button
              mode="contained"
              icon="plus-circle"
              onPress={() => navigation.navigate('RequestHelp')}
              style={styles.requestHelpButton}
              contentStyle={styles.requestButtonContent}
            >
              🆘 Request Emergency Help
            </Button>
            <Paragraph style={styles.requestHelpSubtext}>
              Need help with medical supplies, emergency support, or safety assistance? 
              Connect with verified BIT Bangalore students nearby.
            </Paragraph>
          </Card.Content>
        </Card>

        {/* Tab Buttons */}
        <View style={styles.tabContainer}>
          <Button
            mode={activeTab === 'mine' ? 'contained' : 'outlined'}
            onPress={() => setActiveTab('mine')}
            style={styles.tabButton}
          >
            📋 My Requests ({myRequests.length})
          </Button>
          <Button
            mode={activeTab === 'other' ? 'contained' : 'outlined'}
            onPress={() => setActiveTab('other')}
            style={styles.tabButton}
          >
            🆘 Other Requests ({nearbyRequests.length})
          </Button>
        </View>

        {/* My Requests Tab Content */}
        {activeTab === 'mine' && (
          <View style={styles.section}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginBottom: 12,
            }}>
              <IconButton
                icon="refresh"
                size={20}
                onPress={async () => {
                  console.log('🔄 Manual refresh of user requests...');
                  try {
                    // Force reload user requests
                    const userRequests = await RequestService.getUserRequestsOnce(user.uid);
                    console.log('🔄 Manually fetched requests:', userRequests.map(r => ({ id: r.id, status: r.status })));
                    
                    const formattedRequests = userRequests.map(request => ({
                      id: request.id,
                      helpType: formatHelpType(request.helpType),
                      description: request.description,
                      timeAgo: formatTimeAgo(request.createdAt),
                      urgency: request.urgency,
                      status: request.status,
                      isAnonymous: request.isAnonymous,
                      acceptedBy: request.acceptedBy,
                      helperName: request.acceptedBy ? `Helper ${request.acceptedBy.slice(-4)}` : null,
                      expiresAt: request.expiresAt,
                      chatRoomId: request.chatRoomId
                    }));
                    
                    // Limit to last 2 requests only
                    const recentRequests = formattedRequests.slice(0, 2);
                    setMyRequests(recentRequests);
                  } catch (error) {
                    console.error('Error refreshing requests:', error);
                  }
                }}
              />
            </View>
            {myRequests.length > 0 ? (
              myRequests.map(renderMyRequest)
            ) : (
              <Card style={styles.requestCard}>
                <Card.Content>
                  <View style={styles.noRequestsContainer}>
                    <Text style={styles.noRequestsText}>
                      📝 No requests yet
                    </Text>
                    <Text style={styles.noRequestsSubtext}>
                      Your help requests will appear here
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            )}
          </View>
        )}

        {/* Other Requests Tab Content */}
        {activeTab === 'other' && (
          <View style={styles.section}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginBottom: 12,
            }}>
              <IconButton
                icon="refresh"
                size={20}
                onPress={() => {
                  console.log('🔄 Refreshing nearby requests...');
                  setRefreshing(true);
                  setTimeout(() => setRefreshing(false), 1000);
                }}
              />
            </View>
            {nearbyRequests.length > 0 ? (
              nearbyRequests.map(renderNearbyRequest)
            ) : (
              <Card style={styles.requestCard}>
                <Card.Content>
                  <View style={styles.noRequestsContainer}>
                    <Text style={styles.noRequestsText}>
                      🌸 No requests in your area right now
                    </Text>
                    <Text style={styles.noRequestsSubtext}>
                      Your help will be appreciated when someone needs it!
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            )}
          </View>
        )}



        {/* Safety Tips */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Safety Tips</Title>
          <Card style={styles.requestCard}>
            <Card.Content>
              <Paragraph style={{ fontSize: 14, marginBottom: 4 }}>• Always meet helpers in public areas</Paragraph>
              <Paragraph style={{ fontSize: 14, marginBottom: 4 }}>• Share your location with trusted contacts</Paragraph>
              <Paragraph style={{ fontSize: 14, marginBottom: 4 }}>• Use the in-app chat for communication</Paragraph>
              <Paragraph style={{ fontSize: 14, marginBottom: 4 }}>• Report any suspicious behavior immediately</Paragraph>
              <Paragraph style={{ fontSize: 14, marginBottom: 4 }}>• Trust your instincts - safety comes first</Paragraph>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.section}>
          <Title style={styles.sectionTitle}>App Features</Title>
          <Card style={styles.requestCard}>
            <Card.Content>
              <Paragraph style={{ fontSize: 14, marginBottom: 4 }}>✅ Emergency help requests</Paragraph>
              <Paragraph style={{ fontSize: 14, marginBottom: 4 }}>✅ Location-based matching</Paragraph>
              <Paragraph style={{ fontSize: 14, marginBottom: 4 }}>✅ Secure chat system</Paragraph>
              <Paragraph style={{ fontSize: 14, marginBottom: 4 }}>✅ Anonymous support option</Paragraph>
              <Paragraph style={{ fontSize: 14, marginBottom: 4 }}>✅ Community rating system</Paragraph>
              <Paragraph style={{ fontSize: 14, marginBottom: 4 }}>✅ 24/7 support availability</Paragraph>
            </Card.Content>
          </Card>
        </View>
        </View>
      </View>

      <FAB
        icon="plus"
        label="Request Help"
        style={styles.fab}
        onPress={() => navigation.navigate('RequestHelp')}
        size="medium"
        mode="surface"
      />

      {/* Confirmation Dialog */}
      <Portal>
        <Dialog 
          visible={confirmDialog.visible} 
          onDismiss={() => setConfirmDialog({ ...confirmDialog, visible: false })}
        >
          <Dialog.Title>{confirmDialog.title}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{confirmDialog.message}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDialog({ ...confirmDialog, visible: false })}>
              {confirmDialog.cancelText}
            </Button>
            <Button 
              mode="contained" 
              onPress={() => {
                if (confirmDialog.onConfirm) {
                  confirmDialog.onConfirm();
                }
              }}
            >
              {confirmDialog.confirmText}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flex: 1,
    overflow: 'auto',
    maxHeight: '100vh',
  },
  content: {
    paddingBottom: 120,
  },
  statsCard: {
    margin: 16,
    elevation: 4,
  },
  statsTitle: {
    textAlign: 'center',
    color: theme.colors.primary,
    marginBottom: 16,
  },
  userInfo: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.colors.placeholder,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    color: theme.colors.text,
  },
  requestCard: {
    marginBottom: 12,
    elevation: 2,
  },
  requestHeader: {
    gap: 12,
  },
  requestInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  nameAndDistance: {
    marginLeft: 12,
    flex: 1,
  },
  requesterName: {
    fontSize: 16,
    marginBottom: 2,
  },
  distance: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  urgencyBadge: {
    alignSelf: 'flex-start',
  },
  helpType: {
    fontStyle: 'italic',
    color: theme.colors.text,
  },
  requestActions: {
    alignItems: 'flex-end',
  },
  acceptButton: {
    backgroundColor: theme.colors.safeGreen,
  },
  buttonContent: {
    paddingVertical: 4,
  },
  activeCard: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: theme.colors.lightPink,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeTitle: {
    fontSize: 16,
    color: theme.colors.primary,
  },
  statusBadge: {
    backgroundColor: theme.colors.safeGreen,
  },
  activeDetails: {
    marginBottom: 12,
  },
  chatButton: {
    borderColor: theme.colors.primary,
  },
  emptyCard: {
    elevation: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.placeholder,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: theme.colors.primary,
    zIndex: 1000,
    elevation: 8,
  },
  requestButtonCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 3,
    backgroundColor: 'white',
  },
  requestHelpButton: {
    marginVertical: 8,
    backgroundColor: theme.colors.primary,
  },
  requestButtonContent: {
    paddingVertical: 8,
  },
  requestHelpSubtext: {
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: 14,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  tabButton: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
    color: theme.colors.placeholder,
  },
  noRequestsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noRequestsText: {
    fontSize: 16,
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  noRequestsSubtext: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  acceptedRequestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusMessageContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  tabButton: {
    flex: 1,
  },
});