import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import InfinitePromptList from '@/components/InfinitePromptList';
import type { Locale } from '@/i18n/index';

interface TagPageProps {
  params: {
    locale: Locale;
    slug: string;
  };
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { locale, slug } = params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  try {
    // Декодируем slug из URL
    const decodedSlug = decodeURIComponent(slug);
    
    // Ищем тег по slug (как закодированному, так и декодированному)
    let tag = await prisma.tag.findUnique({
      where: { slug },
      select: { name: true, description: true }
    });

    // Если не найден по оригинальному slug, пробуем декодированный
    if (!tag && decodedSlug !== slug) {
      tag = await prisma.tag.findUnique({
        where: { slug: decodedSlug },
        select: { name: true, description: true }
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
        select: { name: true, slug: true, description: true }
      });
    }

    if (!tag) {
      return {
        title: t('title'),
        description: t('description')
      };
    }

    const title = `${tag.name} — ${t('title')}`;
    const description = tag.description || `${tag.name} - популярные промпты и шаблоны`;

    return {
      title,
      description,
      alternates: {
        languages: {
          ru: `/ru/tag/${slug}`,
          en: `/en/tag/${slug}`,
          'x-default': `/ru/tag/${slug}`
        }
      },
      robots: {
        index: true,
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
  const t = await getTranslations({ locale, namespace: 'tagPage' });

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

    return (
      <div className="space-y-6">
        {/* Заголовок и описание */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {tag.name}
          </h1>
          {tag.description && (
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {tag.description}
            </p>
          )}
          <div className="mt-4 flex items-center justify-center gap-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {tag.promptCount} готовых решений
            </span>
            {tag.color && (
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: tag.color }}
              ></div>
            )}
          </div>
        </div>

        {/* Дополнительный контент для SEO */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              О теге "{tag.name}"
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              Тег "{tag.name}" объединяет {tag.promptCount} готовых решений и шаблонов для работы с искусственным интеллектом. 
              Здесь вы найдете проверенные промпты, которые помогут вам эффективно использовать ИИ-инструменты 
              для решения различных задач.
            </p>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              Все решения в этой категории тщательно отобраны и протестированы сообществом. 
              Вы можете использовать их как основу для своих проектов или адаптировать под конкретные потребности.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
                💡 Как использовать
              </h3>
              <ul className="text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Выберите подходящий шаблон из списка ниже</li>
                <li>• Скопируйте текст и адаптируйте под свои задачи</li>
                <li>• Экспериментируйте с параметрами для лучших результатов</li>
                <li>• Сохраняйте понравившиеся решения в избранное</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Список промптов */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('allPrompts')}
          </h2>
          <InfinitePromptList 
            locale={locale}
            tag={tag.slug || tag.name}
            initialPrompts={[]}
            initialNextCursor={null}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading tag page:', error);
    notFound();
  }
}
