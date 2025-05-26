'use client'

import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/500.css'
import '@fontsource/montserrat/600.css'
import '@fontsource/montserrat/700.css'
import '@fontsource/open-sans/400.css'
import '@fontsource/open-sans/600.css'

const theme = extendTheme({
  colors: {
    primary: {
      500: '#C0392B', // Deep Red
    },
    accent: {
      500: '#F1C40F', // Gold
    },
    text: {
      500: '#2C3E50', // Charcoal
    },
    background: {
      500: '#FAFAF9', // Warm light background
    },
    card: {
      background: '#FFFFFF',
      border: '#E2E8F0',
      hover: '#F7FAFC'
    }
  },
  fonts: {
    heading: `'Montserrat', sans-serif`,
    body: `'Open Sans', sans-serif`,
  },
  styles: {
    global: {
      body: {
        bg: 'background.500',
        color: 'text.500',
      }
    }
  }
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ChakraProvider theme={theme}>
          {children}
        </ChakraProvider>
      </body>
    </html>
  )
} 