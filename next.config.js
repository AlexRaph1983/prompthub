const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  experimental: {
    webpackBuildWorker: true,
  },
  // Оптимизации для продакшена
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  
  // Оптимизация бандла
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Убираем console.log в продакшене
      config.optimization.minimizer.forEach((minimizer) => {
        if (minimizer.constructor.name === 'TerserPlugin') {
          minimizer.options.terserOptions.compress.drop_console = true;
        }
      });
    }
    return config;
  },
}

module.exports = withNextIntl(nextConfig)