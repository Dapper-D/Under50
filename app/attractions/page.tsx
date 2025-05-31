'use client'

import {
  Box,
  Container,
  Flex,
  Heading,
  Button,
  HStack,
  Grid,
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
  VStack,
  Select,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Text,
  Checkbox,
} from '@chakra-ui/react'
import { FaMapMarkedAlt, FaFilter } from 'react-icons/fa'
import { useState } from 'react'
import AttractionCard from '../components/AttractionCard'
import RestaurantMap from '../components/RestaurantMap' // We'll reuse this for now
import { useAttractions } from '../hooks/useAttractions'
import RestaurantSearch from '../components/RestaurantSearch' // We'll reuse this for now
import Logo from '../components/Logo'
import Link from 'next/link'
import PageLayout from '../components/PageLayout'

const ATTRACTION_CATEGORIES = [
  'All Attractions',
  'Museums',
  'Historical Sites',
  'Parks',
  'Theme Parks',
  'Cultural Sites',
  'Natural Landmarks',
  'Religious Sites',
  'Art Galleries',
  'Zoos & Aquariums'
]

export default function AttractionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { isOpen: isMapOpen, onOpen: onMapOpen, onClose: onMapClose } = useDisclosure()
  const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure()
  const {
    attractions,
    loading,
    error,
    filters,
    updateFilters,
    location
  } = useAttractions()

  // Transform location to match map component's expected format
  const transformedLocation = location ? {
    lat: location.latitude,
    lng: location.longitude
  } : null

  return (
    <PageLayout
      title="Discover Amazing Attractions"
      description="Explore the most fascinating places in your area"
      backgroundImage="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df"
      userLocation={transformedLocation}
      onSearch={(query) => updateFilters({ searchQuery: query })}
    >
      <Flex 
        justify="space-between" 
        align={{ base: "start", md: "center" }}
        mb={6}
        direction={{ base: "column", md: "row" }}
        gap={4}
      >
        <Heading size="lg">Popular Attractions Near You</Heading>
        <HStack spacing={3}>
          <Button
            leftIcon={<FaFilter />}
            colorScheme="blue"
            variant="outline"
            onClick={onFilterOpen}
            size={{ base: "sm", md: "md" }}
          >
            Filters
          </Button>
          <Button
            leftIcon={<FaMapMarkedAlt />}
            colorScheme="blue"
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
          <Text>Finding attractions near you...</Text>
        </Flex>
      ) : attractions.length === 0 ? (
        <Alert status="info" mb={6}>
          <AlertIcon />
          No attractions found. Try adjusting your filters or search criteria.
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
          {attractions.map((attraction) => (
            <AttractionCard
              key={attraction.id}
              {...attraction}
            />
          ))}
        </Grid>
      )}

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
          <DrawerHeader>Attraction Locations</DrawerHeader>
          <DrawerBody p={0}>
            <RestaurantMap 
              restaurants={attractions.map(attraction => ({
                ...attraction,
                cuisine: attraction.category,
                isOpenNow: attraction.isOpenNow,
              }))}
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
          <DrawerHeader>Filter Attractions</DrawerHeader>
          <DrawerBody>
            <VStack spacing={6}>
              <Box width="100%">
                <Text mb={2}>Category</Text>
                <Select
                  value={filters.category || 'all'}
                  onChange={(e) => updateFilters({ category: e.target.value })}
                >
                  {ATTRACTION_CATEGORIES.map((category) => (
                    <option key={category} value={category.toLowerCase().replace(/ & /g, '_')}>
                      {category}
                    </option>
                  ))}
                </Select>
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