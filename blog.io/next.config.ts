import { hostname } from "os";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // You might have other configs here
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3.ap-southeast-2.amazonaws.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

module.exports = nextConfig;