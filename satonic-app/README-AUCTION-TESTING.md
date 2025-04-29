# Satonic Auction Testing Guide

This document explains how to test the auction feature in the Satonic application using mock data and the real backend.

## Setup Overview

The auction system has been implemented with the following components:

1. **Backend API** - Located in `satonic-api/` with endpoints for NFT and auction management
2. **Frontend Components** - Auction creation card and NFT selection interfaces
3. **Mock Data Services** - For testing without a real blockchain wallet

## Testing with Mock Data

By default, the application uses mock data for testing, which allows you to test the auction flow without connecting a real wallet or interacting with the blockchain.

### How mock data works:

1. `src/lib/mock.ts` - Contains mock NFT and auction data
2. `src/lib/mockService.ts` - Provides API-compatible service functions
3. `src/lib/serviceProvider.ts` - Switches between mock and real APIs

### To test auctions with mock data:

1. Ensure the `useMockData` flag in `src/lib/mockService.ts` is set to `true`
2. Run the development server: `npm run dev`
3. Navigate to `/auctions/create` to see the mock NFTs
4. Select an NFT and create an auction

## Testing with the Real Backend

To test with the real backend, you need to:

1. Start the backend services:
   ```bash
   cd satonic-api
   sudo docker compose up -d
   ```

2. Update the frontend to use the real API:
   - Change `useMockData` to `false` in `src/lib/mockService.ts`
   - Set `NEXT_PUBLIC_API_URL` to point to your backend (default: http://localhost:8080/api)
   - Set `NEXT_PUBLIC_ORDISCAN_API_KEY` for real NFT data

3. Run the frontend:
   ```bash
   cd satonic_client_v2/satonic-app
   npm run dev
   ```

## API Integration

The frontend-backend integration includes:

1. **API Client** (`src/lib/api.ts`):
   - Type definitions for NFT, Auction and other entities
   - HTTP client functions for API endpoints

2. **Authentication**:
   - Wallet-based authentication (with Unisat wallet)
   - JWT token handling

3. **NFT Display and Selection**:
   - Fetches NFTs from wallet via Ordiscan API
   - Filters NFTs that are already on auction

4. **Auction Creation**:
   - Form for starting price and duration
   - API integration to create auctions

## Troubleshooting

- **MockUnisatWallet**: If you're using mock data but the wallet connection fails, check if `initMockWallet()` is being called correctly in `serviceProvider.ts`.

- **CORS Issues**: If you encounter CORS errors when connecting to the backend, ensure the backend is configured to allow requests from your frontend origin.

- **Database Errors**: If the backend fails to connect to PostgreSQL, check the database configuration and ensure PostgreSQL is running properly.

## Next Steps for Development

- Implement bidding functionality in the frontend
- Add auction search and filtering
- Implement real PSBT generation for Bitcoin transactions
- Add auction status tracking and finalization 