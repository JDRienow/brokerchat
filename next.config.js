/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    ppr: true,
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Try to set body size limits
  serverRuntimeConfig: {
    maxFileSize: '50mb',
  },
  publicRuntimeConfig: {
    maxFileSize: '50mb',
  },
};

module.exports = nextConfig;
