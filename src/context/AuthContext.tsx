import  { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User } from '../types';
import { setupSocketUser, disconnectSocket } from '../socket';
import { initializeUserPresence, cleanupPresence, handleDisconnect } from '../services/UserStatusService';

interface AuthContextProps {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function signup(email: string, password: string, displayName: string) {
    try {
      // Firebase signup
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName });
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: displayName,
        email: email.toLowerCase(),
        photoURL: null,
        createdAt: new Date()
      });
      
      // Set up user presence
      await initializeUserPresence(user.uid);
    } catch (error) {
      console.error("Error during signup:", error);
      throw error;
    }
  }

  async function login(email: string, password: string) {
    try {
      // Firebase login
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Initialize presence
      await initializeUserPresence(user.uid);
      
      return user;
    } catch (error) {
      console.error("Error during login:", error);
      throw error;
    }
  }

  async function logout() {
    try {
      // Set status to offline
      await handleDisconnect();
      
      // Clean up presence monitoring
      cleanupPresence();
      
      // Disconnect socket
      disconnectSocket();
      
      // Logout from Firebase
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error during logout:", error);
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || userDoc.data().displayName,
              photoURL: user.photoURL || userDoc.data().photoURL
            };
            
            setCurrentUser(userData);
            
            // Set up socket with user ID for real-time messaging
            setupSocketUser(user.uid);
            
            // Initialize presence system
            await initializeUserPresence(user.uid);
          } else {
            // If user doc doesn't exist, create it
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
              createdAt: new Date()
            });
            
            const userData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL
            };
            
            setCurrentUser(userData);
            
            // Set up socket with user ID for real-time messaging
            setupSocketUser(user.uid);
            
            // Initialize presence system
            await initializeUserPresence(user.uid);
          }
        } catch (error) {
          console.error("Error setting up user:", error);
        }
      } else {
        // Clean up presence monitoring
        cleanupPresence();
        
        // Disconnect socket when logging out
        disconnectSocket();
        
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      disconnectSocket();
      cleanupPresence();
    };
  }, []);

  // Handle page unload to set user as offline
  useEffect(() => {
    window.addEventListener('beforeunload', handleDisconnect);
    
    return () => {
      window.removeEventListener('beforeunload', handleDisconnect);
      cleanupPresence();
    };
  }, []);

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
 