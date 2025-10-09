const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function restoreAllUsersAndPrompts() {
  try {
    console.log('🔍 Restoring all users and prompts from data-export.json...');
    
    // Читаем файл data-export.json
    const data = JSON.parse(fs.readFileSync('data-export.json', 'utf8'));
    
    console.log(`Found ${data.users.length} users and ${data.prompts.length} prompts in export file`);
    
    // Восстанавливаем пользователей
    console.log('\n👥 Restoring users...');
    for (const userData of data.users) {
      try {
        // Проверяем, существует ли пользователь
        const existingUser = await prisma.user.findUnique({
          where: { id: userData.id }
        });
        
        if (existingUser) {
          console.log(`⚠️  User ${userData.name} already exists`);
          continue;
        }
        
        // Создаем пользователя
        const user = await prisma.user.create({
          data: {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            image: userData.image,
            bio: userData.bio,
            website: userData.website,
            telegram: userData.telegram,
            github: userData.github,
            twitter: userData.twitter,
            linkedin: userData.linkedin,
            reputationScore: userData.reputationScore || 0,
            reputationPromptCount: userData.reputationPromptCount || 0,
            reputationRatingsSum: userData.reputationRatingsSum || 0,
            reputationRatingsCnt: userData.reputationRatingsCnt || 0,
            reputationLikesCnt: userData.reputationLikesCnt || 0,
            reputationSavesCnt: userData.reputationSavesCnt || 0,
            reputationCommentsCnt: userData.reputationCommentsCnt || 0
          }
        });
        
        console.log(`✅ Created user: ${user.name} (${user.email})`);
        
      } catch (error) {
        console.error(`❌ Error creating user ${userData.name}:`, error.message);
      }
    }
    
    // Восстанавливаем промпты
    console.log('\n📝 Restoring prompts...');
    let restoredCount = 0;
    
    for (const promptData of data.prompts) {
      try {
        // Проверяем, существует ли промпт
        const existingPrompt = await prisma.prompt.findUnique({
          where: { id: promptData.id }
        });
        
        if (existingPrompt) {
          console.log(`⚠️  Prompt "${promptData.title}" already exists`);
          continue;
        }
        
        // Создаем промпт
        const prompt = await prisma.prompt.create({
          data: {
            id: promptData.id,
            title: promptData.title,
            description: promptData.description,
            prompt: promptData.prompt,
            model: promptData.model,
            lang: promptData.lang,
            category: promptData.category,
            tags: promptData.tags,
            license: promptData.license,
            authorId: promptData.authorId,
            averageRating: promptData.averageRating || 0,
            totalRatings: promptData.totalRatings || 0,
            views: promptData.views || 0
          }
        });
        
        console.log(`✅ Created prompt: "${prompt.title}" by ${promptData.authorId}`);
        restoredCount++;
        
      } catch (error) {
        console.error(`❌ Error creating prompt "${promptData.title}":`, error.message);
      }
    }
    
    console.log(`\n🎉 Restoration completed!`);
    console.log(`✅ Restored ${restoredCount} prompts`);
    
    // Обновляем счетчики категорий
    console.log('\n🔄 Updating category counts...');
    await prisma.category.updateMany({
      data: { promptCount: 0 }
    });
    
    const categoryCounts = await prisma.prompt.groupBy({
      by: ['category'],
      _count: { id: true }
    });
    
    for (const count of categoryCounts) {
      // Находим соответствующую категорию в таблице Category
      const category = await prisma.category.findFirst({
        where: {
          OR: [
            { nameEn: count.category },
            { nameRu: count.category }
          ]
        }
      });
      
      if (category) {
        await prisma.category.update({
          where: { id: category.id },
          data: { promptCount: count._count.id }
        });
        console.log(`✅ ${category.nameRu}: ${count._count.id} prompts`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreAllUsersAndPrompts();
