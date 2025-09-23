import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Simple API test called')
    return NextResponse.json({ 
      success: true, 
      message: 'Simple API works!',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Simple API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
