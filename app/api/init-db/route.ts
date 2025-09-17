import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Block in production
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_ROUTES !== '1') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    // Создаем таблицы если их нет
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT,
        "email" TEXT UNIQUE,
        "image" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
      )
    `

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Prompt" (
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
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "averageRating" REAL NOT NULL DEFAULT 0,
        "totalRatings" INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Rating" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "value" INTEGER NOT NULL,
        "userId" TEXT NOT NULL,
        "promptId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        UNIQUE("userId", "promptId")
      )
    `

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Review" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "promptId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "rating" INTEGER NOT NULL,
        "comment" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        UNIQUE("promptId", "userId")
      )
    `

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Like" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "promptId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        UNIQUE("userId", "promptId")
      )
    `

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Save" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "promptId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        UNIQUE("userId", "promptId")
      )
    `

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Comment" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "promptId" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "UserPreference" (
        "userId" TEXT NOT NULL PRIMARY KEY,
        "categories" JSONB NOT NULL,
        "models" JSONB NOT NULL,
        "languages" JSONB NOT NULL,
        "tags" JSONB NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "PromptInteraction" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "promptId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "weight" REAL NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "PromptVector" (
        "promptId" TEXT NOT NULL PRIMARY KEY,
        "vector" JSONB NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `

    // Создаем индексы
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "PromptInteraction_userId_promptId_idx" ON "PromptInteraction"("userId", "promptId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "PromptInteraction_promptId_idx" ON "PromptInteraction"("promptId")`

    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully' 
    })

  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initialize database' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
