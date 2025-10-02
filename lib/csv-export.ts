/**
 * Утилиты для экспорта CSV с правильной кодировкой кириллицы
 */

export interface CSVExportOptions {
  filename: string
  includeBOM?: boolean
  charset?: string
}

/**
 * Экранирует значения для CSV
 */
export function escapeCSVValue(value: string): string {
  // Экранируем кавычки и переносы строк
  return `"${value.replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '')}"`
}

/**
 * Создает CSV строку из данных
 */
export function createCSVContent(
  headers: string[],
  rows: string[][],
  options: { delimiter?: string } = {}
): string {
  const { delimiter = ',' } = options
  
  const csvRows = [
    // Заголовки
    headers.map(escapeCSVValue).join(delimiter),
    // Данные
    ...rows.map(row => row.map(escapeCSVValue).join(delimiter))
  ]
  
  return csvRows.join('\n')
}

/**
 * Экспортирует данные как CSV файл с правильной кодировкой
 */
export function exportCSV(
  headers: string[],
  rows: string[][],
  options: CSVExportOptions
): void {
  try {
    // Создаем CSV контент
    const csvContent = createCSVContent(headers, rows)
    
    // Добавляем BOM для правильного отображения кириллицы
    const BOM = options.includeBOM !== false ? '\uFEFF' : ''
    const csvWithBOM = BOM + csvContent
    
    // Создаем blob с правильной кодировкой
    const blob = new Blob([csvWithBOM], { 
      type: `text/csv;charset=${options.charset || 'utf-8'}` 
    })
    
    // Создаем и скачиваем файл
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = options.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    console.log('✅ CSV экспорт успешен:', options.filename)
  } catch (error) {
    console.error('❌ Ошибка экспорта CSV:', error)
    throw new Error('Ошибка при экспорте CSV файла')
  }
}

/**
 * Экспортирует поисковые запросы в CSV
 */
export function exportSearchQueries(
  queries: Array<{
    query: string
    count: number
    averageResults: number
  }>,
  period: number
): void {
  const headers = ['Query', 'Count', 'Average Results']
  const rows = queries.map(q => [
    q.query,
    q.count.toString(),
    q.averageResults.toString()
  ])
  
  exportCSV(headers, rows, {
    filename: `search-analytics-${period}days.csv`,
    includeBOM: true,
    charset: 'utf-8'
  })
}

/**
 * Экспортирует детальные поисковые запросы
 */
export function exportDetailedSearchQueries(
  queries: Array<{
    id: string
    query: string
    userId: string | null
    resultsCount: number
    hasClick: boolean
    createdAt: string
    userAgent: string | null
  }>,
  period: number
): void {
  const headers = [
    'ID',
    'Query', 
    'User ID',
    'Results Count',
    'Has Click',
    'Created At',
    'User Agent'
  ]
  
  const rows = queries.map(q => [
    q.id,
    q.query,
    q.userId || '',
    q.resultsCount.toString(),
    q.hasClick ? 'Yes' : 'No',
    new Date(q.createdAt).toLocaleString('ru-RU'),
    q.userAgent || ''
  ])
  
  exportCSV(headers, rows, {
    filename: `detailed-search-queries-${period}days.csv`,
    includeBOM: true,
    charset: 'utf-8'
  })
}
