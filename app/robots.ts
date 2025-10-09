import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site';
  
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
    ],
  };
}


