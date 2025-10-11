import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/index';

export default function sitemap(): MetadataRoute.Sitemap {
  const host = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site';
  const basePaths = ['', '/prompts', '/add', '/home', '/leaders'];
  
  // Базовые даты для разных типов страниц
  const baseDate = new Date('2025-10-11');
  const promptsDate = new Date('2025-10-10');
  const addDate = new Date('2025-10-09');
  const homeDate = new Date('2025-10-11');
  const leadersDate = new Date('2025-10-08');

  const entries: MetadataRoute.Sitemap = [];
  
  // Добавляем основные страницы без локали
  for (const p of basePaths) {
    let lastModified: Date;
    let priority: number;
    
    if (p === '') {
      lastModified = baseDate;
      priority = 1.0;
    } else if (p === '/prompts') {
      lastModified = promptsDate;
      priority = 0.9;
    } else if (p === '/add') {
      lastModified = addDate;
      priority = 0.7;
    } else if (p === '/home') {
      lastModified = homeDate;
      priority = 0.8;
    } else if (p === '/leaders') {
      lastModified = leadersDate;
      priority = 0.6;
    } else {
      lastModified = baseDate;
      priority = 0.8;
    }
    
    entries.push({
      url: `${host}${p}`,
      lastModified,
      changeFrequency: 'daily',
      priority,
    });
  }
  
  // Добавляем локализованные страницы
  for (const l of locales) {
    for (const p of basePaths) {
      let lastModified: Date;
      let priority: number;
      
      if (p === '') {
        lastModified = baseDate;
        priority = 1.0;
      } else if (p === '/prompts') {
        lastModified = promptsDate;
        priority = 0.9;
      } else if (p === '/add') {
        lastModified = addDate;
        priority = 0.7;
      } else if (p === '/home') {
        lastModified = homeDate;
        priority = 0.8;
      } else if (p === '/leaders') {
        lastModified = leadersDate;
        priority = 0.6;
      } else {
        lastModified = baseDate;
        priority = 0.8;
      }
      
      entries.push({
        url: `${host}/${l}${p}`,
        lastModified,
        changeFrequency: 'daily',
        priority,
      });
    }
  }
  
  return entries;
}


