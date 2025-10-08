import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('Начинаем восстановление данных...');
    
    // Очищаем базу
    await prisma.prompt.deleteMany();
    await prisma.user.deleteMany();
    
    // Загружаем данные из файла
    const dataPath = path.join(process.cwd(), 'data-export.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    console.log('Восстанавливаем пользователей...');
    for (const user of data.users) {
      await prisma.user.create({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          bio: user.bio,
          website: user.website,
          telegram: user.telegram,
          github: user.github,
          twitter: user.twitter,
          linkedin: user.linkedin,
          reputationScore: user.reputationScore,
          reputationPromptCount: user.reputationPromptCount,
          reputationLikesCnt: user.reputationLikesCnt,
          reputationSavesCnt: user.reputationSavesCnt,
          reputationRatingsCnt: user.reputationRatingsCnt,
          reputationCommentsCnt: user.reputationCommentsCnt
        }
      });
    }
    
    console.log('Восстанавливаем промпты...');
    for (const prompt of data.prompts) {
      await prisma.prompt.create({
        data: {
          id: prompt.id,
          title: prompt.title,
          description: prompt.description,
          prompt: prompt.prompt,
          model: prompt.model,
          lang: prompt.lang,
          category: prompt.category,
          tags: prompt.tags,
          license: prompt.license,
          authorId: prompt.authorId,
          averageRating: prompt.averageRating,
          totalRatings: prompt.totalRatings,
          views: prompt.views
        }
      });
    }
    
    console.log('Восстановление завершено!');
    
    return NextResponse.json({
      success: true,
      message: 'Данные успешно восстановлены',
      users: data.users.length,
      prompts: data.prompts.length
    });
    
  } catch (error) {
    console.error('Ошибка восстановления:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка восстановления данных' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
