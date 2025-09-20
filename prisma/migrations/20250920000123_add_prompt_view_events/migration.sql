-- AlterTable
ALTER TABLE "Prompt" ADD COLUMN "views" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PromptViewEvent" (
    "id" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "userId" TEXT,
    "ipHash" TEXT,
    "uaHash" TEXT,
    "fpHash" TEXT,
    "viewTokenId" TEXT,
    "isCounted" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromptViewEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PromptViewEvent_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ViewMonitoringAlert" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ViewMonitoringAlert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ViewAnalytics" (
    "id" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "countedViews" INTEGER NOT NULL DEFAULT 0,
    "rejectedViews" INTEGER NOT NULL DEFAULT 0,
    "uniqueUsers" INTEGER NOT NULL DEFAULT 0,
    "uniqueGuests" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ViewAnalytics_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ViewAnalytics_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PromptViewEvent_promptId_createdAt_idx" ON "PromptViewEvent"("promptId", "createdAt");
CREATE INDEX "PromptViewEvent_userId_promptId_createdAt_idx" ON "PromptViewEvent"("userId", "promptId", "createdAt");
CREATE INDEX "PromptViewEvent_ipHash_createdAt_idx" ON "PromptViewEvent"("ipHash", "createdAt");
CREATE INDEX "PromptViewEvent_isCounted_createdAt_idx" ON "PromptViewEvent"("isCounted", "createdAt");
CREATE INDEX "ViewMonitoringAlert_type_createdAt_idx" ON "ViewMonitoringAlert"("type", "createdAt");
CREATE INDEX "ViewMonitoringAlert_severity_isResolved_idx" ON "ViewMonitoringAlert"("severity", "isResolved");
CREATE UNIQUE INDEX "ViewAnalytics_promptId_date_key" ON "ViewAnalytics"("promptId", "date");
CREATE INDEX "ViewAnalytics_date_idx" ON "ViewAnalytics"("date");
CREATE INDEX "ViewAnalytics_promptId_date_idx" ON "ViewAnalytics"("promptId", "date");