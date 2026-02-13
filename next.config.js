/** @type {import('next').NextConfig} */
const nextConfig = {
  // Subdirectory deployment configuration
  basePath: process.env.NODE_ENV === 'production' ? '/ignite' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/ignite' : '',
  reactStrictMode: false,
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
  webpack: (config, { isServer }) => {
    // Force webpack to use UMD version of @designcombo/frames
    config.resolve.alias = {
      ...config.resolve.alias,
      '@designcombo/frames': require.resolve('@designcombo/frames/dist/frames.umd.cjs'),
    };

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

      // Increase chunk loading timeout to prevent ChunkLoadError on first load
      config.output = {
        ...config.output,
        chunkLoadTimeout: 120000, // 120 seconds instead of default 120s
      };
    }

    // Server-side externals for native modules
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'koffi': 'commonjs koffi'
      });
    }

    // Optimize chunk splitting to prevent large bundles
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization?.splitChunks,
        chunks: 'all',
        cacheGroups: {
          ...config.optimization?.splitChunks?.cacheGroups,
          redux: {
            test: /[\\/]node_modules[\\/](redux|react-redux|@reduxjs)[\\/]/,
            name: 'redux-vendor',
            priority: 10,
          },
        },
      },
    };

    return config;
  },
  experimental: {
    serverComponentsExternalPackages: [
      'vosk-koffi',
      'koffi',
      'fluent-ffmpeg',
      'fs-extra',
      'adm-zip',
      '@designcombo/frames',
      '@designcombo/state',
      '@designcombo/timeline',
      '@designcombo/events',
      '@designcombo/types'
    ],
    instrumentationHook: true // Re-enabled with non-blocking initialization
  }
};

module.exports = nextConfig; 