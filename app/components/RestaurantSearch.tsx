import { useState } from 'react';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Button,
} from '@chakra-ui/react';
import { FaSearch } from 'react-icons/fa';

interface RestaurantSearchProps {
  userLocation: { lat: number; lng: number } | null;
  onSearch: (query: string) => void;
}

export default function RestaurantSearch({ userLocation, onSearch }: RestaurantSearchProps) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <Box position="relative" width="100%">
      <InputGroup size={{ base: "md", md: "lg" }}>
        <InputLeftElement pointerEvents="none" h="100%">
          <FaSearch color="gray.300" />
        </InputLeftElement>
        <Input
          placeholder="Search for restaurants (e.g., sushi, mexican, italian)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          bg="white"
          color="gray.800"
          borderRadius="md"
          isDisabled={!userLocation}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          _placeholder={{ color: 'gray.400' }}
          fontSize={{ base: "sm", md: "md" }}
          h={{ base: "40px", md: "48px" }}
        />
        <InputRightElement width={{ base: "4rem", md: "4.5rem" }} h="100%">
          <Button
            h={{ base: "1.5rem", md: "1.75rem" }}
            size="sm"
            onClick={handleSearch}
            colorScheme="red"
          >
            Search
          </Button>
        </InputRightElement>
      </InputGroup>
    </Box>
  );
} 