ALTER TABLE "Prompt" ADD COLUMN IF NOT EXISTS "views" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "PromptViewEvent" (
    "id" TEXT PRIMARY KEY,
    "promptId" TEXT NOT NULL,
    "userId" TEXT,
    "ipHash" TEXT,
    "uaHash" TEXT,
    "fpHash" TEXT,
    "viewTokenId" TEXT,
    "isCounted" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "PromptViewEvent_promptId_createdAt_idx" ON "PromptViewEvent"("promptId", "createdAt");
CREATE INDEX IF NOT EXISTS "PromptViewEvent_userId_promptId_createdAt_idx" ON "PromptViewEvent"("userId", "promptId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'PromptViewEvent_promptId_fkey'
  ) THEN
    ALTER TABLE "PromptViewEvent"
      ADD CONSTRAINT "PromptViewEvent_promptId_fkey"
      FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
