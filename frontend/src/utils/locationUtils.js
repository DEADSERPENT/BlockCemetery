/**
 * Location utilities for BlockCemetery
 * Provides alternatives to IPFS hash for location storage
 */

/**
 * Location format types supported
 */
export const LocationType = {
  IPFS_HASH: 'ipfs',           // GeoJSON stored on IPFS
  LAT_LNG: 'latlng',           // Direct coordinates
  PLUS_CODE: 'pluscode',       // Google Plus Codes
  GEOHASH: 'geohash',          // Geohash encoding
  ADDRESS: 'address'           // Human readable address
};

/**
 * Encode lat/lng to a compact string format
 * Format: "lat:lng" with 6 decimal precision
 */
export function encodeLatLng(lat, lng) {
  return `${lat.toFixed(6)}:${lng.toFixed(6)}`;
}

/**
 * Decode lat/lng from compact string
 */
export function decodeLatLng(encoded) {
  const parts = encoded.split(':');
  if (parts.length !== 2) return null;
  return {
    lat: parseFloat(parts[0]),
    lng: parseFloat(parts[1])
  };
}

/**
 * Encode to Geohash (simple implementation)
 * Precision: 9 characters = ~4.77m x 4.77m
 */
export function encodeGeohash(lat, lng, precision = 9) {
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = '';
  let latRange = [-90, 90];
  let lngRange = [-180, 180];

  while (geohash.length < precision) {
    if (evenBit) {
      const mid = (lngRange[0] + lngRange[1]) / 2;
      if (lng >= mid) {
        idx = idx * 2 + 1;
        lngRange[0] = mid;
      } else {
        idx = idx * 2;
        lngRange[1] = mid;
      }
    } else {
      const mid = (latRange[0] + latRange[1]) / 2;
      if (lat >= mid) {
        idx = idx * 2 + 1;
        latRange[0] = mid;
      } else {
        idx = idx * 2;
        latRange[1] = mid;
      }
    }
    evenBit = !evenBit;
    if (++bit === 5) {
      geohash += BASE32.charAt(idx);
      bit = 0;
      idx = 0;
    }
  }
  return geohash;
}

/**
 * Decode Geohash to lat/lng
 */
export function decodeGeohash(geohash) {
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let evenBit = true;
  let latRange = [-90, 90];
  let lngRange = [-180, 180];

  for (const char of geohash.toLowerCase()) {
    const idx = BASE32.indexOf(char);
    if (idx === -1) return null;

    for (let i = 4; i >= 0; i--) {
      const bit = (idx >> i) & 1;
      if (evenBit) {
        const mid = (lngRange[0] + lngRange[1]) / 2;
        lngRange = bit ? [mid, lngRange[1]] : [lngRange[0], mid];
      } else {
        const mid = (latRange[0] + latRange[1]) / 2;
        latRange = bit ? [mid, latRange[1]] : [latRange[0], mid];
      }
      evenBit = !evenBit;
    }
  }

  return {
    lat: (latRange[0] + latRange[1]) / 2,
    lng: (lngRange[0] + lngRange[1]) / 2
  };
}

/**
 * Create location hash in specified format
 */
export function createLocationHash(lat, lng, type = LocationType.GEOHASH) {
  switch (type) {
    case LocationType.LAT_LNG:
      return `latlng:${encodeLatLng(lat, lng)}`;
    case LocationType.GEOHASH:
      return `geo:${encodeGeohash(lat, lng)}`;
    case LocationType.PLUS_CODE:
      // Plus codes require external library, use geohash as fallback
      return `geo:${encodeGeohash(lat, lng)}`;
    default:
      return `geo:${encodeGeohash(lat, lng)}`;
  }
}

/**
 * Parse location hash to get coordinates
 */
export function parseLocationHash(hash) {
  if (!hash) return null;

  // IPFS hash (Qm... or bafy...)
  if (hash.startsWith('Qm') || hash.startsWith('bafy')) {
    return { type: LocationType.IPFS_HASH, hash };
  }

  // Lat/Lng format
  if (hash.startsWith('latlng:')) {
    const coords = decodeLatLng(hash.substring(7));
    return coords ? { type: LocationType.LAT_LNG, ...coords } : null;
  }

  // Geohash format
  if (hash.startsWith('geo:')) {
    const coords = decodeGeohash(hash.substring(4));
    return coords ? { type: LocationType.GEOHASH, ...coords } : null;
  }

  // Try parsing as raw geohash
  if (/^[0-9bcdefghjkmnpqrstuvwxyz]+$/i.test(hash)) {
    const coords = decodeGeohash(hash);
    return coords ? { type: LocationType.GEOHASH, ...coords } : null;
  }

  return null;
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat, lng, format = 'decimal') {
  if (format === 'dms') {
    // Degrees, minutes, seconds
    const toDMS = (coord, isLat) => {
      const abs = Math.abs(coord);
      const d = Math.floor(abs);
      const m = Math.floor((abs - d) * 60);
      const s = ((abs - d - m / 60) * 3600).toFixed(1);
      const dir = isLat ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
      return `${d}°${m}'${s}"${dir}`;
    };
    return `${toDMS(lat, true)} ${toDMS(lng, false)}`;
  }
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * Calculate distance between two points (Haversine formula)
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

export default {
  LocationType,
  encodeLatLng,
  decodeLatLng,
  encodeGeohash,
  decodeGeohash,
  createLocationHash,
  parseLocationHash,
  formatCoordinates,
  calculateDistance
};
