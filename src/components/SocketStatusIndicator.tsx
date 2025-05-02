import  { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { getConnectionStatus } from '../socket';

export default function SocketStatusIndicator() {
  const [isConnected, setIsConnected] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  
  useEffect(() => {
    const checkConnection = () => {
      const { isConnected } = getConnectionStatus();
      setIsConnected(isConnected);
    };
    
    // Check initial status
    checkConnection();
    
    // Check status periodically
    const intervalId = setInterval(checkConnection, 5000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  if (isConnected) {
    return (
      <div 
        className="relative flex items-center" 
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Wifi size={16} className="text-green-500" />
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
            Real-time connection active
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div 
      className="relative flex items-center" 
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <WifiOff size={16} className="text-gray-400" />
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
          Using fallback mode
        </div>
      )}
    </div>
  );
}
 