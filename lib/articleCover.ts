/**
 * Утилита для выбора обложки статьи.
 * Если в базе есть coverImage — используем его.
 * Иначе подставляем дефолтную обложку по slug, если такая известна.
 */
export function getArticleCover(slug: string, coverImage?: string | null): string | null {
  if (coverImage) return coverImage;

  switch (slug) {
    // Специальная обложка для статьи про Excel и Google Sheets
    case 'prompty-dlya-excel-i-google-sheets':
      return '/images/articles/excel-google-sheets-cover.webp';

    default:
      return null;
  }
}


