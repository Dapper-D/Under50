import { prisma } from './prisma'
import axios, { AxiosResponse, AxiosError, RawAxiosRequestHeaders } from 'axios'
import { Location } from '@/app/types'

interface GooglePlacesResponse {
  status: string
  results: Array<{
    place_id: string
    name: string
    photos?: Array<{
      photo_reference: string
    }>
    types: string[]
    rating?: number
    price_level?: number
    formatted_address?: string
    vicinity?: string
    geometry: {
      location: {
        lat: number
        lng: number
      }
    }
    opening_hours?: {
      open_now: boolean
    }
    formatted_phone_number?: string
    website?: string
  }>
}

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

// Helper function to add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Helper function to handle rate limiting
async function makeRequestWithRetry(url: string, retries = 3, delayMs = 1000): Promise<AxiosResponse<GooglePlacesResponse>> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log('Making request to:', url)
      const response = await axios.get<GooglePlacesResponse>(url)
      console.log('Response HTTP status:', response.status)
      console.log('Response data:', JSON.stringify(response.data, null, 2))
      
      if (response.data.status === 'ZERO_RESULTS') {
        console.log('Google API returned ZERO_RESULTS')
        return response
      }
      if (response.data.status === 'OK') {
        return response
      }
      throw new Error(`Google API returned status: ${response.data.status}`)
    } catch (error) {
      console.error('Request error:', (error as AxiosError)?.response?.data || (error as Error).message)
      if ((error as AxiosError)?.response?.status === 429 && i < retries - 1) {
        console.log(`Rate limited, waiting ${delayMs}ms before retry ${i + 1}`)
        await delay(delayMs)
        // Exponential backoff
        delayMs *= 2
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries reached')
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

// Add this function to get place details
export async function getPlaceDetails(placeId: string) {
  try {
    console.log('Fetching place details for:', placeId);
    const response = await axios.get<any>(`https://maps.googleapis.com/maps/api/place/details/json`, {
      params: {
        place_id: placeId,
        fields: 'formatted_phone_number,website,url,price_level,opening_hours,delivery,takeout,dine_in,serves_breakfast,serves_lunch,serves_dinner,photos,menu_url',
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    console.log('Place details response:', JSON.stringify(response.data, null, 2));

    const result = response.data.result;
    return {
      phoneNumber: result?.formatted_phone_number,
      website: result?.website,
      menuUrl: result?.menu_url || result?.url, // Try menu_url first, fallback to Maps URL
      googleMapsUrl: result?.url, // Store the Google Maps URL separately
      priceLevel: result?.price_level,
      openingHours: result?.opening_hours?.weekday_text || [],
      currentOpenStatus: result?.opening_hours?.open_now,
      services: {
        delivery: result?.delivery || false,
        takeout: result?.takeout || false,
        dineIn: result?.dine_in || false
      },
      servingTimes: {
        breakfast: result?.serves_breakfast || false,
        lunch: result?.serves_lunch || false,
        dinner: result?.serves_dinner || false
      },
      photos: result?.photos?.map((photo: any) => ({
        reference: photo.photo_reference,
        width: photo.width,
        height: photo.height
      }))
    };
  } catch (error) {
    console.error('Error fetching place details:', error);
    if (error instanceof AxiosError && error.response) {
      console.error('Error response:', error.response.data);
    }
    return null;
  }
}

export async function findNearbyRestaurants(
  location: Location,
  maxPrice: number = 50,
  cuisineType?: string,
  searchQuery?: string,
  maxDistance: number = 10,
  dietary: string[] = []
) {
  console.log('Finding nearby restaurants with params:', { location, maxPrice, cuisineType, searchQuery, maxDistance, dietary })
  
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.error('Google Places API key is not configured')
    throw new Error('Google Places API key is not configured')
  }

  // Build query parameters
  const params = new URLSearchParams()
  params.append('location', `${location.latitude},${location.longitude}`)
  params.append('maxPrice', maxPrice.toString())
  if (cuisineType) params.append('cuisine', cuisineType)
  if (searchQuery) params.append('search', searchQuery)
  params.append('maxDistance', maxDistance.toString())
  if (dietary.length > 0) params.append('dietary', dietary.join(','))

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
              gte: location.latitude - maxDistance / 69,
              lte: location.latitude + maxDistance / 69,
            },
            longitude: {
              gte: location.longitude - maxDistance / (69 * Math.cos(location.latitude * Math.PI / 180)),
              lte: location.longitude + maxDistance / (69 * Math.cos(location.latitude * Math.PI / 180)),
            },
          },
          cuisineType ? { cuisine: { contains: cuisineType } } : {},
          searchQuery ? { 
            OR: [
              { name: { contains: searchQuery } },
              { cuisine: { contains: searchQuery } }
            ]
          } : {},
          { priceLevel: { lte: Math.ceil(maxPrice / 15) } }
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
            const details = await getPlaceDetails(restaurant.googleId);
            if (details) {
              // Update the database with fresh opening status
              await prisma.restaurant.update({
                where: { id: restaurant.id },
                data: { 
                  isOpen: details.currentOpenStatus ?? true,
                  lastUpdated: new Date()
                }
              });
              
              return {
                ...restaurant,
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
                isOpenNow: details.currentOpenStatus ?? true
              };
            }
          } catch (error) {
            console.error(`Error updating opening hours for ${restaurant.name}:`, error);
          }
        }
        
        // Fallback to existing data if update fails
        return {
          ...restaurant,
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

      // Cache the results
      cache.set(cacheKey, {
        timestamp: Date.now(),
        data: updatedResults,
        key: cacheKey
      });

      return updatedResults;
    }
  } catch (error) {
    console.error('Error querying database:', error)
  }

  // If not enough results in database or database query failed, fetch from Google Places
  try {
    const radiusInMeters = Math.min(maxDistance * 1000, 50000)
    let searchString = buildSearchString(searchQuery, cuisineType, dietary)

    const url = buildGooglePlacesUrl(
      location,
      radiusInMeters,
      searchString,
      maxPrice
    )

    const googleResponse = await makeRequestWithRetry(url)
    console.log('Google Places API response status:', googleResponse.status)

    if (!googleResponse.data.results || googleResponse.data.results.length === 0) {
      console.log('No restaurants found in Google Places response')
      return []
    }

    const restaurants = await processGoogleResults(
      googleResponse.data.results,
      location,
      maxDistance
    )

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
            image: restaurant.image,
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
            image: restaurant.image,
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

function buildGooglePlacesUrl(
  location: Location,
  radius: number,
  searchString: string,
  maxPrice: number
): string {
  return `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
    `query=${encodeURIComponent(searchString)}&` +
    `location=${location.latitude},${location.longitude}&` +
    `radius=${radius}&` +
    `region=ca&` +
    `type=restaurant&` +
    (maxPrice ? `maxprice=${Math.min(Math.ceil(maxPrice / 15), 4)}&` : '') +
    `key=${process.env.GOOGLE_PLACES_API_KEY}`
}

async function processGoogleResults(
  results: any[],
  userLocation: Location,
  maxDistance: number
): Promise<RestaurantData[]> {
  const restaurants: RestaurantData[] = []

  for (const place of results) {
    try {
      await delay(200) // Reduced delay to 200ms
      const details = await getPlaceDetails(place.place_id)
      
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        place.geometry.location.lat,
        place.geometry.location.lng
      )

      // Skip if beyond max distance
      if (parseFloat(distance) > maxDistance) continue

      // Determine if the place is open
      let isOpenNow = true; // Default to open unless we have explicit information
      
      if (place.opening_hours?.open_now !== undefined) {
        // Use the direct open_now status if available
        isOpenNow = place.opening_hours.open_now;
      } else if (details?.openingHours) {
        // If we have detailed opening hours, try to determine current status
        const now = new Date();
        const dayOfWeek = now.getDay();
        const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
        
        // Parse opening hours if available
        if (details.openingHours && details.openingHours[dayOfWeek]) {
          const todayHours = details.openingHours[dayOfWeek];
          console.log(`Opening hours for ${place.name}:`, todayHours);
          // For now, assume open if we have hours for today
          // In a full implementation, you'd parse the hours string and check against current time
          isOpenNow = true;
        }
      }

      const restaurant: RestaurantData = {
        id: place.place_id,
        name: place.name,
        image: place.photos?.[0]?.photo_reference 
          ? `/api/photos?photo_reference=${place.photos[0].photo_reference}&maxwidth=400`
          : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
        cuisine: place.types?.find((type: string) => 
          !['restaurant', 'food', 'point_of_interest', 'establishment'].includes(type)
        ) || 'Restaurant',
        rating: place.rating || 4.0,
        priceLevel: place.price_level || 2,
        averagePrice: (place.price_level || 2) * 15,
        address: place.formatted_address || place.vicinity || 'Address not available',
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        },
        isOpenNow: isOpenNow,
        distance,
        phoneNumber: details?.phoneNumber,
        menuUrl: details?.website
      }

      restaurants.push(restaurant)
    } catch (error) {
      console.error(`Error processing restaurant ${place.name}:`, error)
      continue
    }
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