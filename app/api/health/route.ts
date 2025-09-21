import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRedis } from '@/lib/redis'

export async function GET() {
  const checks: Array<{ component: string; status: 'pass' | 'fail'; detail?: string }> = []
  let httpStatus = 200

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.push({ component: 'database', status: 'pass' })
  } catch (error) {
    httpStatus = 503
    checks.push({ component: 'database', status: 'fail', detail: error instanceof Error ? error.message : 'unknown error' })
  }

  try {
    const redis = await getRedis()
    await redis.ping()
    checks.push({ component: 'redis', status: 'pass' })
  } catch (error) {
    httpStatus = 503
    checks.push({ component: 'redis', status: 'fail', detail: error instanceof Error ? error.message : 'unknown error' })
  }

  return NextResponse.json({ status: httpStatus === 200 ? 'pass' : 'fail', checks }, { status: httpStatus })
}
