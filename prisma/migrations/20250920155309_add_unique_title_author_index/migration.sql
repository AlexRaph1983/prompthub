/*
  Warnings:

  - You are about to alter the column `createdAt` on the `Comment` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("timestamp(3)")` to `DateTime`.
  - You are about to alter the column `updatedAt` on the `Comment` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("timestamp(3)")` to `DateTime`.
  - You are about to alter the column `createdAt` on the `Like` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("timestamp(3)")` to `DateTime`.
  - You are about to alter the column `averageRating` on the `Prompt` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("double precision")` to `Float`.
  - You are about to alter the column `createdAt` on the `Prompt` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("timestamp(3)")` to `DateTime`.
  - You are about to alter the column `createdAt` on the `PromptInteraction` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("timestamp(3)")` to `DateTime`.
  - You are about to alter the column `weight` on the `PromptInteraction` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("double precision")` to `Float`.
  - You are about to alter the column `updatedAt` on the `PromptVector` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("timestamp(3)")` to `DateTime`.
  - You are about to alter the column `createdAt` on the `Rating` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("timestamp(3)")` to `DateTime`.
  - You are about to alter the column `updatedAt` on the `Rating` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("timestamp(3)")` to `DateTime`.
  - You are about to alter the column `createdAt` on the `Review` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("timestamp(3)")` to `DateTime`.
  - You are about to alter the column `updatedAt` on the `Review` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("timestamp(3)")` to `DateTime`.
  - You are about to alter the column `createdAt` on the `Save` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("timestamp(3)")` to `DateTime`.
  - You are about to alter the column `createdAt` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("timestamp(3)")` to `DateTime`.
  - You are about to alter the column `updatedAt` on the `UserPreference` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("timestamp(3)")` to `DateTime`.
  - Made the column `id` on table `Comment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id` on table `Like` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id` on table `Prompt` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id` on table `PromptInteraction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `promptId` on table `PromptVector` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id` on table `Rating` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id` on table `Review` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id` on table `Save` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `UserPreference` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("content", "createdAt", "id", "promptId", "updatedAt", "userId") SELECT "content", "createdAt", "id", "promptId", "updatedAt", "userId" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
CREATE TABLE "new_Like" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Like_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Like" ("createdAt", "id", "promptId", "userId") SELECT "createdAt", "id", "promptId", "userId" FROM "Like";
DROP TABLE "Like";
ALTER TABLE "new_Like" RENAME TO "Like";
CREATE UNIQUE INDEX "Like_userId_promptId_key" ON "Like"("userId", "promptId");
CREATE TABLE "new_Prompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "averageRating" REAL NOT NULL DEFAULT 0,
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Prompt_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Prompt" ("authorId", "averageRating", "category", "createdAt", "description", "id", "lang", "license", "model", "prompt", "tags", "title", "totalRatings", "views") SELECT "authorId", "averageRating", "category", "createdAt", "description", "id", "lang", "license", "model", "prompt", "tags", "title", "totalRatings", "views" FROM "Prompt";
DROP TABLE "Prompt";
ALTER TABLE "new_Prompt" RENAME TO "Prompt";
CREATE UNIQUE INDEX "Prompt_title_authorId_key" ON "Prompt"("title", "authorId");
CREATE TABLE "new_PromptInteraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "weight" REAL NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_PromptInteraction" ("createdAt", "id", "promptId", "type", "userId", "weight") SELECT "createdAt", "id", "promptId", "type", "userId", "weight" FROM "PromptInteraction";
DROP TABLE "PromptInteraction";
ALTER TABLE "new_PromptInteraction" RENAME TO "PromptInteraction";
CREATE INDEX "PromptInteraction_userId_promptId_idx" ON "PromptInteraction"("userId", "promptId");
CREATE INDEX "PromptInteraction_promptId_idx" ON "PromptInteraction"("promptId");
CREATE TABLE "new_PromptVector" (
    "promptId" TEXT NOT NULL PRIMARY KEY,
    "vector" JSONB NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PromptVector_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PromptVector" ("promptId", "updatedAt", "vector") SELECT "promptId", "updatedAt", "vector" FROM "PromptVector";
DROP TABLE "PromptVector";
ALTER TABLE "new_PromptVector" RENAME TO "PromptVector";
CREATE TABLE "new_Rating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Rating_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Rating" ("createdAt", "id", "promptId", "updatedAt", "userId", "value") SELECT "createdAt", "id", "promptId", "updatedAt", "userId", "value" FROM "Rating";
DROP TABLE "Rating";
ALTER TABLE "new_Rating" RENAME TO "Rating";
CREATE UNIQUE INDEX "Rating_userId_promptId_key" ON "Rating"("userId", "promptId");
CREATE TABLE "new_Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Review" ("comment", "createdAt", "id", "promptId", "rating", "updatedAt", "userId") SELECT "comment", "createdAt", "id", "promptId", "rating", "updatedAt", "userId" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
CREATE UNIQUE INDEX "Review_promptId_userId_key" ON "Review"("promptId", "userId");
CREATE TABLE "new_Save" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Save_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Save_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Save" ("createdAt", "id", "promptId", "userId") SELECT "createdAt", "id", "promptId", "userId" FROM "Save";
DROP TABLE "Save";
ALTER TABLE "new_Save" RENAME TO "Save";
CREATE UNIQUE INDEX "Save_userId_promptId_key" ON "Save"("userId", "promptId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bio" TEXT,
    "website" TEXT,
    "telegram" TEXT,
    "github" TEXT,
    "twitter" TEXT,
    "linkedin" TEXT,
    "reputationScore" INTEGER NOT NULL DEFAULT 0,
    "reputationPromptCount" INTEGER NOT NULL DEFAULT 0,
    "reputationRatingsSum" INTEGER NOT NULL DEFAULT 0,
    "reputationRatingsCnt" INTEGER NOT NULL DEFAULT 0,
    "reputationLikesCnt" INTEGER NOT NULL DEFAULT 0,
    "reputationSavesCnt" INTEGER NOT NULL DEFAULT 0,
    "reputationCommentsCnt" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_User" ("bio", "createdAt", "email", "github", "id", "image", "linkedin", "name", "reputationCommentsCnt", "reputationLikesCnt", "reputationPromptCount", "reputationRatingsCnt", "reputationRatingsSum", "reputationSavesCnt", "reputationScore", "telegram", "twitter", "website") SELECT "bio", "createdAt", "email", "github", "id", "image", "linkedin", "name", "reputationCommentsCnt", "reputationLikesCnt", "reputationPromptCount", "reputationRatingsCnt", "reputationRatingsSum", "reputationSavesCnt", "reputationScore", "telegram", "twitter", "website" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_UserPreference" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "categories" JSONB NOT NULL,
    "models" JSONB NOT NULL,
    "languages" JSONB NOT NULL,
    "tags" JSONB NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UserPreference" ("categories", "languages", "models", "tags", "updatedAt", "userId") SELECT "categories", "languages", "models", "tags", "updatedAt", "userId" FROM "UserPreference";
DROP TABLE "UserPreference";
ALTER TABLE "new_UserPreference" RENAME TO "UserPreference";
CREATE TABLE "new_ViewAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "countedViews" INTEGER NOT NULL DEFAULT 0,
    "rejectedViews" INTEGER NOT NULL DEFAULT 0,
    "uniqueUsers" INTEGER NOT NULL DEFAULT 0,
    "uniqueGuests" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ViewAnalytics" ("countedViews", "createdAt", "date", "id", "promptId", "rejectedViews", "totalViews", "uniqueGuests", "uniqueUsers", "updatedAt") SELECT "countedViews", "createdAt", "date", "id", "promptId", "rejectedViews", "totalViews", "uniqueGuests", "uniqueUsers", "updatedAt" FROM "ViewAnalytics";
DROP TABLE "ViewAnalytics";
ALTER TABLE "new_ViewAnalytics" RENAME TO "ViewAnalytics";
CREATE INDEX "ViewAnalytics_date_idx" ON "ViewAnalytics"("date");
CREATE INDEX "ViewAnalytics_promptId_date_idx" ON "ViewAnalytics"("promptId", "date");
CREATE UNIQUE INDEX "ViewAnalytics_promptId_date_key" ON "ViewAnalytics"("promptId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
