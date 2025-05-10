import { toast } from 'react-hot-toast';

// API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
export const AUTH_TOKEN_KEY = 'satonic_auth_token';

// Define proper response types
export interface ApiError {
  success: false;
  error: string;
  status?: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Authentication helpers
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    // Check if token exists and is not just whitespace
    if (!token || !token.trim()) {
      return null;
    }
    
    // Return the cleaned token (no extra whitespace)
    return token.trim();
  } catch (err) {
    console.error('Error retrieving auth token:', err);
    return null;
  }
};

export const setAuthToken = (token: string): void => {
  try {
    if (!token) {
      console.warn('Attempted to set empty auth token');
      return;
    }
    
    // Store the trimmed token
    localStorage.setItem(AUTH_TOKEN_KEY, token.trim());
    console.log('Auth token stored successfully');
  } catch (err) {
    console.error('Error storing auth token:', err);
  }
};

export const removeAuthToken = (): void => {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    console.log('Auth token removed');
  } catch (err) {
    console.error('Error removing auth token:', err);
  }
};

// Debugging helper for token issues
export const debugAuthToken = (): void => {
  if (typeof window === 'undefined') {
    console.log('Running on server, no token available');
    return;
  }
  
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (!token) {
      console.log('No token found in localStorage');
      return;
    }
    
    console.log('Token exists in localStorage');
    console.log('Token length:', token.length);
    console.log('First 5 chars:', token.substring(0, 5));
    console.log('Last 5 chars:', token.substring(token.length - 5));
    console.log('Contains whitespace at start/end:', token !== token.trim());
    
    // Check if token appears to be JWT format (xxx.yyy.zzz)
    const jwtPattern = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$/;
    console.log('Matches JWT format:', jwtPattern.test(token.trim()));
  } catch (err) {
    console.error('Error debugging auth token:', err);
  }
};

// Reset all auth state - useful for troubleshooting
export const resetAuthState = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // Remove auth token
    localStorage.removeItem(AUTH_TOKEN_KEY);
    
    // Clear any other auth-related items in localStorage
    const authKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.toLowerCase().includes('auth') || 
                  key.toLowerCase().includes('token') || 
                  key.toLowerCase().includes('user'))) {
        authKeys.push(key);
      }
    }
    
    console.log('Clearing authentication state...');
    authKeys.forEach(key => {
      console.log(`- Removing localStorage item: ${key}`);
      localStorage.removeItem(key);
    });
    
    console.log('Auth state reset completed');
    console.log('Please refresh the page to complete the reset process');
  } catch (err) {
    console.error('Error resetting auth state:', err);
  }
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Types
export interface User {
  id: string;
  wallets?: Wallet[];
  emails?: Email[];
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  bio: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  address: string;
  type: string;
  created_at: string;
  updated_at: string;
  btc_satoshi: number;
  btc_pending_satoshi: number;
  btc_utxo_count: number;
  inscription_satoshi: number;
  inscription_pending_satoshi: number;
  inscription_utxo_count: number;
  satoshi: number;
  pending_satoshi: number;
  utxo_count: number;
}

export interface Email {
  id: string;
  user_id: string;
  address: string;
  verified: boolean;
  primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface NFT {
  id: string;
  wallet_id: string;
  token_id: string;
  inscription_id: string;
  collection: string;
  title: string;
  description: string;
  image_url: string;
  content_url: string;
  metadata: any;
  created_at: string;
  updated_at: string;
  auction_id?: string;
  wallet_address?: string;
  network?: string;
}

export interface Auction {
  title: string;
  auction_id: string;
  nft_id: string;
  seller_address: string;
  start_price: number;
  current_bid?: number;
  current_bidder_id?: string;
  start_time: string;
  end_time: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  psbt?: string;
  created_at: string;
  updated_at: string;
  bids?: Bid[];
}

export interface Bid {
  id: string;
  auction_id: string;
  bidder_id: string;
  wallet_address: string;
  amount: number;
  created_at: string;
  accepted: boolean;
  signature?: string;
}

export interface BidRequest {
  auction_id: string;
  amount: number;
  wallet_address: string;
}

export interface CreateAuctionRequest {
  nft_id: string;
  seller_address?: string;
  seller_pubkey?: string;
  title?: string;
  description?: string;
  start_price: number;
  start_time: string;
  end_time: string;
  psbt?: string;
}

export interface ImportNFTRequest {
  wallet_address: string;
  inscription_id: string;
  collection?: string;
  title?: string;
  description?: string;
  metadata?: any;
}

export interface MultisigResponse {
  descriptor: string;
  address: string;
}

export interface CreateEscrowRequest {
  inscription_utxo: string;
  vout: number;
  multisig_address: string;
  multisig_script: string;
}

export interface FinalizeEscrowRequest {
  signed_psbt: string;
}

export interface CreateEscrowResponse {
  psbt: string;
}

export interface FinalizeEscrowResponse {
  txid: string;
}

export interface WalletBalanceResponse {
  satoshi?: number;
  pendingSatoshi?: number;
  utxoCount?: number;
  btcSatoshi?: number;
  btcPendingSatoshi?: number;
  btcUtxoCount?: number;
  inscriptionSatoshi?: number;
  inscriptionPendingSatoshi?: number;
  inscriptionUtxoCount?: number;
}

export interface UserProfileUpdateRequest {
  username?: string;
  bio?: string;
  avatar_url?: string;
}

// Helper for API requests
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const token = getAuthToken();
    
    const customHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      // Don't log the actual token for security reasons
      console.log(`Using authentication token for request to: ${endpoint}`);
      
      // Ensure token is properly formatted without extra spaces or newlines
      const cleanToken = token.trim();
      customHeaders['Authorization'] = `Bearer ${cleanToken}`;
    } else {
      console.log(`No auth token available for request to: ${endpoint}`);
    }
    
    // Prepare the final request options
    const requestOptions = {
      ...options,
      headers: {
        ...customHeaders,
        ...(options.headers as Record<string, string> || {}),
      }
    };
    
    // Log request details (without sensitive info)
    console.log(`Making API request to: ${endpoint}, method: ${options.method || 'GET'}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);

    // Handle non-JSON responses (like 204 No Content)
    if (response.status === 204) {
      return { 
        success: true,
        data: {} as T
      };
    }
    
    // Check for authentication issues
    if (response.status === 401) {
      console.error('Authentication failed (401) for request to:', endpoint);
      
      // Only remove token if it's an actual authentication issue
      // Check for a specific header or response body that indicates token expiration
      const authProblem = response.headers.get('x-auth-failed') === 'true' || 
                          response.headers.get('www-authenticate')?.includes('invalid_token');
      
      if (authProblem) {
        console.warn('Auth token appears to be invalid, clearing token');
        removeAuthToken();
      }
      
      return {
        success: false,
        error: 'Authentication required. Please sign in again.' 
      };
    }
    
    // Parse the response
    let data;
    const contentType = response.headers.get('content-type');
    
    try {
      // Only try to parse as JSON if the Content-Type is application/json
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        
        // Log response data structure for debugging (without sensitive data)
        console.log(`API response data structure from ${endpoint}:`, 
          Object.keys(data).length > 0 
            ? Object.keys(data) 
            : 'Empty response');
      } else {
        const text = await response.text();
        console.warn(`Server returned non-JSON response for ${endpoint}:`, 
            text.length > 100 ? `${text.substring(0, 100)}...` : text);
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
      }
    } catch (parseError) {
      console.error(`Error parsing response from ${endpoint}:`, parseError);
      // Try to get the raw text if JSON parsing failed
      const text = await response.text().catch(() => 'Could not read response text');
      throw new Error(`Failed to parse response: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
    }

    // Log response summary
    console.log(`API response from ${endpoint}:`, 
        response.ok ? 'Success' : `Error (${response.status})`);
    
    // IMPORTANT: The API returns responses in the format { success: true, data: {...} }
    // We need to extract the actual data from this response structure
    
    // Check if response already has a success field (backend format)
    if (data && 'success' in data) {
      // The backend is already returning our expected format
      if (data.success && data.data) {
        // Return in our expected format
        return {
          success: true,
          data: data.data as T
        };
      } else {
        // Error from backend
        return {
          success: false,
          error: data.error || 'Unknown API error',
          status: response.status
        };
      }
    }
    
    // If we get here, the backend is not using our expected format
    // Just return the data directly
    return response.ok 
      ? { success: true, data: data as T }
      : { 
          success: false, 
          error: data?.error || (typeof data === 'string' ? data : JSON.stringify(data)),
          status: response.status
        };
  } catch (error) {
    console.error(`Error in API request to ${endpoint}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// API Client
export const api = {
  // NFT Endpoints
  nft: {
    // Get all user NFTs
    getUserNFTs: (network?: string) => apiRequest<{
      nfts: NFT[];
      total_count: number;
      page: number;
      page_size: number;
    }>(`/nfts${network ? `?network=${network}` : ''}`),
    
    // Get NFTs by address
    getNFTs: (address: string, network?: string) => apiRequest<{
      nfts: NFT[];
      total_count: number;
      page: number;
      page_size: number;
    }>(`/nfts/address/?address=${address}${network ? `&network=${network}` : ''}`),
    
    // Get a specific NFT by ID
    getNFT: (id: string) => apiRequest<NFT>(`/nfts/${id}`),


    // Validate an NFT before importing
    validateNFT: (data: ImportNFTRequest) => apiRequest<{
      valid: boolean;
      message: string;
      nft?: NFT;
    }>('/nfts/validate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
  
  // Auction Endpoints
  auction: {
    // Get all auctions
    getAll: (params?: {
      status?: string;
      seller_id?: string;
      bidder_id?: string;
      page?: number;
      page_size?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      return apiRequest<{
        auctions: Auction[];
        total_count: number;
        page: number;
        page_size: number;
      }>(`/auctions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    },
    
    // Get a specific auction by ID
    get: (id: string) => apiRequest<Auction>(`/auctions/${id}`),
    
    // Create a new auction
    create: (data: CreateAuctionRequest) => {
      
      return apiRequest<Auction>('/auctions/create', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    
    },
    
    // Finalize an auction
    finalize: (id: string, signature: string) => apiRequest<Auction>(`/auctions/${id}/finalize`, {
      method: 'POST',
      body: JSON.stringify({ auction_id: id, signature }),
    }),
    
    // Place a bid on an auction
    placeBid: (data: BidRequest) => apiRequest<Bid>(`/auctions/${data.auction_id}/bids`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
  
  //onchain endpoints
  onchain: {

    // Get user profile
    createMultisig: () => apiRequest<MultisigResponse>('/onchain/create-multisig'),

    // Update user profile
    createEscrow: (data: CreateEscrowRequest) => apiRequest<CreateEscrowResponse>('/onchain/create-escrow', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    // Get wallet balance
    finalizeEscrow: (data: FinalizeEscrowRequest) => apiRequest<FinalizeEscrowResponse>('/onchain/finalize-escrow', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  },
  
  // User Endpoints
  user: {
    // Get user profile
    getProfile: () => apiRequest<User>('/users/profile'),

    // Update user profile
    updateProfile: (data: UserProfileUpdateRequest) => apiRequest<User>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

    // Get wallet balance
    getWalletBalance: (address: string) => apiRequest<WalletBalanceResponse>(
      `/wallets/${address}`
    ),

  },
  
  // Auth Endpoints
  auth: {
    // Wallet login
    walletLogin: (address: string, signature: string, message: string): Promise<ApiResponse<{ token: string; expires_at: string; user: User }>> => {
      console.log("API sending auth request:", { 
        address, 
        signature: signature ? signature.substring(0, 10) + '...' : 'none',
        messageLength: message?.length || 0
      });
      
      if (!address || !signature || !message) {
        console.error("Missing required auth parameters");
        return Promise.resolve({
          success: false,
          error: "Missing required authentication parameters"
        });
      }
      
      return new Promise((resolve) => {
        apiRequest<{ token: string; expires_at: string; user: User }>('/auth/wallet-login', {
          method: 'POST',
          body: JSON.stringify({ 
            address, 
            signature, 
            message 
          }),
        }).then(response => {
          console.log('Raw wallet login response:', response);
          
          // Additional validation for response data
          if (response.success && response.data) {
            if (!response.data.token) {
              console.error('API returned success but token is missing');
              resolve({
                success: false,
                error: 'Server returned invalid token data'
              });
              return;
            }
            
            console.log('Token received from server:', {
              length: response.data.token.length,
              preview: `${response.data.token.substring(0, 10)}...${response.data.token.substring(response.data.token.length - 10)}`
            });
          }
          
          resolve(response);
        }).catch(error => {
          console.error('Wallet login request failed:', error);
          resolve({
            success: false,
            error: error.message || 'Network request failed'
          });
        });
      });
    },
    
    // Email login
    emailLogin: (email: string) => 
      apiRequest<{ message: string }>('/auth/email-login', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    
    // Verify email code
    verifyEmailCode: (email: string, code: string) => 
      apiRequest<{ token: string; expires_at: string; user: User }>('/auth/verify-code', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      }),
    
    // Link wallet to account
    linkWallet: (address: string, signature: string, message: string) => 
      apiRequest<{ message: string }>('/auth/link-wallet', {
        method: 'POST',
        body: JSON.stringify({ address, signature, message }),
      }),
    
    // Link email to account
    linkEmail: (email: string) => 
      apiRequest<{ message: string }>('/auth/link-email', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
  },
  
  // WebSocket
  ws: {
    // Get WebSocket URL
    getUrl: () => `${API_BASE_URL.replace('http', 'ws')}/ws`,
  },
  
  // System Endpoints
  system: {
    // Health check - verify backend is available
    healthCheck: () => apiRequest<{ status: string }>('/health'),
  },

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return {
      success: true,
      data
    };
  },

  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return {
      success: true,
      data
    };
  },

  async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return {
      success: true,
      data
    };
  },

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return {
      success: true,
      data
    };
  },
};

export default api; 