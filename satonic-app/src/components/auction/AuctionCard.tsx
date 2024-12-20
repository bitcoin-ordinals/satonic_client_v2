import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import Image from "next/image"
import Link from "next/link"

interface AuctionCardProps {
  auction: {
    id: string
    title: string
    image: string
    currentBid: number
    endTime: Date
    creator: string
  }
}

export function AuctionCard({ auction }: AuctionCardProps) {
  return (
    <Card className="overflow-hidden border-neon-red/20 bg-card">
      <CardHeader className="p-0">
        <div className="aspect-square relative">
          <Image
            src={auction.image}
            alt={auction.title}
            fill
            className="object-cover"
          />
        </div>
        <CardTitle className="p-4">{auction.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 text-card-foreground">
        <h3 className="text-lg font-bold mb-2">{auction.title}</h3>
        <div className="flex justify-between text-sm text-gray-400">
          <span>Current Bid</span>
          <span>{auction.currentBid} BTC</span>
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>Ends in</span>
          <span>
            {Math.floor((auction.endTime.getTime() - Date.now()) / 3600000)}h
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link href={`/auctions/${auction.id}`} className="w-full">
          <Button className="w-full bg-neon-red hover:bg-neon-red-dark">
            Place Bid
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}