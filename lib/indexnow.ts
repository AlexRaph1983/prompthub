/**
 * IndexNow API для быстрой индексации в Яндекс и Bing
 * https://www.indexnow.org/
 */

const INDEXNOW_API_URLS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow',
];

// Генерируем ключ IndexNow (должен быть доступен по /indexnow-key.txt в корне)
export const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'indexnow-key-1735295876621';

const BASE_URL = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site';

interface IndexNowRequest {
  host: string;
  key: string;
  urlList: string[];
}

/**
 * Отправка URL в IndexNow
 */
export async function submitIndexNow(urls: string[]): Promise<boolean> {
  if (!urls.length) return false;

  // Фильтруем только URL нашего домена
  const validUrls = urls
    .filter(url => {
      try {
        const urlObj = new URL(url);
        return urlObj.hostname === new URL(BASE_URL).hostname;
      } catch {
        return false;
      }
    })
    .slice(0, 10000); // Лимит IndexNow: 10k URL за запрос

  if (!validUrls.length) {
    console.warn('IndexNow: No valid URLs to submit');
    return false;
  }

  const requestBody: IndexNowRequest = {
    host: new URL(BASE_URL).hostname,
    key: INDEXNOW_KEY,
    urlList: validUrls,
  };

  // Отправляем на все API (первый успешный ответ считается успехом)
  const results = await Promise.allSettled(
    INDEXNOW_API_URLS.map(async (apiUrl) => {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok || response.status === 202) {
          console.log(`IndexNow: Successfully submitted ${validUrls.length} URLs to ${apiUrl}`);
          return true;
        } else {
          console.warn(`IndexNow: Failed to submit to ${apiUrl}, status: ${response.status}`);
          return false;
        }
      } catch (error) {
        console.error(`IndexNow: Error submitting to ${apiUrl}:`, error);
        return false;
      }
    })
  );

  // Возвращаем true, если хотя бы один запрос успешен
  return results.some(result => result.status === 'fulfilled' && result.value === true);
}

/**
 * Отправка одного URL
 */
export async function submitSingleUrl(path: string): Promise<boolean> {
  const fullUrl = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  return submitIndexNow([fullUrl]);
}

/**
 * Batch отправка с rate limiting
 */
export async function submitBatch(urls: string[], batchSize: number = 100): Promise<number> {
  let successCount = 0;
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const success = await submitIndexNow(batch);
    if (success) successCount += batch.length;
    
    // Rate limit: 1 запрос в секунду
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return successCount;
}

