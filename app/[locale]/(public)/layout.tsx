import CategoryNavServer from './CategoryNavServer';
import CategoryDrawerServer from './CategoryDrawerServer';
import TagCloudServer from './TagCloudServer';
import type { Locale } from '@/i18n/index';

// Отключаем кэширование для динамических данных
export const revalidate = 0;

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
      <div className="hidden lg:grid lg:grid-cols-[320px_1fr_300px] lg:gap-6 lg:p-6">
        {/* Левая колонка - Навигация по категориям */}
        <aside className="sticky top-6">
          <CategoryNavServer locale={locale} />
        </aside>

        {/* Центральная колонка - Основной контент */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* Правая колонка - Облако тегов */}
        <aside className="sticky top-6 h-fit">
          <TagCloudServer locale={locale} />
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
