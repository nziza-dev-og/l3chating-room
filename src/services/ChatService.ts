import { 
  collection,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
  updateDoc,
  doc,
  where,
  onSnapshot,
  getDoc,
  writeBatch,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db, safeOnSnapshot, safeQuery, getAllDocuments, safeGetDoc } from '../firebase';
import socket from '../socket'; // real Socket.IO client instance
import { User, Chat, Message } from '../types';

// Proxy endpoint on your server
const PROXY_URL = 'http://localhost:5000/proxy';

/**
 * Fetch all users from Firestore
 */
export async function fetchUsers(): Promise<User[]> {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        uid: docSnap.id,
        displayName: data.displayName,
        email: data.email,
        photoURL: data.photoURL
      };
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

/**
 * Get existing chat or create a new one between two users
 */
export async function getOrCreateChat(currentUserId: string, otherUserId: string): Promise<string> {
  try {
    let chatId = await findExistingChat(currentUserId, otherUserId);
    if (chatId) return chatId;

    const currentUserDoc = await safeGetDoc(`users/${currentUserId}`);
    const otherUserDoc = await safeGetDoc(`users/${otherUserId}`);
    if (!currentUserDoc || !otherUserDoc) throw new Error('User not found');

    const chatData = {
      userIds: [currentUserId, otherUserId],
      users: {
        [currentUserId]: currentUserDoc.data(),
        [otherUserId]: otherUserDoc.data()
      },
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    };

    const newChatRef = await addDoc(collection(db, 'chats'), chatData);
    return newChatRef.id;
  } catch (error) {
    console.error('Error getting or creating chat:', error);
    throw error;
  }
}

async function findExistingChat(userId1: string, userId2: string): Promise<string | null> {
  try {
    const result = await safeQuery('chats', [where('userIds', 'array-contains', userId1)]);
    if (result.success) {
      for (const docSnap of result.data.docs) {
        const data = docSnap.data() as Chat;
        if (data.userIds.includes(userId2)) return docSnap.id;
      }
    }
    if (!result.success) {
      const all = await getAllDocuments('chats');
      if (all.success) {
        for (const docSnap of all.data) {
          const data = docSnap.data() as Chat;
          if (data.userIds.includes(userId1) && data.userIds.includes(userId2)) return docSnap.id;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error finding chat:', error);
    return null;
  }
}

/**
 * Send a message: writes to Firestore, updates chat metadata, emits via WebSocket
 */
export async function sendMessage(chatId: string, senderId: string, text: string): Promise<string> {
  if (!chatId || !senderId || !text.trim()) throw new Error('Invalid data');

  const messagesRef = collection(db, `chats/${chatId}/messages`);
  const chatRef = doc(db, 'chats', chatId);
  const batch = writeBatch(db);

  const newMessageRef = doc(messagesRef);
  batch.set(newMessageRef, {
    senderId,
    text,
    timestamp: serverTimestamp(),
    read: false
  });
  batch.update(chatRef, {
    lastMessage: { text, senderId },
    lastUpdated: serverTimestamp()
  });
  await batch.commit();

  // Real-time emit
  const sent: Message = { id: newMessageRef.id, chatId, senderId, text, timestamp: new Date() };
  socket.emit('sendMessage', sent);

  // Notify via server proxy
  const target = `/chat-notifications`;
  fetch(`${PROXY_URL}?url=${encodeURIComponent('http://localhost:5000' + target)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, senderId, messageId: newMessageRef.id, text, timestamp: new Date().toISOString() })
  }).catch(err => console.error('Proxy notification error:', err));

  return newMessageRef.id;
}

/**
 * Subscribe to message updates via Firestore and WebSocket
 */
export function subscribeToMessages(chatId: string, callback: (msgs: Message[]) => void): () => void {
  if (!chatId) return () => {};
  let current: Message[] = [];

  const unsubDb = safeOnSnapshot(`chats/${chatId}/messages`, [orderBy('timestamp', 'asc')], {
    next: snap => {
      current = snap.docs.map(d => ({ id: d.id, chatId, senderId: d.data().senderId, text: d.data().text, timestamp: d.data().timestamp }));
      callback([...current]);
    },
    error: e => console.error('Snapshot error:', e)
  });

  const handler = (msg: Message) => {
    if (msg.chatId === chatId) {
      current = [...current, msg];
      callback([...current]);
    }
  };
  socket.on('receiveMessage', handler);
  socket.emit('joinChat', chatId);

  return () => {
    unsubDb();
    socket.off('receiveMessage', handler);
    socket.emit('leaveChat', chatId);
  };
}

/**
 * Mark messages as read in Firestore and notify server
 */
export async function markMessagesAsRead(chatId: string, userId: string): Promise<number> {
  if (!chatId || !userId) return 0;
  try {
    const result = await safeQuery(`chats/${chatId}/messages`, [where('senderId', '!=', userId), where('read', '==', false)]);
    let count = 0;
    if (result.success) {
      const batch = writeBatch(db);
      result.data.docs.forEach(d => { batch.update(d.ref, { read: true }); count++; });
      await batch.commit();
    }
    socket.emit('messagesRead', { chatId, userId });
    return count;
  } catch (e) {
    console.error('Read error:', e);
    return 0;
  }
}

/**
 * Subscribe to chat list updates via Firestore and WebSocket
 */
export function subscribeToChats(userId: string, callback: (chats: Chat[]) => void): () => void {
  if (!userId) return () => {};
  let currentChats: Chat[] = [];

  const processSnapshot = (snapshot: any) => {
    currentChats = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return { id: docSnap.id, userIds: data.userIds, users: data.users, lastMessage: data.lastMessage, lastUpdated: data.lastUpdated };
    });
    callback([...currentChats]);
  };

  const unsubDb = safeOnSnapshot('chats', [where('userIds', 'array-contains', userId), orderBy('lastUpdated', 'desc')], {
    next: processSnapshot,
    error: e => console.error('Chats snapshot error:', e)
  });

  const handler = (chat: Chat) => {
    if (chat.userIds.includes(userId)) {
      // Update or prepend
      const exists = currentChats.find(c => c.id === chat.id);
      if (exists) {
        currentChats = currentChats.map(c => c.id === chat.id ? chat : c);
      } else {
        currentChats = [chat, ...currentChats];
      }
      callback([...currentChats]);
    }
  };
  socket.on('chatUpdated', handler);

  return () => {
    unsubDb();
    socket.off('chatUpdated', handler);
  };
}