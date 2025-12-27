import { NextRequest, NextResponse } from 'next/server';
import { INDEXNOW_KEY } from '@/lib/indexnow';

/**
 * IndexNow key file endpoint
 * Должен быть доступен по /{key}.txt для валидации IndexNow
 */
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ indexnowKey: string }> }
) {
  try {
    const { indexnowKey } = await params;
    const keyWithoutExt = INDEXNOW_KEY.replace('.txt', '');
    
    // Проверяем, что запрашиваемый ключ соответствует нашему
    if (indexnowKey === keyWithoutExt || indexnowKey === INDEXNOW_KEY) {
      return new NextResponse(INDEXNOW_KEY, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
    
    return new NextResponse('Not Found', { status: 404 });
  } catch (error) {
    // Если params не доступен (статическая генерация), возвращаем 404
    return new NextResponse('Not Found', { status: 404 });
  }
}

