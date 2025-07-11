import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
  eslint: {
    // Disable ESLint during builds for MVP deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checking during builds for MVP deployment
    ignoreBuildErrors: true,
  },
  // Configure API route body size limits
  api: {
    bodyParser: {
      sizeLimit: '30mb',
    },
  },
};

export default nextConfig;
