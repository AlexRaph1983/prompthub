const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restoreAllPrompts() {
  try {
    console.log('🔍 Checking users in database...');
    
    // Проверяем пользователей
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, image: true }
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`- ${u.id}: ${u.name} (${u.email}) - Image: ${u.image ? 'Yes' : 'No'}`);
    });
    
    // Ищем пользователя с Google авторизацией (обычно имеет image с googleusercontent.com)
    const googleUser = users.find(u => u.image && u.image.includes('googleusercontent.com'));
    if (googleUser) {
      console.log(`✅ Found Google user: ${googleUser.name} (${googleUser.email})`);
    } else {
      console.log('⚠️  No Google users found, will use first available user');
    }
    
    const authorId = googleUser ? googleUser.id : users[0]?.id;
    
    if (!authorId) {
      console.log('❌ No users found! Cannot import prompts.');
      return;
    }
    
    console.log(`\n📥 Importing prompts for author: ${authorId}`);
    
    // Импортируем промпты из всех файлов
    const promptFiles = [
      'prompts_prompthub2.json',
      'prompts_prompthub3.json', 
      'prompts_prompthub4.json',
      'suno_prompts.json'
    ];
    
    let totalImported = 0;
    
    for (const filename of promptFiles) {
      if (fs.existsSync(filename)) {
        console.log(`\n📄 Processing ${filename}...`);
        
        const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
        const items = data.items || [];
        
        console.log(`Found ${items.length} prompts in ${filename}`);
        
        for (const item of items) {
          try {
            // Проверяем, не существует ли уже такой промпт
            const existing = await prisma.prompt.findFirst({
              where: {
                title: item.title,
                authorId: authorId
              }
            });
            
            if (existing) {
              console.log(`⚠️  Skipping existing prompt: ${item.title}`);
              continue;
            }
            
            // Создаем промпт
            const prompt = await prisma.prompt.create({
              data: {
                title: item.title,
                description: item.summary || item.title,
                prompt: item.prompt_text,
                model: item.model || 'any',
                lang: item.language || 'ru',
                category: item.category || 'general',
                tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''),
                license: item.license || 'CC-BY',
                authorId: authorId
              }
            });
            
            console.log(`✅ Imported: ${item.title}`);
            totalImported++;
            
          } catch (error) {
            console.error(`❌ Error importing "${item.title}":`, error.message);
          }
        }
      } else {
        console.log(`⚠️  File not found: ${filename}`);
      }
    }
    
    console.log(`\n🎉 Import completed! Total imported: ${totalImported} prompts`);
    
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

restoreAllPrompts();
