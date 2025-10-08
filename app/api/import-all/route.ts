import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('Импортируем ВСЕ данные...');
    
    // Очищаем базу
    await prisma.prompt.deleteMany();
    await prisma.user.deleteMany();
    
    // Создаем пользователя PromptMaster
    const promptMaster = await prisma.user.create({
      data: {
        id: 'promptmaster',
        name: 'PromptMaster',
        email: 'promptmaster@prompthub.local',
        bio: 'Template curator for PromptHub.',
        reputationScore: 13,
        reputationPromptCount: 5,
        reputationLikesCnt: 0,
        reputationSavesCnt: 0,
        reputationRatingsCnt: 0,
        reputationCommentsCnt: 0
      }
    });
    
    console.log('PromptMaster создан');
    
    // Импортируем все файлы с промптами
    const files = [
      'prompts_prompthub2.json',
      'prompts_prompthub3.json', 
      'prompts_prompthub4.json',
      'suno_prompts.json'
    ];
    
    let totalPrompts = 0;
    
    for (const file of files) {
      try {
        const filePath = path.join(process.cwd(), file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        if (data.items && Array.isArray(data.items)) {
          for (const item of data.items) {
            await prisma.prompt.create({
              data: {
                id: `promptmaster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: item.title,
                description: item.summary || item.description || '',
                prompt: item.prompt_text || item.prompt || '',
                model: item.model || 'GPT-4o',
                lang: item.language === 'ru' ? 'Русский' : 'English',
                category: item.category || 'Text',
                tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''),
                license: item.license || 'CC-BY',
                authorId: 'promptmaster',
                averageRating: 0,
                totalRatings: 0,
                views: 0
              }
            });
            totalPrompts++;
          }
        }
        console.log(`Импортировано из ${file}: ${data.items?.length || 0} промптов`);
      } catch (error) {
        console.error(`Ошибка импорта ${file}:`, error);
      }
    }
    
    console.log(`ВСЕГО ИМПОРТИРОВАНО: ${totalPrompts} промптов`);
    
    return NextResponse.json({
      success: true,
      message: 'ВСЕ данные импортированы',
      prompts: totalPrompts,
      users: 1
    });
    
  } catch (error) {
    console.error('Ошибка импорта:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка импорта данных' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
