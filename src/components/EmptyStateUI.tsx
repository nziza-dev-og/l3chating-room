import  { MessageSquare, Users } from 'lucide-react';

interface EmptyStateUIProps {
  type: 'chats' | 'users' | 'messages';
  message?: string;
}

export default function EmptyStateUI({ type, message }: EmptyStateUIProps) {
  const content = {
    chats: {
      icon: <MessageSquare className="text-gray-400 mb-3" size={36} />,
      title: 'No conversations yet',
      message: message || 'Start a new chat from the Users tab'
    },
    users: {
      icon: <Users className="text-gray-400 mb-3" size={36} />,
      title: 'No users found',
      message: message || 'Try adjusting your search criteria'
    },
    messages: {
      icon: <MessageSquare className="text-gray-400 mb-3" size={36} />,
      title: 'No messages yet',
      message: message || 'Start a conversation by typing a message below'
    }
  };

  const { icon, title, message: defaultMessage } = content[type];

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      {icon}
      <h3 className="text-lg font-medium text-gray-700 mb-1">{title}</h3>
      <p className="text-gray-500 max-w-xs">{defaultMessage}</p>
      
      {type === 'chats' && (
        <div className="mt-6">
          <img 
            src="https://images.unsplash.com/photo-1723143752117-54c01cd5ac4a?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw1fHxtb2Rlcm4lMjBjaGF0JTIwYXBwJTIwaW50ZXJmYWNlJTIwbW9iaWxlfGVufDB8fHx8MTc0NjE2MjE5OHww&ixlib=rb-4.0.3&fit=fillmax&h=300&w=400"
            alt="Chat interface" 
            className="w-48 h-48 object-cover rounded-lg shadow-md mx-auto opacity-60"
          />
        </div>
      )}
    </div>
  );
}
 