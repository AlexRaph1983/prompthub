#!/bin/bash
echo "[$(date -Is)] START Prisma connectivity audit"

# 0.2 Печать ключевых версий
echo "Node version:"
node -v
echo "Prisma version:"
npx prisma -v

# 0.3 Проверим, что процесс видит .env, schema.prisma и сам файл БД
set -a; source ./.env || true; set +a
echo "DATABASE_URL=$DATABASE_URL"
echo "PRISMA_SCHEMA_PATH=${PRISMA_SCHEMA_PATH:-./prisma/schema.prisma}"
test -f "${PRISMA_SCHEMA_PATH:-./prisma/schema.prisma}" && echo "schema.prisma found" || echo "schema.prisma MISSING"

# 0.4 Выявим куда указывает SQLite
echo "=== DATASOURCE CONFIG ==="
grep -n "datasource" "${PRISMA_SCHEMA_PATH:-./prisma/schema.prisma}"
grep -n "url(" "${PRISMA_SCHEMA_PATH:-./prisma/schema.prisma}"

# 1.1 Нормализуем DATABASE_URL
echo "=== CURRENT WORKING DIRECTORY ==="
pwd

echo "=== FINDING ALL .db FILES ==="
find . .. /var/www -maxdepth 3 -type f -name "*.db" -ls 2>/dev/null | sort -k7,7nr | head

echo "=== CURRENT DB FILE INFO ==="
ls -la dev.db
ls -la prisma/dev.db

echo "=== SQLITE3 DIRECT CHECK ==="
sqlite3 dev.db ".tables"
sqlite3 dev.db "SELECT count(*) FROM User;"
sqlite3 dev.db "SELECT count(*) FROM Prompt;"

echo "=== PRISMA PING TEST ==="
cat > prisma_ping.js <<'JS'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient({ log: ['query','info','warn','error'] })
async function main() {
  try {
    const userCount = await prisma.user.count()
    const promptCount = await prisma.prompt.count()
    console.log(JSON.stringify({ ok:true, userCount, promptCount }))
  } catch (error) {
    console.error('Prisma error:', error.message)
  }
}
main().finally(()=>prisma.$disconnect())
JS

node prisma_ping.js

echo "[$(date -Is)] END Prisma connectivity audit"
