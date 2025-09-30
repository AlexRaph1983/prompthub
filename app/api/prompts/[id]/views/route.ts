import { NextRequest, NextResponse } from 'next/server'
import { ViewsService } from '@/lib/services/viewsService'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const views = await ViewsService.getPromptViews(params.id)
    
    return NextResponse.json({ views })
  } catch (error) {
    console.error('Error fetching prompt views:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
