import { initGoogleApi } from './google';

export const initializeGoogleServices = async () => {
  try {
    await initGoogleApi();
    console.log('Google APIs initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Google APIs:', error);
    return false;
  }
};

export const checkGoogleAuthStatus = () => {
  return window.gapi.auth2.getAuthInstance().isSignedIn.get();
};

export const signInWithGoogle = async () => {
  try {
    const auth2 = window.gapi.auth2.getAuthInstance();
    const user = await auth2.signIn();
    return user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signOutFromGoogle = async () => {
  try {
    const auth2 = window.gapi.auth2.getAuthInstance();
    await auth2.signOut();
  } catch (error) {
    console.error('Error signing out from Google:', error);
    throw error;
  }
};
