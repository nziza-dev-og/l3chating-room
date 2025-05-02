import { db, safeOnSnapshot, safeQuery } from '../firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, orderBy, where, limit } from 'firebase/firestore';
import socket from '../socket'; // import your socket instance

// Replace proxy URL with your server's base URL
const SERVER_URL = 'http://localhost:5000';

export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'friend_request' | 'system';
  title: string;
  body: string;
  isRead: boolean;
  timestamp: any;
  data?: Record<string, any>;
}

/**
 * Send a notification: stores in Firestore, emits via WebSocket, and attempts server-side push
 */
export async function sendNotification(
  userId: string,
  notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>
) {
  try {
    const notificationsRef = collection(db, 'notifications');
    // Add notification to Firestore
    const docRef = await addDoc(notificationsRef, {
      userId,
      ...notification,
      isRead: false,
      timestamp: serverTimestamp(),
    });

    const notifWithId: Notification = {
      id: docRef.id,
      userId,
      ...notification,
      isRead: false,
      timestamp: new Date(),
    };

    // Emit notification over WebSocket to server
    socket.emit('notification', notifWithId);

    // Attempt to trigger server-side push endpoint
    try {
      const TARGET_URL = `${SERVER_URL}/api/push-notifications`;
      await fetch(TARGET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifWithId),
      });
    } catch (pushError) {
      console.warn('Server push notification failed:', pushError);
    }

    return docRef.id;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

/**
 * Subscribe to Firestore notifications and to socket notifications
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
) {
  if (!userId) return () => {};

  // Local cache for merging Firestore and real-time socket
  let currentNotifs: Notification[] = [];

  // Firestore subscription
  const unsubscribeDb = safeOnSnapshot(
    'notifications',
    [where('userId', '==', userId), orderBy('timestamp', 'desc'), limit(50)],
    {
      next: (snapshot) => {
        currentNotifs = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            userId: d.userId,
            type: d.type,
            title: d.title,
            body: d.body,
            isRead: d.isRead,
            timestamp: d.timestamp,
            data: d.data,
          };
        });
        callback([...currentNotifs]);
      },
      error: (error) => {
        console.error('Error in notifications snapshot listener:', error);
      },
    }
  );

  // Socket subscription
  const socketHandler = (notif: Notification) => {
    if (notif.userId === userId) {
      currentNotifs = [notif, ...currentNotifs];
      callback([...currentNotifs]);
    }
  };
  socket.on('notification', socketHandler);

  // Return cleanup
  return () => {
    unsubscribeDb();
    socket.off('notification', socketHandler);
  };
}

/**
 * Mark a single notification as read in Firestore and notify server
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { isRead: true });
    // Emit read event
    socket.emit('notificationRead', { id: notificationId });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user and notify server
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { data, success } = await safeQuery('notifications', [
      where('userId', '==', userId),
      where('isRead', '==', false),
    ]);
    if (success) {
      const updatePromises = data.docs.map((docSnap) =>
        updateDoc(docSnap.ref, { isRead: true })
      );
      await Promise.all(updatePromises);
      // Emit bulk read event
      socket.emit('notificationReadAll', { userId });
      return data.size;
    }
    return 0;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return 0;
  }
}
