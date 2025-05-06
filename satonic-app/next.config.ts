/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    ORDISCAN_API_KEY: process.env.ORDISCAN_API_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      // Add additional patterns for NFT image hosting
      {
        protocol: 'https',
        hostname: '**.unisat.io',
      },
      {
        protocol: 'http',
        hostname: '**.unisat.io',
      },
      {
        protocol: 'https',
        hostname: 'ordiscan.com',
      },
      {
        protocol: 'https',
        hostname: '**.ordiscan.com',
      },
      // For testing, allow all domains - remove in production
      {
        protocol: 'https',
        hostname: '*',
      },
      {
        protocol: 'http',
        hostname: '*',
      },
    ],
    // Enable dangerous unoptimized images for debugging
    unoptimized: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
