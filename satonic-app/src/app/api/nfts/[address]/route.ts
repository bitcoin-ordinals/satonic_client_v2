import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    // Replace this URL with actual Ordinals API endpoint
    const response = await fetch(
      `https://api.example.com/ordinals/${params.address}`
    )
    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch NFTs' },
      { status: 500 }
    )
  }
} 