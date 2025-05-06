import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getAuthToken, setAuthToken, removeAuthToken, User } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loginWithWallet: (address: string, signature: string, message: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
  loginWithWallet: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const login = (token: string, userData: User) => {
    setAuthToken(token);
    setUser(userData);
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    router.push('/');
  };

  const refreshUser = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // If it's a mock/local token, we don't need to fetch from backend
      if (token.startsWith('mock_') || token.startsWith('wallet_')) {
        console.log('Skipping backend profile fetch for local authentication token');
        
        // Try to load user from localStorage
        try {
          const cachedUser = localStorage.getItem('user');
          if (cachedUser) {
            const userData = JSON.parse(cachedUser);
            if (userData) {
              setUser(userData);
              console.log('Using cached user data');
            }
          } else {
            // Create minimal user object if no cached data
            // This avoids backend calls but still treats user as authenticated
            console.log('No cached user data, creating minimal user object');
            const userAddress = localStorage.getItem('wallet_address');
            if (userAddress) {
              const minimalUser = {
                id: userAddress,
                wallets: [{
                  id: '1', 
                  user_id: '1', 
                  address: userAddress,
                  type: 'bitcoin',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }]
              };
              setUser(minimalUser as User);
              
              // Store for future use
              localStorage.setItem('user', JSON.stringify(minimalUser));
            } else {
              console.warn('No wallet address found in localStorage');
              setUser(null);
            }
          }
        } catch (cacheError) {
          console.warn('Failed to load user from cache:', cacheError);
          setUser(null);
        }
        
        setIsLoading(false);
        return;
      }
      
      // For real backend tokens, make the profile request
      console.log('Making backend profile request for real token');
      
      try {
        // Make the API call with a timeout
        const response = await Promise.race([
          api.user.getProfile(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 8000)
          )
        ]);
        
        if (response.success && response.data) {
          setUser(response.data);
          console.log('User data refreshed successfully from backend');
          
          // Store user data in localStorage for future use
          try {
            localStorage.setItem('user', JSON.stringify(response.data));
          } catch (storageError) {
            console.warn('Failed to store user data in localStorage:', storageError);
          }
        } else if (!response.success) {
          console.error('Failed to refresh user data:', response.error);
          
          // Try to use cached user data on error
          try {
            const cachedUser = localStorage.getItem('user');
            if (cachedUser) {
              const userData = JSON.parse(cachedUser);
              if (userData) {
                console.log('Using cached user data due to API error');
                setUser(userData);
                return;
              }
            }
          } catch (cacheError) {
            console.warn('Failed to load user from cache:', cacheError);
          }
          
          // If no cached data and API error, logout if it's a real token
          // (We don't want to auto-logout for network issues)
          if (response.error === 'Your session has expired. Please sign in again.') {
            logout();
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('API call error or timeout:', error);
        
        // Try to use cached user data on error
        try {
          const cachedUser = localStorage.getItem('user');
          if (cachedUser) {
            const userData = JSON.parse(cachedUser);
            if (userData) {
              console.log('Using cached user data due to error');
              setUser(userData);
              return;
            }
          }
        } catch (cacheError) {
          console.warn('Failed to load user from cache:', cacheError);
        }
        
        // Don't logout on network errors
        setUser(null);
      }
    } catch (error) {
      console.error('Error in refreshUser:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Login method for wallet authentication - local only, no backend calls
  const loginWithWallet = async (address: string, signature: string, message: string) => {
    try {
      console.log('Local wallet login with address:', address);
      
      // Store the address for future use
      localStorage.setItem('wallet_address', address);
      
      // Create a mock token - in a real app you'd get this from the server
      const token = `wallet_${address}_${Date.now()}`;
      setAuthToken(token);
      
      // Create a minimal user object
      const minimalUser = {
        id: address,
        wallets: [{
          id: '1', 
          user_id: '1', 
          address: address,
          type: 'bitcoin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]
      };
      
      // Store the user data
      localStorage.setItem('user', JSON.stringify(minimalUser));
      setUser(minimalUser as User);
      
      return true;
    } catch (error) {
      console.error('Wallet login error:', error);
      return false;
    }
  };

  // Check for existing token and load user data on initial load
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      // Check if the token starts with "mock_" or "wallet_"
      const token = getAuthToken();
      console.log('Auth Provider init - token:', token ? token.substring(0, 10) + '...' : 'none');
      
      // If we have a mock token, don't try to refresh from backend
      if (token && (token.startsWith('mock_') || token.startsWith('wallet_'))) {
        console.log('Using local authentication, skipping backend profile fetch');
        // Just use the cached user data
        try {
          const cachedUser = localStorage.getItem('user');
          if (cachedUser) {
            const userData = JSON.parse(cachedUser);
            setUser(userData);
          }
        } catch (e) {
          console.warn('Error reading cached user data:', e);
        }
        setIsLoading(false);
        return;
      }
      
      await refreshUser();
    };

    initAuth();
  }, []);

  // Expose auth methods to window for non-React components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Create a safe subset of auth methods to expose
      const exposedAuth = {
        loginWithWallet,
        logout,
        refreshUser
      };
      
      // Expose to window with a specific namespace
      (window as any).__SATONIC_AUTH_CONTEXT = exposedAuth;
      
      // Cleanup on unmount
      return () => {
        delete (window as any).__SATONIC_AUTH_CONTEXT;
      };
    }
  }, [loginWithWallet, logout, refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
        loginWithWallet
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 