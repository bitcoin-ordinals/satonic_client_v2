'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser, clearAuth } from '@/lib/auth';
import { api, WalletBalanceResponse } from '@/lib/api';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<string>('0');

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Get current user
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    // Load wallet balance if user has wallets
    if (currentUser && currentUser.wallets && currentUser.wallets.length > 0) {
      fetchWalletBalance(currentUser.wallets[0].id);
    }
    
    setLoading(false);
  }, [router]);

  const fetchWalletBalance = async (walletId: string) => {
    try {
      const response = await api.get<WalletBalanceResponse>(`/wallets/${walletId}/balance`);
      if (response.success && response.data) {
        // Convert satoshis to BTC
        const balanceBTC = (response.data.balance / 100000000).toFixed(8);
        setWalletBalance(balanceBTC);
      }
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
    }
  };

  const handleLogout = async () => {
    await clearAuth();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition"
          >
            Logout
          </button>
        </div>
        
        {user && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Your Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400">User ID</p>
                <p className="font-mono">{user.id}</p>
              </div>
              {user.username && (
                <div>
                  <p className="text-gray-400">Username</p>
                  <p>{user.username}</p>
                </div>
              )}
              {user.email && (
                <div>
                  <p className="text-gray-400">Email</p>
                  <p>{user.email}</p>
                </div>
              )}
              <div>
                <p className="text-gray-400">Account Created</p>
                <p>{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}
        
        {user?.wallets && user.wallets.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Your Wallets</h2>
            <div className="space-y-4">
              {user.wallets.map((wallet: any) => (
                <div key={wallet.id} className="border border-gray-700 p-4 rounded-lg">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                    <div>
                      <p className="text-gray-400">Address</p>
                      <p className="font-mono break-all">{wallet.address}</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <p className="text-gray-400">Balance</p>
                      <p className="text-xl font-bold">{walletBalance} BTC</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button 
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition"
                      onClick={() => router.push('/nfts')}
                    >
                      View NFTs
                    </button>
                    <button 
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm transition"
                      onClick={() => router.push('/auctions')}
                    >
                      View Auctions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 