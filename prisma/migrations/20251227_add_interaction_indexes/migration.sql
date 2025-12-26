-- Migration: Add indexes for PromptInteraction to support recommendations
-- This migration adds indexes for efficient querying of user interactions

-- Index on type for filtering by interaction type
CREATE INDEX IF NOT EXISTS "PromptInteraction_type_idx" ON "PromptInteraction"("type");

-- Index on createdAt for time-based queries
CREATE INDEX IF NOT EXISTS "PromptInteraction_createdAt_idx" ON "PromptInteraction"("createdAt");

-- Composite index for user profile queries (userId + type + createdAt)
CREATE INDEX IF NOT EXISTS "PromptInteraction_userId_type_createdAt_idx" ON "PromptInteraction"("userId", "type", "createdAt");

-- Composite index for rate limiting checks (userId + promptId + type + createdAt)
CREATE INDEX IF NOT EXISTS "PromptInteraction_userId_promptId_type_createdAt_idx" ON "PromptInteraction"("userId", "promptId", "type", "createdAt");

-- Index for prompt-based analytics
CREATE INDEX IF NOT EXISTS "PromptInteraction_promptId_type_idx" ON "PromptInteraction"("promptId", "type");

-- ROLLBACK:
-- DROP INDEX IF EXISTS "PromptInteraction_type_idx";
-- DROP INDEX IF EXISTS "PromptInteraction_createdAt_idx";
-- DROP INDEX IF EXISTS "PromptInteraction_userId_type_createdAt_idx";
-- DROP INDEX IF EXISTS "PromptInteraction_userId_promptId_type_createdAt_idx";
-- DROP INDEX IF EXISTS "PromptInteraction_promptId_type_idx";


