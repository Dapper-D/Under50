import { NextResponse } from 'next/server'
import { searchNearby, serverKey, priceLevelToNumber, photoProxyUrl, distanceKm, MAX_RADIUS_M } from '@/app/lib/googlePlaces'

const PLACEHOLDER = 'https://via.placeholder.com/400x300?text=No+Image'

// One Nearby Search (New) call returns everything this route needs, so there is
// no extra Place Details request per result.
const FIELDS = [
  'id', 'displayName', 'formattedAddress', 'shortFormattedAddress', 'location', 'types', 'primaryType',
  'rating', 'priceLevel', 'photos', 'currentOpeningHours', 'regularOpeningHours',
  'nationalPhoneNumber', 'websiteUri', 'editorialSummary'
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const category = searchParams.get('category') || 'tourist_attraction'
  const maxDistance = parseFloat(searchParams.get('maxDistance') || '10') // km
  const isOpen = searchParams.get('isOpen') === 'true'

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
    const places = await searchNearby({
      types: [category === 'all' ? 'tourist_attraction' : category],
      lat: userLat,
      lng: userLng,
      radiusM: Math.min(maxDistance * 1000, MAX_RADIUS_M),
      fields: FIELDS
    })

    const attractions = places
      .filter((place) => place.location && place.id)
      // Nearby Search (New) has no openNow filter, so apply it here
      .filter((place) => !isOpen || place.currentOpeningHours?.openNow === true)
      .map((place) => {
        const { latitude, longitude } = place.location!
        const name = place.displayName?.text || 'Unknown Location'
        const hours = place.currentOpeningHours || place.regularOpeningHours
        return {
          id: place.id,
          name,
          image: photoProxyUrl(place.photos?.[0]?.name) || PLACEHOLDER,
          category: place.primaryType || place.types?.[0] || 'tourist_attraction',
          rating: place.rating || 0,
          priceLevel: priceLevelToNumber(place.priceLevel),
          distance: `${distanceKm(userLat, userLng, latitude, longitude).toFixed(1)} km`,
          isOpenNow: place.currentOpeningHours?.openNow || false,
          location: { latitude, longitude },
          address: place.shortFormattedAddress || place.formattedAddress || 'Address not available',
          description: place.editorialSummary?.text || `Visit ${name} and explore one of the area's top attractions.`,
          phoneNumber: place.nationalPhoneNumber,
          website: place.websiteUri,
          openingHours: hours?.weekdayDescriptions,
          photos: place.photos?.map((photo) => ({
            reference: photo.name,
            width: photo.widthPx,
            height: photo.heightPx
          })) || []
        }
      })

    return NextResponse.json({ attractions })
  } catch (error) {
    console.error('Error fetching attractions:', error)
    return NextResponse.json({ error: 'Failed to fetch attractions' }, { status: 500 })
  }
}
