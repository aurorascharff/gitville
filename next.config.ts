import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'github.com' },
    ],
  },
  reactCompiler: true,
  partialPrefetching: true,
  typedRoutes: true,
  experimental: {
    inlineCss: true,
  },
};

export default nextConfig;
