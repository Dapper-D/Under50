import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!query || !lat || !lng) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const sessionToken = Math.random().toString(36).substring(2, 15);
  const mapboxUrl = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&session_token=${sessionToken}&proximity=${lng}%2C${lat}&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`;

  try {
    const response = await fetch(mapboxUrl);
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from Mapbox:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
} 