import  { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search } from 'lucide-react';
import { fetchUsers } from '../services/ChatService';
import { User as UserType } from '../types';
import UserAvatar from '../components/UserAvator';
import OnlineStatus from './OnlineStatus';

interface UserListProps {
  onSelectUser: (user: UserType) => void;
}

export default function UserList({ onSelectUser }: UserListProps) {
  const [users, setUsers] = useState<UserType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        setError(null);
        const usersList = await fetchUsers();
        
        // Filter out current user
        const filteredUsers = usersList.filter(user => user.uid !== currentUser?.uid);
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Could not load users. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (currentUser) {
      loadUsers();
    }
  }, [currentUser]);

  const filteredUsers = users.filter((user) => 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">New Conversation</h2>
      
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search users..."
          className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
      </div>
      
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : filteredUsers.length > 0 ? (
        <div className="space-y-2">
          {filteredUsers.map((user) => (
            <div
              key={user.uid}
              className="flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-100"
              onClick={() => onSelectUser(user)}
            >
              <div className="relative">
                <UserAvatar 
                  userId={user.uid} 
                  photoURL={user.photoURL} 
                  displayName={user.displayName}
                />
                <div className="absolute -bottom-0.5 -right-0.5">
                  <OnlineStatus userId={user.uid} />
                </div>
              </div>
              <span className="ml-3 font-medium">{user.displayName || 'Anonymous User'}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No users found</p>
      )}
    </div>
  );
}
 