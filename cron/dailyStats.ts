import { getDailySeries, recomputeDayFromEvents } from '@/lib/services/dailyStatsService'

/**
 * Ежедневный крон: агрегирует просмотры/копирования за вчера
 * и догоняет пропущенные дни. Запускать в 00:00 серверного времени.
 *
 * Пример cron-записи (prod):
 * 0 0 * * * cd /root/prompthub && pnpm cron:daily-stats >> /var/log/prompthub-daily-stats.log 2>&1
 */
async function run() {
  const startedAt = new Date()
  const target = new Date()
  target.setDate(target.getDate() - 1)

  const prefix = '[cron:daily-stats]'
  console.log(`${prefix} start ${startedAt.toISOString()} target=${target.toISOString().slice(0, 10)}`)

  try {
    // Обновляем вчера (идемпотентно)
    await recomputeDayFromEvents(target)

    // Догоняем пропущенные дни и заполняем интервалы
    await getDailySeries('all')

    console.log(`${prefix} done at ${new Date().toISOString()}`)
  } catch (error) {
    console.error(`${prefix} failed`, error)
    // TODO: сюда можно прикрутить e-mail/Telegram-оповещение об ошибке
    process.exit(1)
  }
}

run().then(() => process.exit(0))

