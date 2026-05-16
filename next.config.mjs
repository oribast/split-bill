/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['pg'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@neondatabase/serverless');
    }
    return config;
  },
};

export default nextConfig;
