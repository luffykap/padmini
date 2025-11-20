import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';   // ✅ Web-safe ScrollView
import { 
  Card,
  Title,
  Paragraph,
  List,
  Button,
  Divider,
  Avatar
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/theme';
import config from '../config/production';

export default function SettingsScreen({ navigation }) {
  const { user, userProfile, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      console.log('Sign out initiated...');
      await signOut();
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', error.message || 'Failed to sign out. Please try again.');
    }
  };

  return (
    <View style={styles.screenWrapper}> 
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
      >

        {/* USER PROFILE */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.profileSection}>
              <Avatar.Icon 
                size={60} 
                icon="account" 
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Title>{userProfile?.fullName || 'User'}</Title>
                <Paragraph>{user?.email}</Paragraph>
                <Paragraph style={styles.college}>
                  {userProfile?.college || 'College'}
                </Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* SIGN OUT BUTTON */}
        <View style={styles.fixTouch}>
          <Button
            mode="contained"
            onPress={handleSignOut}
            icon="logout"
            textColor="white"
            style={styles.signOutButton}
            contentStyle={{ paddingVertical: 6 }}
          >
            Sign Out
          </Button>
        </View>

        {/* PRIVACY & SAFETY */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Privacy & Safety</Title>

            <List.Item
              title="Verified Account"
              description="Gender verified with face-api.js (AI)"
              left={props => (
                <List.Icon 
                  {...props} 
                  icon="shield-check" 
                  color={theme.colors.safeGreen} 
                />
              )}
            />

            <Divider />

            <List.Item
              title="Location Services"
              description="Used to find nearby helpers"
              left={props => <List.Icon {...props} icon="map-marker" />}
            />

            <Divider />

            <List.Item
              title="Notifications"
              description="Enabled for emergency alerts"
              left={props => <List.Icon {...props} icon="bell" />}
            />
          </Card.Content>
        </Card>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Paragraph style={styles.footerText}>
            Made with 💝 for campus safety
          </Paragraph>
          <Paragraph style={styles.footerText}>
            © 2025 Pad-Mini
          </Paragraph>
        </View>
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({

  // 🔥 Ensures nothing overlays the ScrollView
  screenWrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
    position: "relative",
    zIndex: 0
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingVertical: 12,
    paddingBottom: 200,
    flexDirection: "column",   // 🔥 Ensures vertical layout
    alignItems: "stretch",     // 🔥 Prevents touch blocking from center layout
  },

  card: {
    width: "90%",
    maxWidth: 600,
    alignSelf: "center",
    marginVertical: 12,
    borderRadius: 16,
    elevation: 3,
  },

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    backgroundColor: theme.colors.primary,
  },

  profileInfo: {
    marginLeft: 15,
  },

  college: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },

  sectionTitle: {
    fontSize: 16,
    marginBottom: 15,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },

  // 🔥 FIX: Ensures sign-out button receives clicks on web
  fixTouch: {
    zIndex: 9999,
    position: "relative",
    width: "90%",
    maxWidth: 600,
    alignSelf: "center",
  },

  signOutButton: {
    backgroundColor: "#FF4D4D",
    borderRadius: 12,
    marginVertical: 12,
    elevation: 2,
  },

  footer: {
    alignItems: "center",
    paddingVertical: 40,
  },

  footerText: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
});

