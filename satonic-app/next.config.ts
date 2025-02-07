/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    ORDISCAN_API_KEY: process.env.ORDISCAN_API_KEY,
  },
  images: {
    domains: ["ordiscan.com"], 
  },
};

export default nextConfig;
