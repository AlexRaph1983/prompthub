const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixHitmakerImport() {
  try {
    console.log('🔧 Исправляем импорт промптов HitMaker...');

    // Читаем оригинальные промпты HitMaker
    const promptsFile = path.join(__dirname, '..', 'hitmaker_prompts_for_import.json');
    const hitmakerPrompts = JSON.parse(fs.readFileSync(promptsFile, 'utf8'));

    console.log(`Найдено ${hitmakerPrompts.length} оригинальных промптов HitMaker`);

    // Находим пользователя HitMaker
    const hitmakerUser = await prisma.user.findFirst({
      where: { name: 'HitMaker' }
    });

    if (!hitmakerUser) {
      console.error('❌ Пользователь HitMaker не найден!');
      return;
    }

    console.log('✅ Найден пользователь HitMaker:', hitmakerUser.id);

    let fixed = 0;

    // Для каждого оригинального промпта HitMaker
    for (const promptData of hitmakerPrompts) {
      // Ищем промпт с таким же названием под PromptMaster
      const wrongPrompt = await prisma.prompt.findFirst({
        where: {
          title: promptData.title,
          authorId: 'promptmaster' // Предполагаемый ID PromptMaster
        }
      });

      if (wrongPrompt) {
        console.log(`🔄 Исправляем промпт: "${promptData.title}"`);

        // Обновляем authorId на правильного пользователя HitMaker
        await prisma.prompt.update({
          where: { id: wrongPrompt.id },
          data: { authorId: hitmakerUser.id }
        });

        fixed++;
      } else {
        console.log(`⚠️  Не найден неправильный промпт: "${promptData.title}"`);
      }
    }

    console.log(`✅ Исправлено ${fixed} промптов`);

    // Проверяем результат
    const hitmakerCount = await prisma.prompt.count({
      where: { authorId: hitmakerUser.id }
    });

    console.log(`📊 Промптов HitMaker теперь: ${hitmakerCount}`);

    // Показываем пример исправленных промптов
    const examples = await prisma.prompt.findMany({
      where: { authorId: hitmakerUser.id },
      take: 3,
      select: { title: true, category: true }
    });

    console.log('📝 Примеры исправленных промптов:');
    examples.forEach(p => console.log(` - ${p.title} (${p.category})`));

  } catch (error) {
    console.error('❌ Ошибка исправления:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixHitmakerImport();

