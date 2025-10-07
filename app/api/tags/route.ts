import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      where: {
        isActive: true,
        promptCount: {
          gt: 0
        }
      },
      orderBy: {
        promptCount: 'desc'
      },
      take: 20,
      select: {
        id: true,
        name: true,
        slug: true,
        promptCount: true,
        color: true
      }
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}
