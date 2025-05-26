'use client'

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Text,
  IconButton,
  HStack,
  Grid,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Checkbox,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react'
import { useState, ChangeEvent, useCallback } from 'react'
import { FaMapMarkedAlt, FaFilter } from 'react-icons/fa'
import RestaurantCard from './components/RestaurantCard'
import RestaurantMap from './components/RestaurantMap'
import { useRestaurants } from './hooks/useRestaurants'
import { Restaurant } from './types'
import RestaurantSearch from './components/RestaurantSearch'
import Logo from './components/Logo'
import { debounce } from 'lodash'

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const { isOpen: isMapOpen, onOpen: onMapOpen, onClose: onMapClose } = useDisclosure()
  const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure()
  const {
    restaurants,
    loading,
    error,
    filters,
    updateFilters,
    location
  } = useRestaurants({ maxPrice: 50, cuisine: 'all', dietary: [] })

  // Transform location to match RestaurantSearch component's expected format
  const transformedLocation = location ? {
    lat: location.latitude,
    lng: location.longitude
  } : null

  // Add debouncing for slider changes
  const debouncedPriceChange = useCallback(
    debounce((val: [number, number]) => {
      updateFilters({ maxPrice: val[1] })
    }, 500),
    []
  )

  const debouncedDistanceChange = useCallback(
    debounce((val: [number, number]) => {
      updateFilters({ maxDistance: val[1] })
    }, 500),
    []
  )

  const handlePriceRangeChange = (val: [number, number]) => {
    debouncedPriceChange(val)
  }

  const handleDistanceChange = (val: [number, number]) => {
    debouncedDistanceChange(val)
  }

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    updateFilters({ searchQuery: e.target.value })
  }

  const handleOpenNowClick = () => {
    updateFilters({ isOpen: !filters.isOpen })
  }

  const handleCuisineChange = (cuisine: string) => {
    updateFilters({ cuisine })
  }

  const handleDietaryChange = (option: string) => {
    const currentDietary = filters.dietary || []
    const newDietary = currentDietary.includes(option)
      ? currentDietary.filter(item => item !== option)
      : [...currentDietary, option]
    updateFilters({ dietary: newDietary })
  }

  return (
    <Box as="main">
      {/* Hero Section */}
      <Box
        position="relative"
        height="600px"
        backgroundImage="url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4')"
        backgroundSize="cover"
        backgroundPosition="center"
      >
        <Box
          position="absolute"
          width="100%"
          height="100%"
          bg="blackAlpha.600"
        />
        
        {/* Navigation */}
        <Container maxW="container.xl">
          <Flex 
            py={4} 
            justify="space-between" 
            position="relative" 
            color="white"
            direction={{ base: "column", md: "row" }}
            align={{ base: "center", md: "center" }}
            gap={{ base: 4, md: 0 }}
          >
            <Logo />
            <HStack 
              spacing={{ base: 2, md: 8 }}
              wrap="wrap"
              justify="center"
            >
              <Button variant="ghost" color="white" size={{ base: "sm", md: "md" }}>Home</Button>
              <Button variant="ghost" color="white" size={{ base: "sm", md: "md" }}>Discover</Button>
              <Button variant="ghost" color="white" size={{ base: "sm", md: "md" }}>Favorites</Button>
              <Button variant="ghost" color="white" size={{ base: "sm", md: "md" }}>Profile</Button>
            </HStack>
          </Flex>
        </Container>

        {/* Hero Content */}
        <Container maxW="container.xl" position="relative">
          <Stack
            spacing={{ base: 4, md: 6 }}
            pt={{ base: 20, md: 32 }}
            color="white"
            mx="auto"
            textAlign="center"
            width="100%"
          >
            <Heading
              size={{ base: "xl", md: "2xl" }}
              lineHeight="1.2"
              maxW="container.md"
              mx="auto"
              px={4}
            >
              Find Affordable Dining Near You
            </Heading>
            <Text 
              fontSize={{ base: "lg", md: "xl" }}
              maxW="container.md"
              mx="auto"
              px={4}
            >
              Discover restaurants with meals under $30 on average
            </Text>

            {/* Search Bar */}
            <Box position="relative" width="100%" maxW="container.sm" mx="auto" px={4}>
              <RestaurantSearch
                userLocation={transformedLocation}
                onSearch={(query) => updateFilters({ searchQuery: query })}
              />
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" py={12} px={{ base: 4, md: 8 }}>
        <Flex 
          gap={{ base: 4, md: 8 }}
          direction={{ base: "column", lg: "row" }}
        >
          {/* Restaurant Grid */}
          <Box flex={1}>
            <Flex 
              justify="space-between" 
              align={{ base: "start", md: "center" }}
              mb={6}
              direction={{ base: "column", md: "row" }}
              gap={4}
            >
              <Heading size={{ base: "md", lg: "lg" }}>Popular Budget-Friendly Restaurants</Heading>
              <HStack spacing={3}>
                <Button
                  leftIcon={<FaFilter />}
                  colorScheme="primary"
                  variant="outline"
                  onClick={onFilterOpen}
                  size={{ base: "sm", md: "md" }}
                >
                  Filters
                </Button>
                <Button
                  leftIcon={<FaMapMarkedAlt />}
                  colorScheme="primary"
                  variant="outline"
                  onClick={onMapOpen}
                  size={{ base: "sm", md: "md" }}
                >
                  View Map
                </Button>
              </HStack>
            </Flex>
            
            {error && (
              <Alert status="error" mb={6}>
                <AlertIcon />
                {error}
              </Alert>
            )}

            {loading ? (
              <Flex justify="center" p={8} direction="column" align="center">
                <Spinner size="xl" mb={4} />
                <Text>Finding restaurants near you...</Text>
              </Flex>
            ) : restaurants.length === 0 ? (
              <Alert status="info" mb={6}>
                <AlertIcon />
                No restaurants found. Try adjusting your filters or search criteria.
              </Alert>
            ) : (
              <Grid
                templateColumns={{
                  base: "repeat(1, 1fr)",
                  md: "repeat(2, 1fr)",
                  lg: "repeat(auto-fill, minmax(280px, 1fr))"
                }}
                gap={{ base: 4, md: 6 }}
              >
                {restaurants.map((restaurant: Restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    name={restaurant.name}
                    image={restaurant.image}
                    cuisine={restaurant.cuisine}
                    rating={restaurant.rating}
                    averagePrice={restaurant.averagePrice}
                    distance={restaurant.distance}
                    isOpenNow={restaurant.isOpenNow}
                    phoneNumber={restaurant.phoneNumber}
                    menuUrl={restaurant.menuUrl}
                    address={restaurant.address}
                  />
                ))}
              </Grid>
            )}
          </Box>
        </Flex>
      </Container>

      {/* Map Drawer */}
      <Drawer
        isOpen={isMapOpen}
        placement="right"
        onClose={onMapClose}
        size="lg"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Restaurant Locations</DrawerHeader>
          <DrawerBody p={0}>
            <RestaurantMap 
              restaurants={restaurants}
              userLocation={location || undefined}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Filters Drawer */}
      <Drawer
        isOpen={isFilterOpen}
        placement="right"
        onClose={onFilterClose}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Filter Restaurants</DrawerHeader>
          <DrawerBody>
            <VStack align="stretch" spacing={6}>
              <Box>
                <Heading size="sm" mb={4}>Price Range</Heading>
                <RangeSlider
                  aria-label={['min', 'max']}
                  defaultValue={[0, filters.maxPrice || 50]}
                  min={0}
                  max={50}
                  onChange={handlePriceRangeChange}
                >
                  <RangeSliderTrack>
                    <RangeSliderFilledTrack />
                  </RangeSliderTrack>
                  <RangeSliderThumb index={0} />
                  <RangeSliderThumb index={1} />
                </RangeSlider>
                <Text mt={2}>
                  $0 - ${filters.maxPrice || 50}
                </Text>
              </Box>

              <Box>
                <Heading size="sm" mb={4}>Distance</Heading>
                <RangeSlider
                  aria-label={['min', 'max']}
                  defaultValue={[0, filters.maxDistance || 10]}
                  min={0}
                  max={10}
                  step={0.5}
                  onChange={handleDistanceChange}
                >
                  <RangeSliderTrack>
                    <RangeSliderFilledTrack />
                  </RangeSliderTrack>
                  <RangeSliderThumb index={0} />
                  <RangeSliderThumb index={1} />
                </RangeSlider>
                <Text mt={2}>
                  0 - {filters.maxDistance || 10}km
                </Text>
              </Box>

              <Box>
                <Heading size="sm" mb={4}>Cuisine Type</Heading>
                <VStack align="stretch">
                  <Checkbox 
                    isChecked={filters.cuisine === 'all' || !filters.cuisine}
                    onChange={() => handleCuisineChange('all')}
                  >
                    All Cuisines
                  </Checkbox>
                  <Checkbox 
                    isChecked={filters.cuisine === 'American'}
                    onChange={() => handleCuisineChange('American')}
                  >
                    American
                  </Checkbox>
                  <Checkbox 
                    isChecked={filters.cuisine === 'Italian'}
                    onChange={() => handleCuisineChange('Italian')}
                  >
                    Italian
                  </Checkbox>
                  <Checkbox 
                    isChecked={filters.cuisine === 'Mexican'}
                    onChange={() => handleCuisineChange('Mexican')}
                  >
                    Mexican
                  </Checkbox>
                  <Checkbox 
                    isChecked={filters.cuisine === 'Asian'}
                    onChange={() => handleCuisineChange('Asian')}
                  >
                    Asian
                  </Checkbox>
                  <Checkbox 
                    isChecked={filters.cuisine === 'Mediterranean'}
                    onChange={() => handleCuisineChange('Mediterranean')}
                  >
                    Mediterranean
                  </Checkbox>
                </VStack>
              </Box>

              <Box>
                <Heading size="sm" mb={4}>Dietary Options</Heading>
                <VStack align="stretch">
                  <Checkbox
                    isChecked={(filters.dietary || []).includes('vegetarian')}
                    onChange={() => handleDietaryChange('vegetarian')}
                  >
                    Vegetarian
                  </Checkbox>
                  <Checkbox
                    isChecked={(filters.dietary || []).includes('vegan')}
                    onChange={() => handleDietaryChange('vegan')}
                  >
                    Vegan
                  </Checkbox>
                  <Checkbox
                    isChecked={(filters.dietary || []).includes('gluten-free')}
                    onChange={() => handleDietaryChange('gluten-free')}
                  >
                    Gluten-Free
                  </Checkbox>
                  <Checkbox
                    isChecked={(filters.dietary || []).includes('halal')}
                    onChange={() => handleDietaryChange('halal')}
                  >
                    Halal
                  </Checkbox>
                </VStack>
              </Box>

              <Button
                colorScheme="primary"
                onClick={onFilterClose}
                size="lg"
                mt={4}
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