import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  Image,
  Heading,
  Divider,
  Icon,
  SimpleGrid,
  Spinner,
  Button,
  Stack,
} from '@chakra-ui/react'
import { FaStar, FaMapMarkerAlt, FaUtensils, FaGlobe } from 'react-icons/fa'
import { Restaurant } from '@/app/types'
import { useState, useEffect } from 'react'

interface RestaurantDetailsProps {
  restaurant: Restaurant
  isOpen: boolean
  onClose: () => void
}

interface PlaceLinks {
  googleMapsUrl?: string
  website?: string
}

// Google Maps page for a place. Google's Places API doesn't return menu items,
// so "View menu" opens the place on Google Maps, where its Menu tab and menu
// photos live. This URL works without an API call; the details request below
// swaps in Google's own link when it arrives.
const mapsUrlFor = (name: string, placeId?: string | number) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}` +
  (placeId ? `&query_place_id=${encodeURIComponent(String(placeId))}` : '')

export default function RestaurantDetails({ restaurant, isOpen, onClose }: RestaurantDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<PlaceLinks>({});

  useEffect(() => {
    async function fetchLinks() {
      if (!isOpen || !restaurant.id) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/restaurants/${encodeURIComponent(String(restaurant.id))}/details`);
        if (!response.ok) throw new Error('Failed to fetch details');
        const data = await response.json();
        setLinks({ googleMapsUrl: data.googleMapsUrl, website: data.website });
      } catch (error) {
        console.error('Error fetching restaurant links:', error);
        setLinks({});
      } finally {
        setLoading(false);
      }
    }

    fetchLinks();
  }, [isOpen, restaurant.id]);

  const menuHref = links.googleMapsUrl || mapsUrlFor(restaurant.name, restaurant.id);
  const websiteHref = links.website || restaurant.website || restaurant.menuUrl;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <Heading size="lg">{restaurant.name}</Heading>
            <HStack spacing={2}>
              <Badge colorScheme={restaurant.isOpenNow ? 'green' : 'red'}>
                {restaurant.isOpenNow ? 'Open Now' : 'Closed'}
              </Badge>
              <HStack>
                <Icon as={FaStar} color="yellow.400" />
                <Text>{restaurant.rating.toFixed(1)}</Text>
              </HStack>
              <HStack>
                <Icon as={FaMapMarkerAlt} color="gray.500" />
                <Text fontSize="sm" color="gray.600">{restaurant.distance}</Text>
              </HStack>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            {/* Main Image */}
            <Box borderRadius="md" overflow="hidden">
              <Image
                src={restaurant.image}
                alt={restaurant.name}
                width="100%"
                height="200px"
                objectFit="cover"
              />
            </Box>

            <Divider />

            {/* Menu Section */}
            <Box>
              <Heading size="md" mb={2}>Menu</Heading>
              <Text color="gray.600" fontSize="sm" mb={4}>
                See the menu and menu photos on Google Maps, or on the restaurant&apos;s own website.
              </Text>
              <Stack direction={{ base: 'column', sm: 'row' }} spacing={3}>
                <Button
                  as="a"
                  href={menuHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  colorScheme="orange"
                  leftIcon={<Icon as={FaUtensils} />}
                  flex={1}
                >
                  View menu
                </Button>
                {websiteHref ? (
                  <Button
                    as="a"
                    href={websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outline"
                    colorScheme="orange"
                    leftIcon={<Icon as={FaGlobe} />}
                    flex={1}
                  >
                    Website
                  </Button>
                ) : loading ? (
                  <Box display="flex" alignItems="center" justifyContent="center" flex={1}>
                    <Spinner size="sm" />
                  </Box>
                ) : null}
              </Stack>
            </Box>

            {/* Cuisine and Price Range */}
            <SimpleGrid columns={2} spacing={4}>
              <Box>
                <Text fontWeight="bold">Cuisine</Text>
                <Text color="gray.600">{restaurant.cuisine}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Price Range</Text>
                <Text color="gray.600">${restaurant.averagePrice} average per person</Text>
              </Box>
            </SimpleGrid>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
} 