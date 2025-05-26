live link at https://under50.vercel.app/
# Under50 Restaurant Finder

A web application to find affordable restaurants near you, with prices under $50 per person on average.

## Environment Setup

Before running the application, you need to set up the following environment variables. Create a `.env.local` file in the root directory with the following variables:

### Required Environment Variables

```env
# Google Maps & Places API Configuration
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# Database Configuration
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

### How to Obtain API Keys

#### Google Maps & Places API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Maps JavaScript API
   - Google Places API
   - Google Geocoding API
4. Go to the Credentials page
5. Create a new API key
6. Restrict the API key:
   - For `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Restrict to Maps JavaScript API and your website domain
   - For `GOOGLE_PLACES_API_KEY`: Restrict to Places API and your server IP

#### Database Setup
1. Install PostgreSQL locally or use a cloud provider
2. Create a new database
3. Update the `DATABASE_URL` with your database credentials
4. Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`

### Optional Environment Variables
```env
# Set your preferred region for restaurant searches (default: ca)
REGION_CODE=ca

# Configure rate limiting (defaults shown)
MAX_REQUESTS_PER_MINUTE=60
CACHE_DURATION_MINUTES=5
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd under50
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your API keys and configuration
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

## Features

- Search for restaurants by cuisine, price range, and dietary preferences
- Filter results by distance and current opening status
- View restaurant details including ratings, photos, and contact information
- Get directions to restaurants
- Mobile-friendly interface
- Real-time updates based on your location

## Performance Optimizations

The application includes several optimizations:
- Client-side caching of restaurant data
- Image lazy loading and optimization
- Debounced search and filter operations
- Efficient database queries with proper indexing
- Rate limiting for external API calls

## Security Considerations

1. Always restrict your API keys:
   - Set up HTTP referrer restrictions
   - Enable application restrictions
   - Monitor API usage regularly

2. Database security:
   - Use strong passwords
   - Enable SSL connections
   - Restrict database access to necessary IPs

## Troubleshooting

Common issues and solutions:

1. API Key Issues:
   - Ensure all required APIs are enabled in Google Cloud Console
   - Check API key restrictions
   - Verify correct environment variable names

2. Database Connection Issues:
   - Verify PostgreSQL is running
   - Check database credentials
   - Ensure database exists and is accessible

3. Performance Issues:
   - Check browser console for errors
   - Verify API rate limits
   - Monitor database query performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
