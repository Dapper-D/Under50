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
import Link from 'next/link'
import PageLayout from './components/PageLayout'

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
  } = useRestaurants()

  // Transform location to match map component's expected format
  const transformedLocation = location ? {
    lat: location.latitude,
    lng: location.longitude,
    latitude: location.latitude,
    longitude: location.longitude
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
    <PageLayout
      title="Discover Your Next Adventure"
      description="Explore local restaurants, attractions, and activities in your area"
      backgroundImage="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"
      userLocation={transformedLocation}
      onSearch={(query) => updateFilters({ searchQuery: query })}
    >
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
                lg: "repeat(auto-fill, minmax(300px, 1fr))"
              }}
              gap={6}
            >
              {restaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  {...restaurant}
                />
              ))}
            </Grid>
          )}
        </Box>
      </Flex>

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
              userLocation={transformedLocation}
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
            <VStack spacing={6}>
              <Box width="100%">
                <Text mb={2}>Price Range</Text>
                <RangeSlider
                  defaultValue={[0, filters.maxPrice || 50]}
                  min={0}
                  max={100}
                  step={5}
                  onChange={(val) => updateFilters({ maxPrice: val[1] })}
                >
                  <RangeSliderTrack>
                    <RangeSliderFilledTrack />
                  </RangeSliderTrack>
                  <RangeSliderThumb index={0} />
                  <RangeSliderThumb index={1} />
                </RangeSlider>
                <Text textAlign="center" mt={2}>
                  Up to ${filters.maxPrice || 50}
                </Text>
              </Box>

              <Box width="100%">
                <Text mb={2}>Distance (km)</Text>
                <RangeSlider
                  defaultValue={[0, filters.maxDistance || 10]}
                  min={0}
                  max={50}
                  step={1}
                  onChange={(val) => updateFilters({ maxDistance: val[1] })}
                >
                  <RangeSliderTrack>
                    <RangeSliderFilledTrack />
                  </RangeSliderTrack>
                  <RangeSliderThumb index={0} />
                  <RangeSliderThumb index={1} />
                </RangeSlider>
                <Text textAlign="center" mt={2}>
                  Within {filters.maxDistance || 10}km
                </Text>
              </Box>

              <Box width="100%">
                <Checkbox
                  isChecked={filters.isOpen}
                  onChange={(e) => updateFilters({ isOpen: e.target.checked })}
                >
                  Open Now
                </Checkbox>
              </Box>

              <Button
                colorScheme="blue"
                width="100%"
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
    </PageLayout>
  )
} 