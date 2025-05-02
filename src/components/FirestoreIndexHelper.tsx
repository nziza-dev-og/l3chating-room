import  { useState, useEffect } from 'react';
import { AlertCircle, ExternalLink, CheckCircle } from 'lucide-react';

export default function FirestoreIndexHelper() {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [indexUrls, setIndexUrls] = useState<string[]>([
    'https://console.firebase.google.com/v1/r/project/chating-class/firestore/indexes?create_composite=Cktwcm9qZWN0cy9jaGF0aW5nLWNsYXNzL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jaGF0cy9pbmRleGVzL18QARoLCgd1c2VySWRzGAEaDwoLbGFzdFVwZGF0ZWQQAhoMCghfX25hbWVfXxAC',
    'https://console.firebase.google.com/v1/r/project/chating-class/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9jaGF0aW5nLWNsYXNzL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9tZXNzYWdlcy9pbmRleGVzL18QARoICgRyZWFkEAEaDAoIc2VuZGVySWQQARoMCghfX25hbWVfXxAC'
  ]);
  const [createdIndexes, setCreatedIndexes] = useState<{[key: string]: boolean}>({});
  const [showSuccess, setShowSuccess] = useState(false);
  
  useEffect(() => {
    // If all indexes are marked as created, show success message for 3 seconds
    const allCreated = indexUrls.every(url => createdIndexes[url]);
    if (allCreated && Object.keys(createdIndexes).length > 0) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setDismissed(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [createdIndexes, indexUrls]);
  
  const handleCreateIndex = (url: string) => {
    window.open(url, '_blank');
    
    // Mark this index as created
    setCreatedIndexes(prev => ({
      ...prev,
      [url]: true
    }));
    
    // Show expanded instructions
    setExpanded(true);
  };
  
  if (dismissed) return null;
  
  if (showSuccess) {
    return (
      <div className="fixed inset-x-0 top-0 z-50 bg-green-100 p-3 shadow-md">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="text-green-600 mr-2" size={20} />
              <span className="text-green-800 font-medium">Indexes created successfully! Performance will improve shortly.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-yellow-100 p-3 shadow-md">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-start mb-3 md:mb-0">
            <AlertCircle className="text-yellow-600 mr-2 mt-0.5 shrink-0" size={20} />
            <div>
              <h3 className="font-semibold">Database Indexes Required</h3>
              <p className="text-sm text-yellow-800">
                The app needs database indexes to function optimally. We've implemented workarounds,
                but creating the indexes will improve performance.
              </p>
              
              {expanded && (
                <div className="mt-2 bg-white p-3 rounded border border-yellow-200 text-sm">
                  <p className="mb-2 font-medium">After clicking "Create Index" in Firebase Console:</p>
                  <ol className="list-decimal pl-5 space-y-1 text-gray-700">
                    <li>Make sure you're logged into your Firebase account</li>
                    <li>In the Firebase Console page that opens, click the blue "Create Index" button</li>
                    <li>Wait for the index to finish building (usually takes a few minutes)</li>
                    <li>Return to this app - no need to refresh the page</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            {indexUrls.map((url, index) => (
              <button
                key={index}
                onClick={() => handleCreateIndex(url)}
                className={`text-sm px-3 py-1.5 rounded flex items-center ${
                  createdIndexes[url] 
                    ? "bg-green-600 text-white" 
                    : "bg-yellow-600 text-white hover:bg-yellow-700"
                }`}
                disabled={createdIndexes[url]}
              >
                {createdIndexes[url] ? (
                  <>
                    <CheckCircle size={14} className="mr-1" />
                    Index {index + 1} Created
                  </>
                ) : (
                  <>
                    Create Index {index + 1} <ExternalLink size={14} className="ml-1" />
                  </>
                )}
              </button>
            ))}
            
            <div className="flex space-x-2">
              {!expanded && (
                <button
                  onClick={() => setExpanded(true)}
                  className="text-sm px-3 py-1.5 bg-white border border-yellow-600 text-yellow-700 rounded hover:bg-yellow-50"
                >
                  Show Instructions
                </button>
              )}
              <button
                onClick={() => setDismissed(true)}
                className="text-sm px-3 py-1.5 text-yellow-800 hover:text-yellow-900 hover:underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
 