import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/index';

export default function sitemap(): MetadataRoute.Sitemap {
  const host = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site';
  const basePaths = ['', '/prompts', '/add', '/home', '/leaders'];

  const entries: MetadataRoute.Sitemap = [];
  
  // Добавляем основные страницы без локали
  for (const p of basePaths) {
    entries.push({
      url: `${host}${p}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: p === '' ? 1 : 0.8,
    });
  }
  
  // Добавляем локализованные страницы
  for (const l of locales) {
    for (const p of basePaths) {
      entries.push({
        url: `${host}/${l}${p}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: p === '' ? 1 : 0.8,
      });
    }
  }
  
  return entries;
}


