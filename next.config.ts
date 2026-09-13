import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ============================================================================
  // Performance Optimizations
  // ============================================================================

  // Enable React Compiler for automatic optimizations
  reactCompiler: true,

  // ============================================================================
  // Image Optimization
  // ============================================================================
  images: {
    // Enable image optimization
    formats: ['image/avif', 'image/webp'],
    
    // Define allowed image domains (add your CDN/image hosts here)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      {
        protocol: 'https',
        hostname: '**.pusher.com',
      },
      // Add more domains as needed for player images, team logos, etc.
    ],
    
    // Image sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Minimize layout shift
    minimumCacheTTL: 60,
  },

  // ============================================================================
  // Build Optimizations
  // ============================================================================

  // Optimize production builds
  productionBrowserSourceMaps: false, // Disable source maps in production for smaller bundles
  
  // Compress output
  compress: true,

  // ============================================================================
  // Server External Packages (moved from experimental)
  // ============================================================================
  
  // Packages that should not be bundled by the server
  // Note: @prisma/client is handled automatically by Turbopack
  serverExternalPackages: ['prisma'],

  // ============================================================================
  // Code Splitting & Bundle Optimization
  // ============================================================================
  
  // Experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: [
      'react',
      'react-dom',
      'zustand',
      'pusher-js',
      '@prisma/client',
    ],
    
    // optimizeCss needs the optional `critters` package and breaks
    // Vercel/CI builds when it is missing. Leave CSS optimization to Next.
  },

  // ============================================================================
  // Turbopack Configuration (Next.js 16+)
  // ============================================================================
  
  // Empty turbopack config to silence the warning
  // Turbopack is enabled by default in Next.js 16
  turbopack: {},

  // ============================================================================
  // Headers & Security
  // ============================================================================
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' wss://*.pusher.com https://*.pusher.com; img-src 'self' data: https:; font-src 'self' data:; frame-ancestors 'none';",
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // ============================================================================
  // Redirects & Rewrites (if needed)
  // ============================================================================
  // async redirects() {
  //   return [];
  // },
  // async rewrites() {
  //   return [];
  // },
};

export default nextConfig;
