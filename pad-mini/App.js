import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Suppress known GiftedChat ref warnings (library issue, doesn't affect functionality)
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args[0];
  if (typeof message === 'string') {
    // Suppress ref-related warnings from GiftedChat library
    if (message.includes('`ref` is not a prop') || 
        message.includes('Function components cannot be given refs')) {
      return; // Suppress these specific warnings
    }
  }
  originalWarn.apply(console, args);
};

// Import context
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Import screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import GenderVerificationScreen from './src/screens/GenderVerificationScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import { OTPRegisterScreen } from './src/screens/OTPRegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import RequestHelpScreen from './src/screens/RequestHelpScreen';
import HelpResponseScreen from './src/screens/HelpResponseScreen';
import ChatScreen from './src/screens/ChatScreen';

// Import theme
import { theme } from './src/theme/theme';
import { View, ActivityIndicator } from 'react-native';

const Stack = createStackNavigator();

function AppNavigator() {
  const { user, userProfile, loading, initializing, isVerified } = useAuth();

  // Show loading spinner while initializing auth
  if (initializing || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // If user is not authenticated, show auth flow
  if (!user) {
    return (
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="GenderVerification" 
          component={GenderVerificationScreen}
          options={{ title: 'Gender Verification' }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ title: 'Join Pad-Mini' }}
        />
        <Stack.Screen 
          name="OTPRegister" 
          component={OTPRegisterScreen}
          options={{ title: 'College Email Verification' }}
        />
      </Stack.Navigator>
    );
  }

  // If user is authenticated, show main app
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: 'Pad-Mini',
          headerLeft: null,
          gestureEnabled: false
        }}
      />
      <Stack.Screen 
        name="RequestHelp" 
        component={RequestHelpScreen}
        options={{ title: 'Request Help' }}
      />
      <Stack.Screen 
        name="HelpResponse" 
        component={HelpResponseScreen}
        options={{ title: 'Help Someone' }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: 'Private Chat' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="auto" backgroundColor={theme.colors.primary} />
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}