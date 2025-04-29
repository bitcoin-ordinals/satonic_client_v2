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
  const isEnded = auction.endTime < new Date();
  const timeLeft = isEnded ? "Ended" : `${Math.floor((auction.endTime.getTime() - Date.now()) / 3600000)}h`;
  const isPlaceholder = auction.image.includes('placehold.co');

  return (
    <Card className="overflow-hidden border-neon-red/20 bg-card/80 backdrop-blur-sm hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all duration-300 group">
      <CardHeader className="p-0">
        <div className="aspect-square relative group-hover:scale-[1.02] transition-transform duration-500">
          {isPlaceholder ? (
            <img
              src={auction.image}
              alt={auction.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={auction.image}
              alt={auction.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={true}
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
            <div className="p-4 w-full">
              <p className="text-white text-lg font-bold truncate">{auction.title}</p>
              <p className="text-gray-300 text-sm">by {auction.creator}</p>
            </div>
          </div>
        </div>
        <CardTitle className="p-4 text-red-500 group-hover:text-red-400 transition-colors">{auction.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 text-card-foreground">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Current Bid</span>
          <span className="text-red-500 font-semibold">{auction.currentBid} BTC</span>
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>{isEnded ? "Ended" : "Time Left"}</span>
          <span className={isEnded ? "text-red-500" : "text-green-500 font-semibold"}>
            {timeLeft}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link href={`/auctions/${auction.id}`} className="w-full">
          <Button className="w-full bg-neon-red hover:bg-red-600 group-hover:shadow-[0_0_10px_rgba(239,68,68,0.7)] transition-all duration-300">
            {isEnded ? "View Details" : "Place Bid"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}