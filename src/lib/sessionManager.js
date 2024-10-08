const SESSION_STORAGE_KEY = 'mtaDataMapState';
const AUTH_KEY = 'subway_stories_auth';

export const saveStateToSessionStorage = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    sessionStorage.setItem(SESSION_STORAGE_KEY, serializedState);
  } catch (error) {
    console.error('Error saving state to sessionStorage:', error);
  }
};

export const loadStateFromSessionStorage = () => {
  try {
    const serializedState = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (error) {
    console.error('Error loading state from sessionStorage:', error);
    return undefined;
  }
};

export const clearSessionStorage = () => {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing sessionStorage:', error);
  }
};

export const setAuth = () => {
  localStorage.setItem(AUTH_KEY, 'true');
};

export const isAuthenticated = () => {
  return localStorage.getItem(AUTH_KEY) === 'true';
};