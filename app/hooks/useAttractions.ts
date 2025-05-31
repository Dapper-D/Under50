import { useState, useEffect } from 'react'
import { Attraction } from '@/app/types'
import { useGeolocation } from './useGeolocation'

interface AttractionsFilters {
  searchQuery?: string
  maxPrice?: number
  maxDistance?: number
  category?: string
  isOpen?: boolean
}

interface UseAttractionsProps {
  maxPrice?: number
  category?: string
}

export function useAttractions({ maxPrice = 50, category = 'all' }: UseAttractionsProps = {}) {
  const [attractions, setAttractions] = useState<Attraction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AttractionsFilters>({
    maxPrice,
    category,
    maxDistance: 10,
    isOpen: false
  })

  const { location, error: locationError } = useGeolocation()

  useEffect(() => {
    async function fetchAttractions() {
      if (!location) return

      setLoading(true)
      setError(null)

      try {
        const queryParams: Record<string, string> = {
          lat: location.latitude.toString(),
          lng: location.longitude.toString(),
        }

        // Add filters to query params
        if (filters.searchQuery) queryParams.searchQuery = filters.searchQuery
        if (filters.maxPrice) queryParams.maxPrice = filters.maxPrice.toString()
        if (filters.maxDistance) queryParams.maxDistance = filters.maxDistance.toString()
        if (filters.category) queryParams.category = filters.category
        if (filters.isOpen !== undefined) queryParams.isOpen = filters.isOpen.toString()

        const params = new URLSearchParams(queryParams)
        const response = await fetch(`/api/attractions?${params}`)
        if (!response.ok) throw new Error('Failed to fetch attractions')
        
        const data = await response.json()
        setAttractions(data.attractions)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setAttractions([])
      } finally {
        setLoading(false)
      }
    }

    fetchAttractions()
  }, [location, filters])

  const updateFilters = (newFilters: Partial<AttractionsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  return {
    attractions,
    loading,
    error: error || locationError,
    filters,
    updateFilters,
    location
  }
} 