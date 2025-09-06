import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: [
      // TODO: replace with actual domain env
      `${process.env.NEXT_PUBLIC_APP_HOST || 'http://localhost:3000'}/sitemap.xml`,
    ],
  };
}


