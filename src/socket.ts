import { io, Socket } from 'socket.io-client';

// Track connection status for components
let isConnected = false;
let connectionError: Error | null = null;

interface ServerToClientEvents {
  receiveMessage: (message: any) => void;
  userTyping: (data: { userId: string; isTyping: boolean }) => void;
  userStatus: (data: { userId: string; online: boolean }) => void;
  chatUpdated: (chat: any) => void;
  messagesRead: (info: { chatId: string; userId: string }) => void;
}

interface ClientToServerEvents {
  sendMessage: (data: { chatId: string; message: any }) => void;
  typing: (data: { chatId: string; isTyping: boolean }) => void;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  checkUserStatus: (userId: string) => void;
  chatUpdated: (chat: any) => void;
  messagesRead: (info: { chatId: string; userId: string }) => void;
}

// Initialize actual Socket.IO client
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('https://chating-room-sever.onrender.com', {
  autoConnect: false,
});

// Connection status handlers
socket.on('connect', () => {
  isConnected = true;
  connectionError = null;
  console.log('Connected to socket server with ID:', socket.id);
});

socket.on('connect_error', (err) => {
  isConnected = false;
  connectionError = err;
  console.error('Socket connection error:', err);
});

socket.on('disconnect', () => {
  isConnected = false;
  console.log('Disconnected from socket server');
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const getConnectionStatus = () => ({
  isConnected,
  error: connectionError,
});

export const setupSocketUser = (userId: string) => {
  socket.auth = { userId };
  connectSocket();
};

// Messaging APIs
export const sendSocketMessage = (chatId: string, message: any) => {
  socket.emit('sendMessage', { chatId, message });
};

export const listenForMessages = (chatId: string, callback: (message: any) => void) => {
  const eventName = 'receiveMessage';
  socket.off(eventName);
  socket.on(eventName, (data) => {
    if (data.chatId === chatId) callback(data);
  });
  socket.emit('joinChat', chatId);
  return () => {
    socket.off(eventName);
    if (socket.connected) {
      socket.emit('leaveChat', chatId);
    }
  };
};

// Typing indicator APIs
export const emitTyping = (chatId: string, isTyping: boolean) => {
  socket.emit('typing', { chatId, isTyping });
};

export const listenForTyping = (chatId: string, callback: (data: { userId: string; isTyping: boolean }) => void) => {
  const eventName = 'userTyping';
  socket.off(eventName);
  socket.on(eventName, (data) => {
    if (data.chatId === chatId) callback(data);
  });
  socket.emit('joinChat', chatId);
  return () => {
    socket.off(eventName);
    socket.emit('leaveChat', chatId);
  };
};

// User status APIs
export const checkUserStatus = (userId: string) => {
  socket.emit('checkUserStatus', userId);
};

export const listenForUserStatus = (callback: (data: { userId: string; online: boolean }) => void) => {
  const eventName = 'userStatus';
  socket.off(eventName);
  socket.on(eventName, callback);
  return () => {
    socket.off(eventName);
  };
};

// Chat update APIs
export const emitChatUpdated = (chat: any) => {
  socket.emit('chatUpdated', chat);
};

export const listenForChatUpdates = (callback: (chat: any) => void) => {
  const eventName = 'chatUpdated';
  socket.off(eventName);
  socket.on(eventName, callback);
  return () => {
    socket.off(eventName);
  };
};

// Messages read APIs
export const emitMessagesRead = (chatId: string, userId: string) => {
  socket.emit('messagesRead', { chatId, userId });
};

export const listenForMessagesRead = (callback: (info: { chatId: string; userId: string }) => void) => {
  const eventName = 'messagesRead';
  socket.off(eventName);
  socket.on(eventName, callback);
  return () => {
    socket.off(eventName);
  };
};

export default socket;
