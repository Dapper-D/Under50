import {
  Box,
  Image,
  Badge,
  Text,
  Stack,
  Heading,
  Button,
  HStack,
  Icon,
  Flex,
  useToken,
  useDisclosure,
  VStack,
  Link,
  Skeleton,
} from '@chakra-ui/react'
import { FaStar, FaMapMarkerAlt, FaDirections, FaPhone, FaUtensils } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import ColorThief from 'colorthief'
import RestaurantDetails from './RestaurantDetails'
import { Restaurant } from '@/app/types'
import NextImage from 'next/image'

type RestaurantCardProps = Omit<Restaurant, 'id' | 'location' | 'menu' | 'dietary'>

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

function getContrastColor(r: number, g: number, b: number): string {
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#2C3E50' : '#FFFFFF'
}

function getAccentColor(dominantColor: [number, number, number]): string {
  // Convert to HSL to adjust luminance and saturation
  const [r, g, b] = dominantColor
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
      default: h = 0
    }
    h /= 6
  }

  // Adjust saturation and lightness for better visual appeal
  s = Math.min(1, s * 1.2)
  l = Math.max(0.3, Math.min(0.7, l))

  // Convert back to RGB
  function hue2rgb(p: number, q: number, t: number) {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const r2 = Math.round(hue2rgb(p, q, h + 1/3) * 255)
  const g2 = Math.round(hue2rgb(p, q, h) * 255)
  const b2 = Math.round(hue2rgb(p, q, h - 1/3) * 255)

  return rgbToHex(r2, g2, b2)
}

export default function RestaurantCard(props: RestaurantCardProps) {
  const [accentColor, setAccentColor] = useState<string>('')
  const [textColor, setTextColor] = useState<string>('#2C3E50')
  const [gray500] = useToken('colors', ['gray.500'])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    const img = document.createElement('img')
    img.crossOrigin = 'Anonymous'
    img.src = props.image

    const handleError = () => {
      console.error('Error loading image for color extraction')
      setAccentColor('#E53E3E') // Fallback to red
      setTextColor('#FFFFFF')
    }
    
    img.onload = () => {
      const colorThief = new ColorThief()
      try {
        // Create a canvas to ensure the image is properly loaded
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.width = img.width
        canvas.height = img.height
        context?.drawImage(img, 0, 0)
        
        const dominantColor = colorThief.getColor(img) as [number, number, number]
        if (!dominantColor || dominantColor.some(c => typeof c !== 'number')) {
          handleError()
          return
        }
        
        const accent = getAccentColor(dominantColor)
        setAccentColor(accent)
        setTextColor(getContrastColor(...dominantColor))
      } catch (error) {
        console.error('Error extracting color:', error)
        handleError()
      }
    }

    img.onerror = handleError
  }, [props.image])

  const handleCall = () => {
    if (props.phoneNumber) {
      // Clean the phone number to only include digits
      const cleanNumber = props.phoneNumber.replace(/\D/g, '');
      window.location.href = `tel:${cleanNumber}`;
    }
  };

  const handleGetDirections = () => {
    // Open Google Maps with directions to the restaurant
    const destination = encodeURIComponent(props.name + ' ' + (props.address || ''));
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
      '_blank'
    );
  };

  return (
    <>
      <Box
        maxW="sm"
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        bg="card.background"
        borderColor="card.border"
        _hover={{ 
          transform: 'translateY(-4px)', 
          transition: 'all 0.2s',
          bg: 'card.hover',
          boxShadow: `0 4px 20px ${accentColor}20`,
          cursor: 'pointer'
        }}
        width="100%"
        onClick={onOpen}
      >
        <Box position="relative" height="200px">
          <Skeleton isLoaded={imageLoaded} height="200px">
            <NextImage
              src={props.image}
              alt={props.name}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
          </Skeleton>
        </Box>

        <Box p={{ base: 4, md: 6 }}>
          <Box display="flex" alignItems="baseline" flexWrap="wrap" gap={2}>
            <Badge
              bg={accentColor}
              color={textColor}
              borderRadius="full"
              px={2}
              fontSize={{ base: "xs", md: "sm" }}
            >
              {props.isOpenNow ? 'Open Now' : 'Closed'}
            </Badge>
            <Badge
              bg={`${accentColor}CC`}
              color={textColor}
              borderRadius="full"
              px={2}
              fontSize={{ base: "xs", md: "sm" }}
            >
              ${props.averagePrice} avg
            </Badge>
          </Box>

          <Heading
            mt={2}
            fontSize={{ base: "lg", md: "xl" }}
            fontWeight="semibold"
            lineHeight="tight"
            noOfLines={2}
          >
            {props.name}
          </Heading>

          <Text color="gray.500" fontSize={{ base: "xs", md: "sm" }}>
            {props.cuisine}
          </Text>

          <Stack spacing={1} mt={2}>
            <HStack>
              <Icon as={FaStar} color={accentColor} boxSize={{ base: 3, md: 4 }} />
              <Text fontSize={{ base: "sm", md: "md" }}>{props.rating.toFixed(1)}</Text>
            </HStack>

            <HStack>
              <Icon as={FaMapMarkerAlt} color={gray500} boxSize={{ base: 3, md: 4 }} />
              <Text color="gray.500" fontSize={{ base: "xs", md: "sm" }}>
                {props.distance}
              </Text>
            </HStack>
          </Stack>

          <Flex mt={{ base: 3, md: 4 }} justify="space-between" gap={2}>
            <Button 
              bg={accentColor}
              color={textColor}
              size={{ base: "xs", md: "sm" }}
              _hover={{
                bg: `${accentColor}CC`
              }}
              flex={1}
              leftIcon={<Icon as={FaDirections} />}
              onClick={(e) => {
                e.stopPropagation(); // Prevent modal from opening
                handleGetDirections();
              }}
            >
              Directions
            </Button>
            <Button 
              variant="outline" 
              borderColor={accentColor}
              color={accentColor}
              size={{ base: "xs", md: "sm" }}
              _hover={{
                bg: `${accentColor}11`
              }}
              flex={1}
              onClick={(e) => {
                e.stopPropagation(); // Prevent modal from opening
                handleCall();
              }}
              isDisabled={!props.phoneNumber}
            >
              Call
            </Button>
          </Flex>
        </Box>
      </Box>

      <RestaurantDetails
        restaurant={{
          ...props,
          id: props.name, // Using name as id since we don't have the actual id
          location: {
            latitude: 0,
            longitude: 0
          }
        }}
        isOpen={isOpen}
        onClose={onClose}
      />
    </>
  )
} 