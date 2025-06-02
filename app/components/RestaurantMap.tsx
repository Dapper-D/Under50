import { useEffect, useState, useCallback } from 'react'
import { 
  Box, 
  Text, 
  Image, 
  VStack, 
  HStack, 
  Badge, 
  useToast, 
  Spinner, 
  Button, 
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure
} from '@chakra-ui/react'
import { FaDirections, FaStar, FaSearch, FaFilter } from 'react-icons/fa'
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import useSWR from 'swr'
import { Restaurant, Location } from '@/app/types'

interface CuisineType {
  id: number
  name: string
  count: number
}

interface RestaurantMapProps {
  restaurants: Restaurant[]
  center?: [number, number]
  zoom?: number
  maxPrice?: number
  userLocation?: Location | null
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

export default function RestaurantMap({
  restaurants: initialRestaurants,
  center = [-74.006, 40.7128],
  zoom = 12,
  maxPrice = 50,
  userLocation
}: RestaurantMapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  })

  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCuisine, setSelectedCuisine] = useState<string>('')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maxPrice])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  // Fetch cuisine types
  const { data: cuisineTypes } = useSWR<CuisineType[]>(
    '/api/restaurants/cuisines',
    fetcher
  )

  const fetchNearbyRestaurants = useCallback(async (
    latitude: number,
    longitude: number,
    cuisine?: string,
    search?: string,
    price?: number
  ) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        ...(cuisine ? { cuisine } : {}),
        ...(search ? { search } : {}),
        ...(price ? { maxPrice: price.toString() } : {})
      })

      const response = await fetch(`/api/restaurants?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch restaurants')
      }

      const data = await response.json()
      setRestaurants(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch nearby restaurants',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      console.error('Error fetching restaurants:', error)
    } finally {
      setLoading(false)
    }
  }, [toast])

  const handleSearch = () => {
    if (userLocation) {
      fetchNearbyRestaurants(
        userLocation.latitude,
        userLocation.longitude,
        selectedCuisine,
        searchQuery,
        priceRange[1]
      )
    }
  }

  const getDirections = (restaurant: Restaurant) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${restaurant.location.latitude},${restaurant.location.longitude}`,
      '_blank'
    )
  }

  useEffect(() => {
    if (userLocation) {
      fetchNearbyRestaurants(
        userLocation.latitude,
        userLocation.longitude,
        selectedCuisine,
        searchQuery,
        priceRange[1]
      )
    }
  }, [userLocation, fetchNearbyRestaurants, selectedCuisine, searchQuery, priceRange])

  if (loadError) {
    return (
      <Box height="400px" width="100%" display="flex" alignItems="center" justifyContent="center">
        <Text>Error loading maps</Text>
      </Box>
    )
  }

  if (!isLoaded) {
    return (
      <Box height="400px" width="100%" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" />
      </Box>
    )
  }

  return (
    <Box height="400px" width="100%" position="relative">
      <Box
        position="absolute"
        top={4}
        left={4}
        zIndex={1}
        bg="white"
        p={2}
        borderRadius="md"
        boxShadow="lg"
        width="300px"
      >
        <VStack spacing={2}>
          <InputGroup>
            <Input
              placeholder="Search restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <InputRightElement>
              <Button
                size="sm"
                onClick={handleSearch}
                aria-label="Search"
              >
                <Icon as={FaSearch} />
              </Button>
            </InputRightElement>
          </InputGroup>
          <Button
            leftIcon={<Icon as={FaFilter} />}
            onClick={onOpen}
            width="100%"
          >
            Filters
          </Button>
        </VStack>
      </Box>

      {loading && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={1000}
          bg="white"
          p={4}
          borderRadius="md"
          boxShadow="lg"
        >
          <Spinner size="xl" />
        </Box>
      )}

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={{
          lat: userLocation?.latitude || center[1],
          lng: userLocation?.longitude || center[0]
        }}
        zoom={zoom}
        options={{
          zoomControl: true,
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true,
        }}
      >
        {/* User location marker */}
        {userLocation && (
          <Marker
            position={{
              lat: userLocation.latitude,
              lng: userLocation.longitude
            }}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            }}
          />
        )}

        {/* Restaurant markers */}
        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            position={{
              lat: restaurant.location.latitude,
              lng: restaurant.location.longitude
            }}
            onClick={() => setSelectedRestaurant(restaurant)}
          />
        ))}

        {/* Info window for selected restaurant */}
        {selectedRestaurant && (
          <InfoWindow
            position={{
              lat: selectedRestaurant.location.latitude,
              lng: selectedRestaurant.location.longitude
            }}
            onCloseClick={() => setSelectedRestaurant(null)}
          >
            <VStack align="start" spacing={2} p={2}>
              <Image
                src={selectedRestaurant.image}
                alt={selectedRestaurant.name}
                borderRadius="md"
                height="100px"
                objectFit="cover"
              />
              <Text fontWeight="bold">{selectedRestaurant.name}</Text>
              <Text fontSize="sm">{selectedRestaurant.address}</Text>
              <HStack>
                <Badge colorScheme={selectedRestaurant.isOpenNow ? 'green' : 'red'}>
                  {selectedRestaurant.isOpenNow ? 'Open' : 'Closed'}
                </Badge>
                <Badge>
                  {'$'.repeat(selectedRestaurant.priceLevel || 1)}
                </Badge>
                <Badge colorScheme="yellow">
                  <HStack spacing={1}>
                    <Icon as={FaStar} />
                    <Text>{selectedRestaurant.rating}</Text>
                  </HStack>
                </Badge>
              </HStack>
              <Text fontSize="sm" color="gray.600">
                {selectedRestaurant.cuisine} • {selectedRestaurant.distance}
              </Text>
              <Button
                leftIcon={<Icon as={FaDirections} />}
                colorScheme="blue"
                size="sm"
                onClick={() => getDirections(selectedRestaurant)}
              >
                Get Directions
              </Button>
            </VStack>
          </InfoWindow>
        )}
      </GoogleMap>

      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Filters</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4}>
              <Box width="100%">
                <Text mb={2}>Cuisine Type</Text>
                <Select
                  value={selectedCuisine}
                  onChange={(e) => setSelectedCuisine(e.target.value)}
                  placeholder="All Cuisines"
                >
                  {cuisineTypes?.map((cuisine: CuisineType) => (
                    <option key={cuisine.id} value={cuisine.name}>
                      {cuisine.name} ({cuisine.count})
                    </option>
                  ))}
                </Select>
              </Box>

              <Box width="100%">
                <Text mb={2}>Price Range</Text>
                <RangeSlider
                  min={0}
                  max={maxPrice}
                  step={5}
                  value={priceRange}
                  onChange={(val: [number, number]) => setPriceRange(val)}
                >
                  <RangeSliderTrack>
                    <RangeSliderFilledTrack />
                  </RangeSliderTrack>
                  <RangeSliderThumb index={0} />
                  <RangeSliderThumb index={1} />
                </RangeSlider>
                <Text textAlign="center" mt={2}>
                  ${priceRange[0]} - ${priceRange[1]}
                </Text>
              </Box>

              <Button
                colorScheme="blue"
                width="100%"
                onClick={() => {
                  handleSearch()
                  onClose()
                }}
              >
                Apply Filters
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
} 