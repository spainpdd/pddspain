/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // pg и встроенный dev-Postgres не должны бандлиться Next'ом
    serverComponentsExternalPackages: ['pg', '@electric-sql/pglite'],
    // страницы со статистикой всегда свежие при переходе по ссылкам
    staleTimes: { dynamic: 0, static: 30 },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
    ];
  },
};

module.exports = nextConfig;
