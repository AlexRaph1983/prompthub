import React from 'react';
import type { Locale } from '@/i18n/index';

interface ArticleCTAProps {
  locale: Locale;
}

/**
 * Call-to-Action блок в конце статьи
 */
export function ArticleCTA({ locale }: ArticleCTAProps) {
  const title = locale === 'ru'
    ? 'Готовы применить полученные знания?'
    : 'Ready to apply what you learned?';

  const description = locale === 'ru'
    ? 'Найдите готовые промпты или создайте свой шаблон и поделитесь с сообществом.'
    : 'Find ready-to-use prompts or create your own template and share it with the community.';

  const browseText = locale === 'ru' ? 'Смотреть промпты' : 'Browse Prompts';
  const createText = locale === 'ru' ? 'Создать промпт' : 'Create Prompt';

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-8 text-white mb-12">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        <p className="text-lg mb-6 text-blue-100">{description}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={`/${locale}/prompts`}
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            {browseText}
          </a>
          <a
            href={`/${locale}/add`}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium border-2 border-white"
          >
            {createText}
          </a>
        </div>
      </div>
    </div>
  );
}

