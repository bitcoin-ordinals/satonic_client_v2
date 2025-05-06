import { AUTH_TOKEN_KEY } from './api';
import { User } from './api';
import { disconnectWallet } from './wallet';

export interface Wallet {
  id: string;
  user_id: string;
  address: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface AuthToken {
  token: string;
  expires_at: string;
  user: User;
}

/**
 * Store authentication token and user information
 */
export function setAuth(authToken: AuthToken): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, authToken.token);
    localStorage.setItem('user', JSON.stringify(authToken.user));
    localStorage.setItem('expires_at', authToken.expires_at);
    // Dispatch an event for components to listen to
    window.dispatchEvent(new Event('auth_changed'));
  } catch (error) {
    console.error('Failed to store auth token:', error);
  }
}

/**
 * Remove authentication token and user information
 */
export async function clearAuth(): Promise<void> {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem('user');
    localStorage.removeItem('expires_at');
    
    // Attempt to disconnect wallet if available
    await disconnectWallet();
    
    // Dispatch an event for components to listen to
    window.dispatchEvent(new Event('auth_changed'));
  } catch (error) {
    console.error('Failed to clear auth token:', error);
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const expiresAt = localStorage.getItem('expires_at');
    
    if (!token || !expiresAt) {
      return false;
    }
    
    // Check if token is expired
    const expiryDate = new Date(expiresAt);
    if (expiryDate < new Date()) {
      // Token expired, clear it
      clearAuth();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
}

/**
 * Get the current user if authenticated
 */
export function getCurrentUser(): User | null {
  try {
    if (!isAuthenticated()) {
      return null;
    }
    
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      return null;
    }
    
    return JSON.parse(userJson);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Get the authentication token
 */
export function getAuthToken(): string | null {
  try {
    if (!isAuthenticated()) {
      return null;
    }
    
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Update the current user information
 */
export function updateCurrentUser(user: User): void {
  try {
    localStorage.setItem('user', JSON.stringify(user));
    
    // Dispatch an event for components to listen to
    window.dispatchEvent(new Event('user_updated'));
  } catch (error) {
    console.error('Failed to update user:', error);
  }
}

/**
 * Setup authentication state listener
 */
export function setupAuthListener(callback: () => void): () => void {
  const handler = () => callback();
  
  window.addEventListener('auth_changed', handler);
  window.addEventListener('user_updated', handler);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('auth_changed', handler);
    window.removeEventListener('user_updated', handler);
  };
} 