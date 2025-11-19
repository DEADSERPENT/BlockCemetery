const express = require('express');
const router = express.Router();
const {
  createLocationHash,
  parseLocationHash,
  encodeGeohash,
  decodeGeohash,
  createGeoJSONFromCoords,
  createGravePlotGeoJSON
} = require('../utils/locationUtils');

/**
 * Convert lat/lng to location hash
 * POST /api/location/encode
 * Body: { lat: number, lng: number, type: 'geohash' | 'latlng' }
 */
router.post('/encode', (req, res) => {
  try {
    const { lat, lng, type = 'geohash' } = req.body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'lat and lng must be numbers' });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid coordinate range' });
    }

    const locationHash = createLocationHash(lat, lng, type);
    const geohash = encodeGeohash(lat, lng);

    res.json({
      success: true,
      locationHash,
      geohash,
      coordinates: { lat, lng },
      googleMapsUrl: `https://maps.google.com/?q=${lat},${lng}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Decode location hash to coordinates
 * POST /api/location/decode
 * Body: { hash: string }
 */
router.post('/decode', (req, res) => {
  try {
    const { hash } = req.body;

    if (!hash) {
      return res.status(400).json({ error: 'hash is required' });
    }

    const result = parseLocationHash(hash);

    if (!result) {
      return res.status(400).json({ error: 'Unable to decode location hash' });
    }

    const response = {
      success: true,
      type: result.type,
      ...result
    };

    if (result.lat && result.lng) {
      response.googleMapsUrl = `https://maps.google.com/?q=${result.lat},${result.lng}`;
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate GeoJSON for a grave plot
 * POST /api/location/geojson
 * Body: { lat, lng, width?, height?, graveId?, section?, plot? }
 */
router.post('/geojson', (req, res) => {
  try {
    const {
      lat,
      lng,
      width = 2,
      height = 1,
      graveId,
      section,
      plot,
      ...otherProps
    } = req.body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'lat and lng must be numbers' });
    }

    const properties = {
      graveId,
      section,
      plot,
      ...otherProps
    };

    const geojson = createGravePlotGeoJSON(lat, lng, width, height, properties);

    res.json({
      success: true,
      geojson
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Batch generate location hashes
 * POST /api/location/batch-encode
 * Body: { locations: [{ lat, lng, id? }], type?: string }
 */
router.post('/batch-encode', (req, res) => {
  try {
    const { locations, type = 'geohash' } = req.body;

    if (!Array.isArray(locations)) {
      return res.status(400).json({ error: 'locations must be an array' });
    }

    const results = locations.map((loc, index) => {
      if (typeof loc.lat !== 'number' || typeof loc.lng !== 'number') {
        return { index, error: 'Invalid coordinates' };
      }

      return {
        index,
        id: loc.id,
        locationHash: createLocationHash(loc.lat, loc.lng, type),
        geohash: encodeGeohash(loc.lat, loc.lng),
        coordinates: { lat: loc.lat, lng: loc.lng }
      };
    });

    res.json({
      success: true,
      count: results.length,
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get supported location types
 * GET /api/location/types
 */
router.get('/types', (req, res) => {
  res.json({
    success: true,
    types: [
      {
        id: 'geohash',
        name: 'Geohash',
        description: 'Compact alphanumeric encoding, ~5m precision',
        example: 'geo:gcpvj0duq'
      },
      {
        id: 'latlng',
        name: 'Lat/Lng',
        description: 'Direct coordinate storage',
        example: 'latlng:51.505000:-0.090000'
      },
      {
        id: 'ipfs',
        name: 'IPFS Hash',
        description: 'GeoJSON polygon stored on IPFS',
        example: 'QmTestHash123...'
      }
    ],
    recommendation: 'Use geohash for simple point locations, IPFS for detailed polygons'
  });
});

module.exports = router;
