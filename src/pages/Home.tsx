import  { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatList from '../components/ChatList';
import UserList from '../components/UserList';
import ChatWindow from '../components/ChatWindow';
import FirestoreIndexHelper from '../components/FirestoreIndexHelper';
import WelcomeScreen from '../components/WelcomeScreen';
import { LogOut, MessageSquare, Users, Bell } from 'lucide-react';
import { User } from '../types';
import { getOrCreateChat } from '../services/ChatService';
import OnlineStatus from '../components/OnlineStatus';
import SocketStatusIndicator from '../components/SocketStatusIndicator';
import NotificationsPanel from '../components/NotificationsPanel';
import ErrorBoundary from '../components/ErrorBoundary';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'chats' | 'users'>('chats');
  const [selectedChat, setSelectedChat] = useState<{ id: string; otherUserName: string } | null>(null);
  const [indexError, setIndexError] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for Firestore index errors
    const originalConsoleError = console.error;
    console.error = function(...args) {
      const errorMessage = args.join(' ');
      if (errorMessage.includes('The query requires an index') && 
          errorMessage.includes('failed-precondition')) {
        setIndexError(true);
      }
      originalConsoleError.apply(console, args);
    };
    
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  // Simulated notification count for demo
  useEffect(() => {
    if (currentUser) {
      // This would normally be connected to your notification service
      setNotificationCount(2);
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleSelectChat = (chatId: string, otherUserName: string) => {
    setSelectedChat({ id: chatId, otherUserName });
    setActiveTab('chats');
  };

  const handleSelectUser = async (user: User) => {
    if (!currentUser) return;
    
    try {
      const chatId = await getOrCreateChat(currentUser.uid, user.uid);
      setSelectedChat({ 
        id: chatId, 
        otherUserName: user.displayName || 'User' 
      });
      setActiveTab('chats');
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {indexError && <FirestoreIndexHelper />}
      {showNotifications && (
        <NotificationsPanel 
          isOpen={showNotifications} 
          onClose={() => setShowNotifications(false)}
        />
      )}

      <header className="bg-primary-700 text-white p-3 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <MessageSquare className="mr-2" />
            <h1 className="text-xl font-bold">ChatterBox</h1>
            <div className="ml-2">
              <SocketStatusIndicator />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button 
                className="p-2 hover:bg-primary-800 rounded-full"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={18} />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                    {notificationCount}
                  </span>
                )}
              </button>
            </div>
            
            <div className="flex items-center text-sm">
              {currentUser?.displayName && (
                <>
                  <span className="mr-2">{currentUser.displayName}</span>
                  <OnlineStatus userId={currentUser.uid} showLabel />
                </>
              )}
            </div>
            
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-primary-800 rounded-full"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-16 bg-gray-800 flex flex-col items-center py-4">
          <button
            onClick={() => setActiveTab('chats')}
            className={`p-3 rounded-full mb-2 ${activeTab === 'chats' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            title="Conversations"
          >
            <MessageSquare size={20} />
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`p-3 rounded-full ${activeTab === 'users' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            title="Users"
          >
            <Users size={20} />
          </button>
        </div>

        <div className="w-80 border-r bg-white overflow-hidden">
          <ErrorBoundary>
            {activeTab === 'chats' ? (
              <ChatList
                onSelectChat={handleSelectChat}
                selectedChatId={selectedChat?.id || null}
              />
            ) : (
              <UserList onSelectUser={handleSelectUser} />
            )}
          </ErrorBoundary>
        </div>

        <div className="flex-1 flex flex-col bg-gray-50">
          <ErrorBoundary>
            {selectedChat ? (
              <ChatWindow 
                chatId={selectedChat.id}
                otherUserName={selectedChat.otherUserName}
              />
            ) : (
              <WelcomeScreen />
            )}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
 