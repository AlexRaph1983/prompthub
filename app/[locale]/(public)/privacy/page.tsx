import { unstable_setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

interface PrivacyPageProps {
  params: { locale: string };
}

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'privacy' });
  
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = params;
  unstable_setRequestLocale(locale);
  const t = await getTranslations('privacy');

  return (
    <main className="bg-transparent min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">{t('title')}</h1>
          
          <div className="prose prose-lg max-w-none space-y-6">
            {/* Дата обновления */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
              <p className="text-sm text-blue-900">
                <strong>{t('lastUpdated')}:</strong> {new Date().toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}
              </p>
            </div>

            {/* 1. Общие положения */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('section1.title')}</h2>
              <p className="text-gray-700 mb-4">{t('section1.p1')}</p>
              <p className="text-gray-700 mb-4">{t('section1.p2')}</p>
              <p className="text-gray-700">{t('section1.p3')}</p>
            </section>

            {/* 2. Определения */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('section2.title')}</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>{t('section2.term1')}:</strong> {t('section2.def1')}</li>
                <li><strong>{t('section2.term2')}:</strong> {t('section2.def2')}</li>
                <li><strong>{t('section2.term3')}:</strong> {t('section2.def3')}</li>
                <li><strong>{t('section2.term4')}:</strong> {t('section2.def4')}</li>
              </ul>
            </section>

            {/* 3. Оператор персональных данных */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('section3.title')}</h2>
              <p className="text-gray-700 mb-4">{t('section3.p1')}</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>{t('section3.contact')}:</strong></p>
                <p className="text-gray-700">Email: privacy@prompt-hub.site</p>
              </div>
            </section>

            {/* 4. Категории обрабатываемых персональных данных */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('section4.title')}</h2>
              <p className="text-gray-700 mb-4">{t('section4.p1')}</p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium text-gray-800 mb-2">{t('section4.cat1.title')}</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>{t('section4.cat1.item1')}</li>
                    <li>{t('section4.cat1.item2')}</li>
                    <li>{t('section4.cat1.item3')}</li>
                    <li>{t('section4.cat1.item4')}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium text-gray-800 mb-2">{t('section4.cat2.title')}</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>{t('section4.cat2.item1')}</li>
                    <li>{t('section4.cat2.item2')}</li>
                    <li>{t('section4.cat2.item3')}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium text-gray-800 mb-2">{t('section4.cat3.title')}</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>{t('section4.cat3.item1')}</li>
                    <li>{t('section4.cat3.item2')}</li>
                    <li>{t('section4.cat3.item3')}</li>
                    <li>{t('section4.cat3.item4')}</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 5. Цели обработки */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('section5.title')}</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>{t('section5.purpose1')}</li>
                <li>{t('section5.purpose2')}</li>
                <li>{t('section5.purpose3')}</li>
                <li>{t('section5.purpose4')}</li>
                <li>{t('section5.purpose5')}</li>
                <li>{t('section5.purpose6')}</li>
              </ul>
            </section>

            {/* 6. Правовые основания */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('section6.title')}</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>{t('section6.basis1')}</li>
                <li>{t('section6.basis2')}</li>
                <li>{t('section6.basis3')}</li>
              </ul>
            </section>

            {/* 7. Способы обработки */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('section7.title')}</h2>
              <p className="text-gray-700 mb-4">{t('section7.p1')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>{t('section7.method1')}</li>
                <li>{t('section7.method2')}</li>
                <li>{t('section7.method3')}</li>
                <li>{t('section7.method4')}</li>
              </ul>
            </section>

            {/* 8. Меры защиты */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('section8.title')}</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>{t('section8.measure1')}</li>
                <li>{t('section8.measure2')}</li>
                <li>{t('section8.measure3')}</li>
                <li>{t('section8.measure4')}</li>
                <li>{t('section8.measure5')}</li>
              </ul>
            </section>

            {/* 9. Cookies и аналитика */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('section9.title')}</h2>
              <p className="text-gray-700 mb-4">{t('section9.p1')}</p>
              
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
                <p className="text-sm text-amber-900">
                  <strong>{t('section9.cookie1.name')}:</strong> {t('section9.cookie1.desc')}
                </p>
              </div>
              
              <p className="text-gray-700 mb-4">{t('section9.p2')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Яндекс.Метрика:</strong> {t('section9.analytics1')}</li>
              </ul>
            </section>

            {/* 10. Права субъектов */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('section10.title')}</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>{t('section10.right1')}</li>
                <li>{t('section10.right2')}</li>
                <li>{t('section10.right3')}</li>
                <li>{t('section10.right4')}</li>
                <li>{t('section10.right5')}</li>
                <li>{t('section10.right6')}</li>
              </ul>
              <p className="text-gray-700 mt-4">{t('section10.contact')}</p>
            </section>

            {/* 11. Срок хранения */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('section11.title')}</h2>
              <p className="text-gray-700 mb-4">{t('section11.p1')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>{t('section11.period1')}</li>
                <li>{t('section11.period2')}</li>
                <li>{t('section11.period3')}</li>
              </ul>
            </section>

            {/* 12. Изменения политики */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('section12.title')}</h2>
              <p className="text-gray-700">{t('section12.p1')}</p>
            </section>

            {/* Контакты */}
            <section className="bg-blue-50 rounded-lg p-6 mt-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('contactTitle')}</h2>
              <p className="text-gray-700 mb-2">{t('contactText')}</p>
              <p className="text-blue-600 font-medium">Email: privacy@prompt-hub.site</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

