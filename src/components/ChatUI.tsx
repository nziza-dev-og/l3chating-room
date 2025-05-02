import  { 
  CometChatMessages, 
  CometChatConversationsWithMessages 
} from '@cometchat/chat-uikit-react';
import { useState } from 'react';

type ChatUIProps = {
  userId: string;
};

export default function ChatUI({ userId }: ChatUIProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  return (
    <div className="h-full">
      {selectedUser ? (
        <CometChatMessages 
          user={selectedUser} 
          onBackClick={() => setSelectedUser(null)}
        />
      ) : (
        <CometChatConversationsWithMessages 
          onItemClick={(item: any) => {
            if (item.uid) {
              setSelectedUser(item.uid);
            }
          }}
        />
      )}
    </div>
  );
}
 