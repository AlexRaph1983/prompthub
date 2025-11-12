import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Очищаем кеш Next.js
    const { revalidatePath } = await import('next/cache');
    
    // Очищаем кеш для тегов и категорий
    revalidatePath('/api/tags');
    revalidatePath('/api/categories');
    revalidatePath('/api/stats');
    
    // Очищаем кеш для страниц
    revalidatePath('/');
    revalidatePath('/prompts');
    revalidatePath('/categories');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cache cleared successfully' 
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
