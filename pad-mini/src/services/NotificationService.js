import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  static async requestPermission() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        throw new Error('Permission not granted for notifications');
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#e91e63',
        });
      }

      return finalStatus;
    } catch (error) {
      throw new Error('Failed to get notification permissions');
    }
  }

  static async getExpoPushToken() {
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (error) {
      throw new Error('Failed to get push token');
    }
  }

  static async sendLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send local notification:', error);
    }
  }

  static async scheduleNotification(title, body, triggerDate, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: triggerDate,
      });
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }

  static async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  }

  // Helper methods for app-specific notifications
  static async notifyHelpRequest(helpType, distance) {
    await this.sendLocalNotification(
      'Help Request Nearby',
      `Someone needs ${helpType} about ${distance}km away`,
      { type: 'help_request' }
    );
  }

  static async notifyRequestAccepted(helperName) {
    await this.sendLocalNotification(
      'Help is Coming!',
      `${helperName} is coming to help you`,
      { type: 'request_accepted' }
    );
  }

  static async notifyNewMessage(senderName) {
    await this.sendLocalNotification(
      'New Message',
      `${senderName} sent you a message`,
      { type: 'new_message' }
    );
  }
}