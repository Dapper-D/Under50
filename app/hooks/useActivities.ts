import { useState, useEffect } from 'react'
import { Activity } from '@/app/types'
import { useGeolocation } from './useGeolocation'

interface ActivitiesFilters {
  searchQuery?: string
  maxPrice?: number
  maxDistance?: number
  category?: string
  difficulty?: 'Easy' | 'Moderate' | 'Challenging'
  isAvailable?: boolean
}

interface UseActivitiesProps {
  maxPrice?: number
  category?: string
}

export function useActivities({ maxPrice = 50, category = 'all' }: UseActivitiesProps = {}) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ActivitiesFilters>({
    maxPrice,
    category,
    maxDistance: 10,
    isAvailable: true
  })

  const { location, error: locationError } = useGeolocation()

  useEffect(() => {
    async function fetchActivities() {
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
        if (filters.difficulty) queryParams.difficulty = filters.difficulty
        if (filters.isAvailable !== undefined) queryParams.isAvailable = filters.isAvailable.toString()

        const params = new URLSearchParams(queryParams)
        const response = await fetch(`/api/activities?${params}`)
        if (!response.ok) throw new Error('Failed to fetch activities')
        
        const data = await response.json()
        setActivities(data.activities)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setActivities([])
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [location, filters])

  const updateFilters = (newFilters: Partial<ActivitiesFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  return {
    activities,
    loading,
    error: error || locationError,
    filters,
    updateFilters,
    location
  }
} 