import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Auction from "@/models/auction"; 

export async function POST(req: Request) {
  try {
    await connectToDatabase(); 
    const auctionData = await req.json(); 

    const newAuction = new Auction(auctionData); 
    await newAuction.save(); 

    return NextResponse.json({ success: true, auctionId: newAuction._id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const auctions = await Auction.find().sort({ createdAt: -1 });

    return NextResponse.json(auctions, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
