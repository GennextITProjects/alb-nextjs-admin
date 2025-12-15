import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // for maximum compatibility
    domains: [
      'images.unsplash.com',
      'unsplash.com',
      'utfs.io',
      'alb-web-assets.s3.ap-south-1.amazonaws.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
      {
        protocol: 'https',
        hostname: 'alb-web-assets.s3.ap-south-1.amazonaws.com',
        pathname: '/**',
      },
    ],
    // Optional: Image optimization settings
    formats: ['image/webp'],
    minimumCacheTTL: 60, // 60 seconds
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
 
  async headers() {
    return [
      {
        source: '/firebase-messaging-sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
        ],
      },
    ];
  },

  //  optional: large images
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;