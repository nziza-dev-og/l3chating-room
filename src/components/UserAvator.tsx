import  { User } from 'lucide-react';
import { useMemo } from 'react';

interface UserAvatarProps {
  userId: string;
  photoURL?: string | null;
  displayName?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Collection of demo avatars from Unsplash
const DEMO_AVATARS = [
  'https://images.unsplash.com/photo-1505033575518-a36ea2ef75ae?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjaGF0JTIwYXBwJTIwdXNlciUyMHByb2ZpbGUlMjBhdmF0YXJ8ZW58MHx8fHwxNzQ2MTYzMjE3fDA&ixlib=rb-4.0.3&fit=fillmax&h=200&w=200',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBjaGF0JTIwYXBwJTIwdXNlciUyMHByb2ZpbGUlMjBhdmF0YXJ8ZW58MHx8fHwxNzQ2MTYzMjE3fDA&ixlib=rb-4.0.3&fit=fillmax&h=200&w=200',
  'https://images.unsplash.com/photo-1517292987719-0369a794ec0f?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBjaGF0JTIwYXBwJTIwdXNlciUyMHByb2ZpbGUlMjBhdmF0YXJ8ZW58MHx8fHwxNzQ2MTYzMjE3fDA&ixlib=rb-4.0.3&fit=fillmax&h=200&w=200',
  'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBjaGF0JTIwYXBwJTIwdXNlciUyMHByb2ZpbGUlMjBhdmF0YXJ8ZW58MHx8fHwxNzQ2MTYzMjE3fDA&ixlib=rb-4.0.3&fit=fillmax&h=200&w=200'
];

export default function UserAvatar({ userId, photoURL, displayName, size = 'md' }: UserAvatarProps) {
  // Deterministically select a demo avatar based on userId
  const demoAvatarUrl = useMemo(() => {
    if (!userId) return DEMO_AVATARS[0];
    
    // Use the sum of character codes to create a consistent "random" number
    const charSum = userId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const index = charSum % DEMO_AVATARS.length;
    return DEMO_AVATARS[index];
  }, [userId]);
  
  // Set size classes
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };
  
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 28
  };
  
  // Use provided photoURL or demo avatar
  const avatarSrc = photoURL || demoAvatarUrl;
  
  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center bg-primary-100 text-primary-700`}>
      {avatarSrc ? (
        <img 
          src={avatarSrc} 
          alt={displayName || 'User avatar'} 
          className="w-full h-full object-cover"
          onError={(e) => {
            // If image fails to load, show the icon instead
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <User size={iconSizes[size]} />
      )}
    </div>
  );
}
 