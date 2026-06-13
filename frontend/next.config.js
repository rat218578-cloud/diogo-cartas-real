/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true  // ← IGNORA ERROS DE TIPO
  },
  eslint: {
    ignoreDuringBuilds: true  // ← IGNORA LINTING
  },
  images: {
    unoptimized: true
  },
  swcMinify: true,
  compress: true,
  staticPageGenerationTimeout: 60
}

module.exports = nextConfig
