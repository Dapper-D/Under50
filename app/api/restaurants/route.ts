import { NextResponse } from 'next/server'
import { findNearbyRestaurants, searchRestaurants } from '@/app/lib/restaurantService'

interface MapboxFeature {
  id: string
  type: string
  place_type: string[]
  properties: {
    name: string
    address?: string
    category?: string
    tel?: string
    price?: string
  }
  text: string
  place_name: string
  center: [number, number]
  geometry: {
    type: string
    coordinates: [number, number]
  }
  context: Array<{
    id: string
    text: string
  }>
}

interface Restaurant {
  id: string
  name: string
  image: string
  cuisine: string
  rating: number
  averagePrice: number
  distance: string
  isOpenNow: boolean
  location: {
    latitude: number
    longitude: number
  }
  address: string
}

export async function GET(request: Request) {
  try {
    console.log('API: Received GET request')
    const { searchParams } = new URL(request.url)
    const latitude = searchParams.get('latitude')
    const longitude = searchParams.get('longitude')
    const maxPrice = searchParams.get('maxPrice')
    const cuisineType = searchParams.get('cuisine')
    const searchQuery = searchParams.get('search')
    
    console.log('API: Request params:', {
      latitude,
      longitude,
      maxPrice,
      cuisineType,
      searchQuery
    })

    if (!latitude || !longitude) {
      console.log('API: Missing latitude or longitude')
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 })
    }

    try {
      // Find nearby restaurants
      console.log('API: Finding nearby restaurants')
      const restaurants = await findNearbyRestaurants(
        {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        },
        maxPrice ? parseInt(maxPrice) : undefined,
        cuisineType ?? undefined,
        searchQuery ?? undefined
      )

      console.log('API: Found restaurants:', restaurants?.length ?? 0)
      return NextResponse.json(restaurants)
    } catch (error) {
      console.error('API: Error in restaurant operations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch restaurants', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('API: Critical error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // In a real application, validate the data and save to database
    // For now, just return a success message
    return NextResponse.json({ message: 'Restaurant added successfully' }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add restaurant' },
      { status: 400 }
    )
  }
} 