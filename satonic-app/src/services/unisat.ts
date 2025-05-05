import { api, isAuthenticated, setAuthToken, ApiSuccess } from '@/lib/api';
import { toast } from 'react-hot-toast';

// Add a lock to prevent multiple simultaneous authentication attempts
let authInProgress = false;
let lastAuthAttempt = 0;
const AUTH_COOLDOWN_MS = 2000; // 2 second cooldown between auth attempts

// Helper function to check if wallet is connected and authenticate if needed
async function ensureWalletAuthenticated(): Promise<boolean> {
  // If already authenticated with backend, we're good - return true immediately
  if (isAuthenticated()) {
    return true;
  }
  
  // If authentication is already in progress, don't start another attempt
  if (authInProgress) {
    console.log("Authentication already in progress, skipping this request");
    return false;
  }
  
  // Implement cooldown to prevent rapid repeated auth attempts
  const now = Date.now();
  if (now - lastAuthAttempt < AUTH_COOLDOWN_MS) {
    console.log("Auth attempt too soon after previous attempt, skipping");
    return false;
  }
  
  try {
    // Set the lock before starting authentication
    authInProgress = true;
    lastAuthAttempt = now;
    
    // Check if wallet is installed
    if (typeof window === 'undefined' || !(window as any).unisat) {
      toast.error('Unisat wallet not installed');
      return false;
    }

    // Request wallet to switch to testnet
    try {
      // First try the standard testnet option which most wallets support
      try {
        await window.unisat?.switchChain?.('BITCOIN_TESTNET4');
      } catch (error) {
        console.log('Failed to switch to standard testnet, trying testnet4:', error);
        // If standard testnet fails, try testnet4 as a fallback
        // but don't throw an error if this also fails, as we'll handle it below
        try {
          await window.unisat?.switchChain?.('BITCOIN_TESTNET4');
        } catch (secondError) {
          console.warn('Failed to switch to testnet4 as well:', secondError);
          // Continue anyway, as the wallet might already be on testnet
        }
      }

      // Verify we're on an appropriate network
      const network = await (window as any).unisat.getChain();
      console.log('Current wallet network(testing purposes):', network);
      
    } catch (error) {
      console.error('Network verification failed:', error);
      // Don't block authentication - some wallets might work anyway
    }
    
    // Get wallet address
    const accounts = await (window as any).unisat.getAccounts();
    if (!accounts || accounts.length === 0) {
      // Try to request accounts if none found
      try {
        const requestedAccounts = await (window as any).unisat.requestAccounts();
        if (!requestedAccounts || requestedAccounts.length === 0) {
          toast.error('Please connect your wallet');
          return false;
        }
      } catch (error) {
        console.error('Failed to request accounts:', error);
        toast.error('Failed to connect wallet');
        return false;
      }
    }
    
    const accounts2 = await (window as any).unisat.getAccounts();
    if (!accounts2 || accounts2.length === 0) {
      toast.error('No wallet accounts found');
      return false; 
    }
    
    const address = accounts2[0] || '';
    console.log('Using wallet address:', address);
    
    // Create message to sign
    const message = `Sign this message to authenticate with Satonic: ${address}`;
    
    // Request signature
    let signature;
    try {
      signature = await (window as any).unisat.signMessage(message);
      console.log('Signature obtained:', signature);
    } catch (error) {
      console.error('Failed to sign message:', error);
      toast.error('Wallet signature rejected');
      return false;
    }
    
    // Authenticate with backend
    console.log("Sending auth request to backend:", { address, message });
    
    try {
      const response = await api.auth.walletLogin(address, signature, message);
      
      if (!response.success) {
        console.error('Backend authentication failed:', response.error);
        toast.error(response.error || 'Authentication failed');
        return false;
      }
      
      // After success check, we know response is ApiSuccess type with data
      console.log("Authentication successful, storing token");
      // Type assertion since we've already checked success
      const successResponse = response as ApiSuccess<{ token: string; expires_at: string; user: any }>;
      setAuthToken(successResponse.data.token);
      return true;
    } catch (error) {
      console.error('Backend authentication error:', error);
      toast.error('Server authentication error');
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
      const inscriptions = response.data.nfts.map((nft: any) => ({
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
      return response.data.nfts.map((nft: any) => ({
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
  
  // Add a method to authenticate with the wallet explicitly
  async connect(): Promise<boolean> {
    // This will be called explicitly when a user wants to connect their wallet
    return await ensureWalletAuthenticated();
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