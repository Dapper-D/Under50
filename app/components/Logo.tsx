import { Box, Text } from '@chakra-ui/react'

const Logo = () => {
  return (
    <Box 
      display="flex" 
      alignItems="center" 
      gap={2}
      role="group"
    >
      <Box 
        as="svg" 
        width="40px" 
        height="40px" 
        viewBox="0 0 24 24"
        transition="transform 0.3s ease"
        _groupHover={{
          transform: "scale(1.05)"
        }}
      >
        <defs>
          <linearGradient id="bowlGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FF4B2B' }} />
            <stop offset="100%" style={{ stopColor: '#FFB347' }} />
          </linearGradient>
          <filter id="steam">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.3" />
          </filter>
        </defs>

        {/* Bowl Shape */}
        <Box
          as="g"
          transform="translate(0,0)"
          transition="transform 0.4s ease"
          _groupHover={{
            transform: "translate(0,-2px) rotate(-20deg)"
          }}
        >
          <path
            d="M4 16.5C4 16.5 4 13 7 11.5C10 10 14 10 17 11.5C20 13 20 16.5 20 16.5"
            fill="url(#bowlGradient)"
            stroke="#FF4B2B"
            strokeWidth="1"
            strokeLinecap="round"
            style={{
              transformOrigin: 'center'
            }}
          />

          {/* Bowl Base */}
          <path
            d="M3 16.5H21"
            stroke="#FF4B2B"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </Box>

        {/* Steam - multiple paths for natural effect */}
        <g filter="url(#steam)">
          <path
            d="M10 11.5C10 11.5 12 8 14 11.5"
            stroke="white"
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity="0.6"
          >
            <animate
              attributeName="d"
              dur="2.5s"
              repeatCount="indefinite"
              values="M10 11.5C10 11.5 12 8 14 11.5;
                      M10.5 11.5C10.5 11.5 12 6 13.5 11.5;
                      M10 11.5C10 11.5 12 8 14 11.5"
            />
            <animate
              attributeName="opacity"
              dur="2.5s"
              repeatCount="indefinite"
              values="0.6;0.2;0.6"
            />
          </path>
          <path
            d="M12 11C12 11 13 7 14 11"
            stroke="white"
            strokeWidth="0.6"
            strokeLinecap="round"
            opacity="0.4"
          >
            <animate
              attributeName="d"
              dur="3s"
              repeatCount="indefinite"
              values="M12 11C12 11 13 7 14 11;
                      M12 11C12 11 13.5 5 14.5 11;
                      M12 11C12 11 13 7 14 11"
            />
            <animate
              attributeName="opacity"
              dur="3s"
              repeatCount="indefinite"
              values="0.4;0.1;0.4"
            />
          </path>
          <path
            d="M9 11.5C9 11.5 11 8.5 13 11.5"
            stroke="white"
            strokeWidth="0.7"
            strokeLinecap="round"
            opacity="0.5"
          >
            <animate
              attributeName="d"
              dur="3.5s"
              repeatCount="indefinite"
              values="M9 11.5C9 11.5 11 8.5 13 11.5;
                      M9.5 11.5C9.5 11.5 11.5 6.5 13.5 11.5;
                      M9 11.5C9 11.5 11 8.5 13 11.5"
            />
            <animate
              attributeName="opacity"
              dur="3.5s"
              repeatCount="indefinite"
              values="0.5;0.15;0.5"
            />
          </path>
        </g>
      </Box>
      
      <Text
        fontSize="3xl"
        fontWeight="extrabold"
        fontFamily="heading"
        bgGradient="linear(to-r, #FF4B2B, #FFB347)"
        bgClip="text"
        letterSpacing="tight"
        transition="all 0.3s ease"
        _groupHover={{
          transform: "scale(1.05)"
        }}
      >
        Under 50
      </Text>
    </Box>
  )
}

export default Logo 