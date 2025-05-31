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
} from '@chakra-ui/react'
import { FaStar, FaMapMarkerAlt, FaDirections, FaClock, FaTicketAlt } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import ColorThief from 'colorthief'
import NextImage from 'next/image'
import { Attraction } from '@/app/types'

type AttractionCardProps = Omit<Attraction, 'id' | 'location'>

export default function AttractionCard(props: AttractionCardProps) {
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
      setAccentColor('#3182CE') // Fallback to blue
      setTextColor('#FFFFFF')
    }
    
    img.onload = () => {
      const colorThief = new ColorThief()
      try {
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
        
        setAccentColor(`rgb(${dominantColor.join(',')})`)
        // Calculate contrast color for text
        const brightness = (dominantColor[0] * 299 + dominantColor[1] * 587 + dominantColor[2] * 114) / 1000
        setTextColor(brightness > 128 ? '#2C3E50' : '#FFFFFF')
      } catch (error) {
        console.error('Error extracting color:', error)
        handleError()
      }
    }

    img.onerror = handleError
  }, [props.image])

  const handleGetDirections = () => {
    const destination = encodeURIComponent(props.name + ' ' + (props.address || ''))
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
      '_blank'
    )
  }

  return (
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
      </Box>

      <Box p={4}>
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
          {props.ticketPrice && (
            <Badge
              bg={`${accentColor}CC`}
              color={textColor}
              borderRadius="full"
              px={2}
              fontSize={{ base: "xs", md: "sm" }}
            >
              ${props.ticketPrice} entry
            </Badge>
          )}
          <Badge
            bg={`${accentColor}99`}
            color={textColor}
            borderRadius="full"
            px={2}
            fontSize={{ base: "xs", md: "sm" }}
          >
            {props.category}
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

        <Text color="gray.500" fontSize={{ base: "xs", md: "sm" }} noOfLines={2} mt={1}>
          {props.description}
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

          {props.suggestedDuration && (
            <HStack>
              <Icon as={FaClock} color={gray500} boxSize={{ base: 3, md: 4 }} />
              <Text color="gray.500" fontSize={{ base: "xs", md: "sm" }}>
                {props.suggestedDuration}
              </Text>
            </HStack>
          )}
        </Stack>

        <Flex gap={2} mt={4}>
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
              e.stopPropagation()
              handleGetDirections()
            }}
          >
            Directions
          </Button>
          {props.website && (
            <Button 
              variant="outline" 
              borderColor={accentColor}
              color={accentColor}
              size={{ base: "xs", md: "sm" }}
              _hover={{
                bg: `${accentColor}11`
              }}
              flex={1}
              leftIcon={<Icon as={FaTicketAlt} />}
              onClick={(e) => {
                e.stopPropagation()
                window.open(props.website, '_blank')
              }}
            >
              Book
            </Button>
          )}
        </Flex>
      </Box>
    </Box>
  )
} 