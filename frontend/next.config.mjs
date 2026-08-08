const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const remotePatterns = [
  { protocol: 'https', hostname: 'picsum.photos' },
  { protocol: 'https', hostname: 'res.cloudinary.com' },
  { protocol: 'https', hostname: 'images.unsplash.com' },
  { protocol: 'http', hostname: 'localhost', port: '5000' },
  { protocol: 'http', hostname: '127.0.0.1', port: '5000' },
];

if (apiUrl) {
  try {
    const parsed = new URL(apiUrl);
    remotePatterns.push({
      protocol: parsed.protocol.replace(':', ''),
      hostname: parsed.hostname,
      port: parsed.port || undefined,
    });
  } catch (err) {
    // Ignore invalid url
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns,
  },
  // Server Actions / route handlers fetch from the backend — not proxied here.
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    return apiUrl ? [{ source: '/api/v1/:path*', destination: `${apiUrl}/:path*` }] : [];
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;
