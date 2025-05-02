import  { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Chat } from '../types';
import { MessageSquare, User as UserIcon } from 'lucide-react';
import { subscribeToChats } from '../services/ChatService';
import EmptyStateUI from './EmptyStateUI';
import OnlineStatus from './OnlineStatus';

interface ChatListProps {
  onSelectChat: (chatId: string, otherUserName: string) => void;
  selectedChatId: string | null;
}

export default function ChatList({ onSelectChat, selectedChatId }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const unsubscribe = subscribeToChats(currentUser.uid, (chatsList) => {
      setChats(chatsList);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  if (loading) {
    return (
      <div className="h-full flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (chats.length === 0) {
    return <EmptyStateUI type="chats" />;
  }

  return (
    <div className="overflow-y-auto h-full">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">Conversations</h2>
        <p className="text-sm text-gray-500">Your recent chats</p>
      </div>
      
      <div className="divide-y">
        {chats.map((chat) => {
          const otherUserKey = Object.keys(chat.users).find(
            (uid) => uid !== currentUser?.uid
          ) || '';
          const otherUser = chat.users[otherUserKey];

          return (
            <div
              key={chat.id}
              className={`p-3 cursor-pointer ${
                selectedChatId === chat.id ? 'bg-primary-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => onSelectChat(chat.id, otherUser?.displayName || 'User')}
            >
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700">
                    {otherUser?.photoURL ? (
                      <img
                        src={otherUser.photoURL}
                        alt={otherUser.displayName}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <UserIcon size={20} />
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <OnlineStatus userId={otherUserKey} />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium">{otherUser?.displayName || 'User'}</p>
                    {chat.lastMessage && chat.lastMessage.timestamp && (
                      <p className="text-xs text-gray-500">
                        {new Date(chat.lastMessage.timestamp.toDate()).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                  {chat.lastMessage ? (
                    <p className="text-sm text-gray-500 truncate">
                      {chat.lastMessage.senderId === currentUser?.uid && (
                        <span className="text-gray-400 mr-1">You:</span>
                      )}
                      {chat.lastMessage.text}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">New conversation</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
 