const express = require('express');
const { getProvider, getContract } = require('../config/blockchain');

const router = express.Router();

/**
 * @route GET /api/blockchain/status
 * @desc Get blockchain connection status
 */
router.get('/status', async (req, res) => {
  try {
    const provider = getProvider();
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();

    res.json({
      connected: true,
      network: {
        name: network.name,
        chainId: network.chainId.toString()
      },
      blockNumber
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/blockchain/contract-info
 * @desc Get contract deployment information
 */
router.get('/contract-info', async (req, res) => {
  try {
    const contract = getContract();

    if (!contract) {
      return res.status(400).json({ error: 'Contract not initialized' });
    }

    const totalGraveyards = await contract.getTotalGraveyards();
    const totalGraves = await contract.getTotalGraves();

    res.json({
      address: await contract.getAddress(),
      totalGraveyards: totalGraveyards.toString(),
      totalGraves: totalGraves.toString(),
      note: 'Enhanced contract uses role-based access control (no single owner)'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/blockchain/gas-price
 * @desc Get current gas price
 */
router.get('/gas-price', async (req, res) => {
  try {
    const provider = getProvider();
    const feeData = await provider.getFeeData();

    res.json({
      gasPrice: feeData.gasPrice?.toString(),
      maxFeePerGas: feeData.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
