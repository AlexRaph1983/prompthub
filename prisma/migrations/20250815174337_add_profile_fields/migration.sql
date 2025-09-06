-- AlterTable
ALTER TABLE "User" ADD COLUMN "bio" TEXT;
ALTER TABLE "User" ADD COLUMN "github" TEXT;
ALTER TABLE "User" ADD COLUMN "linkedin" TEXT;
ALTER TABLE "User" ADD COLUMN "telegram" TEXT;
ALTER TABLE "User" ADD COLUMN "twitter" TEXT;
ALTER TABLE "User" ADD COLUMN "website" TEXT;

-- CreateTable
CREATE TABLE "UserPreference" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "categories" JSONB NOT NULL,
    "models" JSONB NOT NULL,
    "languages" JSONB NOT NULL,
    "tags" JSONB NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PromptInteraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "weight" REAL NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PromptVector" (
    "promptId" TEXT NOT NULL PRIMARY KEY,
    "vector" JSONB NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PromptVector_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PromptInteraction_userId_promptId_idx" ON "PromptInteraction"("userId", "promptId");

-- CreateIndex
CREATE INDEX "PromptInteraction_promptId_idx" ON "PromptInteraction"("promptId");
