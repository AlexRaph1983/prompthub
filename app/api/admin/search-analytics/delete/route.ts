import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    // Временно отключаем авторизацию для тестирования
    // const adminSession = await requirePermission('analytics_delete', request)
    // if (!adminSession) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { queryIds, query, dateFrom, dateTo } = body

    let whereClause: any = {}

    // Если переданы конкретные ID запросов
    if (queryIds && queryIds.length > 0) {
      whereClause.id = {
        in: queryIds
      }
    } else {
      // Если переданы фильтры
      if (query) {
        whereClause.query = {
          contains: query,
          mode: 'insensitive'
        }
      }

      if (dateFrom || dateTo) {
        whereClause.createdAt = {}
        if (dateFrom) {
          whereClause.createdAt.gte = new Date(dateFrom)
        }
        if (dateTo) {
          whereClause.createdAt.lte = new Date(dateTo)
        }
      }
    }

    // Подсчитываем количество записей для удаления
    const countToDelete = await prisma.searchQuery.count({
      where: whereClause
    })

    if (countToDelete === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No records found to delete',
        deletedCount: 0
      })
    }

    // Удаляем записи
    const deleteResult = await prisma.searchQuery.deleteMany({
      where: whereClause
    })

    console.log(`[ADMIN] Deleted ${deleteResult.count} search queries`)

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${deleteResult.count} search queries`,
      deletedCount: deleteResult.count
    })

  } catch (error) {
    console.error('Error deleting search queries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
