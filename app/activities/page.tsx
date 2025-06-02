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
  Stack,
  Radio,
  RadioGroup,
} from '@chakra-ui/react'
import { FaMapMarkedAlt, FaFilter } from 'react-icons/fa'
import { useState } from 'react'
import ActivityCard from '../components/ActivityCard'
import RestaurantMap from '../components/RestaurantMap' // We'll reuse this for now
import { useActivities } from '../hooks/useActivities'
import RestaurantSearch from '../components/RestaurantSearch' // We'll reuse this for now
import Logo from '../components/Logo'
import Link from 'next/link'
import PageLayout from '../components/PageLayout'

const ACTIVITY_CATEGORIES = [
  'All Activities',
  'Amusement Parks',
  'Aquariums',
  'Bowling Alleys',
  'Casinos',
  'Gyms',
  'Movie Theaters',
  'Parks',
  'Spas',
  'Stadiums',
  'Zoos'
]

const DIFFICULTY_LEVELS = ['Easy', 'Moderate', 'Challenging']

export default function ActivitiesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { isOpen: isMapOpen, onOpen: onMapOpen, onClose: onMapClose } = useDisclosure()
  const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure()
  const {
    activities,
    loading,
    error,
    filters,
    updateFilters,
    location
  } = useActivities()

  // Transform location to match map component's expected format
  const transformedLocation = location ? {
    lat: location.latitude,
    lng: location.longitude,
    latitude: location.latitude,
    longitude: location.longitude
  } : null;

  return (
    <PageLayout
      title="Find Exciting Activities"
      description="Discover fun and engaging activities for everyone"
      backgroundImage="https://images.unsplash.com/photo-1471967183320-ee018f6e114a"
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
        <Heading size="lg">Popular Activities Near You</Heading>
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
          <Text>Finding activities near you...</Text>
        </Flex>
      ) : activities.length === 0 ? (
        <Alert status="info" mb={6}>
          <AlertIcon />
          No activities found. Try adjusting your filters or search criteria.
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
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              {...activity}
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
          <DrawerHeader>Activity Locations</DrawerHeader>
          <DrawerBody p={0}>
            <RestaurantMap 
              restaurants={activities.map(activity => ({
                ...activity,
                cuisine: activity.category,
                isOpenNow: activity.isAvailable,
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
          <DrawerHeader>Filter Activities</DrawerHeader>
          <DrawerBody>
            <VStack spacing={6}>
              <Box width="100%">
                <Text mb={2}>Category</Text>
                <Select
                  value={filters.category || 'all'}
                  onChange={(e) => updateFilters({ category: e.target.value })}
                >
                  {ACTIVITY_CATEGORIES.map((category) => (
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
                <Text mb={2}>Difficulty Level</Text>
                <RadioGroup
                  value={filters.difficulty || 'all'}
                  onChange={(value) => updateFilters({ difficulty: value === 'all' ? undefined : value as 'Easy' | 'Moderate' | 'Challenging' })}
                >
                  <Stack>
                    <Radio value="all">All Levels</Radio>
                    {DIFFICULTY_LEVELS.map((level) => (
                      <Radio key={level} value={level.toLowerCase()}>
                        {level}
                      </Radio>
                    ))}
                  </Stack>
                </RadioGroup>
              </Box>

              <Box width="100%">
                <Checkbox
                  isChecked={filters.isAvailable}
                  onChange={(e) => updateFilters({ isAvailable: e.target.checked })}
                >
                  Available Now
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