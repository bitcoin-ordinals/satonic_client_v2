import mongoose, { Schema, Document } from "mongoose";

export interface IAuction extends Document {
  title: string;
  inscriptionId: string; 
  inscriptionNumber: number; 
  startingBid: number;
  incrementInterval: number;
  duration: number;
  createdAt: Date;
}

const AuctionSchema = new Schema<IAuction>({
  title: { type: String, required: true },
  inscriptionId: { type: String, required: true, unique: true },
  inscriptionNumber: { type: Number, required: true },
  startingBid: { type: Number, required: true },
  incrementInterval: { type: Number, required: true },
  duration: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Auction || mongoose.model<IAuction>("Auction", AuctionSchema);
