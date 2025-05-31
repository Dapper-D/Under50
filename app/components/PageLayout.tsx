import {
  Box,
  Container,
  Flex,
  Button,
  HStack,
  Heading,
  Text,
  VStack,
} from '@chakra-ui/react'
import Link from 'next/link'
import Logo from './Logo'
import RestaurantSearch from './RestaurantSearch'

interface PageLayoutProps {
  title: string
  description: string
  backgroundImage: string
  children: React.ReactNode
  userLocation: { lat: number; lng: number } | null
  onSearch: (query: string) => void
}

export default function PageLayout({
  title,
  description,
  backgroundImage,
  children,
  userLocation,
  onSearch
}: PageLayoutProps) {
  return (
    <Box as="main">
      {/* Hero Section */}
      <Box
        position="relative"
        height={{ base: "400px", md: "500px" }}
        backgroundImage={`url('${backgroundImage}')`}
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
              <Link href="/" passHref legacyBehavior>
                <Button as="a" variant="ghost" color="white" size={{ base: "sm", md: "md" }}>Restaurants</Button>
              </Link>
              <Link href="/attractions" passHref legacyBehavior>
                <Button as="a" variant="ghost" color="white" size={{ base: "sm", md: "md" }}>Attractions</Button>
              </Link>
              <Link href="/activities" passHref legacyBehavior>
                <Button as="a" variant="ghost" color="white" size={{ base: "sm", md: "md" }}>Activities</Button>
              </Link>
            </HStack>
          </Flex>

          {/* Hero Content */}
          <VStack
            spacing={4}
            pt={{ base: 16, md: 24 }}
            color="white"
            textAlign="center"
          >
            <Heading size={{ base: "xl", md: "2xl" }}>{title}</Heading>
            <Text fontSize={{ base: "lg", md: "xl" }} maxW="container.md">
              {description}
            </Text>
            <Box width="100%" maxW="container.md" px={4}>
              <RestaurantSearch
                userLocation={userLocation}
                onSearch={onSearch}
              />
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" py={8}>
        {children}
      </Container>
    </Box>
  )
} 