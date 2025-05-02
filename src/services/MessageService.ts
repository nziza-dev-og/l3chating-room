import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import socket from '../socket'; // import your real socket instance

export interface Message {
  chatId: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

/**
 * Send a message: stores in Firestore, emits via WebSocket, and optionally notifies server-side logic
 */
export async function sendMessage(
  chatId: string,
  senderId: string,
  text: string
): Promise<string> {
  try {
    const messagesRef = collection(db, 'messages');
    const message: Omit<Message, 'timestamp'> & { timestamp: any } = {
      chatId,
      senderId,
      text,
      timestamp: serverTimestamp(),
    };

    // Add to Firestore
    const docRef = await addDoc(messagesRef, message);

    // Prepare payload for real-time
    const sentMessage: Message = {
      chatId,
      senderId,
      text,
      timestamp: new Date(),
    };

    // Emit over WebSocket
    socket.emit('sendMessage', sentMessage);

    return docRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Listen for incoming messages on a chat
 */
export function subscribeToMessages(
  chatId: string,
  callback: (message: Message) => void
): () => void {
  // Firestore real-time subscription (optional)
  // You can use onSnapshot here if needed

  // Socket subscription for real-time
  const handler = (msg: Message) => {
    if (msg.chatId === chatId) {
      callback(msg);
    }
  };

  socket.on('receiveMessage', handler);

  // Join room on server
  socket.emit('joinChat', chatId);

  // Cleanup function
  return () => {
    socket.off('receiveMessage', handler);
    socket.emit('leaveChat', chatId);
  };
}

/**
 * Emit typing indicator for a chat
 */
export function emitTyping(chatId: string, senderId: string, isTyping: boolean) {
  socket.emit('typing', { chatId, userId: senderId, isTyping });
}

/**
 * Listen for typing indicators
 */
export function subscribeToTyping(
  chatId: string,
  callback: (data: { userId: string; isTyping: boolean }) => void
): () => void {
  const handler = (data: { userId: string; isTyping: boolean }) => {
    if (data && data.userId && typeof data.isTyping === 'boolean') {
      callback(data);
    }
  };

  socket.on('userTyping', handler);
  socket.emit('joinChat', chatId);

  return () => {
    socket.off('userTyping', handler);
    socket.emit('leaveChat', chatId);
  };
}
