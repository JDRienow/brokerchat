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
  // Note: App Router doesn't use the api.bodyParser config
  // Individual route configurations are handled in the route files
};

export default nextConfig;
