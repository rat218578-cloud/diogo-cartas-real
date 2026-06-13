/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // Mude de 'export' para 'standalone'
  images: {
    unoptimized: true
  },
  swcMinify: true,
  compress: true
}

module.exports = nextConfig
