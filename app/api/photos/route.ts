import { NextResponse } from 'next/server'
import { serverKey } from '@/app/lib/googlePlaces'

// Proxies Place Photos (New) so the API key stays on the server.
// GET /api/photos?name=places/PLACE_ID/photos/PHOTO_ID&maxwidth=400
//
// Photo names come from search/details responses and can expire, so they are
// not stored long term. Old `photo_reference` links (from the legacy API,
// possibly still saved in the database) get the fallback image instead.

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'
const PHOTO_NAME = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const maxwidth = Math.min(Math.max(parseInt(searchParams.get('maxwidth') || '400') || 400, 1), 4800)

    if (!name) {
      if (searchParams.get('photo_reference')) {
        // Legacy reference: can't be used with the new API
        return NextResponse.redirect(FALLBACK_IMAGE, 302)
      }
      return NextResponse.json({ error: 'Photo name is required' }, { status: 400 })
    }

    // Only allow real photo resource names, so the proxy can't be pointed elsewhere
    if (!PHOTO_NAME.test(name)) {
      return NextResponse.json({ error: 'Invalid photo name' }, { status: 400 })
    }

    const key = serverKey()
    if (!key) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const url = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${maxwidth}&key=${key}`
    const response = await fetch(url, { cache: 'no-store' }) // follows the redirect to the image

    if (!response.ok) {
      console.error('Place photo request failed:', response.status)
      return NextResponse.redirect(FALLBACK_IMAGE, 302)
    }

    const buffer = await response.arrayBuffer()
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'content-type': response.headers.get('content-type') || 'image/jpeg',
        'cache-control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    console.error('Error fetching photo:', error)
    return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 500 })
  }
}
