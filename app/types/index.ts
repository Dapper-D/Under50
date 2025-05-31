export interface Restaurant {
  id: string | number
  name: string
  image: string
  cuisine: string
  rating: number
  priceLevel?: number
  averagePrice?: number
  distance: string
  isOpenNow: boolean
  location: {
    latitude: number
    longitude: number
  }
  address: string
  menu?: MenuItem[]
  dietary?: string[]
  phoneNumber?: string
  menuUrl?: string
  website?: string
  googleMapsUrl?: string
  openingHours?: string[]
  services?: {
    delivery: boolean
    takeout: boolean
    dineIn: boolean
  }
  servingTimes?: {
    breakfast: boolean
    lunch: boolean
    dinner: boolean
  }
  photos?: Array<{
    reference: string
    width: number
    height: number
  }>
}

export interface MenuItem {
  name: string
  description?: string
  price: number
  category?: string
}

export interface Attraction {
  id: string | number
  name: string
  image: string
  category: string
  rating: number
  priceLevel?: number
  ticketPrice?: number
  distance: string
  isOpenNow: boolean
  location: {
    latitude: number
    longitude: number
  }
  address: string
  description: string
  phoneNumber?: string
  website?: string
  googleMapsUrl?: string
  openingHours?: string[]
  bestTimeToVisit?: string
  suggestedDuration?: string
  accessibility?: {
    wheelchair: boolean
    parking: boolean
    publicTransport: boolean
  }
  photos?: Array<{
    reference: string
    width: number
    height: number
  }>
}

export interface Activity {
  id: string | number
  name: string
  image: string
  category: string
  rating: number
  priceLevel?: number
  pricePerPerson?: number
  distance: string
  isAvailable: boolean
  location: {
    latitude: number
    longitude: number
  }
  address: string
  description: string
  phoneNumber?: string
  website?: string
  googleMapsUrl?: string
  schedule?: string[]
  duration?: string
  difficulty?: 'Easy' | 'Moderate' | 'Challenging'
  ageRestriction?: string
  groupSize?: {
    min: number
    max: number
  }
  photos?: Array<{
    reference: string
    width: number
    height: number
  }>
}

export interface Filters {
  maxPrice?: number
  cuisine: string
  isOpen?: boolean
  maxDistance?: number
  dietary?: string[]
  searchQuery?: string
}

export interface Location {
  latitude: number
  longitude: number
} 