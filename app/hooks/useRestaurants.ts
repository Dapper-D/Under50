import { useState, useEffect, useCallback, useMemo } from 'react'
import { Restaurant, Filters, Location } from '@/app/types'
import { debounce } from 'lodash'

interface MenuItem {
  id: number
  name: string
  price: number
  description: string
  category: string
}

export function useRestaurants(initialFilters: Filters = { cuisine: 'all' }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [location, setLocation] = useState<Location | null>(null)

  // Memoize the location fetching function
  const fetchLocation = useCallback(() => {
    console.log('Attempting to get user location...')
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Successfully got user location:', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          updateFilters({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          // Set default location (New York City) if geolocation fails
          setLocation({
            latitude: 40.7128,
            longitude: -74.006,
            lat: 40.7128,
            lng: -74.006
          })
        }
      )
    } else {
      console.log('Geolocation not supported, setting default NYC location')
      setLocation({
        latitude: 40.7128,
        longitude: -74.006,
        lat: 40.7128,
        lng: -74.006
      })
    }
  }, [])

  // Memoize the fetch restaurants function
  const fetchRestaurants = useCallback(
    debounce(async (currentLocation: Location, currentFilters: Filters) => {
      try {
        setLoading(true)
        setError(null)

        console.log('Fetching restaurants with params:', {
          currentLocation,
          currentFilters
        })

        // Build query string from filters and location
        const params = new URLSearchParams()
        params.append('latitude', currentLocation.latitude.toString())
        params.append('longitude', currentLocation.longitude.toString())
        if (currentFilters.maxPrice) params.append('maxPrice', currentFilters.maxPrice.toString())
        if (currentFilters.cuisine && currentFilters.cuisine !== 'all') params.append('cuisine', currentFilters.cuisine)
        if (currentFilters.isOpen !== undefined) params.append('isOpen', currentFilters.isOpen.toString())
        if (currentFilters.maxDistance) params.append('maxDistance', currentFilters.maxDistance.toString())
        if (currentFilters.dietary && currentFilters.dietary.length > 0) {
          params.append('dietary', currentFilters.dietary.join(','))
        }
        if (currentFilters.searchQuery) params.append('search', currentFilters.searchQuery)

        const response = await fetch(`/api/restaurants?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch restaurants')
        }

        const data = await response.json()
        console.log('Received restaurants:', data.length)
        setRestaurants(data)
      } catch (err) {
        console.error('Error in fetchRestaurants:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }, 500),
    []
  )

  // Get user's location on mount
  useEffect(() => {
    fetchLocation()
  }, [fetchLocation])

  // Fetch restaurants when location or filters change
  useEffect(() => {
    if (location) {
      fetchRestaurants(location, filters)
    }
    
    // Cleanup function to cancel any pending debounced calls
    return () => {
      fetchRestaurants.cancel()
    }
  }, [location, filters, fetchRestaurants])

  const updateFilters = useCallback((newFilters: Partial<Filters>) => {
    setFilters((prevFilters: Filters) => ({
      ...prevFilters,
      ...newFilters
    }))
  }, [])

  // Memoize the return value to prevent unnecessary re-renders
  const returnValue = useMemo(() => ({
    restaurants,
    loading,
    error,
    filters,
    updateFilters,
    location
  }), [restaurants, loading, error, filters, updateFilters, location])

  return returnValue
} 