import { useState, useEffect, useCallback } from 'react';
import { unisatService } from '@/services/unisat';
import { useAuth } from '@/components/providers/auth-provider';
import { isAuthenticated } from '@/lib/api';
import { toast } from 'react-hot-toast';

export function useUnisat() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { user, refreshUser } = useAuth();

  // Check if wallet is connected on component mount
  useEffect(() => {
    // Check if the app is already authenticated
    if (isAuthenticated()) {
      // If we have app auth, then check if we have wallet info
      if (user?.wallets && user.wallets.length > 0) {
        // Set the address from the user's wallet
        setAddress(user.wallets[0].address);
        setIsConnected(true);
      }
    } else {
      // Not authenticated, check wallet connection status
      checkConnection();
    }
  }, [user]);

  // Function to check wallet connection without prompting for signature
  const checkConnection = useCallback(async () => {
    try {
      // Regular wallet check
      const isWalletConnected = await unisatService.isWalletConnected();
      setIsConnected(isWalletConnected);
      
      if (isWalletConnected) {
        const connectedAddress = await unisatService.getConnectedAddress();
        setAddress(connectedAddress);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return false;
    }
  }, []);

  // Function to connect wallet with signature
  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      // If app is already authenticated, don't need to authenticate again
      if (isAuthenticated()) {
        console.log('Already authenticated, just checking wallet connection');
        // Just check if wallet is connected
        const isConnected = await checkConnection();
        return isConnected;
      }
      
      // Not authenticated, need to connect and authenticate
      console.log('Not authenticated, connecting wallet and getting signature');
      const success = await unisatService.connect();
      
      if (success) {
        setIsConnected(true);
        const connectedAddress = await unisatService.getConnectedAddress();
        setAddress(connectedAddress);
        
        // Refresh user data to get updated wallet info
        await refreshUser();
        
        return true;
      } else {
        toast.error('Failed to connect wallet');
        return false;
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [refreshUser, checkConnection]);

  return {
    isConnected,
    address,
    isConnecting,
    connect,
    checkConnection
  };
} 