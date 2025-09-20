-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Like_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Save" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Save_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Save_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- AlterTable
ALTER TABLE "User" ADD COLUMN "reputationScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "reputationPromptCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "reputationRatingsSum" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "reputationRatingsCnt" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "reputationLikesCnt" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "reputationSavesCnt" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "reputationCommentsCnt" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_promptId_key" ON "Like"("userId", "promptId");
CREATE UNIQUE INDEX "Save_userId_promptId_key" ON "Save"("userId", "promptId");
