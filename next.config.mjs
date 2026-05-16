/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  async redirects() {
    return [
      {
        source: '/dashboard/:path*',
        has: [
          {
            type: 'host',
            value: 'tikozap.com',
          },
        ],
        destination: 'https://app.tikozap.com/dashboard/:path*',
        permanent: false,
      },
      {
        source: '/onboarding/:path*',
        has: [
          {
            type: 'host',
            value: 'tikozap.com',
          },
        ],
        destination: 'https://app.tikozap.com/onboarding/:path*',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;