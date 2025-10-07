import CategoryNavServer from './CategoryNavServer';
import CategoryDrawerServer from './CategoryDrawerServer';
import type { Locale } from '@/i18n/index';

interface PublicLayoutProps {
  children: React.ReactNode;
  params: { locale: Locale };
}

export default async function PublicLayout({ children, params }: PublicLayoutProps) {
  const { locale } = params;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Мобильная навигация */}
      <div className="lg:hidden p-4">
        <CategoryDrawerServer locale={locale} />
      </div>

      {/* Десктопная трёхколоночная структура */}
      <div className="hidden lg:grid lg:grid-cols-[280px_1fr_300px] lg:gap-6 lg:p-6">
        {/* Левая колонка - Навигация по категориям */}
        <aside className="sticky top-6 h-fit">
          <CategoryNavServer locale={locale} />
        </aside>

        {/* Центральная колонка - Основной контент */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* Правая колонка - Дополнительная информация */}
        <aside className="sticky top-6 h-fit">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Популярные теги
            </h3>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  ChatGPT
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Claude
                </span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  Gemini
                </span>
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                  Midjourney
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Мобильная одноколоночная структура */}
      <div className="lg:hidden">
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
