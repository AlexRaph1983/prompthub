#!/bin/bash

echo "🚀 Running database migration and tests..."

# Run database migration
echo "📊 Running database migration..."
npx prisma migrate dev --name add_query_hash

# Run unit tests
echo "🧪 Running unit tests..."
npm test -- --testPathPattern="search-utils|useSearchTracking|search-tracking" --verbose

# Run e2e tests (if Playwright is configured)
echo "🎭 Running e2e tests..."
if command -v npx playwright test &> /dev/null; then
    npx playwright test __tests__/e2e/search-tracking.e2e.test.ts
else
    echo "⚠️ Playwright not configured, skipping e2e tests"
fi

echo "✅ Migration and tests completed!"
