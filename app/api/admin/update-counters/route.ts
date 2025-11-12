import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('Updating all counters...');
    
    // Обновляем счетчики тегов
    console.log('Updating tag counters...');
    const tags = await prisma.tag.findMany();
    
    for (const tag of tags) {
      const promptCount = await prisma.prompt.count({
        where: {
          tags: {
            contains: tag.name
          }
        }
      });
      
      await prisma.tag.update({
        where: { id: tag.id },
        data: { promptCount }
      });
      
      console.log(`Updated tag ${tag.name}: ${promptCount} prompts`);
    }
    
    // Обновляем счетчики категорий
    console.log('Updating category counters...');
    const categories = await prisma.category.findMany();
    
    for (const category of categories) {
      const promptCount = await prisma.prompt.count({
        where: {
          category: category.slug
        }
      });
      
      await prisma.category.update({
        where: { id: category.id },
        data: { promptCount }
      });
      
      console.log(`Updated category ${category.name}: ${promptCount} prompts`);
    }
    
    // Очищаем кеш
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/api/tags');
    revalidatePath('/api/categories');
    revalidatePath('/api/stats');
    revalidatePath('/');
    revalidatePath('/prompts');
    revalidatePath('/categories');
    
    return NextResponse.json({ 
      success: true, 
      message: 'All counters updated successfully' 
    });
  } catch (error) {
    console.error('Error updating counters:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update counters' },
      { status: 500 }
    );
  }
}
