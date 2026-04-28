import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // puppeteer-core is a native Node.js module — keep it out of webpack bundles
  serverExternalPackages: ['puppeteer-core'],
}

export default nextConfig
