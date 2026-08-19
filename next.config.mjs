/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,

  eslint: {
    ignoreDuringBuilds: true,
  },

  async headers() {
    return [
      // Low-risk security headers for the whole app,
      // including the embeddable widget.
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), geolocation=(), payment=(), usb=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },

      // Clickjacking protection everywhere except /widget/embed,
      // because merchant websites must be allowed to iframe it.
      {
        source: '/((?!widget/embed).*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
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
        destination:
          'https://app.tikozap.com/dashboard/:path*',
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
        destination:
          'https://app.tikozap.com/onboarding/:path*',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;