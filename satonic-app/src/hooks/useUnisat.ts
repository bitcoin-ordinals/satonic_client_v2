import { useState, useEffect, useCallback } from 'react';
import { unisatService, BitcoinNetwork } from '@/services/unisat';
import { useAuth } from '@/components/providers/auth-provider';
import { isAuthenticated } from '@/lib/api';
import { toast } from 'react-hot-toast';
import '@/types';

export function useUnisat() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { user, refreshUser, currentNetwork, setCurrentNetwork } = useAuth();

  // Reset state when authentication changes
  useEffect(() => {
    const handleAuthChange = () => {
      // If not authenticated anymore, reset state
      if (!isAuthenticated()) {
        setIsConnected(false);
        setAddress(null);
      }
    };

    // Listen for auth changes
    window.addEventListener('auth_changed', handleAuthChange);
    
    // Clean up listener on unmount
    return () => {
      window.removeEventListener('auth_changed', handleAuthChange);
    };
  }, []);

  // Check if wallet is connected on component mount or when user changes
  useEffect(() => {
    // Check if the app is already authenticated
    if (isAuthenticated()) {
      // If we have app auth, then check if we have wallet info
      if (user?.wallets && user.wallets.length > 0) {
        // Set the address from the user's wallet
        setAddress(user.wallets[0].address);
        setIsConnected(true);
      } else {
        // No wallets found, reset state
        setAddress(null);
        setIsConnected(false);
      }
    } else {
      // Not authenticated, check wallet connection status
      checkConnection();
    }

    // Also initialize the network
    initializeNetwork();
  }, [user]);

  // Initialize network from stored preference or wallet
  const initializeNetwork = useCallback(async () => {
    try {
      const network = await unisatService.getCurrentNetwork();
      setCurrentNetwork(network);
    } catch (error) {
      console.error('Failed to initialize network:', error);
    }
  }, [setCurrentNetwork]);

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

  // Function to switch network
  const switchNetwork = useCallback(async (network: BitcoinNetwork) => {
    try {
      const success = await unisatService.switchNetwork(network);
      if (success) {
        setCurrentNetwork(network);
        toast.success(`Switched to ${network}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to switch network:', error);
      toast.error('Failed to switch network');
      return false;
    }
  }, [setCurrentNetwork]);

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

      // Ensure we're on the correct network
      await unisatService.switchNetwork(currentNetwork);

      // Not authenticated, need to connect and authenticate
      console.log('Not authenticated, connecting wallet and getting signature');
      const success = await unisatService.connect(currentNetwork);
      
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
  }, [refreshUser, checkConnection, currentNetwork]);

  return {
    isConnected,
    address,
    isConnecting,
    connect,
    checkConnection,
    switchNetwork,
    currentNetwork
  };
} 