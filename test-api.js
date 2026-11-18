// Quick check that your server key works with Places API (New).
// Run: node test-api.js   (reads .env.local, then .env)
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
if (!apiKey) {
  console.error('Error: GOOGLE_PLACES_API_KEY is not set in .env.local');
  process.exit(1);
}

// Downtown Vancouver
const body = {
  includedTypes: ['restaurant'],
  maxResultCount: 3,
  locationRestriction: { circle: { center: { latitude: 49.2827, longitude: -123.1207 }, radius: 2000 } }
};

fetch('https://places.googleapis.com/v1/places:searchNearby', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': 'places.displayName,places.rating'
  },
  body: JSON.stringify(body)
})
  .then(async (res) => {
    const data = await res.json();
    if (!res.ok) {
      console.error(`Failed (HTTP ${res.status}): ${data.error?.message || JSON.stringify(data)}`);
      console.error('Check that "Places API (New)" is enabled and the key is allowed to use it.');
      process.exit(1);
    }
    console.log('Success! Places API (New) is working. Nearby restaurants:');
    (data.places || []).forEach((p) => console.log(`- ${p.displayName?.text} (Rating: ${p.rating ?? 'N/A'})`));
  })
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
