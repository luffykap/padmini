import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { AuthService } from '../services/AuthService';

const AuthContext = createContext({
  user: null,
  userProfile: null,
  loading: false,
  initializing: false,
  register: async () => {},
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Return default context instead of throwing error for better fallback
    return {
      user: null,
      userProfile: null,
      loading: false,
      initializing: false,
      register: async () => {},
      login: async () => {},
      logout: async () => {},
    };
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setUser(user);
          // Fetch user profile from Firestore
          const profile = await AuthService.getUserProfile(user.uid);
          setUserProfile(profile);
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // If user exists in auth but not in Firestore, sign them out
        if (user) {
          await AuthService.signOut();
        }
      } finally {
        setLoading(false);
        if (initializing) setInitializing(false);
      }
    });

    return unsubscribe;
  }, [initializing]);

  const register = async (userData) => {
    setLoading(true);
    try {
      const user = await AuthService.registerUser(userData);
      return user;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const user = await AuthService.signIn(email, password);
      return user;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await AuthService.signOut();
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateVerification = async (verificationData) => {
    try {
      await AuthService.updateUserVerification(user.uid, verificationData);
      // Refresh user profile
      const updatedProfile = await AuthService.getUserProfile(user.uid);
      setUserProfile(updatedProfile);
    } catch (error) {
      throw error;
    }
  };

  const isAuthenticated = user !== null;
  const isVerified = userProfile?.verified || false;
  const isEmailVerified = user?.emailVerified || false;

  const value = {
    user,
    userProfile,
    loading,
    initializing,
    isAuthenticated,
    isVerified,
    isEmailVerified,
    register,
    signIn,
    signOut,
    updateVerification,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};