/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['imitmcitygvkpecymblt.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: true, // Disable image optimization to avoid token issues
  },
};

export default nextConfig;

