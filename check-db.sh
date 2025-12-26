#!/bin/bash

cd /root/prompthub

echo "Checking database..."

node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const total = await prisma.prompt.count();
    console.log('Total prompts:', total);

    // Найти всех пользователей HitMaker
    const hitmakerUsers = await prisma.user.findMany({
      where: { name: 'HitMaker' }
    });
    console.log('HitMaker users:', hitmakerUsers.length);
    hitmakerUsers.forEach(u => console.log(' -', u.id, u.name));

    // Проверить промпты для каждого пользователя HitMaker
    for (const user of hitmakerUsers) {
      const count = await prisma.prompt.count({
        where: { authorId: user.id }
      });
      console.log('Prompts for', user.id + ':', count);

      if (count > 0) {
        const prompts = await prisma.prompt.findMany({
          where: { authorId: user.id },
          take: 2,
          select: { title: true }
        });
        prompts.forEach(p => console.log('  -', p.title.substring(0, 60)));
      }
    }

    const categories = await prisma.category.findMany({
      select: { nameRu: true, nameEn: true, id: true }
    });
    console.log('Available categories:');
    categories.forEach((c, i) => console.log(' ' + (i+1) + '.', c.nameRu, '->', c.nameEn, '(ID:', c.id.substring(0, 10) + ')'));

    const samplePrompts = await prisma.prompt.findMany({
      take: 2,
      select: { title: true, category: true, categoryId: true, authorId: true }
    });
    console.log('Sample prompts structure:');
    samplePrompts.forEach((p, i) => console.log(' ' + (i+1) + '.', 'category:', p.category, 'by', p.authorId));

    const recent = await prisma.prompt.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { title: true, authorId: true, createdAt: true }
    });
    console.log('Last 10 prompts:');
    recent.forEach((p, i) => console.log(' ' + (i+1) + '.', p.createdAt.toISOString(), p.title.substring(0, 50), 'by', p.authorId));

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.\$disconnect();
  }
}

check();
"
