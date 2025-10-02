import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '6')
    
    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }
    
    // Моковые подсказки для демонстрации
    const mockSuggestions = [
      'ambient music',
      'k-pop beats',
      'phonk music',
      'lofi hip hop',
      'meditation sounds',
      'chill vibes',
      'upbeat electronic',
      'reggae rhythm',
      'jazz fusion',
      'classical piano'
    ]
    
    // Фильтруем подсказки по запросу
    const filteredSuggestions = mockSuggestions
      .filter(suggestion => 
        suggestion.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit)
    
    return NextResponse.json({ 
      suggestions: filteredSuggestions,
      query,
      limit 
    })
  } catch (error) {
    console.error('Search suggestions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
}
