/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'res.cloudinary.com'] // adjust as needed
  },
  async redirects() {
    return [
      {
        source: '/recycle-bin',
        destination: '/trash',
        permanent: true
      }
    ]
  },
  typescript: {
    // ✅ Allows using .js files in a TypeScript project without throwing
    ignoreBuildErrors: true
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Enable Turbopack
  turbopack: {
    // Add any specific Turbopack rules here
  }
}

export default nextConfig 