import { AuctionCard } from "./AuctionCard"

interface Auction {
  id: string
  title: string
  image: string
  currentBid: number
  endTime: Date
  creator: string
}

// This would normally come from an API
const mockAuctions: Auction[] = [
  {
    id: "1",
    title: "Ordinal #1234",
    image: "/mock/nft1.jpg",
    currentBid: 0.5,
    endTime: new Date(Date.now() + 86400000),
    creator: "0x1234...5678"
  },
  // Add more mock auctions...
]

export function AuctionGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mockAuctions.map((auction) => (
        <AuctionCard key={auction.id} auction={auction} />
      ))}
    </div>
  )
}

