import { NextResponse } from 'next/server'
import { searchNearby, serverKey, priceLevelToNumber, photoProxyUrl, distanceKm, MAX_RADIUS_M } from '@/app/lib/googlePlaces'

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

const PLACEHOLDER = 'https://via.placeholder.com/400x300?text=No+Image'

// One Nearby Search (New) call per type returns everything this route needs,
// so there is no extra Place Details request per result.
const FIELDS = [
  'id', 'displayName', 'formattedAddress', 'shortFormattedAddress', 'location', 'types',
  'rating', 'priceLevel', 'photos', 'currentOpeningHours', 'regularOpeningHours',
  'nationalPhoneNumber', 'websiteUri', 'editorialSummary'
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const category = searchParams.get('category')
  const maxDistance = parseFloat(searchParams.get('maxDistance') || '10') // km
  const isAvailable = searchParams.get('isAvailable') === 'true'
  const difficulty = searchParams.get('difficulty')

  if (!serverKey()) {
    console.error('GOOGLE_PLACES_API_KEY is not configured')
    return NextResponse.json({ error: 'Google Places API is not configured' }, { status: 500 })
  }

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 })
  }

  try {
    const userLat = parseFloat(lat)
    const userLng = parseFloat(lng)
    const types: readonly ActivityType[] =
      category === 'all' ? ACTIVITY_TYPES : [(category as ActivityType) || ACTIVITY_TYPES[0]]
    const allActivities = []

    for (const type of types) {
      const places = await searchNearby({
        types: [type],
        lat: userLat,
        lng: userLng,
        radiusM: Math.min(maxDistance * 1000, MAX_RADIUS_M),
        fields: FIELDS
      })

      for (const place of places) {
        if (!place.location || !place.id) continue
        // Nearby Search (New) has no openNow filter, so apply it here
        if (isAvailable && place.currentOpeningHours?.openNow !== true) continue

        // Difficulty is a rough guess from the type
        let activityDifficulty: 'Easy' | 'Moderate' | 'Challenging' = 'Moderate'
        if (type === 'gym' || type === 'stadium') activityDifficulty = 'Challenging'
        else if (type === 'spa' || type === 'movie_theater') activityDifficulty = 'Easy'
        if (difficulty && difficulty !== activityDifficulty) continue

        const { latitude, longitude } = place.location
        const name = place.displayName?.text || 'Unknown Location'
        const priceLevel = priceLevelToNumber(place.priceLevel)
        const hours = place.currentOpeningHours || place.regularOpeningHours

        allActivities.push({
          id: place.id,
          name,
          image: photoProxyUrl(place.photos?.[0]?.name) || PLACEHOLDER,
          category: type.replace(/_/g, ' '),
          rating: place.rating || 0,
          priceLevel,
          pricePerPerson: (priceLevel || 2) * 15, // rough estimate from the price level
          distance: `${distanceKm(userLat, userLng, latitude, longitude).toFixed(1)} km`,
          isAvailable: place.currentOpeningHours?.openNow || false,
          location: { latitude, longitude },
          address: place.shortFormattedAddress || place.formattedAddress || 'Address not available',
          description: place.editorialSummary?.text || `Enjoy ${name} for an exciting experience.`,
          phoneNumber: place.nationalPhoneNumber,
          website: place.websiteUri,
          schedule: hours?.weekdayDescriptions,
          duration: '2-3 hours', // example duration
          difficulty: activityDifficulty,
          groupSize: {
            min: 1,
            max: type === 'stadium' ? 100 : type === 'movie_theater' ? 10 : 20
          },
          photos: place.photos?.map((photo) => ({
            reference: photo.name,
            width: photo.widthPx,
            height: photo.heightPx
          })) || []
        })
      }
    }

    return NextResponse.json({ activities: allActivities })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}
