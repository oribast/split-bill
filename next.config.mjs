/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['pg'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias['@neondatabase/serverless'] = false;
    }
    return config;
  },
};

export default nextConfig;
