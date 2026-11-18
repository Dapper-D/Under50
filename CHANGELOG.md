# Changelog

## Unreleased: menu links, logo refresh, price fix

### Changed
- **Menu:** the restaurant modal's Menu section now has a **View menu** button that opens the restaurant's Google Maps page, with its Menu tab and menu photos, and a **Website** button. Google's Places API doesn't provide menu items, so the app no longer makes up example dishes and prices when it can't find a menu. If the details request fails, View menu falls back to a Google Maps link built from the place ID.
- **Logo:** clicking "Under 50" now does a full page load of the home page, so it refreshes the page. It's a plain link, and the hover and steam animations are unchanged. Group hover now uses `data-group` instead of `role="group"`, so screen readers announce the logo as a link.

### Fixed
- Restaurants loaded from the database had no `averagePrice`, so their cards showed "$undefined avg". It's now worked out from the price level, the same way as fresh results.
- The restaurant modal was given the restaurant's name as its ID, so it couldn't look anything up. It now gets the real Google place ID.

### Note
- `app/api/restaurants/[id]/menu` is no longer called. It's left in place.


## Unreleased: move to Places API (New)

Google stopped letting new Cloud projects enable the legacy Places API on March 1, 2025. This release moves every Places call to Places API (New), so the app works with a key from a new project.

### Changed
- New `app/lib/googlePlaces.ts` holds all Places API (New) calls (Text Search, Nearby Search, Place Details) and shared helpers.
- **Restaurant search** uses Text Search (New). Phone, website and opening status come back in the same request, so each search no longer makes a details call per result with a 200 ms pause between them. Searches are faster and cheaper.
- **Restaurant details** use Place Details (New). The response shape is the same. The new API has no menu URL, so `menuUrl` falls back to the website, then the Google Maps page, as before.
- **Attractions and Activities** use Nearby Search (New) instead of `@googlemaps/google-maps-services-js` (removed), with no per-place details calls. Nearby Search (New) has no "open now" filter, so that filter now runs on the results.
- **Photos:** `/api/photos?name=…` serves Place Photos (New). Old `?photo_reference=` links return the fallback picture.
- **Saved restaurants:** photo names expire and Google says not to store them, so the database keeps only the fallback image. A fresh photo name is fetched when a saved restaurant is shown, in the same cheap request that refreshes its opening status.
- Server key is now `GOOGLE_PLACES_API_KEY` everywhere. `GOOGLE_MAPS_API_KEY` is still read as a fallback.
- `test-api.js` checks a key against Places API (New).

### Fixed
- **API key leak:** Attractions and Activities put the server key into image URLs sent to the browser. Their images now go through `/api/photos`.
- **Restaurants under 1 km were dropped:** distances like "850m" were compared as 850 km against the distance limit.
- **Search radius:** Attractions and Activities defaulted to 10,000 km when no distance was sent. The radius is now capped at 50 km, which is the new API's limit.
- **Fallback image:** `images.unsplash.com` was not in `next.config.js` image hosts, so `next/image` could fail on restaurants without a photo. The unused `maps.googleapis.com` entry is gone.

### Added
- `.env.example` with every variable the app reads.
- README setup steps for getting and restricting both keys, and for Vercel.

### Removed
- README mentions of `MAX_REQUESTS_PER_MINUTE` and `CACHE_DURATION_MINUTES`. The code never read them.
- Geocoding API from the setup steps. The app doesn't call it.
