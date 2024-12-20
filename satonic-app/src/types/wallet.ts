export interface WalletInfo {
  address: string
  type: 'unisat' | 'xverse' | 'other' // Add more wallet types as needed
  name: string
  icon?: string
}

export interface WalletConnection {
  isInstalled: boolean
  isConnected: boolean
  address: string | null
}

export interface WalletBalance {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

export interface UnisatWallet {
  getAccounts: () => Promise<string[]>;
  getPublicKey: () => Promise<string>;
  getBalance: () => Promise<number>;
  getNetwork: () => Promise<string>;
  getChain: () => Promise<{
    enum: ChainType;
    name: string;
    network: string;
  }>;
  getVersion: () => Promise<string>;
  requestAccounts: () => Promise<string[]>;
  switchNetwork: (network: string) => Promise<string>;
  switchChain: (chain: ChainType) => Promise<{
    enum: ChainType;
    name: string;
    network: string;
  }>;
  disconnect: () => Promise<void>;
}

export enum ChainType {
  BITCOIN_MAINNET = "BITCOIN_MAINNET",
  BITCOIN_TESTNET = "BITCOIN_TESTNET"
  // Add other chain types as needed
} 