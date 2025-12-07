'use client';

import { useEffect, useState } from 'react';

export function YandexShareBlock() {
  const [shareScriptLoaded, setShareScriptLoaded] = useState(false);

  useEffect(() => {
    // Проверяем, загружен ли уже скрипт
    if (typeof window !== 'undefined' && !(window as any).Ya?.share2) {
      const script = document.createElement('script');
      script.src = 'https://yastatic.net/share2/share.js';
      script.async = true;
      script.onload = () => {
        setShareScriptLoaded(true);
        // Инициализируем Яндекс.Шер после загрузки скрипта
        if ((window as any).Ya?.share2) {
          (window as any).Ya.share2('ya-share-container', {
            content: {
              url: window.location.href,
              title: document.title
            },
            theme: {
              services: 'vkontakte,odnoklassniki,telegram,whatsapp',
              shape: 'round',
              limit: 4,
              size: 'm'
            }
          });
        }
      };
      document.body.appendChild(script);
    } else {
      setShareScriptLoaded(true);
      // Если скрипт уже загружен, инициализируем сразу
      if ((window as any).Ya?.share2) {
        (window as any).Ya.share2('ya-share-container', {
          content: {
            url: window.location.href,
            title: document.title
          },
          theme: {
            services: 'vkontakte,odnoklassniki,telegram,whatsapp',
            shape: 'round',
            limit: 4,
            size: 'm'
          }
        });
      }
    }
  }, []);

  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
      {shareScriptLoaded ? (
        <div 
          id="ya-share-container"
          className="ya-share2"
        ></div>
      ) : (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-violet-600 border-t-transparent"></div>
          <span className="ml-3 text-gray-500 dark:text-gray-400">Загружаем кнопки...</span>
        </div>
      )}
    </div>
  );
}




