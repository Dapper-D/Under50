import { NextResponse } from 'next/server'
import { getCuisineTypes } from '@/app/lib/restaurantService'

export async function GET() {
  try {
    const cuisines = await getCuisineTypes()
    return NextResponse.json(cuisines)
  } catch (error) {
    console.error('Error fetching cuisine types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cuisine types' },
      { status: 500 }
    )
  }
} 