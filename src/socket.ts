// src/socket.ts
import { io, Socket } from 'socket.io-client';

export interface ServerToClientEvents {
  receiveMessage:    (msg: any) => void;
  chatUpdated:       (chat: any) => void;
  messagesRead:      (info: any) => void;
}
export interface ClientToServerEvents {
  sendMessage:       (msg: any) => void;
  joinChat:          (chatId: string) => void;
  leaveChat:         (chatId: string) => void;
  chatUpdated:       (chat: any) => void;
  messagesRead:      (info: any) => void;
}

const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io('https://chating-room-server.onrender.com', {
    autoConnect: false,
    transports: ['websocket']
  });

socket.on('connect',    () => console.log('Connected as', socket.id));
socket.on('disconnect', () => console.log('Disconnected'));

export function connectSocket()   { socket.connect(); }
export function disconnectSocket(){ socket.disconnect(); }

export default socket;
