const fs = require('fs')

const PROD_CATEGORIES = new Set([
  '3d',
  'audio',
  'cooking',
  'design',
  'image',
  'marketing',
  'music',
  'productivity',
  'video',
  'writing'
])

const inputFile = 'data/generated_prompts_ru_300.json'
const outputFile = 'data/generated_prompts_ru_prod.json'

const json = JSON.parse(fs.readFileSync(inputFile, 'utf8'))
const items = json.items || []

const filtered = items.filter((item) => PROD_CATEGORIES.has(item.categorySlug))

console.log(`Original: ${items.length}`)
console.log(`Filtered: ${filtered.length}`)
console.log('')

const byCat = new Map()
for (const item of filtered) {
  byCat.set(item.categorySlug, (byCat.get(item.categorySlug) || 0) + 1)
}

console.log('Distribution:')
for (const [slug, count] of Array.from(byCat.entries()).sort((a, b) => b[1] - a[1])) {
  console.log(`- ${slug}: ${count}`)
}

fs.writeFileSync(outputFile, JSON.stringify({ items: filtered }, null, 2), 'utf8')
console.log(`\nSaved to ${outputFile}`)

