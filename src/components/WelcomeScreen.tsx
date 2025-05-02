import  { MessageSquare } from 'lucide-react';

export default function WelcomeScreen() {
  return (
    <div className="flex h-full items-center justify-center flex-col p-4 text-center">
      <div className="w-72 h-72 rounded-full overflow-hidden mb-8 shadow-lg border-4 border-white">
        <img 
          src="https://images.unsplash.com/photo-1517292987719-0369a794ec0f?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjaGF0JTIwYXBwJTIwaW50ZXJmYWNlJTIwbW9iaWxlfGVufDB8fHx8MTc0NjE2MjE5OHww&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800" 
          alt="ChatterBox App" 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex items-center justify-center mb-4">
        <MessageSquare className="text-primary-600 mr-2" size={28} />
        <h1 className="text-3xl font-bold text-gray-800">ChatterBox</h1>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-3">Welcome to Secure Messaging</h2>
      
      <p className="text-gray-600 max-w-md mb-6">
        Start chatting securely with your contacts. Your messages are private and only visible to you and your conversation partner.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="font-medium text-lg text-gray-800 mb-3">Real-time Messaging</h3>
          <img 
            src="https://images.unsplash.com/photo-1604881989793-466aca8dd319?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBjaGF0JTIwYXBwJTIwaW50ZXJmYWNlJTIwbW9iaWxlfGVufDB8fHx8MTc0NjE2MjE5OHww&ixlib=rb-4.0.3&fit=fillmax&h=160&w=240"
            alt="People collaborating" 
            className="w-full h-32 object-cover rounded-lg mb-3"
          />
          <p className="text-gray-600 text-sm">
            Experience instant message delivery with our Socket.io integration. See when someone is typing in real-time.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="font-medium text-lg text-gray-800 mb-3">Mobile Friendly</h3>
          <img 
            src="https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBjaGF0JTIwYXBwJTIwaW50ZXJmYWNlJTIwbW9iaWxlfGVufDB8fHx8MTc0NjE2MjE5OHww&ixlib=rb-4.0.3&fit=fillmax&h=160&w=240"
            alt="Modern architecture" 
            className="w-full h-32 object-cover rounded-lg mb-3"
          />
          <p className="text-gray-600 text-sm">
            Chat from any device with our responsive design. The experience is seamless whether on desktop or mobile.
          </p>
        </div>
      </div>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-md w-full mt-6">
        <h3 className="font-medium text-gray-800 mb-2">Getting Started</h3>
        <ol className="text-left text-gray-600 space-y-2 list-decimal pl-5">
          <li>Use the <span className="font-medium">Users</span> tab to find contacts</li>
          <li>Start a conversation by clicking on a user</li>
          <li>View your active chats in the <span className="font-medium">Chats</span> tab</li>
          <li>Messages are delivered instantly in real-time</li>
          <li>See when your contacts are typing</li>
        </ol>
      </div>
    </div>
  );
}
 