/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    ORDISCAN_API_KEY: process.env.ORDISCAN_API_KEY,
  },
};

export default nextConfig;
