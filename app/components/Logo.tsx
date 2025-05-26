import { Box, Text } from '@chakra-ui/react'

const Logo = () => {
  return (
    <Box 
      display="flex" 
      alignItems="center" 
      gap={2}
      role="group"
    >
      {/* Steaming Bowl icon */}
      <Box 
        as="svg" 
        width="40px" 
        height="40px" 
        viewBox="0 0 24 24"
        transition="transform 0.3s ease, filter 0.3s ease"
        _groupHover={{
          transform: "scale(1.05)",
          filter: "drop-shadow(0 0 8px #FFA500)"
        }}
      >
        {/* Steam - using a gradient from light yellow to orange */}
        <defs>
          <linearGradient id="steamGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#FFD700' }} />
            <stop offset="100%" style={{ stopColor: '#FFA500' }} />
          </linearGradient>
        </defs>
        <g>
          <path 
            d="M8.5 5C8.5 5 9.5 7 9.5 8C9.5 9.1 8.6 10 7.5 10C6.4 10 5.5 9.1 5.5 8C5.5 7 6.5 5 6.5 5C6.8 5.3 7.2 5.5 7.5 5.5C7.8 5.5 8.2 5.3 8.5 5Z"
            fill="url(#steamGradient)"
            opacity="0.9"
            style={{
              transformOrigin: "center",
              animation: "steam 2s ease-in-out infinite"
            }}
          />
          <path 
            d="M14.5 4C14.5 4 16 6.6 16 8C16 9.7 14.7 11 13 11C11.3 11 10 9.7 10 8C10 6.6 11.5 4 11.5 4C12.1 4.4 12.5 4.7 13 4.7C13.5 4.7 13.9 4.4 14.5 4Z"
            fill="url(#steamGradient)"
            opacity="0.9"
            style={{
              transformOrigin: "center",
              animation: "steam 2s ease-in-out infinite 0.3s"
            }}
          />
          <path 
            d="M18.5 6C18.5 6 19.5 8 19.5 9C19.5 10.1 18.6 11 17.5 11C16.4 11 15.5 10.1 15.5 9C15.5 8 16.5 6 16.5 6C16.8 6.3 17.2 6.5 17.5 6.5C17.8 6.5 18.2 6.3 18.5 6Z"
            fill="url(#steamGradient)"
            opacity="0.9"
            style={{
              transformOrigin: "center",
              animation: "steam 2s ease-in-out infinite 0.6s"
            }}
          />
        </g>
        {/* Bowl - using a gradient from orange to deep red */}
        <defs>
          <linearGradient id="bowlGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FFA500' }} />
            <stop offset="100%" style={{ stopColor: '#FF4500' }} />
          </linearGradient>
        </defs>
        <path 
          d="M20 13H4C4 13 2 18.5 2 19C2 20.7 6.5 21 12 21C17.5 21 22 20.7 22 19C22 18.5 20 13 20 13ZM12 19C7.6 19 4 18.8 4 18.5C4 18.2 7.6 18 12 18C16.4 18 20 18.2 20 18.5C20 18.8 16.4 19 12 19Z"
          fill="url(#bowlGradient)"
        />
      </Box>
      <Text
        fontSize="3xl"
        fontWeight="extrabold"
        fontFamily="heading"
        bgGradient="linear(to-r, #FFD700, #FF4500)"
        bgClip="text"
        letterSpacing="tight"
        transition="all 0.3s ease"
        _groupHover={{
          transform: "scale(1.05)",
          textShadow: "0 0 10px rgba(255, 165, 0, 0.5)"
        }}
      >
        Under50
      </Text>
      <style jsx global>{`
        @keyframes steam {
          0% { opacity: 0.7; transform: translateY(0); }
          50% { opacity: 0.9; transform: translateY(-2px); }
          100% { opacity: 0.7; transform: translateY(0); }
        }
      `}</style>
    </Box>
  )
}

export default Logo 