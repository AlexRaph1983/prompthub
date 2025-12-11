-- CreateTable
CREATE TABLE "PromptDailyStats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "promptId" TEXT NOT NULL DEFAULT 'global',
    "views" INTEGER NOT NULL DEFAULT 0,
    "copies" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "PromptDailyStats_date_idx" ON "PromptDailyStats"("date");

-- CreateIndex
CREATE INDEX "PromptDailyStats_promptId_date_idx" ON "PromptDailyStats"("promptId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PromptDailyStats_date_promptId_key" ON "PromptDailyStats"("date", "promptId");
