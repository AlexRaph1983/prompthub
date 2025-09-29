const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugMissingPrompts() {
  console.log('🔍 Диагностика пропавших промптов...');
  
  try {
    // Общая статистика
    const totalPrompts = await prisma.prompt.count();
    console.log(`📊 Всего промптов в базе: ${totalPrompts}`);
    
    // Проверяем структуру промптов
    const samplePrompt = await prisma.prompt.findFirst({
      select: {
        id: true,
        title: true,
        tags: true,
        category: true,
        lang: true,
        model: true,
        license: true,
        authorId: true,
        views: true,
        averageRating: true,
        totalRatings: true,
        createdAt: true
      }
    });
    console.log('📋 Структура промпта:', samplePrompt);
    
    // Промпты SUNO Master
    const sunoPrompts = await prisma.prompt.findMany({
      where: {
        author: {
          name: 'SUNO Master'
        }
      },
      select: {
        id: true,
        title: true,
        tags: true,
        category: true,
        createdAt: true
      }
    });
    console.log(`🎵 Промптов SUNO Master: ${sunoPrompts.length}`);
    
    // Проверяем последние 10 промптов
    const recentPrompts = await prisma.prompt.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      select: {
        id: true,
        title: true,
        tags: true,
        category: true,
        author: {
          select: {
            name: true
          }
        },
        createdAt: true
      }
    });
    
    console.log('\n📝 Последние 10 промптов:');
    recentPrompts.forEach((prompt, index) => {
      console.log(`${index + 1}. "${prompt.title}"`);
      console.log(`   Автор: ${prompt.author?.name || 'Unknown'}`);
      console.log(`   Теги: ${prompt.tags || 'ОТСУТСТВУЮТ'}`);
      console.log(`   Категория: ${prompt.category || 'ОТСУТСТВУЕТ'}`);
      console.log(`   ID: ${prompt.id}`);
      console.log(`   Создан: ${prompt.createdAt.toLocaleDateString()}`);
      console.log('');
    });
    
    // Проверяем API endpoint
    console.log('🌐 Проверяем API endpoint /api/prompts...');
    try {
      const response = await fetch('http://localhost:3000/api/prompts');
      const data = await response.json();
      console.log(`✅ API /api/prompts работает, получено ${data.prompts?.length || 0} промптов`);
    } catch (error) {
      console.log(`❌ Ошибка API /api/prompts: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Ошибка при диагностике:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugMissingPrompts();
