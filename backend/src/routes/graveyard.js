const express = require('express');
const { getContract } = require('../config/blockchain');
const { loadGeoJSON } = require('../utils/geojson');

const router = express.Router();

/**
 * @route GET /api/graveyards
 * @desc Get all graveyards
 */
router.get('/', async (req, res) => {
  try {
    const contract = getContract();
    const totalGraveyards = await contract.getTotalGraveyards();

    const graveyards = [];
    for (let i = 1; i <= totalGraveyards; i++) {
      try {
        const graveyard = await contract.getGraveyard(i);
        graveyards.push({
          id: graveyard.id.toString(),
          owner: graveyard.owner,
          name: graveyard.name,
          location: graveyard.location,
          numPlots: graveyard.numPlots.toString(),
          active: graveyard.active,
          totalGraves: graveyard.graveIds.length
        });
      } catch (err) {
        console.error(`Error fetching graveyard ${i}:`, err.message);
      }
    }

    res.json({ graveyards });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/graveyards/:id
 * @desc Get single graveyard details
 */
router.get('/:id', async (req, res) => {
  try {
    const contract = getContract();
    const graveyardId = req.params.id;

    const graveyard = await contract.getGraveyard(graveyardId);
    const availableGraves = await contract.getAvailableGraves(graveyardId);

    res.json({
      id: graveyard.id.toString(),
      owner: graveyard.owner,
      name: graveyard.name,
      location: graveyard.location,
      numPlots: graveyard.numPlots.toString(),
      active: graveyard.active,
      graveIds: graveyard.graveIds.map(id => id.toString()),
      availableGraves: availableGraves.map(id => id.toString()),
      totalGraves: graveyard.graveIds.length,
      availableCount: availableGraves.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/graveyards/:id/graves
 * @desc Get all graves in a graveyard
 */
router.get('/:id/graves', async (req, res) => {
  try {
    const contract = getContract();
    const graveyardId = req.params.id;

    const graveIds = await contract.getGraveyardGraves(graveyardId);

    const graves = [];
    for (const graveId of graveIds) {
      const grave = await contract.getGrave(graveId);
      graves.push({
        id: grave.id.toString(),
        graveyardId: grave.graveyardId.toString(),
        owner: grave.owner,
        price: grave.price.toString(),
        reserved: grave.reserved,
        maintained: grave.maintained,
        locationHash: grave.locationHash,
        metadataHash: grave.metadataHash,
        timestamp: grave.timestamp.toString()
      });
    }

    res.json({ graves });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/graveyards/:id/map
 * @desc Get GeoJSON map data for graveyard
 */
router.get('/:id/map', async (req, res) => {
  try {
    const graveyardId = req.params.id;
    const geoJSON = await loadGeoJSON(graveyardId);

    if (!geoJSON) {
      return res.status(404).json({ error: 'Map data not found' });
    }

    // Enhance GeoJSON with on-chain data
    const contract = getContract();
    const graveIds = await contract.getGraveyardGraves(graveyardId);

    for (const feature of geoJSON.features) {
      const graveId = feature.properties.graveId;
      if (graveId && graveIds.includes(BigInt(graveId))) {
        const grave = await contract.getGrave(graveId);
        feature.properties.reserved = grave.reserved;
        feature.properties.maintained = grave.maintained;
        feature.properties.price = grave.price.toString();
      }
    }

    res.json(geoJSON);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
