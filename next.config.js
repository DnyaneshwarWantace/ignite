/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add output configuration for deployment
  output: 'standalone',
  
  // Deployment optimizations
  swcMinify: true,
  poweredByHeader: false,
  
  // Disable ESLint during build for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: 'scontent-*.xx.fbcdn.net',
      }
    ],
  },
  
  // Environment variables for build
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  webpack: (config, { isServer }) => {
    // Exclude native modules from client-side bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        'fs-extra': false,
        'fluent-ffmpeg': false,
        'vosk-koffi': false,
        'adm-zip': false,
        'koffi': false,
      };
      
      // Exclude native binary files and koffi
      config.module.rules.push({
        test: /\.node$/,
        use: 'ignore-loader'
      });

      // Add externals for client-side
      config.externals = [
        ...(config.externals || []),
        'vosk-koffi',
        'koffi',
        'fs-extra',
        'fluent-ffmpeg',
        'adm-zip'
      ];
    }

    // Server-side externals for native modules
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'koffi': 'commonjs koffi'
      });
    }

    return config;
  },
  
  experimental: {
    serverComponentsExternalPackages: ['vosk-koffi', 'koffi', 'fluent-ffmpeg', 'fs-extra', 'adm-zip']
  },
  
  // Add redirects for deployment
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  
  // Handle trailing slashes
  trailingSlash: false,
};

module.exports = nextConfig; 