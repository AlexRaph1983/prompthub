import { unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getPopularTagsForCategory } from '@/lib/categories';
import { generateCategoryMetadata, generateCategoryStructuredData } from '@/lib/seo';
import { createCategoryUrl } from '@/lib/url';
import { prisma } from '@/lib/prisma';
import InfinitePromptList from '@/components/InfinitePromptList';
import { promptRepository } from '@/lib/repositories/promptRepository';
import type { Locale } from '@/i18n/index';

interface CategoryPageProps {
  params: { locale: Locale; slug: string };
  searchParams: { page?: string; tag?: string; nsfw?: string };
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps) {
  const { locale, slug } = params;
  const category = await getCategoryBySlug(slug);
  
  if (!category) {
    return {
      title: 'Категория не найдена',
      description: 'Запрашиваемая категория не существует'
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site';
  return generateCategoryMetadata(category, locale, baseUrl);
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { locale, slug } = params;
  const { page = '1', tag, nsfw } = searchParams;
  
  unstable_setRequestLocale(locale);

  // Получаем категорию
  const category = await getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  // Получаем популярные теги для категории
  const popularTags = await getPopularTagsForCategory(category.id, 10);

  // Получаем промпты для категории
  const pageNumber = parseInt(page, 10);
  const limit = 20;
  const offset = (pageNumber - 1) * limit;

  const prompts = await promptRepository.listPrompts({
    limit,
    cursor: null,
    sort: 'createdAt',
    order: 'desc',
    categoryId: category.id,
    tag: tag || undefined,
    nsfw: nsfw === 'true'
  });

  // Получаем подкатегории
  const subcategories = category.children || [];

  // Структурированные данные для SEO
  const baseUrl = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site';
  const structuredData = generateCategoryStructuredData(category, locale, baseUrl);

  return (
    <>
      {/* Структурированные данные */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="space-y-6">
        {/* Заголовок категории */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {locale === 'ru' ? category.nameRu : category.nameEn}
          </h1>
          
          {(locale === 'ru' ? category.descriptionRu : category.descriptionEn) && (
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              {locale === 'ru' ? category.descriptionRu : category.descriptionEn}
            </p>
          )}

          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>{category.promptCount} готовых решений</span>
            {category.children && category.children.length > 0 && (
              <span>{category.children.length} подразделов</span>
            )}
          </div>
        </div>

        {/* Подкатегории */}
        {subcategories.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {locale === 'ru' ? 'Подразделы' : 'Subcategories'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subcategories.map((subcategory) => (
                <a
                  key={subcategory.id}
                  href={createCategoryUrl(subcategory.slug, locale)}
                  className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    {locale === 'ru' ? subcategory.nameRu : subcategory.nameEn}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {subcategory.promptCount} готовых решений
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Популярные теги */}
        {popularTags.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {locale === 'ru' ? 'Популярные теги' : 'Popular tags'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <a
                  key={tag.id}
                  href={`/${locale}/category/${slug}?tag=${tag.slug}`}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200 transition-colors"
                >
                  {tag.name} ({tag.count})
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Промпты */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {locale === 'ru' ? 'Готовые решения' : 'All prompts'}
            </h2>
          </div>
          
          <div className="p-6">
            {prompts.items.length > 0 ? (
              <InfinitePromptList
                initialPrompts={prompts.items}
                initialNextCursor={prompts.nextCursor}
                locale={locale}
                categoryId={category.id}
                tag={tag}
                nsfw={nsfw === 'true'}
              />
            ) : (
              <InfinitePromptList
                initialPrompts={[]}
                initialNextCursor={null}
                locale={locale}
                categoryId={category.id}
                tag={tag}
                nsfw={nsfw === 'true'}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
