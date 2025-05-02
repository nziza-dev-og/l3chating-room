import  { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Message } from '../types';
import { Send, MoreVertical, AlertCircle } from 'lucide-react';
import { sendMessage, subscribeToMessages, markMessagesAsRead } from '../services/ChatService';
import { sendSocketMessage, emitTyping, listenForTyping, listenForMessages, getConnectionStatus } from '../socket';
import UserAvatar from '../components/UserAvator';
import OnlineStatus from './OnlineStatus';

interface ChatWindowProps {
  chatId: string;
  otherUserName: string;
}

export default function ChatWindow({ chatId, otherUserName }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showSocketWarning, setShowSocketWarning] = useState(false);
  const [otherUserId, setOtherUserId] = useState<string>('');
  const { currentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatIdRef = useRef(chatId);

  // Update ref when chatId changes
  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);

  // Get the other user's ID from the chat ID
  useEffect(() => {
    if (!chatId || !currentUser) return;
    
    // This is a simplified approach - in a real app, you would get this data 
    // from the chat document in Firestore
    const fetchChatDetails = async () => {
      try {
        // For demo purposes, we'll just generate a random ID
        // In a real app, this would be fetched from Firestore
        setOtherUserId(`user_${Math.floor(Math.random() * 1000)}`);
      } catch (err) {
        console.error('Error fetching chat details:', err);
      }
    };
    
    fetchChatDetails();
  }, [chatId, currentUser]);

  // Check socket connection status
  useEffect(() => {
    const checkConnectionStatus = () => {
      const { isConnected, error } = getConnectionStatus();
      setShowSocketWarning(!isConnected && !!error);
    };
    
    // Check initially
    checkConnectionStatus();
    
    // Set up interval to check periodically
    const intervalId = setInterval(checkConnectionStatus, 5000);
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!chatId || !currentUser) return;

    // Mark messages as read when chat window opens
    const markAsRead = async () => {
      try {
        await markMessagesAsRead(chatId, currentUser.uid);
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    };
    
    markAsRead();
    
    // Subscribe to firestore messages with error handling
    let unsubFirestore: (() => void) | null = null;
    
    try {
      unsubFirestore = subscribeToMessages(chatId, (messagesList) => {
        if (chatIdRef.current === chatId) { // Ensure we're still on the same chat
          setMessages(messagesList);
          // Mark new messages as read
          if (messagesList.some(m => m.senderId !== currentUser.uid)) {
            markAsRead();
          }
        }
      });
    } catch (err) {
      console.error('Error subscribing to messages:', err);
      setError('Failed to load messages. Please try refreshing.');
    }
    
    // Socket.io for real-time features (typing indicators, etc)
    let unsubSocket: (() => void) | null = null;
    let unsubTyping: (() => void) | null = null;
    
    try {
      unsubSocket = listenForMessages(chatId, (message) => {
        console.log('Socket message received:', message);
      });
      
      unsubTyping = listenForTyping(chatId, (data) => {
        if (data.userId !== currentUser?.uid) {
          setOtherUserTyping(data.isTyping);
        }
      });
    } catch (socketErr) {
      console.warn('Socket subscription error:', socketErr);
      // We don't set error here since Firestore is our primary data source
    }

    // Cleanup function
    return () => {
      if (unsubFirestore) unsubFirestore();
      if (unsubSocket) unsubSocket();
      if (unsubTyping) unsubTyping();
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatId, currentUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, otherUserTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Handle typing indicator
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      try {
        emitTyping(chatId, true);
      } catch (err) {
        console.warn('Error sending typing indicator:', err);
      }
    } else if (isTyping && value.length === 0) {
      setIsTyping(false);
      try {
        emitTyping(chatId, false);
      } catch (err) {
        console.warn('Error updating typing indicator:', err);
      }
    }
    
    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (value.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        try {
          emitTyping(chatId, false);
        } catch (err) {
          console.warn('Error clearing typing indicator:', err);
        }
      }, 3000); // Stop typing indicator after 3 seconds of inactivity
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !chatId) return;

    try {
      setSending(true);
      setError(null);
      
      // Stop typing indicator
      setIsTyping(false);
      try {
        emitTyping(chatId, false);
      } catch (err) {
        console.warn('Error clearing typing indicator on send:', err);
      }
      
      // Clear timeout if it exists
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      
      // Get the trimmed message
      const messageText = newMessage.trim();
      
      // Clear input immediately for better UX
      setNewMessage('');
      
      // Create optimistic message for immediate UI update
      const optimisticId = 'temp-' + Date.now();
      const optimisticMessage: Message = {
        id: optimisticId,
        senderId: currentUser.uid,
        text: messageText,
        timestamp: null as any // Will be set by server
      };
      
      // Add optimistic message to state
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Send via Firebase (for persistence)
      const messageId = await sendMessage(chatId, currentUser.uid, messageText);
      
      // Also attempt to send via socket.io (for instant delivery)
      try {
        sendSocketMessage(chatId, {
          id: messageId,
          senderId: currentUser.uid,
          text: messageText,
          timestamp: new Date().toISOString()
        });
      } catch (socketErr) {
        console.warn('Error sending message via socket:', socketErr);
        // This is non-critical as the message is already in Firestore
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-red-500">
        <p>{error}</p>
        <button 
          onClick={() => setError(null)}
          className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-white shadow-sm z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative">
              <UserAvatar 
                userId={otherUserId} 
                displayName={otherUserName} 
                size="md"
              />
              <div className="absolute -bottom-0.5 -right-0.5">
                <OnlineStatus userId={otherUserId} />
              </div>
            </div>
            <div className="ml-3">
              <div className="font-medium">{otherUserName}</div>
              {otherUserTyping && (
                <div className="text-xs text-gray-500">typing...</div>
              )}
            </div>
          </div>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {showSocketWarning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm flex items-center">
          <AlertCircle size={16} className="text-yellow-600 mr-2" />
          <span className="text-yellow-700">
            Real-time features limited. Messages will still be delivered but may be delayed.
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            <p>No messages yet. Send one to start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isSentByMe = message.senderId === currentUser?.uid;
            return (
              <div key={message.id} className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                {!isSentByMe && (
                  <UserAvatar 
                    userId={otherUserId} 
                    displayName={otherUserName} 
                    size="sm"
                    className="mr-2 self-end mb-1"
                  />
                )}
                <div 
                  className={`message-bubble ${
                    isSentByMe ? 'sent' : 'received'
                  }`}
                >
                  {message.text}
                  <div className="text-xs mt-1 opacity-70">
                    {message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }) : 'Sending...'}
                  </div>
                </div>
                {isSentByMe && (
                  <UserAvatar 
                    userId={currentUser.uid} 
                    displayName={currentUser.displayName || ''} 
                    photoURL={currentUser.photoURL}
                    size="sm"
                    className="ml-2 self-end mb-1"
                  />
                )}
              </div>
            );
          })
        )}
        
        {otherUserTyping && (
          <div className="flex justify-start">
            <UserAvatar 
              userId={otherUserId} 
              displayName={otherUserName} 
              size="sm"
              className="mr-2 self-end"
            />
            <div className="bg-gray-200 rounded-2xl py-2 px-4 rounded-tl-none inline-flex">
              <span className="typing-indicator">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 border-t bg-white">
        <div className="flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={sending}
          />
          <button
            type="submit"
            className="ml-2 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!newMessage.trim() || sending}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
 