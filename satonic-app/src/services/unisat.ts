import { api, isAuthenticated, setAuthToken, ApiSuccess, getAuthToken } from '@/lib/api';
import { toast } from 'react-hot-toast';

// Add a lock to prevent multiple simultaneous authentication attempts
let authInProgress = false;
let lastAuthAttempt = 0;
const AUTH_COOLDOWN_MS = 2000; // 2 second cooldown between auth attempts

// Define network types
export type BitcoinNetwork = 'mainnet' | 'testnet4' | 'testnet';

// Map internal network types to Unisat network types
const NETWORK_MAPPING = {
  'mainnet': 'livenet',
  'testnet4': 'testnet', 
  'testnet': 'testnet'
};

// Helper function to check if wallet is connected and authenticate if needed
async function ensureWalletAuthenticated(network: BitcoinNetwork = 'testnet4'): Promise<boolean> {
  // If authentication is already in progress, return false
  if (authInProgress) {
    console.log('Authentication already in progress, skipping');
    return false;
  }
  
  // Set the lock
  authInProgress = true;
  
  try {
    // If already authenticated with backend, we're good - return true immediately
    if (getAuthToken()) {
      console.log('Already authenticated, skipping wallet check');
      return true;
    }
    
    console.log('Starting authentication process');
    
    // Check if Unisat is available
    if (typeof window === 'undefined' || !(window as any).unisat) {
      console.error('Unisat wallet not detected');
      toast.error('Unisat wallet extension not detected. Please install it first.');
      return false;
    }
    
    try {
      // Switch to the correct network
      const unisatNetwork = NETWORK_MAPPING[network] || 'testnet';
      await (window as any).unisat.switchNetwork(unisatNetwork);
      console.log(`Switched to network: ${unisatNetwork}`);
    } catch (networkError) {
      console.error('Failed to switch network:', networkError);
      toast.error('Failed to switch network. Please try again.');
      return false;
    }
    
    // Get accounts/addresses
    let accounts;
    try {
      accounts = await (window as any).unisat.getAccounts();
    } catch (error) {
      console.error('Failed to get accounts:', error);
      toast.error('Failed to access wallet accounts');
      return false;
    }
    
    if (!accounts || accounts.length === 0) {
      // Try to request accounts if none found
      try {
        const requestedAccounts = await (window as any).unisat.requestAccounts();
        if (!requestedAccounts || requestedAccounts.length === 0) {
          toast.error('Please connect your wallet');
          return false;
        }
        accounts = requestedAccounts;
      } catch (error) {
        console.error('Failed to request accounts:', error);
        toast.error('Failed to connect wallet');
        return false;
      }
    }
    
    if (!accounts || accounts.length === 0) {
      toast.error('No wallet accounts found');
      return false; 
    }
    
    const address = accounts[0] || '';
    console.log('Using wallet address:', address);
    
    // Create message to sign to prove ownership of wallet
    const message = `Sign this message to authenticate with Satonic: ${address}`;
    
    // Request signature
    let signature;
    try {
      signature = await (window as any).unisat.signMessage(message);
      console.log('Signature obtained');
    } catch (error) {
      console.error('Failed to sign message:', error);
      toast.error('Wallet signature rejected');
      return false;
    }
    
    // If we have a signature, the user has proven wallet ownership
    if (signature) {
      console.log('User signed message, proceeding with local authentication');
      
      // Import the auth context to use our local login method
      const { useAuth } = await import('@/components/providers/auth-provider');
      
      // Get the auth context functions - need to use in a way that works outside React components
      // This is a bit of a hack but works for our purpose
      const authContextValues = (window as any).__SATONIC_AUTH_CONTEXT;
      
      if (authContextValues && authContextValues.loginWithWallet) {
        const success = await authContextValues.loginWithWallet(address, signature, message);
        if (success) {
          toast.success('Wallet connected successfully');
          // Dispatch auth event to notify components
          window.dispatchEvent(new Event('auth_changed'));
          return true;
        } else {
          toast.error('Failed to complete authentication');
          return false;
        }
      } else {
        // Fallback if we can't access the auth context directly
        // Store data in localStorage for the auth provider to pick up
        localStorage.setItem('wallet_address', address);
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
        
        // Store for future use
        localStorage.setItem('user', JSON.stringify(minimalUser));
        
        toast.success('Wallet connected successfully');
        
        // Dispatch auth event to notify components
        window.dispatchEvent(new Event('auth_changed'));
        
        return true;
      }
    } else {
      toast.error('Failed to obtain signature');
      return false;
    }
  } catch (error) {
    console.error('Wallet authentication error:', error);
    toast.error('Wallet error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    return false;
  } finally {
    // Always release the lock when done
    authInProgress = false;
  }
}

export interface UnisatInscription {
  inscriptionId: string;
  inscriptionNumber: number;
  address: string;
  outputValue: number;
  preview: string;
  content: string;
  contentType: string;
  timestamp: number;
  genesisTransaction: string;
  location: string;
  output: string;
  offset: number;
}

export interface UnisatBalance {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

export interface UnisatUtxo {
  txId: string;
  outputIndex: number;
  satoshis: number;
  scriptPk: string;
  addressType: string;
  inscriptions: UnisatInscription[];
}

class UnisatService {
  async getAddressBalance(address: string): Promise<UnisatBalance> {
    try {
      // Check if authenticated without triggering wallet connection
      if (!isAuthenticated()) {
        console.warn('User not authenticated, returning empty balance');
        return {
          confirmed: 0,
          unconfirmed: 0,
          total: 0
        };
      }
      
      const response = await api.nft.getNFTs(address);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch balance');
      }
      // Transform the response to match UnisatBalance interface
      return {
        confirmed: 0,
        unconfirmed: 0,
        total: response.data.total_count
      };
    } catch (error) {
      console.error('Error fetching address balance:', error);
      // Return empty result instead of throwing
      return {
        confirmed: 0,
        unconfirmed: 0,
        total: 0
      };
    }
  }

  async getAddressInscriptions(address: string, cursor: number = 0, size: number = 20): Promise<{
    total: number;
    inscriptions: UnisatInscription[];
  }> {
    try {
      // Check if authenticated without triggering wallet connection
      if (!isAuthenticated()) {
        console.warn('User not authenticated, returning empty inscriptions');
        // Return empty data instead of throwing error to avoid cascading auth prompts
        return {
          total: 0,
          inscriptions: []
        };
      }
      
      const response = await api.nft.getNFTs(address);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch inscriptions');
      }
      // Transform the response to match UnisatInscription interface
      const inscriptions = (response.data?.nfts || []).map((nft: any) => ({
        inscriptionId: nft.id,
        inscriptionNumber: parseInt(nft.inscription_id || '0'),
        address: nft.wallet_id,
        outputValue: 0,
        preview: nft.image_url,
        content: nft.content_url,
        contentType: nft.metadata?.content_type || 'text/plain',
        timestamp: Date.parse(nft.created_at),
        genesisTransaction: nft.metadata?.genesis_tx || '',
        location: '',
        output: '',
        offset: 0
      }));
      return {
        total: inscriptions.length,
        inscriptions
      };
    } catch (error) {
      console.error('Error fetching address inscriptions:', error);
      // Return empty result instead of throwing to prevent API errors
      return {
        total: 0,
        inscriptions: []
      };
    }
  }

  async getInscriptionDetail(inscriptionId: string): Promise<UnisatInscription | null> {
    try {
      // Check if authenticated without triggering wallet connection
      if (!isAuthenticated()) {
        console.warn('User not authenticated, returning null for inscription detail');
        return null;
      }
      
      const response = await api.nft.getNFT(inscriptionId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch inscription detail');
      }
      const nft = response.data;
      return {
        inscriptionId: nft.id,
        inscriptionNumber: parseInt(nft.inscription_id || '0'),
        address: nft.wallet_id,
        outputValue: 0,
        preview: nft.image_url,
        content: nft.content_url,
        contentType: nft.metadata?.content_type || 'text/plain',
        timestamp: Date.parse(nft.created_at),
        genesisTransaction: nft.metadata?.genesis_tx || '',
        location: '',
        output: '',
        offset: 0
      };
    } catch (error) {
      console.error('Error fetching inscription detail:', error);
      return null;
    }
  }

  async getAddressUtxos(address: string): Promise<UnisatUtxo[]> {
    try {
      // Check if authenticated without triggering wallet connection
      if (!isAuthenticated()) {
        console.warn('User not authenticated, returning empty UTXOs');
        return [];
      }
      
      // This endpoint needs to be implemented in your backend
      const response = await api.nft.getNFTs(address);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch utxos');
      }
      // Transform the response to match UnisatUtxo interface
      return (response.data?.nfts || []).map((nft: any) => ({
        txId: nft.metadata?.genesis_tx || '',
        outputIndex: 0,
        satoshis: 0,
        scriptPk: '',
        addressType: '',
        inscriptions: [{
          inscriptionId: nft.id,
          inscriptionNumber: parseInt(nft.inscription_id || '0'),
          address: nft.wallet_id,
          outputValue: 0,
          preview: nft.image_url,
          content: nft.content_url,
          contentType: nft.metadata?.content_type || 'text/plain',
          timestamp: Date.parse(nft.created_at),
          genesisTransaction: nft.metadata?.genesis_tx || '',
          location: '',
          output: '',
          offset: 0
        }]
      }));
    } catch (error) {
      console.error('Error fetching address utxos:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  async getInscriptionContent(inscriptionId: string): Promise<string | null> {
    try {
      // Check if authenticated without triggering wallet connection
      if (!isAuthenticated()) {
        console.warn('User not authenticated, returning null for inscription content');
        return null;
      }
      
      const response = await api.nft.getNFT(inscriptionId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch inscription content');
      }
      return response.data.content_url;
    } catch (error) {
      console.error('Error fetching inscription content:', error);
      return null;
    }
  }
  
  // Switch network and ensure it's properly configured
  async switchNetwork(network: BitcoinNetwork): Promise<boolean> {
    if (typeof window === 'undefined' || !(window as any).unisat) {
      toast.error('Unisat wallet not detected');
      return false;
    }

    try {
      const unisatNetwork = NETWORK_MAPPING[network] || 'testnet';
      await (window as any).unisat.switchNetwork(unisatNetwork);
      console.log(`Switched to network: ${unisatNetwork}`);
      
      // Verify the current network
      const currentChain = await (window as any).unisat.getChain();
      console.log(`Current wallet chain: ${JSON.stringify(currentChain)}`);
      
      // Store the current network in local storage
      localStorage.setItem('current_network', network);
      
      return true;
    } catch (error) {
      console.error('Network switch error:', error);
      toast.error('Failed to switch network');
      return false;
    }
  }

  // Get the current network
  async getCurrentNetwork(): Promise<BitcoinNetwork> {
    try {
      // First check localStorage for user preference
      const storedNetwork = localStorage.getItem('current_network') as BitcoinNetwork;
      if (storedNetwork) {
        return storedNetwork;
      }
      
      // Otherwise check the wallet's current network
      if (typeof window !== 'undefined' && (window as any).unisat) {
        const chain = await (window as any).unisat.getChain();
        if (chain && chain.enum === 'Mainnet') {
          return 'mainnet';
        }
      }
      
      // Default to testnet4
      return 'testnet4';
    } catch (error) {
      console.error('Error getting current network:', error);
      return 'testnet4'; // Default
    }
  }

  // Add a method to authenticate with the wallet explicitly
  async connect(network: BitcoinNetwork = 'testnet4'): Promise<boolean> {
    // This will be called explicitly when a user wants to connect their wallet
    return await ensureWalletAuthenticated(network);
  }
  
  // Check if wallet is connected without authentication
  async isWalletConnected(): Promise<boolean> {
    if (typeof window === 'undefined' || !(window as any).unisat) {
      return false;
    }
    
    try {
      const accounts = await (window as any).unisat.getAccounts();
      return accounts && accounts.length > 0;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return false;
    }
  }
  
  // Get the connected wallet address without authentication
  async getConnectedAddress(): Promise<string | null> {
    if (typeof window === 'undefined' || !(window as any).unisat) {
      return null;
    }
    
    try {
      const accounts = await (window as any).unisat.getAccounts();
      return accounts && accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error('Error getting wallet address:', error);
      return null;
    }
  }
}

export const unisatService = new UnisatService(); 