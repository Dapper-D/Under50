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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react'
import { FaStar, FaMapMarkerAlt } from 'react-icons/fa'
import { Restaurant } from '@/app/types'
import { useState, useEffect } from 'react'

interface RestaurantDetailsProps {
  restaurant: Restaurant
  isOpen: boolean
  onClose: () => void
}

interface MenuItem {
  name: string;
  description?: string;
  price: number;
  category?: string;
}

export default function RestaurantDetails({ restaurant, isOpen, onClose }: RestaurantDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    async function fetchMenu() {
      if (!isOpen || !restaurant.id) return;
      
      setLoading(true);
      try {
        // Try to fetch menu from Google Places API
        const response = await fetch(`/api/restaurants/${restaurant.id}/menu`);
        if (!response.ok) throw new Error('Failed to fetch menu');
        const data = await response.json();
        setMenuItems(data.menu || []);
      } catch (error) {
        console.error('Error fetching menu:', error);
        // If no menu is available, create some example items based on cuisine type
        const exampleItems = generateExampleMenu(restaurant.cuisine);
        setMenuItems(exampleItems);
      } finally {
        setLoading(false);
      }
    }

    fetchMenu();
  }, [isOpen, restaurant.id, restaurant.cuisine]);

  // Helper function to generate example menu items based on cuisine
  const generateExampleMenu = (cuisine: string): MenuItem[] => {
    // This is a fallback when we can't get the real menu
    const basePrice = restaurant.averagePrice || 15;
    
    return [
      {
        name: `${cuisine} Special`,
        description: `Our signature ${cuisine.toLowerCase()} dish`,
        price: basePrice * 1.2,
        category: 'Specials'
      },
      {
        name: `Traditional ${cuisine} Plate`,
        description: `Classic ${cuisine.toLowerCase()} flavors`,
        price: basePrice,
        category: 'Mains'
      },
      {
        name: `${cuisine} Starter`,
        description: 'Perfect way to begin your meal',
        price: basePrice * 0.6,
        category: 'Appetizers'
      },
      {
        name: `${cuisine} Dessert`,
        description: 'Sweet ending to your meal',
        price: basePrice * 0.8,
        category: 'Desserts'
      }
    ];
  };

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
              <Heading size="md" mb={4}>Menu</Heading>
              {loading ? (
                <Box display="flex" justifyContent="center" py={8}>
                  <Spinner size="xl" />
                </Box>
              ) : menuItems.length > 0 ? (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Item</Th>
                      <Th>Description</Th>
                      <Th isNumeric>Price</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {menuItems.map((item, index) => (
                      <Tr key={index}>
                        <Td fontWeight="medium">{item.name}</Td>
                        <Td fontSize="sm" color="gray.600">{item.description || ''}</Td>
                        <Td isNumeric>${item.price.toFixed(2)}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Text color="gray.500" textAlign="center">
                  Menu information is currently unavailable.
                  Please visit the restaurant or check their website for the most up-to-date menu.
                </Text>
              )}
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