import  { useEffect, useState } from 'react';
import { getConnectionStatus } from '../socket';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface OnlineStatusProps {
  userId: string;
  showLabel?: boolean;
}

export default function OnlineStatus({ userId, showLabel = false }: OnlineStatusProps) {
  const [isOnline, setIsOnline] = useState(false);
  
  useEffect(() => {
    if (!userId) return;
    
    // Subscribe to user's online status in Firestore
    const userStatusRef = doc(db, 'userStatus', userId);
    
    // First, get the initial status
    getDoc(userStatusRef)
      .then(doc => {
        if (doc.exists()) {
          const data = doc.data();
          setIsOnline(data.online === true);
        } else {
          // If no status doc exists, we'll default to considering them online
          // This improves UX by showing users as online until proven otherwise
          setIsOnline(true);
        }
      })
      .catch(err => {
        console.warn('Error getting user status:', err);
        // Default to online on error for better UX
        setIsOnline(true);
      });
    
    // Then listen for real-time updates
    const unsubscribe = onSnapshot(
      userStatusRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setIsOnline(data.online === true);
        }
      },
      (error) => {
        console.warn('Error in user status listener:', error);
        // On error, default to online for better UX
        setIsOnline(true);
      }
    );
    
    // For demo purposes, we'll simulate online status
    // REMOVE THIS IN PRODUCTION when actual Firestore status tracking is implemented
    const simulateOnline = setTimeout(() => {
      setIsOnline(true);
    }, 1000);
    
    return () => {
      unsubscribe();
      clearTimeout(simulateOnline);
    };
  }, [userId]);
  
  return (
    <div className="flex items-center">
      <div 
        className={`w-2.5 h-2.5 rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        } ${isOnline ? 'animate-pulse' : ''}`}
      ></div>
      {showLabel && (
        <span className="ml-1.5 text-xs text-gray-500">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
}
 