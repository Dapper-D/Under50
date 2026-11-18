live link at https://under50.vercel.app/
# Under50 Restaurant Finder

A web application to find affordable restaurants near you, with prices under $50 per person on average.

# Tech Stack
Frontend: Next.js 14, React 18, TypeScript
UI & Styling: Chakra UI, Emotion, Framer Motion
Maps & Location: Google Maps JavaScript API, Google Places API (New)
Data Fetching: SWR, Axios
Backend: Next.js API Routes / Server-side functionality
Database: PostgreSQL
ORM: Prisma
Deployment: Vercel
Tooling: npm, ESLint

## Environment Setup

Copy `.env.example` to `.env.local` in the project root (next to `package.json`) and fill it in. `.env.local` is git-ignored; never commit it.

```env
# Browser key: shows the map
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Server key: restaurant search, details, photos, attractions and activities
GOOGLE_PLACES_API_KEY=

# PostgreSQL connection string used by Prisma
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
```

`GOOGLE_MAPS_API_KEY` is still read as a fallback for the server key, so older setups keep working.

### Get the Google keys

The app uses **Places API (New)**. The legacy Places API can't be enabled on Google Cloud projects created after March 1, 2025.

1. Open the [Google Cloud Console](https://console.cloud.google.com/), create or pick a project, and turn on billing.
2. Under **APIs & Services > Library**, enable **Maps JavaScript API** and **Places API (New)**.
3. Under **APIs & Services > Credentials**, choose **Create credentials > API key** twice, once for each key below.
4. Restrict each key:
   - **Browser key** (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`). Application restriction: Websites, with `https://under50.vercel.app/*` and `http://localhost:3000/*`. API restriction: Maps JavaScript API.
   - **Server key** (`GOOGLE_PLACES_API_KEY`). API restriction: Places API (New). Vercel has no fixed outgoing IP, so don't add an IP restriction there.
5. Check the server key with `node test-api.js`. It should print three nearby restaurants.

### Deploy on Vercel

Add the same three variables under **Project > Settings > Environment Variables** for Production (and Preview if you test pull requests), then redeploy. `NEXT_PUBLIC_` values are built into the page, so a change only applies after a new deployment.

### Database Setup
1. Install PostgreSQL locally or use a cloud provider
2. Create a new database
3. Update the `DATABASE_URL` with your database credentials
4. Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`

### Optional Environment Variables
```env
# Region used to bias searches (default: ca)
REGION_CODE=ca
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
