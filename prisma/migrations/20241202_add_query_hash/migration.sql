-- Add queryHash field to SearchQuery table for deduplication
ALTER TABLE "SearchQuery" ADD COLUMN "queryHash" TEXT;

-- Create index for faster deduplication lookups
CREATE INDEX "SearchQuery_queryHash_idx" ON "SearchQuery"("queryHash");

-- Create composite index for deduplication queries
CREATE INDEX "SearchQuery_dedup_idx" ON "SearchQuery"("queryHash", "userId", "ipHash", "createdAt");
