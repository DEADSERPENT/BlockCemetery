const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const CemeteryManagerABI = require('../../../artifacts/contracts/CemeteryManagerEnhanced.sol/CemeteryManagerEnhanced.json');

/**
 * Public API routes - No authentication required
 * Provides read-only access to cemetery data
 */

// Initialize contract
let contract;
const initializeContract = () => {
  if (!contract) {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545');
    contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      CemeteryManagerABI.abi,
      provider
    );
  }
  return contract;
};

/**
 * @route   GET /api/public/graveyards
 * @desc    Get all graveyards (public)
 * @access  Public
 */
router.get('/graveyards', async (req, res) => {
  try {
    const contract = initializeContract();
    const totalGraveyards = await contract.getTotalGraveyards();

    const graveyards = [];
    for (let i = 1; i <= totalGraveyards; i++) {
      const gy = await contract.getGraveyard(i);
      graveyards.push({
        id: gy.id.toString(),
        name: gy.name,
        location: gy.location,
        numPlots: gy.numPlots.toString(),
        active: gy.active,
        totalGraves: gy.graveIds.length,
      });
    }

    res.json({
      success: true,
      count: graveyards.length,
      graveyards,
    });
  } catch (error) {
    console.error('Error fetching graveyards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch graveyards',
    });
  }
});

/**
 * @route   GET /api/public/search
 * @desc    Search for graves (public)
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { type, query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    const contract = initializeContract();
    const results = [];

    // Get all graveyards for context
    const totalGraveyards = await contract.getTotalGraveyards();
    const graveyards = {};

    for (let i = 1; i <= totalGraveyards; i++) {
      const gy = await contract.getGraveyard(i);
      graveyards[i] = {
        name: gy.name,
        location: gy.location,
      };
    }

    // Search by type
    if (type === 'location') {
      // Search by graveyard location
      for (let i = 1; i <= totalGraveyards; i++) {
        const gy = graveyards[i];
        if (
          gy.name.toLowerCase().includes(query.toLowerCase()) ||
          gy.location.toLowerCase().includes(query.toLowerCase())
        ) {
          // Get graves in this graveyard
          const graveyard = await contract.getGraveyard(i);
          for (const graveId of graveyard.graveIds) {
            const grave = await contract.getGrave(graveId);
            if (grave.reserved) {
              results.push({
                graveId: grave.id.toString(),
                cemetery: gy.name,
                location: gy.location,
                burialDate: grave.burialDate ? grave.burialDate.toString() : null,
                name: grave.deceasedName || 'Name Private',
              });
            }
          }
        }
      }
    } else if (type === 'name') {
      // Search by deceased name (if available)
      // Note: In production, this would query encrypted name hashes
      for (let i = 1; i <= totalGraveyards; i++) {
        const graveyard = await contract.getGraveyard(i);
        for (const graveId of graveyard.graveIds) {
          const grave = await contract.getGrave(graveId);
          if (
            grave.reserved &&
            grave.deceasedName &&
            grave.deceasedName.toLowerCase().includes(query.toLowerCase())
          ) {
            results.push({
              graveId: grave.id.toString(),
              cemetery: graveyards[i].name,
              location: graveyards[i].location,
              burialDate: grave.burialDate ? grave.burialDate.toString() : null,
              name: grave.deceasedName,
            });
          }
        }
      }
    } else if (type === 'date') {
      // Search by burial date/year
      const searchYear = parseInt(query);
      for (let i = 1; i <= totalGraveyards; i++) {
        const graveyard = await contract.getGraveyard(i);
        for (const graveId of graveyard.graveIds) {
          const grave = await contract.getGrave(graveId);
          if (grave.reserved && grave.burialDate) {
            const burialYear = new Date(grave.burialDate.toString() * 1000).getFullYear();
            if (burialYear === searchYear) {
              results.push({
                graveId: grave.id.toString(),
                cemetery: graveyards[i].name,
                location: graveyards[i].location,
                burialDate: grave.burialDate.toString(),
                name: grave.deceasedName || 'Name Private',
              });
            }
          }
        }
      }
    }

    res.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
    });
  }
});

/**
 * @route   GET /api/public/grave/:id
 * @desc    Get grave details with GPS (public)
 * @access  Public
 */
router.get('/grave/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contract = initializeContract();

    const grave = await contract.getGrave(id);

    if (!grave.id) {
      return res.status(404).json({
        success: false,
        error: 'Grave not found',
      });
    }

    // Get GPS coordinates
    const gps = await contract.getGraveGPS(id);

    // Get graveyard info
    const graveyard = await contract.getGraveyard(grave.graveyardId);

    res.json({
      success: true,
      grave: {
        id: grave.id.toString(),
        graveyardId: grave.graveyardId.toString(),
        graveyardName: graveyard.name,
        location: graveyard.location,
        reserved: grave.reserved,
        maintained: grave.maintained,
        price: grave.price.toString(),
        gps: {
          latitude: parseFloat(gps.latitude.toString()) / 1e6,
          longitude: parseFloat(gps.longitude.toString()) / 1e6,
          accuracy: gps.accuracy.toString(),
        },
        deceasedName: grave.deceasedName || 'Private',
        burialDate: grave.burialDate ? grave.burialDate.toString() : null,
      },
    });
  } catch (error) {
    console.error('Error fetching grave:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch grave details',
    });
  }
});

/**
 * @route   GET /api/public/analytics
 * @desc    Get public analytics (limited)
 * @access  Public
 */
router.get('/analytics', async (req, res) => {
  try {
    const contract = initializeContract();
    const analytics = await contract.getAnalytics();

    res.json({
      success: true,
      analytics: {
        totalGraveyards: analytics.totalGraveyards.toString(),
        totalGraves: analytics.totalGraves.toString(),
        totalReserved: analytics.totalReserved.toString(),
        // Revenue and prices are hidden for public
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
    });
  }
});

module.exports = router;
