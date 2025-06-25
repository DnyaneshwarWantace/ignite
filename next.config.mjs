import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  experimental: {
    instrumentationHook: true,
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Ensure case sensitivity doesn't cause issues
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve('./src'),
      '@/components': path.resolve('./src/components'),
      '@/lib': path.resolve('./src/lib'),
      '@/store': path.resolve('./src/store'),
      '@/app': path.resolve('./src/app'),
      '@/contexts': path.resolve('./src/contexts'),
      '@apiUtils': path.resolve('./src/apiUtils'),
    }
    return config
  },
};

export default nextConfig;
