import  { doc, updateDoc, serverTimestamp, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Track presence connection
let presenceRef: any = null;
let userId: string | null = null;
let onlineStatusInterval: NodeJS.Timeout | null = null;

// Initialize user presence
export const initializeUserPresence = async (uid: string) => {
  if (!uid) return;
  
  userId = uid;
  
  try {
    // Create or update the user's status document
    const userStatusRef = doc(db, 'userStatus', uid);
    presenceRef = userStatusRef;
    
    // Set initial online status
    await setDoc(userStatusRef, {
      online: true,
      lastSeen: serverTimestamp()
    }, { merge: true });
    
    // Set up regular pings to keep status updated
    if (onlineStatusInterval) clearInterval(onlineStatusInterval);
    
    onlineStatusInterval = setInterval(async () => {
      if (presenceRef) {
        try {
          await updateDoc(presenceRef, {
            online: true,
            lastSeen: serverTimestamp()
          });
        } catch (error) {
          console.warn('Error updating presence:', error);
        }
      }
    }, 30000);
    
    // Set up disconnect handler
    window.addEventListener('beforeunload', handleDisconnect);
    
    // Simulate presence for other users
    simulateOtherUsersPresence();
    
    return true;
  } catch (error) {
    console.error('Error initializing presence:', error);
    return false;
  }
};

// Simulate other users' presence (for demo purposes)
const simulateOtherUsersPresence = () => {
  // This is a demo function to simulate other users coming online
  // In a real app, this would be handled by the users' own clients
  
  // Create or update some fake users
  const fakeUsers = [
    { id: 'user_123', online: true },
    { id: 'user_456', online: true },
    { id: 'user_789', online: false }
  ];
  
  fakeUsers.forEach(async (user) => {
    if (user.id !== userId) {
      try {
        const userStatusRef = doc(db, 'userStatus', user.id);
        await setDoc(userStatusRef, {
          online: user.online,
          lastSeen: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.warn(`Error setting up fake user ${user.id}:`, error);
      }
    }
  });
};

// Handle user disconnect
export const handleDisconnect = async () => {
  if (presenceRef && userId) {
    try {
      await updateDoc(presenceRef, {
        online: false,
        lastSeen: serverTimestamp()
      });
    } catch (error) {
      console.warn('Error updating offline status:', error);
    }
  }
  
  if (onlineStatusInterval) {
    clearInterval(onlineStatusInterval);
    onlineStatusInterval = null;
  }
};

// Clean up presence monitoring
export const cleanupPresence = () => {
  if (onlineStatusInterval) {
    clearInterval(onlineStatusInterval);
    onlineStatusInterval = null;
  }
  
  window.removeEventListener('beforeunload', handleDisconnect);
  
  // Set status to offline
  if (presenceRef && userId) {
    updateDoc(presenceRef, {
      online: false,
      lastSeen: serverTimestamp()
    }).catch(console.warn);
  }
  
  presenceRef = null;
  userId = null;
};

// Subscribe to a user's status
export const subscribeToUserStatus = (uid: string, callback: (isOnline: boolean) => void) => {
  if (!uid) return () => {};
  
  const userStatusRef = doc(db, 'userStatus', uid);
  
  const unsubscribe = onSnapshot(
    userStatusRef,
    (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        callback(data.online === true);
      } else {
        // If no document exists, assume offline
        callback(false);
      }
    },
    (error) => {
      console.warn(`Error in user status listener for ${uid}:`, error);
      // On error, assume user is offline
      callback(false);
    }
  );
  
  return unsubscribe;
};
 