// Small client for Places API (New).
// Docs: https://developers.google.com/maps/documentation/places/web-service/op-overview
//
// Every request needs an X-Goog-FieldMask header listing the fields to return.
// Fields are billed by tier, so ask only for what the app uses.

const BASE = 'https://places.googleapis.com/v1'

// Server-side key. GOOGLE_MAPS_API_KEY is accepted as a fallback so older
// .env files keep working.
export function serverKey(): string | undefined {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY
}

export class PlacesError extends Error {
  constructor(message: string, public status: number, public body?: unknown) {
    super(message)
  }
}

export interface NewPlace {
  id: string
  displayName?: { text: string; languageCode?: string }
  formattedAddress?: string
  shortFormattedAddress?: string
  location?: { latitude: number; longitude: number }
  rating?: number
  priceLevel?: string
  types?: string[]
  primaryType?: string
  photos?: Array<{ name: string; widthPx: number; heightPx: number }>
  currentOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] }
  regularOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] }
  nationalPhoneNumber?: string
  websiteUri?: string
  googleMapsUri?: string
  editorialSummary?: { text: string }
  delivery?: boolean
  takeout?: boolean
  dineIn?: boolean
  servesBreakfast?: boolean
  servesLunch?: boolean
  servesDinner?: boolean
}

export const MAX_RADIUS_M = 50000 // the new API rejects anything larger

async function call<T>(path: string, init: { method: 'GET' | 'POST'; fields: string[]; body?: unknown }, retries = 2): Promise<T> {
  const key = serverKey()
  if (!key) throw new PlacesError('Google Places API key is not configured (set GOOGLE_PLACES_API_KEY)', 500)

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${BASE}${path}`, {
      method: init.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': init.fields.join(',')
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: 'no-store'
    })
    if (res.ok) return (await res.json()) as T

    const body = await res.json().catch(() => undefined)
    // Back off and retry on rate limiting
    if (res.status === 429 && attempt < retries) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt))
      continue
    }
    const msg = (body as any)?.error?.message || res.statusText
    throw new PlacesError(`Places API ${res.status}: ${msg}`, res.status, body)
  }
}

const circle = (lat: number, lng: number, radiusM: number) => ({
  circle: { center: { latitude: lat, longitude: lng }, radius: Math.min(Math.max(radiusM, 1), MAX_RADIUS_M) }
})

/** Text Search (New): POST places:searchText */
export async function searchText(opts: {
  textQuery: string
  lat: number
  lng: number
  radiusM: number
  includedType?: string
  priceLevels?: string[]
  openNow?: boolean
  regionCode?: string
  fields: string[]
}): Promise<NewPlace[]> {
  const data = await call<{ places?: NewPlace[] }>('/places:searchText', {
    method: 'POST',
    fields: opts.fields.map((f) => `places.${f}`),
    body: {
      textQuery: opts.textQuery,
      locationBias: circle(opts.lat, opts.lng, opts.radiusM),
      ...(opts.includedType ? { includedType: opts.includedType } : {}),
      ...(opts.priceLevels?.length ? { priceLevels: opts.priceLevels } : {}),
      ...(opts.openNow ? { openNow: true } : {}),
      regionCode: opts.regionCode || process.env.REGION_CODE || 'ca',
      pageSize: 20
    }
  })
  return data.places || []
}

/** Nearby Search (New): POST places:searchNearby. Has no openNow filter, so filter on the result. */
export async function searchNearby(opts: {
  types: string[]
  lat: number
  lng: number
  radiusM: number
  fields: string[]
}): Promise<NewPlace[]> {
  const data = await call<{ places?: NewPlace[] }>('/places:searchNearby', {
    method: 'POST',
    fields: opts.fields.map((f) => `places.${f}`),
    body: {
      includedTypes: opts.types,
      maxResultCount: 20,
      locationRestriction: circle(opts.lat, opts.lng, opts.radiusM),
      regionCode: process.env.REGION_CODE || 'ca'
    }
  })
  return data.places || []
}

/** Place Details (New): GET places/{id}. Place IDs from the legacy API still work. */
export async function getPlace(id: string, fields: string[]): Promise<NewPlace> {
  return call<NewPlace>(`/places/${encodeURIComponent(id)}`, { method: 'GET', fields })
}

// ---- helpers shared by the routes ----

const PRICE_ORDER = [
  'PRICE_LEVEL_FREE',
  'PRICE_LEVEL_INEXPENSIVE',
  'PRICE_LEVEL_MODERATE',
  'PRICE_LEVEL_EXPENSIVE',
  'PRICE_LEVEL_VERY_EXPENSIVE'
]

/** 'PRICE_LEVEL_MODERATE' -> 2, matching the legacy 0-4 scale the app stores. */
export function priceLevelToNumber(level?: string): number | undefined {
  const i = level ? PRICE_ORDER.indexOf(level) : -1
  return i >= 0 ? i : undefined
}

/** Allowed price levels up to and including `max` (1-4). FREE can't be sent in requests. */
export function priceLevelsUpTo(max: number): string[] {
  return PRICE_ORDER.slice(1, Math.max(1, Math.min(max, 4)) + 1)
}

/** Photo name -> our own proxy URL, so the API key never reaches the browser. */
export function photoProxyUrl(photoName: string | undefined, maxWidth = 400): string | undefined {
  return photoName ? `/api/photos?name=${encodeURIComponent(photoName)}&maxwidth=${maxWidth}` : undefined
}

/** Great-circle distance in km. */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
