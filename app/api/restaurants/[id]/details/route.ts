import { NextResponse } from 'next/server'
import { getPlaceDetails } from '@/app/lib/restaurantService'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const restaurantId = params.id;
    
    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    const details = await getPlaceDetails(restaurantId);

    if (!details) {
      return NextResponse.json({ error: 'Restaurant details not found' }, { status: 404 });
    }

    return NextResponse.json(details);
  } catch (error) {
    console.error('Error fetching restaurant details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurant details' },
      { status: 500 }
    );
  }
} 