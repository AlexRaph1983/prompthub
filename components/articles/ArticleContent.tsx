'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ArticleContentProps {
  content: string;
}

/**
 * Компонент для рендеринга markdown контента статьи
 */
export function ArticleContent({ content }: ArticleContentProps) {
  return (
    <div className="prose prose-lg prose-gray dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Кастомизация элементов
          h2: ({ node, ...props }) => {
            const text = String(props.children);
            const id = text
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-');
            return <h2 id={id} {...props} />;
          },
          h3: ({ node, ...props }) => {
            const text = String(props.children);
            const id = text
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-');
            return <h3 id={id} {...props} />;
          },
          // Ссылки открываются в новом окне, если внешние
          a: ({ node, href, ...props }) => {
            const isExternal = href?.startsWith('http');
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                {...props}
              />
            );
          },
          // Код с подсветкой
          code: ({ node, inline, className, children, ...props }) => {
            if (inline) {
              return (
                <code
                  className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className={`block p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto ${className || ''}`}
                {...props}
              >
                {children}
              </code>
            );
          },
          // Таблицы
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} />
            </div>
          ),
          // Блокquotes
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 rounded-r"
              {...props}
            />
          ),
          // Списки
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside space-y-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside space-y-2" {...props} />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

