/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/asxdesk',
  images: {
    unoptimized: true
  },
  trailingSlash: true
};

module.exports = nextConfig;
