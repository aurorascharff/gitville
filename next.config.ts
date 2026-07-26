import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
  partialPrefetching: true,
  typedRoutes: true,

  experimental: {
    inlineCss: true,
  },
};

export default nextConfig;
