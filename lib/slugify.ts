/**
 * Утилиты для создания slug из кириллических строк
 */

/**
 * Создать slug из строки с поддержкой кириллицы
 */
export function createSlug(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[а-яё]/g, (match: string) => {
      const cyrillicMap: Record<string, string> = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
      };
      return cyrillicMap[match] || match;
    })
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Создать slug для тега
 */
export function createTagSlug(tagName: string): string {
  const slug = createSlug(tagName);
  return slug || `tag-${Date.now()}`;
}

/**
 * Создать slug для категории
 */
export function createCategorySlug(categoryName: string): string {
  const slug = createSlug(categoryName);
  return slug || `category-${Date.now()}`;
}
