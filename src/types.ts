import  { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
}

export interface Chat {
  id: string;
  userIds: string[];
  users: Record<string, {
    displayName: string;
    photoURL: string | null;
  }>;
  lastMessage?: {
    text: string;
    timestamp: Timestamp;
    senderId: string;
  };
}
 