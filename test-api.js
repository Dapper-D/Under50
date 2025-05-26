require('dotenv').config();
const https = require('https');

const apiKey = process.env.GOOGLE_PLACES_API_KEY;
if (!apiKey) {
  console.error('Error: GOOGLE_PLACES_API_KEY not found in environment variables');
  process.exit(1);
}

// Downtown Vancouver coordinates
const location = '49.2827,-123.1207';
const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=2000&type=restaurant&key=${apiKey}`;

console.log('Making request to:', url.replace(apiKey, 'YOUR_API_KEY'));

https.get(url, (resp) => {
  let data = '';

  resp.on('data', (chunk) => {
    data += chunk;
  });

  resp.on('end', () => {
    const response = JSON.parse(data);
    console.log('API Status:', response.status);
    if (response.status === 'OK') {
      console.log('Success! Found', response.results.length, 'restaurants');
      console.log('First 3 restaurants:');
      response.results.slice(0, 3).forEach(restaurant => {
        console.log(`- ${restaurant.name} (Rating: ${restaurant.rating || 'N/A'})`);
      });
    } else {
      console.log('Full response:', response);
    }
  });

}).on("error", (err) => {
  console.error("Error:", err.message);
}); 