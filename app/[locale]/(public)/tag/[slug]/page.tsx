import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import InfinitePromptList from '@/components/InfinitePromptList';
import type { Locale } from '@/i18n/index';
import { YandexShareBlock } from './YandexShareBlock';
import { generateBreadcrumbSchema, generateItemListSchema } from '@/lib/structured-data';
import { promptRepository } from '@/lib/repositories/promptRepository';

interface TagPageProps {
  params: {
    locale: Locale;
    slug: string;
  };
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { locale, slug } = params;
  const t = await getTranslations({ locale, namespace: 'metadata' }) as any;
  const baseUrl = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site';
  const canonicalLocale: Locale = 'ru';

  try {
    // Декодируем slug из URL
    const decodedSlug = decodeURIComponent(slug);
    
    // Ищем тег по slug (как закодированному, так и декодированному)
    let tag = await prisma.tag.findUnique({
      where: { slug },
      select: { name: true, description: true, slug: true, promptCount: true }
    });

    // Если не найден по оригинальному slug, пробуем декодированный
    if (!tag && decodedSlug !== slug) {
      tag = await prisma.tag.findUnique({
        where: { slug: decodedSlug },
        select: { name: true, description: true, slug: true, promptCount: true }
      });
    }

    // Если не найден по slug, ищем по названию
    if (!tag) {
      tag = await prisma.tag.findFirst({
        where: { 
          OR: [
            { name: decodedSlug },
            { name: { contains: decodedSlug } },
            { slug: decodedSlug }
          ]
        },
        select: { name: true, slug: true, description: true, promptCount: true }
      });
    }

    if (!tag) {
      return {
        title: t('title'),
        description: t('description'),
        robots: { index: false, follow: false }
      };
    }

    const title = `${tag.name} — ${t('title')}`;
    const description = tag.description || `${tag.name} - популярные промпты и шаблоны`;
    const canonicalSlug = tag.slug || slug;
    const canonical = `${baseUrl}/${canonicalLocale}/tag/${canonicalSlug}`;
    const hasContent = (tag.promptCount ?? 0) > 0;

    return {
      title,
      description,
      alternates: { canonical },
      robots: {
        index: locale === canonicalLocale && hasContent,
        follow: true
      }
    };
  } catch (error) {
    console.error('Error generating metadata for tag page:', error);
    return {
      title: t('title'),
      description: t('description')
    };
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const { locale, slug } = params;
  const t = await getTranslations({ locale, namespace: 'tagPage' }) as any;

  try {
    // Декодируем slug из URL
    const decodedSlug = decodeURIComponent(slug);
    
    // Ищем тег по slug (как закодированному, так и декодированному)
    let tag = await prisma.tag.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        promptCount: true,
        color: true
      }
    });

    // Если не найден по оригинальному slug, пробуем декодированный
    if (!tag && decodedSlug !== slug) {
      tag = await prisma.tag.findUnique({
        where: { slug: decodedSlug },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          promptCount: true,
          color: true
        }
      });
    }

    // Если не найден по slug, ищем по названию
    if (!tag) {
      tag = await prisma.tag.findFirst({
        where: { 
          OR: [
            { name: decodedSlug },
            { name: { contains: decodedSlug } },
            { slug: decodedSlug }
          ]
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          promptCount: true,
          color: true
        }
      });
    }

    if (!tag) {
      notFound();
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site';
    const canonicalLocale: Locale = 'ru';
    const canonicalSlug = tag.slug || slug;
    const tagKey = tag.slug || tag.name;

    const { items: initialPrompts, nextCursor } = await promptRepository.listPrompts({
      limit: 20,
      cursor: null,
      sort: 'createdAt',
      order: 'desc',
      tag: tagKey
    });
    const breadcrumbData = generateBreadcrumbSchema(
      [
        { name: 'Главная', url: `${baseUrl}/${canonicalLocale}/home` },
        { name: 'Теги', url: `${baseUrl}/${canonicalLocale}/prompts` },
        { name: tag.name, url: `${baseUrl}/${canonicalLocale}/tag/${canonicalSlug}` }
      ],
      canonicalLocale
    );

    const itemListData = generateItemListSchema(
      `Промпты по тегу ${tag.name}`,
      `Список промптов по тегу ${tag.name}`,
      `${baseUrl}/${canonicalLocale}/tag/${canonicalSlug}`,
      initialPrompts.map((prompt) => ({
        name: prompt.title,
        url: `${baseUrl}/${canonicalLocale}/prompt/${prompt.id}`
      })),
      tag.promptCount || initialPrompts.length
    );

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListData) }}
        />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Hero секция с заголовком */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 dark:from-violet-900/20 dark:via-purple-900/20 dark:to-pink-900/20 backdrop-blur-sm border border-violet-200/50 dark:border-violet-700/30 p-8 md:p-12">
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                {tag.color && (
                  <div 
                    className="w-3 h-3 rounded-full shadow-lg"
                    style={{ backgroundColor: tag.color }}
                  ></div>
                )}
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-white/80 dark:bg-gray-800/80 text-violet-700 dark:text-violet-300 shadow-sm backdrop-blur-sm">
                  {tag.promptCount} готовых решений
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white text-center mb-4 bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
                {tag.name}
              </h1>
              
              {tag.description && (
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto text-center leading-relaxed">
                  {tag.description}
                </p>
              )}
            </div>
            
            {/* Декоративные элементы */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-400/20 to-purple-400/20 rounded-full blur-3xl -z-0"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-pink-400/20 to-purple-400/20 rounded-full blur-3xl -z-0"></div>
          </div>

          {/* О теге - информационная карточка */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-violet-500 to-purple-500 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  О теге "{tag.name}"
                </h2>
              </div>
              
              <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                <p className="text-base">
                  Тег "{tag.name}" объединяет <span className="font-semibold text-violet-600 dark:text-violet-400">{tag.promptCount} готовых решений</span> и шаблонов для работы с искусственным интеллектом. 
                  Здесь вы найдете проверенные промпты, которые помогут вам эффективно использовать ИИ-инструменты 
                  для решения различных задач.
                </p>
                
                <p className="text-base">
                  Все решения в этой категории тщательно отобраны и протестированы сообществом. 
                  Вы можете использовать их как основу для своих проектов или адаптировать под конкретные потребности.
                </p>
              </div>
            </div>
          </div>

          {/* Инструкция по использованию */}
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl border border-violet-200 dark:border-violet-700/30 overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">💡</span>
                <h3 className="text-xl font-bold text-violet-900 dark:text-violet-100">
                  Как использовать промпты
                </h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex gap-3 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">Выберите шаблон</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Найдите подходящий промпт из списка ниже</div>
                  </div>
                </div>
                
                <div className="flex gap-3 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">Адаптируйте</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Скопируйте и настройте под свои задачи</div>
                  </div>
                </div>
                
                <div className="flex gap-3 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">Экспериментируйте</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Пробуйте разные параметры для лучших результатов</div>
                  </div>
                </div>
                
                <div className="flex gap-3 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center font-bold text-sm">4</div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">Сохраняйте</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Добавляйте в избранное понравившиеся решения</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Блок "Поделиться" */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📤 Поделиться подборкой
            </h3>
            <YandexShareBlock />
          </div>

          {/* Список промптов */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-violet-500 to-purple-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('allPrompts')}
              </h2>
            </div>
            
            <InfinitePromptList 
              locale={locale}
              tag={tagKey}
              initialPrompts={initialPrompts}
              initialNextCursor={nextCursor}
            />
          </div>
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error('Error loading tag page:', error);
    notFound();
  }
}
