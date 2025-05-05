export {};

declare global {
  interface UniSat {
    requestAccounts: () => Promise<string[]>;
    getAccounts: () => Promise<string[]>;
    getBalance: () => Promise<any>;
    getInscriptions: (cursor: number, size: number) => Promise<any>;
    switchNetwork: (network: string) => Promise<any>;
    signMessage: (message: string, type: string) => Promise<any>;
    on: (event: string, handler: (...args: any[]) => void) => void;
    switchChain?: (chainEnum: string) => Promise<void>;
    getChain?: () => Promise<{
      enum: string;
      name: string;
      network: 'livenet' | 'testnet';
    }>;
  }

  interface Window {
    unisat?: UniSat;
  }
}
