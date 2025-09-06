import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/index';

export default function sitemap(): MetadataRoute.Sitemap {
  const host = process.env.NEXT_PUBLIC_APP_HOST || 'http://localhost:3000';
  const basePaths = ['', '/prompts', '/add'];

  const entries: MetadataRoute.Sitemap = [];
  for (const l of locales) {
    for (const p of basePaths) {
      entries.push({
        url: `${host}/${l}${p}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: p === '' ? 1 : 0.7,
      });
    }
  }
  return entries;
}


