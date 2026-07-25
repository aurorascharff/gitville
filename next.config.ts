import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
  partialPrefetching: true,
  typedRoutes: true,
  // @vercel/sandbox and better-sqlite3 load native/node built-ins that must not be bundled.
  serverExternalPackages: ['@vercel/sandbox', 'better-sqlite3'],
  experimental: {
    inlineCss: true,
  },
};

export default nextConfig;
