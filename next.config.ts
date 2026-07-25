import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
  partialPrefetching: true,
  typedRoutes: true,
  // @vercel/sandbox loads Node built-ins that must not be bundled into the RSC graph.
  serverExternalPackages: ['@vercel/sandbox'],
  experimental: {
    inlineCss: true,
  },
};

export default nextConfig;
