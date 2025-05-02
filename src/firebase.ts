import  { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  collection, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  limit,
  getDoc,
  doc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDR5ESnHuv6bsin9jFrEm3gTbMdySVpGZE",
  authDomain: "chating-class.firebaseapp.com",
  projectId: "chating-class",
  storageBucket: "chating-class.firebasestorage.app",
  messagingSenderId: "66220288730",
  appId: "1:66220288730:web:abc61ad5a32a5ac2add3e3",
  measurementId: "G-5RCN429FJK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Function to get all documents from a collection without any query constraints
// This is the most reliable fallback when all other query methods fail
export const getAllDocuments = async (collectionPath) => {
  try {
    const collectionRef = collection(db, collectionPath);
    const snapshot = await getDocs(collectionRef);
    return { success: true, data: snapshot };
  } catch (error) {
    console.error(`Error getting all documents (${collectionPath}):`, error);
    return { success: false, error };
  }
};

// Improved safeQuery with multiple fallback strategies
export const safeQuery = async (collectionPath, constraints) => {
  // Try with original constraints first
  try {
    const collectionRef = collection(db, collectionPath);
    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    return { success: true, data: snapshot };
  } catch (error) {
    console.warn(`Query error (${collectionPath}):`, error);
    
    // First fallback: Try without orderBy
    if (error.code === 'failed-precondition' && error.message.includes('requires an index')) {
      try {
        // Filter out orderBy and limit constraints
        const safeConstraints = constraints.filter(c => 
          !String(c).includes('orderBy') && 
          !String(c).includes('OrderBy') &&
          !String(c).includes('limit')
        );
        
        if (safeConstraints.length > 0) {
          const collectionRef = collection(db, collectionPath);
          const q = query(collectionRef, ...safeConstraints);
          const snapshot = await getDocs(q);
          return { success: true, data: snapshot, indexWarning: true };
        }
      } catch (fallbackError) {
        console.warn('First fallback query failed:', fallbackError);
        // Continue to next fallback - don't return here
      }
      
      // Second fallback: Try with just one where clause
      try {
        const whereConstraints = constraints.filter(c => String(c).includes('where'));
        if (whereConstraints.length > 0) {
          // Just use the first where constraint
          const collectionRef = collection(db, collectionPath);
          const q = query(collectionRef, whereConstraints[0]);
          const snapshot = await getDocs(q);
          return { success: true, data: snapshot, indexWarning: true };
        }
      } catch (fallbackError) {
        console.warn('Second fallback query failed:', fallbackError);
        // Continue to next fallback
      }
      
      // Final fallback: Get all documents and filter in memory
      try {
        const result = await getAllDocuments(collectionPath);
        if (result.success) {
          console.log(`Using client-side filtering for ${collectionPath}`);
          return { 
            success: true, 
            data: result.data, 
            indexWarning: true, 
            clientSideFiltering: true,
            originalConstraints: constraints
          };
        }
      } catch (finalFallbackError) {
        console.error('All fallback strategies failed:', finalFallbackError);
      }
    }
    
    // If we've exhausted all options, return the original error
    return { success: false, error };
  }
};

// Safe version of onSnapshot with multiple fallback strategies
export const safeOnSnapshot = (collectionPath, constraints, callbacks) => {
  // Store unsubscribe function
  let unsubscribeFunc = null;
  
  // Try the primary query first
  try {
    const collectionRef = collection(db, collectionPath);
    const q = query(collectionRef, ...constraints);
    
    unsubscribeFunc = onSnapshot(
      q, 
      snapshot => {
        try {
          callbacks.next(snapshot);
        } catch (callbackError) {
          console.error(`Error in snapshot callback for ${collectionPath}:`, callbackError);
          if (callbacks.error) callbacks.error(callbackError);
        }
      },
      error => {
        // Handle error with index
        if (error.code === 'failed-precondition' && error.message.includes('requires an index')) {
          console.warn(`Index error for ${collectionPath}, trying fallback...`);
          
          // First fallback: Try without orderBy constraints
          try {
            // Clean up the previous listener
            if (unsubscribeFunc) unsubscribeFunc();
            
            // Filter out problematic constraints
            const safeConstraints = constraints.filter(c => 
              !String(c).includes('orderBy') && 
              !String(c).includes('OrderBy') &&
              !String(c).includes('limit')
            );
            
            if (safeConstraints.length > 0) {
              const collectionRef = collection(db, collectionPath);
              const q = query(collectionRef, ...safeConstraints);
              
              unsubscribeFunc = onSnapshot(
                q,
                snapshot => {
                  try {
                    if (callbacks.fallback) {
                      callbacks.fallback(snapshot, { 
                        type: 'simplified-query',
                        originalConstraints: constraints 
                      });
                    } else {
                      callbacks.next(snapshot);
                    }
                  } catch (callbackError) {
                    console.error('Error in fallback callback:', callbackError);
                  }
                },
                fallbackError => {
                  console.warn('Fallback query also failed:', fallbackError);
                  secondFallback();
                }
              );
              return () => {
                if (unsubscribeFunc) unsubscribeFunc();
              };
            } else {
              secondFallback();
            }
          } catch (fallbackSetupError) {
            console.error('Error setting up fallback query:', fallbackSetupError);
            secondFallback();
          }
          
          // Second fallback: Just listen to the collection without constraints
          function secondFallback() {
            try {
              // Clean up any previous listener
              if (unsubscribeFunc) unsubscribeFunc();
              
              console.log(`Using basic collection listener for ${collectionPath}`);
              const collectionRef = collection(db, collectionPath);
              
              unsubscribeFunc = onSnapshot(
                collectionRef,
                snapshot => {
                  try {
                    if (callbacks.fallback) {
                      callbacks.fallback(snapshot, { 
                        type: 'collection-only',
                        originalConstraints: constraints
                      });
                    } else {
                      callbacks.next(snapshot);
                    }
                  } catch (callbackError) {
                    console.error('Error in second fallback callback:', callbackError);
                    if (callbacks.error) callbacks.error(callbackError);
                  }
                },
                finalError => {
                  console.error('All snapshot strategies failed:', finalError);
                  if (callbacks.error) callbacks.error(finalError);
                }
              );
            } catch (finalFallbackError) {
              console.error('Error setting up final fallback:', finalFallbackError);
              if (callbacks.error) callbacks.error(finalFallbackError);
            }
          }
        } else {
          // For non-index errors, just call the error callback
          console.error(`Snapshot error for ${collectionPath}:`, error);
          if (callbacks.error) callbacks.error(error);
        }
      }
    );
    
    return () => {
      if (unsubscribeFunc) unsubscribeFunc();
    };
  } catch (setupError) {
    console.error(`Error setting up snapshot listener for ${collectionPath}:`, setupError);
    if (callbacks.error) callbacks.error(setupError);
    return () => {}; // Return no-op function
  }
};

// Method to safely fetch document data by ID
export const safeGetDoc = async (collectionPath, docId) => {
  try {
    const docRef = doc(db, collectionPath, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data(), id: docId };
    } else {
      return { success: false, error: new Error('Document does not exist') };
    }
  } catch (error) {
    console.error(`Error getting document ${collectionPath}/${docId}:`, error);
    return { success: false, error };
  }
};

// Enable offline persistence with error handling
try {
  enableIndexedDbPersistence(db, {
    synchronizeTabs: true,
  }).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.log('Persistence not supported in this browser');
    } else {
      console.error('Persistence error:', err);
    }
  });
} catch (error) {
  console.error('Error enabling persistence:', error);
}
 