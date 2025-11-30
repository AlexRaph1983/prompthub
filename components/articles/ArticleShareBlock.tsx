'use client';

import React from 'react';

/**
 * Кнопки шаринга через Яндекс.Шер
 * Используются только безопасные для РФ сервисы: VK, OK, Telegram, WhatsApp.
 */
export function ArticleShareBlock() {
  const [shareScriptLoaded, setShareScriptLoaded] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const ensureScript = () => {
      if ((window as any).Ya?.share2) {
        if (isMounted) setShareScriptLoaded(true);
        return;
      }

      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://yastatic.net/share2/share.js"]',
      );
      if (existing) {
        existing.addEventListener('load', () => {
          if (isMounted) setShareScriptLoaded(true);
        });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://yastatic.net/share2/share.js';
      script.async = true;
      script.onload = () => {
        if (isMounted) setShareScriptLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Yandex Share script');
      };
      document.head.appendChild(script);
    };

    ensureScript();

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!shareScriptLoaded || typeof window === 'undefined') return;

    const init = () => {
      const w = window as any;
      if (!w.Ya?.share2) return;

      const container = document.getElementById('ya-article-share');
      if (!container) return;

      w.Ya.share2(container, {
        content: {
          url: window.location.href,
          title: document.title || 'PromptHub',
        },
        theme: {
          services: 'vkontakte,odnoklassniki,telegram,whatsapp',
          size: 'm',
          shape: 'round',
          limit: 4,
        },
      });
    };

    const timer = setTimeout(init, 200);
    return () => clearTimeout(timer);
  }, [shareScriptLoaded]);

  return (
    <div className="bg-white/90 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-700/70 rounded-xl p-4 sm:p-5">
      {shareScriptLoaded ? (
        <div id="ya-article-share" className="ya-share2" />
      ) : (
        <div className="flex items-center justify-center gap-3 py-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Загружаем кнопки…
          </span>
        </div>
      )}
    </div>
  );
}


