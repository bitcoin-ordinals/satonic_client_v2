import { Inter } from "next/font/google"
import { Providers } from "./providers"
import { Toaster } from "react-hot-toast";
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "NFT Ordinals Auction Platform",
  description: "Auction your Bitcoin Ordinals NFTs",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background min-h-screen`}>
        <Providers>
          <Toaster position="top-right" reverseOrder={false} />
          {children}
        </Providers>
      </body>
    </html>
  )
}
