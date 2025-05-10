import { useState, useEffect } from 'react';
import { useWalletContext } from '@/components/providers/wallet-provider';
import { unisatService, UnisatInscription } from '@/services/unisat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/providers/auth-provider';

export function InscriptionList() {
  const { isConnected, address, currentNetwork } = useWalletContext();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [inscriptions, setInscriptions] = useState<UnisatInscription[]>([]);
  const [totalInscriptions, setTotalInscriptions] = useState(0);
  const [cursor, setCursor] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    if (isConnected && address) {
      fetchInscriptions();
    }
  }, [isConnected, address, currentNetwork]);

  const fetchInscriptions = async (newCursor = 0, size = pageSize) => {
    if (!address || loading) return;
    
    setLoading(true);
    try {
      const result = await unisatService.getAddressInscriptions(address, newCursor, size);
      
      if (newCursor === 0) {
        setInscriptions(result.inscriptions);
      } else {
        setInscriptions(prev => [...prev, ...result.inscriptions]);
      }
      
      setTotalInscriptions(result.total);
      setCursor(newCursor);
    } catch (error) {
      console.error('Error fetching inscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    await fetchInscriptions(cursor + pageSize);
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Connect your wallet to view inscriptions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inscriptions ({totalInscriptions})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inscriptions.map((inscription) => (
            <Card key={inscription.inscriptionId}>
              <CardContent className="p-4">
                <div className="aspect-square relative overflow-hidden rounded-lg">
                  {inscription.contentType.startsWith('image/') ? (
                    <img
                      src={inscription.preview}
                      alt={`Inscription ${inscription.inscriptionNumber}`}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-muted">
                      <span className="text-muted-foreground">Non-image content</span>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <p className="font-medium">#{inscription.inscriptionNumber}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {inscription.contentType}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        )}
        {inscriptions.length < totalInscriptions && (
          <div className="mt-4 flex justify-center">
            <Button onClick={loadMore} disabled={loading}>
              {loading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 