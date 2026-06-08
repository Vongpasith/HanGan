/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enables standalone building for lighter Docker images
};

export default nextConfig;
