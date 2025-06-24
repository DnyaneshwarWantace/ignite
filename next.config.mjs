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
  output: 'standalone',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
