import { NextResponse } from 'next/server'
import { Client, PlacesNearbyResponse, PlaceDetailsResponse } from '@googlemaps/google-maps-services-js'

const client = new Client({})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const category = searchParams.get('category') || 'tourist_attraction'
  const maxDistance = parseInt(searchParams.get('maxDistance') || '10000')
  const isOpen = searchParams.get('isOpen') === 'true'

  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.error('GOOGLE_MAPS_API_KEY is not configured')
    return NextResponse.json(
      { error: 'Google Maps API is not configured' },
      { status: 500 }
    )
  }

  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'Latitude and longitude are required' },
      { status: 400 }
    )
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY as string;
    
    const response: PlacesNearbyResponse = await client.placesNearby({
      params: {
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        radius: maxDistance * 1000, // Convert km to meters
        type: category === 'all' ? 'tourist_attraction' : category as any,
        opennow: isOpen,
        key: apiKey
      }
    })

    const attractions = await Promise.all(
      response.data.results.map(async (place) => {
        if (!place.geometry?.location || !place.place_id) {
          return null
        }

        // Get additional details for each place
        const details: PlaceDetailsResponse = await client.placeDetails({
          params: {
            place_id: place.place_id,
            fields: ['name', 'formatted_address', 'photo', 'rating', 'opening_hours', 'price_level', 'website', 'formatted_phone_number'],
            key: apiKey
          }
        })

        const photoReference = place.photos?.[0]?.photo_reference
        const photoUrl = photoReference
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${apiKey}`
          : 'https://via.placeholder.com/400x300?text=No+Image'

        // Calculate distance using Haversine formula
        const R = 6371 // Earth's radius in kilometers
        const lat1 = parseFloat(lat)
        const lon1 = parseFloat(lng)
        const lat2 = place.geometry.location.lat
        const lon2 = place.geometry.location.lng
        
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2)
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        const distance = R * c

        return {
          id: place.place_id,
          name: place.name || 'Unknown Location',
          image: photoUrl,
          category: place.types?.[0] || 'tourist_attraction',
          rating: place.rating || 0,
          priceLevel: place.price_level,
          distance: `${distance.toFixed(1)} km`,
          isOpenNow: details.data.result.opening_hours?.open_now || false,
          location: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng
          },
          address: place.vicinity || 'Address not available',
          description: place.editorial_summary?.overview || `Visit ${place.name || 'this location'} and explore one of the area's top attractions.`,
          phoneNumber: details.data.result.formatted_phone_number,
          website: details.data.result.website,
          openingHours: details.data.result.opening_hours?.weekday_text,
          photos: place.photos?.map(photo => ({
            reference: photo.photo_reference,
            width: photo.width,
            height: photo.height
          })) || []
        }
      })
    )

    return NextResponse.json({ attractions: attractions.filter(Boolean) })
  } catch (error) {
    console.error('Error fetching attractions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attractions' },
      { status: 500 }
    )
  }
} 