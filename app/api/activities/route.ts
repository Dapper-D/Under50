import { NextResponse } from 'next/server'
import { Client, PlacesNearbyResponse, PlaceDetailsResponse } from '@googlemaps/google-maps-services-js'

const client = new Client({})

const ACTIVITY_TYPES = [
  'amusement_park',
  'aquarium',
  'bowling_alley',
  'casino',
  'gym',
  'movie_theater',
  'park',
  'spa',
  'stadium',
  'zoo'
] as const

type ActivityType = typeof ACTIVITY_TYPES[number]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const category = searchParams.get('category')
  const maxDistance = parseInt(searchParams.get('maxDistance') || '10000')
  const isAvailable = searchParams.get('isAvailable') === 'true'
  const difficulty = searchParams.get('difficulty')

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
    const types = category === 'all' ? ACTIVITY_TYPES : [category as ActivityType || ACTIVITY_TYPES[0]]
    const allActivities = []

    // Fetch places for each activity type
    for (const type of types) {
      const response: PlacesNearbyResponse = await client.placesNearby({
        params: {
          location: { lat: parseFloat(lat), lng: parseFloat(lng) },
          radius: maxDistance * 1000, // Convert km to meters
          type: type as any,
          opennow: isAvailable,
          key: apiKey
        }
      })

      const activities = await Promise.all(
        response.data.results.map(async (place) => {
          if (!place.geometry?.location || !place.place_id) {
            return null
          }

          // Get additional details for each place
          const details: PlaceDetailsResponse = await client.placeDetails({
            params: {
              place_id: place.place_id,
              fields: ['name', 'formatted_address', 'photo', 'rating', 'opening_hours', 'price_level', 'website', 'formatted_phone_number', 'review'],
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

          // Determine difficulty based on reviews or type
          let activityDifficulty: 'Easy' | 'Moderate' | 'Challenging' = 'Moderate'
          if (type === 'gym' || type === 'stadium') {
            activityDifficulty = 'Challenging'
          } else if (type === 'spa' || type === 'movie_theater') {
            activityDifficulty = 'Easy'
          }

          // Skip if difficulty filter is applied and doesn't match
          if (difficulty && difficulty !== activityDifficulty) {
            return null
          }

          return {
            id: place.place_id,
            name: place.name || 'Unknown Location',
            image: photoUrl,
            category: type.replace(/_/g, ' '),
            rating: place.rating || 0,
            priceLevel: place.price_level,
            pricePerPerson: (place.price_level || 2) * 15, // Rough estimate based on price level
            distance: `${distance.toFixed(1)} km`,
            isAvailable: details.data.result.opening_hours?.open_now || false,
            location: {
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng
            },
            address: place.vicinity || 'Address not available',
            description: place.editorial_summary?.overview || `Enjoy ${place.name || 'this activity'} for an exciting experience.`,
            phoneNumber: details.data.result.formatted_phone_number,
            website: details.data.result.website,
            schedule: details.data.result.opening_hours?.weekday_text,
            duration: '2-3 hours', // Example duration
            difficulty: activityDifficulty,
            groupSize: {
              min: 1,
              max: type === 'stadium' ? 100 : type === 'movie_theater' ? 10 : 20
            },
            photos: place.photos?.map(photo => ({
              reference: photo.photo_reference,
              width: photo.width,
              height: photo.height
            })) || []
          }
        })
      )

      allActivities.push(...activities.filter(Boolean))
    }

    return NextResponse.json({ activities: allActivities })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
} 