import { Box, Text } from '@chakra-ui/react'

const Logo = () => {
  return (
    <Box 
      display="flex" 
      alignItems="center" 
      gap={2}
      role="group"
    >
      {/* Compass icon */}
      <Box 
        as="svg" 
        width="40px" 
        height="40px" 
        viewBox="0 0 24 24"
        transition="transform 0.3s ease, filter 0.3s ease"
        _groupHover={{
          transform: "rotate(45deg) scale(1.05)",
          filter: "drop-shadow(0 0 8px #4299E1)"
        }}
      >
        <defs>
          <linearGradient id="compassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#4299E1' }} />
            <stop offset="100%" style={{ stopColor: '#2B6CB0' }} />
          </linearGradient>
        </defs>
        {/* Compass Circle */}
        <circle 
          cx="12" 
          cy="12" 
          r="10" 
          fill="url(#compassGradient)"
          stroke="white"
          strokeWidth="1"
        />
        {/* Compass Needle */}
        <path
          d="M12 5L14 14H10L12 5Z"
          fill="#FF4444"
        />
        <path
          d="M12 19L10 10H14L12 19Z"
          fill="white"
        />
      </Box>
      
      <Text
        fontSize="3xl"
        fontWeight="extrabold"
        fontFamily="heading"
        bgGradient="linear(to-r, #4299E1, #2B6CB0)"
        bgClip="text"
        letterSpacing="tight"
        transition="all 0.3s ease"
        _groupHover={{
          transform: "scale(1.05)",
          textShadow: "0 0 10px rgba(66, 153, 225, 0.5)"
        }}
      >
        AdventureGuide
      </Text>
    </Box>
  )
}

export default Logo 