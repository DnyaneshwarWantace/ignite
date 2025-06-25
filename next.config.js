/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // Add global runtime configuration
  serverRuntimeConfig: {
    // Will only be available on the server side
    apiHandler: {
      runtime: 'edge',
      dynamic: 'force-dynamic'
    }
  },
  // Configure how API routes are handled during build
  async headers() {
    return [
      {
        // Apply to all API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'x-custom-header',
            value: 'api-route'
          }
        ]
      }
    ];
  },
  // Skip API route type checking during build
  typescript: {
    ignoreBuildErrors: true
  },
  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true
  },
  // Skip linting during build
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2
  }
};

module.exports = nextConfig; 