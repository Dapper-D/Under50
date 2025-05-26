import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const photoReference = searchParams.get('photo_reference')
    const maxwidth = searchParams.get('maxwidth') || '400'

    if (!photoReference) {
      return NextResponse.json({ error: 'Photo reference is required' }, { status: 400 })
    }

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photo_reference=${photoReference}&key=${process.env.GOOGLE_PLACES_API_KEY}`

    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Google Places API returned ${response.status}`)
    }

    const buffer = await response.arrayBuffer()
    const headers = new Headers(response.headers)
    
    // Forward the content type header
    const contentType = headers.get('content-type')
    if (contentType) {
      headers.set('content-type', contentType)
    }

    return new NextResponse(buffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Error fetching photo:', error)
    return NextResponse.json(
      { error: 'Failed to fetch photo' },
      { status: 500 }
    )
  }
} 