const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetViewCounters() {
  try {
    console.log('🔄 Starting view counters reset...');
    
    // 1. Обнуляем счетчики просмотров в промптах
    console.log('📊 Resetting Prompt.views...');
    const updatedPrompts = await prisma.prompt.updateMany({
      data: {
        views: 0
      }
    });
    console.log(`✅ Reset ${updatedPrompts.count} prompt view counters`);
    
    // 2. Очищаем таблицу событий просмотров (если нужна история, закомментируй это)
    console.log('🗑️  Clearing PromptViewEvent table...');
    const deletedEvents = await prisma.promptViewEvent.deleteMany({});
    console.log(`✅ Deleted ${deletedEvents.count} view events`);
    
    // 3. Очищаем аналитику просмотров
    console.log('📈 Clearing ViewAnalytics table...');
    const deletedAnalytics = await prisma.viewAnalytics.deleteMany({});
    console.log(`✅ Deleted ${deletedAnalytics.count} analytics records`);
    
    // 4. Очищаем взаимодействия типа 'view'
    console.log('🔍 Clearing PromptInteraction view records...');
    const deletedInteractions = await prisma.promptInteraction.deleteMany({
      where: { type: 'view' }
    });
    console.log(`✅ Deleted ${deletedInteractions.count} view interactions`);
    
    // 5. Очищаем алерты мониторинга (опционально)
    console.log('⚠️  Clearing ViewMonitoringAlert table...');
    const deletedAlerts = await prisma.viewMonitoringAlert.deleteMany({});
    console.log(`✅ Deleted ${deletedAlerts.count} monitoring alerts`);
    
    console.log('\n✨ View counters reset completed successfully!');
    console.log('📝 Summary:');
    console.log(`   - Prompts reset: ${updatedPrompts.count}`);
    console.log(`   - Events cleared: ${deletedEvents.count}`);
    console.log(`   - Analytics cleared: ${deletedAnalytics.count}`);
    console.log(`   - Interactions cleared: ${deletedInteractions.count}`);
    console.log(`   - Alerts cleared: ${deletedAlerts.count}`);
    
  } catch (error) {
    console.error('❌ Error resetting view counters:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск с подтверждением
const args = process.argv.slice(2);
if (args.includes('--confirm')) {
  resetViewCounters()
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed:', error.message);
      process.exit(1);
    });
} else {
  console.log('⚠️  WARNING: This will reset ALL view counters!');
  console.log('Run with --confirm flag to proceed:');
  console.log('   node scripts/reset-view-counters.js --confirm');
  process.exit(0);
}

