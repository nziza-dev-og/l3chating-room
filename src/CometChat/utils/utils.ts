import  { CometChat } from '@cometchat/chat-uikit-react';

/**
 * Sets up localization for CometChat UI components
 */
export const setupLocalization = () => {
  try {
    // Default English localization is already set up
    // If you need to customize or add other languages, you can do so here
    console.log('CometChat localization initialized');
  } catch (error) {
    console.error('Error setting up localization:', error);
  }
};

/**
 * Logs in a user with auth token
 */
export const loginWithAuthToken = async (uid: string): Promise<CometChat.User | null> => {
  try {
    const user = await CometChat.login(uid);
    console.log('Login successful:', user);
    return user;
  } catch (error) {
    console.error('Login failed:', error);
    return null;
  }
};

/**
 * Creates a new user in CometChat
 */
export const createUser = async (
  uid: string, 
  name: string, 
  avatar?: string
): Promise<CometChat.User | null> => {
  try {
    const user = new CometChat.User({
      uid,
      name,
      avatar
    });
    
    const createdUser = await CometChat.createUser(user);
    console.log('User created:', createdUser);
    return createdUser;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
};

/**
 * Logs out the current user
 */
export const logout = async (): Promise<boolean> => {
  try {
    await CometChat.logout();
    console.log('Logout successful');
    return true;
  } catch (error) {
    console.error('Logout failed:', error);
    return false;
  }
};
 