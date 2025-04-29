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
      // Only try to refresh user data if there's an auth token
      if (!getAuthToken()) {
        setUser(null);
        return;
      }
      
      const response = await api.user.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        throw new Error('Failed to refresh user data');
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      logout();
    }
  };
  
  // Login method for wallet authentication
  const loginWithWallet = async (address: string, signature: string, message: string) => {
    try {
      const response = await api.auth.walletLogin(address, signature, message);
      
      if (response.success && response.data) {
        setAuthToken(response.data.token);
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Wallet login error:', error);
      return false;
    }
  };

  // Check for existing token and fetch user data on initial load
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const token = getAuthToken();
        if (token) {
          await refreshUser();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        removeAuthToken();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

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