import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import userService from '../services/userService';

const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Google provider for social login
  const googleProvider = new GoogleAuthProvider();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        
        // Check if user exists in Firestore, create if not
        await ensureUserDocument(userData);
        setUser(userData);
        
        // Set user in userService for Firestore operations
        userService.setCurrentUser(userData);
      } else {
        // User is signed out
        setUser(null);
        userService.setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Ensure user document exists in Firestore
  const ensureUserDocument = async (userData) => {
    try {
      const userRef = doc(db, 'users', userData.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Create new user document with default data
        const newUserData = {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName || '',
          photoURL: userData.photoURL || '',
          
          // Usage & Billing
          totalGenerations: 0,
          totalSpent: 0,
          totalCosts: 0, // What we pay to Runware
          
          // Storage Plan
          storagePlan: {
            type: 'free', // 'free', 'basic', 'premium', 'unlimited'
            spaceUsed: 0,
            spaceLimit: 0, // 0 = no limit for free (just time-based)
            expiryDate: null,
            autoRenew: false
          },
          
          // Admin role
          role: 'user', // 'user' or 'admin'
          
          // Timestamps
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        
        await setDoc(userRef, newUserData);
        console.log('✅ New user document created:', newUserData);
      } else {
        // Update last login
        await setDoc(userRef, { 
          lastLogin: new Date().toISOString() 
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error ensuring user document:', error);
    }
  };

  // Register with email and password
  const register = async (email, password, displayName = '') => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name if provided
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Login with email and password
  const login = async (email, password) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Check if user is admin
  const isAdmin = async () => {
    if (!user) return false;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        return userData.role === 'admin';
      }
      
      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    loginWithGoogle,
    logout,
    isAdmin,
    userService, // Add userService to context
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};