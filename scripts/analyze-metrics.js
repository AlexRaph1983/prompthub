const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeMetrics() {
  console.log('🔍 АНАЛИЗ МЕТРИК ПРОМПТОВ И ПРОСМОТРОВ\n');

  // 1. Общее количество промптов
  const totalPrompts = await prisma.prompt.count();
  console.log(`📊 Общее количество промптов: ${totalPrompts}`);

  // 2. Распределение по категориям (по количеству)
  const categoryStats = await prisma.category.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      nameRu: true,
      promptCount: true,
      _count: {
        select: { prompts: true }
      }
    },
    orderBy: { promptCount: 'desc' }
  });

  console.log('\n📂 РАСПРЕДЕЛЕНИЕ ПРОМПТОВ ПО КАТЕГОРИЯМ (по количеству):');
  categoryStats.forEach(cat => {
    const realCount = cat._count.prompts;
    const cachedCount = cat.promptCount;
    const percent = ((realCount / totalPrompts) * 100).toFixed(1);
    console.log(`${cat.nameRu}: ${realCount} промптов (${percent}%)`);
  });

  // 3. Анализ просмотров по категориям
  console.log('\n👁️ АНАЛИЗ ПРОСМОТРОВ ПО КАТЕГОРИЯМ:');

  const categoryViews = await prisma.prompt.groupBy({
    by: ['category'],
    _sum: { views: true },
    _count: { id: true },
    orderBy: { _sum: { views: 'desc' } }
  });

  const totalViews = categoryViews.reduce((sum, cat) => sum + (cat._sum.views || 0), 0);
  console.log(`Общее количество просмотров: ${totalViews}`);

  console.log('\nТОП-КАТЕГОРИИ ПО ПРОСМОТРАМ:');
  categoryViews.forEach(cat => {
    const views = cat._sum.views || 0;
    const percent = ((views / totalViews) * 100).toFixed(1);
    const avgViews = (views / cat._count.id).toFixed(1);
    console.log(`${cat.category}: ${views} просмотров (${percent}%) | Среднее: ${avgViews} на промпт`);
  });

  // 4. Распределение по моделям
  console.log('\n🤖 РАСПРЕДЕЛЕНИЕ ПРОМПТОВ ПО МОДЕЛЯМ:');
  const modelStats = await prisma.prompt.groupBy({
    by: ['model'],
    _count: { id: true },
    _sum: { views: true },
    orderBy: { _count: { id: 'desc' } }
  });

  modelStats.forEach(model => {
    const count = model._count.id;
    const percent = ((count / totalPrompts) * 100).toFixed(1);
    const views = model._sum.views || 0;
    const avgViews = (views / count).toFixed(1);
    console.log(`${model.model}: ${count} промптов (${percent}%) | Просмотры: ${views} | Среднее: ${avgViews}`);
  });

  // 5. Топ промптов по просмотрам
  console.log('\n⭐ ТОП-10 ПРОМПТОВ ПО ПРОСМОТРАМ:');
  const topPrompts = await prisma.prompt.findMany({
    select: {
      title: true,
      category: true,
      model: true,
      views: true,
      averageRating: true,
      totalRatings: true
    },
    orderBy: { views: 'desc' },
    take: 10
  });

  topPrompts.forEach((prompt, index) => {
    console.log(`${index + 1}. "${prompt.title}"`);
    console.log(`   Категория: ${prompt.category} | Модель: ${prompt.model}`);
    console.log(`   Просмотры: ${prompt.views} | Рейтинг: ${prompt.averageRating?.toFixed(1) || 0} (${prompt.totalRatings || 0})`);
    console.log('');
  });

  // 6. Анализ потенциала масштабирования
  console.log('📈 АНАЛИЗ ПОТЕНЦИАЛА МАСШТАБИРОВАНИЯ:');

  // Вычисляем потенциал: (просмотры на промпт) * (текущие просмотры / общее просмотры)
  const categoryPotential = categoryViews.map(cat => {
    const views = cat._sum.views || 0;
    const count = cat._count.id;
    const avgViewsPerPrompt = views / count;
    const shareOfTotalViews = views / totalViews;
    const potentialScore = avgViewsPerPrompt * shareOfTotalViews * 100; // Нормализованный скор

    return {
      category: cat.category,
      count,
      views,
      avgViewsPerPrompt,
      shareOfTotalViews,
      potentialScore
    };
  }).sort((a, b) => b.potentialScore - a.potentialScore);

  categoryPotential.forEach(cat => {
    const potential = cat.potentialScore.toFixed(1);
    console.log(`${cat.category}: Потенциал ${potential} | ${cat.count} промптов | ${cat.views} просмотров | ${(cat.shareOfTotalViews * 100).toFixed(1)}% от общего трафика`);
  });

  await prisma.$disconnect();
}

analyzeMetrics().catch(console.error);
