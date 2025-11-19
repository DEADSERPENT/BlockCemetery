/**
 * Location utilities for BlockCemetery Backend
 * Provides alternatives to IPFS hash for location storage
 */

const LocationType = {
  IPFS_HASH: 'ipfs',
  LAT_LNG: 'latlng',
  GEOHASH: 'geohash',
  ADDRESS: 'address'
};

// Encode lat/lng to compact string
function encodeLatLng(lat, lng) {
  return `${lat.toFixed(6)}:${lng.toFixed(6)}`;
}

// Decode lat/lng from compact string
function decodeLatLng(encoded) {
  const parts = encoded.split(':');
  if (parts.length !== 2) return null;
  return {
    lat: parseFloat(parts[0]),
    lng: parseFloat(parts[1])
  };
}

// Encode to Geohash
function encodeGeohash(lat, lng, precision = 9) {
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

// Decode Geohash to lat/lng
function decodeGeohash(geohash) {
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

// Create location hash from coordinates
function createLocationHash(lat, lng, type = 'geohash') {
  switch (type) {
    case 'latlng':
      return `latlng:${encodeLatLng(lat, lng)}`;
    case 'geohash':
    default:
      return `geo:${encodeGeohash(lat, lng)}`;
  }
}

// Parse location hash to coordinates
function parseLocationHash(hash) {
  if (!hash) return null;

  // IPFS hash
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

  return null;
}

// Generate simple GeoJSON from coordinates
function createGeoJSONFromCoords(lat, lng, properties = {}) {
  return {
    type: 'Feature',
    properties: {
      ...properties,
      locationHash: createLocationHash(lat, lng)
    },
    geometry: {
      type: 'Point',
      coordinates: [lng, lat]
    }
  };
}

// Generate GeoJSON polygon for a grave plot
function createGravePlotGeoJSON(centerLat, centerLng, widthMeters = 2, heightMeters = 1, properties = {}) {
  // Approximate degrees per meter
  const latPerMeter = 1 / 111320;
  const lngPerMeter = 1 / (111320 * Math.cos(centerLat * Math.PI / 180));

  const halfWidth = (widthMeters / 2) * lngPerMeter;
  const halfHeight = (heightMeters / 2) * latPerMeter;

  return {
    type: 'Feature',
    properties: {
      ...properties,
      locationHash: createLocationHash(centerLat, centerLng)
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [centerLng - halfWidth, centerLat - halfHeight],
        [centerLng + halfWidth, centerLat - halfHeight],
        [centerLng + halfWidth, centerLat + halfHeight],
        [centerLng - halfWidth, centerLat + halfHeight],
        [centerLng - halfWidth, centerLat - halfHeight]
      ]]
    }
  };
}

module.exports = {
  LocationType,
  encodeLatLng,
  decodeLatLng,
  encodeGeohash,
  decodeGeohash,
  createLocationHash,
  parseLocationHash,
  createGeoJSONFromCoords,
  createGravePlotGeoJSON
};
