// Firebase Configuration Service
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA4dHDly0vETN0dFdPL4FNOdVgTE4a93F4",
  authDomain: "aieasyeayv2.firebaseapp.com",
  projectId: "aieasyeayv2",
  storageBucket: "aieasyeayv2.firebasestorage.app",
  messagingSenderId: "928527409357",
  appId: "1:928527409357:web:ca63a47da60d3b7335c984",
  measurementId: "G-D0E1ERQYF5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// Export the app instance
export default app;