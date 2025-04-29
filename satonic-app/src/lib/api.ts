import { toast } from 'react-hot-toast';

// API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
export const AUTH_TOKEN_KEY = 'satonic_auth_token';

// Define proper response types
export interface ApiError {
  success: false;
  error: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Authentication helpers
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
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
}

export interface Auction {
  id: string;
  nft_id: string;
  seller_wallet_id: string;
  start_price: number;
  reserve_price?: number;
  buy_now_price?: number;
  current_bid?: number;
  current_bidder_id?: string;
  start_time: string;
  end_time: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  psbt: string;
  created_at: string;
  updated_at: string;
  nft?: NFT;
  bids?: Bid[];
}

export interface Bid {
  id: string;
  auction_id: string;
  bidder_id: string;
  wallet_id: string;
  amount: number;
  created_at: string;
  accepted: boolean;
  signature?: string;
}

export interface BidRequest {
  auction_id: string;
  amount: number;
  wallet_id: string;
}

export interface CreateAuctionRequest {
  nft_id: string;
  start_price: number;
  reserve_price?: number;
  buy_now_price?: number;
  start_time: string;
  end_time: string;
  psbt: string;
}

export interface ImportNFTRequest {
  wallet_id: string;
  inscription_id: string;
  collection?: string;
  title?: string;
  description?: string;
  metadata?: any;
}

export interface WalletBalanceResponse {
  address: string;
  balance: number;
  available: number;
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
      customHeaders['Authorization'] = `Bearer ${token}`;
      console.log(`Adding auth header for ${endpoint}`);
    } else {
      console.log(`No auth token for request to ${endpoint}`);
    }
    
    // Deep debug of request
    const requestOptions = {
      ...options,
      headers: {
        ...customHeaders,
        ...(options.headers as Record<string, string> || {}),
      }
    };
    
    console.log(`API request to ${endpoint}:`, {
      method: options.method || 'GET',
      hasAuthHeader: !!token,
      url: `${API_BASE_URL}${endpoint}`
    });
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);

    console.log(`Response from ${endpoint}:`, {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });

    // Handle non-JSON responses (like 204 No Content)
    if (response.status === 204) {
      return { 
        success: true,
        data: {} as T
      };
    }
    
    // Handle unauthorized responses by clearing the token
    if (response.status === 401) {
      console.error('Unauthorized request, clearing token');
      removeAuthToken();
      return {
        success: false,
        error: 'Authentication required. Please sign in again.' 
      };
    }
    
    let data;
    const contentType = response.headers.get('content-type');
    
    try {
      // Only try to parse as JSON if the Content-Type is application/json
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // For non-JSON responses, get the text
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
      }
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      // Try to get the raw text if JSON parsing failed
      const text = await response.text().catch(() => 'Could not read response text');
      throw new Error(`Failed to parse response: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
    }
    
    // If the server response has success and data fields, use those
    if ('success' in data) {
      // Ensure we're returning the correct discriminated union type
      return data.success 
        ? { success: true, data: data.data as T } 
        : { success: false, error: data.error };
    }
    
    // Otherwise, construct an ApiResponse based on HTTP status
    return response.ok 
      ? { success: true, data: data as T }
      : { success: false, error: typeof data === 'string' ? data : JSON.stringify(data) };
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
    getUserNFTs: () => apiRequest<{
      nfts: NFT[];
      total_count: number;
      page: number;
      page_size: number;
    }>('/nfts'),
    
    // Get NFTs by address
    getNFTs: (address: string) => apiRequest<{
      nfts: NFT[];
      total_count: number;
      page: number;
      page_size: number;
    }>(`/nfts/address/${address}`),
    
    // Get a specific NFT by ID
    getNFT: (id: string) => apiRequest<NFT>(`/nfts/${id}`),

    // Import an NFT
    importNFT: (data: ImportNFTRequest) => apiRequest<NFT>('/nfts/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

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
    create: (data: CreateAuctionRequest) => apiRequest<Auction>('/auctions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
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
    getWalletBalance: (walletId: string) => apiRequest<WalletBalanceResponse>(
      `/wallets/${walletId}/balance`
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
      
      return apiRequest<{ token: string; expires_at: string; user: User }>('/auth/wallet-login', {
        method: 'POST',
        body: JSON.stringify({ 
          address, 
          signature, 
          message 
        }),
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