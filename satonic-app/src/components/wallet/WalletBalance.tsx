"use client"

import { WalletBalance as WalletBalanceType } from "@/types/wallet"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { satoshisToAmount } from "@/utils/wallet"
import { useEffect, useState } from "react"

interface Props {
  address: string | null
  balance: WalletBalanceType
}

export default function WalletBalance({ address, balance }: Props) {
  return (
    <Card className="bg-black border-red-500 border-2">
      <CardHeader>
        <CardTitle className="text-red-500 font-mono animate-pulse">
          Wallet Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-black/50 p-4 rounded-lg border border-red-500/50">
          <p className="text-gray-400 text-sm mb-1">Address</p>
          <p className="font-mono text-red-500 break-all">
            {address || 'Not Connected'}
          </p>
        </div>
        <div className="bg-black/50 p-4 rounded-lg border border-red-500/50">
          <p className="text-gray-400 text-sm mb-1">Balance</p>
          <p className="font-mono text-2xl text-red-500">
            {satoshisToAmount(balance.total)} BTC
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 