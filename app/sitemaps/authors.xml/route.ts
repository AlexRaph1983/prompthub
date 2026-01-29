import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  SITEMAP_CONFIG,
  XML_TEMPLATES,
  formatLastMod,
  getCached
} from '@/lib/sitemap'

export const revalidate = SITEMAP_CONFIG.REVALIDATE_TIME

export async function GET(_request: NextRequest) {
  try {
    const urls = await getCached('authors-sitemap', async () => {
      const users = await prisma.user.findMany({
        where: {
          prompts: {
            some: {}
          }
        },
        select: {
          id: true,
          updatedAt: true
        }
      })

      return users.map((user) => ({
        loc: `${SITEMAP_CONFIG.BASE_URL}/ru/author/${user.id}`,
        lastmod: formatLastMod(user.updatedAt),
        changefreq: 'weekly',
        priority: '0.5'
      }))
    })

    const xml = XML_TEMPLATES.urlSet(urls)

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': `public, max-age=${SITEMAP_CONFIG.REVALIDATE_TIME}`,
      },
    })
  } catch (error) {
    console.error('Error generating authors sitemap:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
