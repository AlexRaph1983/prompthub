'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AutoRefreshWidgetsProps {
  refreshInterval?: number; // в миллисекундах, по умолчанию 10 секунд
}

export default function AutoRefreshWidgets({ refreshInterval = 10000 }: AutoRefreshWidgetsProps) {
  const router = useRouter();

  useEffect(() => {
    let lastUpdateTime = Date.now();
    
    const interval = setInterval(async () => {
      try {
        // Проверяем, есть ли новые данные
        const response = await fetch('/api/stats?check=true', {
          cache: 'no-store'
        });
        
        if (response.ok) {
          const data = await response.json();
          const currentTime = Date.now();
          
          // Если данные обновились за последние 2 минуты, обновляем виджеты
          if (data.lastUpdated && (currentTime - new Date(data.lastUpdated).getTime()) < 120000) {
            // Проверяем, не обновляли ли мы уже недавно
            if (currentTime - lastUpdateTime > 5000) { // Минимум 5 секунд между обновлениями
              console.log('Data updated, refreshing widgets...');
              lastUpdateTime = currentTime;
              router.refresh();
            }
          }
        }
      } catch (error) {
        console.log('Auto-refresh check failed:', error);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [router, refreshInterval]);

  return null; // Этот компонент не рендерит ничего
}
