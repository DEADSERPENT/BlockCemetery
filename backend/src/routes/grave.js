const express = require('express');
const { getContract } = require('../config/blockchain');

const router = express.Router();

/**
 * @route GET /api/graves/:id
 * @desc Get grave details by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const contract = getContract();
    const graveId = req.params.id;

    const grave = await contract.getGrave(graveId);

    res.json({
      id: grave.id.toString(),
      graveyardId: grave.graveyardId.toString(),
      owner: grave.owner,
      price: grave.price.toString(),
      priceInEth: require('ethers').formatEther(grave.price),
      reserved: grave.reserved,
      maintained: grave.maintained,
      locationHash: grave.locationHash,
      metadataHash: grave.metadataHash,
      timestamp: grave.timestamp.toString(),
      reservationDate: grave.timestamp > 0
        ? new Date(Number(grave.timestamp) * 1000).toISOString()
        : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/graves/user/:address
 * @desc Get all graves owned by a user
 */
router.get('/user/:address', async (req, res) => {
  try {
    const contract = getContract();
    const userAddress = req.params.address;

    const graveIds = await contract.getUserGraves(userAddress);

    const graves = [];
    for (const graveId of graveIds) {
      const grave = await contract.getGrave(graveId);
      graves.push({
        id: grave.id.toString(),
        graveyardId: grave.graveyardId.toString(),
        price: grave.price.toString(),
        reserved: grave.reserved,
        maintained: grave.maintained,
        locationHash: grave.locationHash,
        timestamp: grave.timestamp.toString()
      });
    }

    res.json({
      address: userAddress,
      totalGraves: graves.length,
      graves
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/graves/:id/status
 * @desc Check if grave is reserved
 */
router.get('/:id/status', async (req, res) => {
  try {
    const contract = getContract();
    const graveId = req.params.id;

    const reserved = await contract.isReserved(graveId);

    res.json({
      graveId,
      reserved
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
