/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true
  },
  swcMinify: true,
  compress: true,
  staticPageGenerationTimeout: 120, // Aumenta timeout para 2 minutos
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5
  }
}

module.exports = nextConfig
