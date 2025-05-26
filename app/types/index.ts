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
  id: number
  name: string
  price: number
  description: string
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