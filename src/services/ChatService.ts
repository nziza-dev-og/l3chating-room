// src/services/ChatService.ts
import {
  collection, addDoc, serverTimestamp, getDocs,
  doc, writeBatch, orderBy, where
} from 'firebase/firestore';
import { db, safeOnSnapshot, safeQuery, getAllDocuments, safeGetDoc } from '../firebase';
import socket from '../socket';
import { User, Chat, Message } from '../types';

const PROXY_URL = 'https://chating-room-server.onrender.com/proxy';

/** Fetch all users */
export async function fetchUsers(): Promise<User[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ uid: d.id, ...(d.data() as any) }));
}

/** Get or create a chat */
export async function getOrCreateChat(a: string, b: string): Promise<string> {
  let id = await findExistingChat(a, b);
  if (id) return id;

  const da = (await safeGetDoc(`users/${a}`))!.data();
  const dbb = (await safeGetDoc(`users/${b}`))!.data();
  const ref = await addDoc(collection(db, 'chats'), {
    userIds: [a, b], users: { [a]: da, [b]: dbb },
    createdAt: serverTimestamp(), lastUpdated: serverTimestamp()
  });
  return ref.id;
}
async function findExistingChat(u1: string, u2: string): Promise<string|null> {
  const q = await safeQuery('chats', [where('userIds', 'array-contains', u1)]);
  if (q.success) {
    for (const d of q.data.docs) {
      if ((d.data() as Chat).userIds.includes(u2)) return d.id;
    }
  }
  const all = await getAllDocuments('chats');
  for (const d of all.data) {
    if ((d.data() as Chat).userIds.includes(u1)
     && (d.data() as Chat).userIds.includes(u2))
      return d.id;
  }
  return null;
}

/** Send a message */
export async function sendMessage(
  chatId: string, senderId: string, text: string
): Promise<string> {
  if (!text.trim()) throw new Error('Empty message');
  const batch = writeBatch(db);
  const msgRef = doc(collection(db, `chats/${chatId}/messages`));
  batch.set(msgRef, { senderId, text, timestamp: serverTimestamp(), read: false });
  batch.update(doc(db, 'chats', chatId), {
    lastMessage: { text, senderId }, lastUpdated: serverTimestamp()
  });
  await batch.commit();

  const msg: Message = { id: msgRef.id, chatId, senderId, text, timestamp: new Date() };
  socket.emit('sendMessage', msg);
  fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(msg)
  }).catch(console.error);

  return msgRef.id;
}

/** Subscribe to messages */
export function subscribeToMessages(
  chatId: string, cb: (msgs: Message[]) => void
): () => void {
  let current: Message[] = [];
  const unsubDb = safeOnSnapshot(
    `chats/${chatId}/messages`, [orderBy('timestamp','asc')],
    { next: snap => {
        current = snap.docs.map(d => ({ id: d.id, chatId, ...(d.data() as any) }));
        cb([...current]);
      }
    }
  );
  const evt = `receiveMessage:${chatId}`;
  const handler = (m: Message) => { current.push(m); cb([...current]); };
  socket.on(evt, handler);
  socket.emit('joinChat', chatId);
  return () => { unsubDb(); socket.off(evt, handler); socket.emit('leaveChat', chatId); };
}

/** Subscribe to chat list */
export function subscribeToChats(
  userId: string, cb: (chats: Chat[]) => void
): () => void {
  let cur: Chat[] = [];
  const unsubDb = safeOnSnapshot(
    'chats',
    [where('userIds','array-contains',userId), orderBy('lastUpdated','desc')],
    { next: snap => { cur = snap.docs.map(d=>({ id:d.id, ...(d.data() as any) })); cb([...cur]); } }
  );
  const handler = (chat: Chat) => {
    if (!chat.userIds.includes(userId)) return;
    const i = cur.findIndex(c=>c.id===chat.id);
    if (i>-1) cur[i]=chat; else cur.unshift(chat);
    cb([...cur]);
  };
  socket.on('chatUpdated', handler);
  return () => { unsubDb(); socket.off('chatUpdated', handler); };
}

/** Mark messages as read */
export async function markMessagesAsRead(
  chatId: string, userId: string
): Promise<number> {
  if (!chatId||!userId) return 0;
  const q = await safeQuery(`chats/${chatId}/messages`, [
    where('senderId','!=',userId), where('read','==',false)
  ]);
  let count=0;
  if (q.success) {
    const batch = writeBatch(db);
    q.data.docs.forEach(d=>{ batch.update(d.ref,{read:true}); count++; });
    await batch.commit();
  }
  socket.emit('messagesRead',{ chatId, userId });
  return count;
}
