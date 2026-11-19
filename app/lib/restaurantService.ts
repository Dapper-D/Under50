import { prisma } from './prisma'
import { Location } from '@/app/types'
import {
  searchText,
  getPlace,
  serverKey,
  priceLevelToNumber,
  priceLevelsUpTo,
  photoProxyUrl,
  NewPlace,
  MAX_RADIUS_M
} from './googlePlaces'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'

interface RestaurantData {
  id: string
  name: string
  image: string
  cuisine: string
  rating: number
  priceLevel: number
  averagePrice: number
  address: string
  latitude: number
  longitude: number
  location: {
    latitude: number
    longitude: number
    lat: number
    lng: number
  }
  isOpenNow: boolean
  googleId?: string
  distance?: string
  phoneNumber?: string
  menuUrl?: string
}

// Cache for restaurant results
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
interface CacheEntry {
  timestamp: number
  data: RestaurantData[]
  key: string
}
const cache = new Map<string, CacheEntry>()

// Generate cache key from search parameters
function generateCacheKey(params: URLSearchParams): string {
  return params.toString()
}

// Check if cache entry is valid
function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_DURATION
}

// Helper function to calculate distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const d = R * c // Distance in km
  
  if (d < 1) {
    return `${Math.round(d * 1000)}m`
  }
  return `${d.toFixed(1)}km`
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180)
}

// calculateDistance returns "850m" or "3.2km"
function distanceLabelToKm(label: string): number {
  return label.endsWith('km') ? parseFloat(label) : parseFloat(label) / 1000
}

// Place details for the restaurant page (Place Details (New))
const DETAIL_FIELDS = [
  'id', 'nationalPhoneNumber', 'websiteUri', 'googleMapsUri', 'priceLevel',
  'currentOpeningHours', 'regularOpeningHours',
  'delivery', 'takeout', 'dineIn', 'servesBreakfast', 'servesLunch', 'servesDinner',
  'photos'
]

export async function getPlaceDetails(placeId: string) {
  try {
    const place = await getPlace(placeId, DETAIL_FIELDS)
    const hours = place.currentOpeningHours || place.regularOpeningHours
    return {
      phoneNumber: place.nationalPhoneNumber,
      website: place.websiteUri,
      // The new API has no menu URL; keep the old fallback of website, then the Maps page
      menuUrl: place.websiteUri || place.googleMapsUri,
      googleMapsUrl: place.googleMapsUri,
      priceLevel: priceLevelToNumber(place.priceLevel),
      openingHours: hours?.weekdayDescriptions || [],
      currentOpenStatus: place.currentOpeningHours?.openNow,
      services: {
        delivery: place.delivery || false,
        takeout: place.takeout || false,
        dineIn: place.dineIn || false
      },
      servingTimes: {
        breakfast: place.servesBreakfast || false,
        lunch: place.servesLunch || false,
        dinner: place.servesDinner || false
      },
      // `reference` now holds the photo resource name; pass it to /api/photos?name=
      photos: place.photos?.map((photo) => ({
        reference: photo.name,
        width: photo.widthPx,
        height: photo.heightPx
      }))
    }
  } catch (error) {
    console.error('Error fetching place details:', error)
    return null
  }
}

// Cheap lookup used for restaurants already in the database: opening status and
// a fresh photo name (Google says photo names expire and must not be stored)
async function getFreshInfo(placeId: string): Promise<{ openNow?: boolean; image?: string } | undefined> {
  try {
    const place = await getPlace(placeId, ['id', 'currentOpeningHours', 'photos'])
    return { openNow: place.currentOpeningHours?.openNow, image: photoProxyUrl(place.photos?.[0]?.name) }
  } catch (error) {
    console.error('Error refreshing place info:', error)
    return undefined
  }
}

export async function findNearbyRestaurants(
  location: Location,
  maxPrice: number = 50,
  cuisineType?: string,
  searchQuery?: string,
  maxDistance: number = 10, // km
  dietary: string[] = [],
  openNow: boolean = false
) {
  console.log('Finding nearby restaurants with params:', { location, maxPrice, cuisineType, searchQuery, maxDistance, dietary, openNow })
  
  if (!serverKey()) {
    console.error('Google Places API key is not configured')
    throw new Error('Google Places API key is not configured (set GOOGLE_PLACES_API_KEY)')
  }

  // Build query parameters
  const params = new URLSearchParams()
  params.append('location', `${location.latitude},${location.longitude}`)
  params.append('maxPrice', maxPrice.toString())
  if (cuisineType) params.append('cuisine', cuisineType)
  if (searchQuery) params.append('search', searchQuery)
  params.append('maxDistance', maxDistance.toString())
  if (dietary.length > 0) params.append('dietary', dietary.join(','))
  if (openNow) params.append('openNow', 'true')

  // Google only rates price as $-$$$$ (levels 1-4), shown as ~$15 per level.
  // Round DOWN so every level allowed fits under maxPrice ($20 or $25 -> level 1).
  const maxLevel = Math.min(Math.floor(maxPrice / 15), 4)
  if (maxLevel < 1) return [] // nothing the app can price is under $15

  // Final check applied to every result, so cards always match the filters
  const matchesFilters = (r: { averagePrice: number; distance?: string; isOpenNow: boolean }) =>
    r.averagePrice <= maxPrice &&
    (r.distance === undefined || distanceLabelToKm(r.distance) <= maxDistance) &&
    (!openNow || r.isOpenNow)

  const cacheKey = generateCacheKey(params)
  
  // Check cache first
  const cachedResult = cache.get(cacheKey)
  if (cachedResult && isCacheValid(cachedResult)) {
    console.log('Returning cached results')
    return cachedResult.data
  }

  // First, try to find restaurants in our database
  try {
    const dbRestaurants = await prisma.restaurant.findMany({
      where: {
        AND: [
          {
            latitude: {
              // degrees of latitude per km is 1/111 (this used 69, which is miles)
              gte: location.latitude - maxDistance / 111,
              lte: location.latitude + maxDistance / 111,
            },
            longitude: {
              gte: location.longitude - maxDistance / (111 * Math.cos(location.latitude * Math.PI / 180)),
              lte: location.longitude + maxDistance / (111 * Math.cos(location.latitude * Math.PI / 180)),
            },
          },
          cuisineType ? { cuisine: { contains: cuisineType } } : {},
          searchQuery ? { 
            OR: [
              { name: { contains: searchQuery } },
              { cuisine: { contains: searchQuery } }
            ]
          } : {},
          { priceLevel: { lte: maxLevel } }
        ]
      },
      take: 20,
    })

    // If we have results from database, fetch fresh opening hours for each
    if (dbRestaurants.length >= 5) {
      const updatedResults = await Promise.all(dbRestaurants.map(async (restaurant: any) => {
        // Fetch fresh details from Google Places API for opening hours
        if (restaurant.googleId) {
          try {
            const fresh = await getFreshInfo(restaurant.googleId);
            if (fresh) {
              const openNow = fresh.openNow ?? true;
              // Update the database with fresh opening status
              await prisma.restaurant.update({
                where: { id: restaurant.id },
                data: { 
                  isOpen: openNow,
                  lastUpdated: new Date()
                }
              });
              
              return {
                ...restaurant,
                averagePrice: (restaurant.priceLevel || 2) * 15, // not stored in the database
                image: fresh.image || FALLBACK_IMAGE,
                location: {
                  latitude: restaurant.latitude,
                  longitude: restaurant.longitude
                },
                distance: calculateDistance(
                  location.latitude,
                  location.longitude,
                  restaurant.latitude,
                  restaurant.longitude
                ),
                isOpenNow: openNow
              };
            }
          } catch (error) {
            console.error(`Error updating opening hours for ${restaurant.name}:`, error);
          }
        }
        
        // Fallback to existing data if update fails
        return {
          ...restaurant,
          averagePrice: (restaurant.priceLevel || 2) * 15, // not stored in the database
          image: FALLBACK_IMAGE,
          location: {
            latitude: restaurant.latitude,
            longitude: restaurant.longitude
          },
          distance: calculateDistance(
            location.latitude,
            location.longitude,
            restaurant.latitude,
            restaurant.longitude
          ),
          isOpenNow: true // Default to open if we can't get current status
        };
      }));

      // Apply distance / price / open-now precisely; if too few saved places
      // survive, fall through to a fresh Google search instead
      const filtered = updatedResults.filter(matchesFilters);
      if (filtered.length >= 5) {
        cache.set(cacheKey, {
          timestamp: Date.now(),
          data: filtered,
          key: cacheKey
        });
        return filtered;
      }
    }
  } catch (error) {
    console.error('Error querying database:', error)
  }

  // If not enough results in database or database query failed, fetch from Google Places
  try {
    const radiusInMeters = Math.min(maxDistance * 1000, MAX_RADIUS_M)
    let searchString = buildSearchString(searchQuery, cuisineType, dietary)

    // The new API takes a list of allowed levels. At the top level (4) no filter
    // is sent, so places with no price data still show up.
    const places = await searchText({
      textQuery: searchString,
      lat: location.latitude,
      lng: location.longitude,
      radiusM: radiusInMeters,
      includedType: 'restaurant',
      priceLevels: maxLevel < 4 ? priceLevelsUpTo(maxLevel) : undefined,
      openNow,
      fields: SEARCH_FIELDS
    })

    if (places.length === 0) {
      console.log('No restaurants found in Google Places response')
      return []
    }

    const restaurants = processGoogleResults(places, location, maxDistance).filter(matchesFilters)

    // Store results in cache
    cache.set(cacheKey, {
      timestamp: Date.now(),
      data: restaurants,
      key: cacheKey
    })

    // Store new restaurants in database
    for (const restaurant of restaurants) {
      try {
        await prisma.restaurant.upsert({
          where: { id: restaurant.id.toString() },
          update: {
            name: restaurant.name,
            // Photo names expire and may not be stored, so only the fallback goes in the database
            image: FALLBACK_IMAGE,
            cuisine: restaurant.cuisine,
            rating: restaurant.rating,
            priceLevel: restaurant.priceLevel || 1,
            address: restaurant.address,
            latitude: restaurant.location.latitude,
            longitude: restaurant.location.longitude,
            isOpen: restaurant.isOpenNow,
            lastUpdated: new Date()
          },
          create: {
            id: restaurant.id.toString(),
            name: restaurant.name,
            image: FALLBACK_IMAGE,
            cuisine: restaurant.cuisine,
            rating: restaurant.rating,
            priceLevel: restaurant.priceLevel || 1,
            address: restaurant.address,
            latitude: restaurant.location.latitude,
            longitude: restaurant.location.longitude,
            isOpen: restaurant.isOpenNow,
            googleId: restaurant.id.toString()
          }
        })
      } catch (error) {
        console.error('Error upserting restaurant:', error)
      }
    }

    return restaurants

  } catch (error) {
    console.error('Error fetching from Google Places:', error)
    throw error
  }
}

// Helper functions
function buildSearchString(searchQuery?: string, cuisineType?: string, dietary: string[] = []): string {
  const terms = []
  if (searchQuery) terms.push(searchQuery)
  if (cuisineType && cuisineType !== 'all') terms.push(cuisineType)
  terms.push('restaurants')
  if (dietary.length > 0) terms.unshift(...dietary)
  return terms.join(' ')
}

// Fields requested from Text Search (New). Phone and website come back in the
// same call, so there is no per-result details request any more.
const SEARCH_FIELDS = [
  'id', 'displayName', 'formattedAddress', 'shortFormattedAddress', 'location',
  'rating', 'priceLevel', 'types', 'primaryType', 'photos',
  'currentOpeningHours', 'nationalPhoneNumber', 'websiteUri'
]

const GENERIC_TYPES = ['restaurant', 'food', 'point_of_interest', 'establishment']

function processGoogleResults(
  places: NewPlace[],
  userLocation: Location,
  maxDistance: number
): RestaurantData[] {
  const restaurants: RestaurantData[] = []

  for (const place of places) {
    if (!place.location) continue
    const { latitude, longitude } = place.location

    const distance = calculateDistance(userLocation.latitude, userLocation.longitude, latitude, longitude)
    if (distanceLabelToKm(distance) > maxDistance) continue

    const priceLevel = priceLevelToNumber(place.priceLevel)
    const cuisine =
      (place.primaryType && !GENERIC_TYPES.includes(place.primaryType) ? place.primaryType : undefined) ||
      place.types?.find((type) => !GENERIC_TYPES.includes(type)) ||
      'Restaurant'

    restaurants.push({
      id: place.id,
      name: place.displayName?.text || 'Unnamed restaurant',
      image: photoProxyUrl(place.photos?.[0]?.name) || FALLBACK_IMAGE,
      cuisine,
      rating: place.rating || 4.0,
      priceLevel: priceLevel || 2,
      averagePrice: (priceLevel || 2) * 15,
      address: place.formattedAddress || place.shortFormattedAddress || 'Address not available',
      latitude,
      longitude,
      location: { latitude, longitude, lat: latitude, lng: longitude },
      // Default to open unless Google says otherwise, as before
      isOpenNow: place.currentOpeningHours?.openNow ?? true,
      distance,
      phoneNumber: place.nationalPhoneNumber,
      menuUrl: place.websiteUri
    })
  }

  return restaurants
}

export async function getCuisineTypes() {
  return prisma.cuisineType.findMany({
    orderBy: { count: 'desc' }
  })
}

export async function searchRestaurants(query: string) {
  return prisma.restaurant.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { cuisine: { contains: query } },
        { address: { contains: query } }
      ]
    },
    take: 20
  })
} 