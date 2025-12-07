/**
 * Improved IPFS Routes with Caching and Validation
 * Version 2: Optimized for CemeteryManagerV2 contract
 */

const express = require('express');
const multer = require('multer');
const axios = require('axios');
const { cacheMiddleware } = require('../utils/cache');
const {
  validateIPFSUpload,
  validateMetadataUpload,
  validateIPFSHashParam,
  rateLimiter,
  sanitizeRequestBody,
} = require('../middleware/validation');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_API_URL = 'https://api.pinata.cloud';

/**
 * @route POST /api/ipfs/v2/upload
 * @desc Upload data to IPFS via Pinata with validation
 * @access Public (rate limited)
 */
router.post(
  '/upload',
  rateLimiter(50, 60000), // 50 requests per minute
  upload.single('file'),
  sanitizeRequestBody,
  validateIPFSUpload,
  async (req, res) => {
    try {
      const { data } = req.body;

      let contentToUpload = data;

      // If file is provided, use file instead
      if (req.file) {
        contentToUpload = req.file.buffer.toString('base64');
      }

      // Upload to Pinata
      if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
        // Fallback: return mock IPFS hash for development
        const crypto = require('crypto');
        const mockHash = 'Qm' + crypto
          .createHash('sha256')
          .update(JSON.stringify(contentToUpload))
          .digest('hex')
          .substring(0, 44);

        return res.json({
          success: true,
          ipfsHash: mockHash,
          bytes32: require('ethers').id(mockHash),
          message: 'Mock IPFS hash (Pinata not configured)',
        });
      }

      // Create JSON blob
      const jsonBlob = JSON.stringify({
        content: contentToUpload,
        timestamp: Date.now(),
      });

      const response = await axios.post(
        `${PINATA_API_URL}/pinning/pinJSONToIPFS`,
        {
          pinataContent: JSON.parse(jsonBlob),
          pinataMetadata: {
            name: `cemetery-data-${Date.now()}`,
          },
        },
        {
          headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_KEY,
          },
        }
      );

      const ipfsHash = response.data.IpfsHash;

      // Convert to bytes32 for contract use
      const { ethers } = require('ethers');
      const bytes32 = ethers.id(ipfsHash);

      res.json({
        success: true,
        ipfsHash,
        bytes32,
        pinSize: response.data.PinSize,
        timestamp: response.data.Timestamp,
      });
    } catch (error) {
      console.error('IPFS upload error:', error);
      res.status(500).json({
        error: 'Upload failed',
        message: error.message,
      });
    }
  }
);

/**
 * @route GET /api/ipfs/v2/:hash
 * @desc Retrieve data from IPFS with caching
 * @access Public (cached)
 */
router.get(
  '/:hash',
  validateIPFSHashParam,
  cacheMiddleware(600), // Cache for 10 minutes
  async (req, res) => {
    try {
      const { hash } = req.params;

      // Fetch from IPFS gateway
      const ipfsGateway =
        process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
      const response = await axios.get(`${ipfsGateway}/${hash}`, {
        timeout: 10000, // 10 second timeout
      });

      res.json({
        success: true,
        hash,
        data: response.data,
      });
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        return res.status(504).json({
          error: 'Gateway timeout',
          message: 'IPFS gateway took too long to respond',
        });
      }

      res.status(500).json({
        error: 'Fetch failed',
        message: error.message,
      });
    }
  }
);

/**
 * @route POST /api/ipfs/v2/upload-metadata
 * @desc Upload encrypted burial metadata
 * @access Public (rate limited)
 *
 * NOTE: Encryption should be done CLIENT-SIDE for security
 * This endpoint expects already-encrypted data
 */
router.post(
  '/upload-metadata',
  rateLimiter(30, 60000), // 30 requests per minute
  sanitizeRequestBody,
  validateMetadataUpload,
  async (req, res) => {
    try {
      const metadata = req.body;

      // Validate that data is encrypted (should have 'encrypted' and 'iv' fields)
      if (!metadata.encrypted || !metadata.iv) {
        return res.status(400).json({
          error: 'Metadata must be encrypted client-side',
          message:
            'Please encrypt sensitive data before uploading. See encryption.js utilities.',
        });
      }

      // Upload to Pinata
      if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
        // Mock mode
        const crypto = require('crypto');
        const mockHash = 'Qm' + crypto
          .createHash('sha256')
          .update(JSON.stringify(metadata))
          .digest('hex')
          .substring(0, 44);

        const { ethers } = require('ethers');
        const bytes32 = ethers.id(mockHash);

        return res.json({
          success: true,
          ipfsHash: mockHash,
          bytes32,
          message: 'Metadata uploaded (mock mode)',
        });
      }

      const response = await axios.post(
        `${PINATA_API_URL}/pinning/pinJSONToIPFS`,
        {
          pinataContent: {
            ...metadata,
            uploadedAt: Date.now(),
          },
          pinataMetadata: {
            name: `grave-${metadata.graveId}-metadata-${Date.now()}`,
            keyvalues: {
              graveId: String(metadata.graveId),
              type: 'burial-metadata',
            },
          },
        },
        {
          headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_KEY,
          },
        }
      );

      const ipfsHash = response.data.IpfsHash;
      const { ethers } = require('ethers');
      const bytes32 = ethers.id(ipfsHash);

      res.json({
        success: true,
        ipfsHash,
        bytes32,
        pinSize: response.data.PinSize,
      });
    } catch (error) {
      console.error('Metadata upload error:', error);
      res.status(500).json({
        error: 'Upload failed',
        message: error.message,
      });
    }
  }
);

/**
 * @route POST /api/ipfs/v2/upload-boundary
 * @desc Upload GeoJSON boundary data
 * @access Admin only (should add auth middleware in production)
 */
router.post(
  '/upload-boundary',
  rateLimiter(10, 60000), // 10 requests per minute
  sanitizeRequestBody,
  async (req, res) => {
    try {
      const { geoJSON } = req.body;

      if (!geoJSON) {
        return res.status(400).json({
          error: 'geoJSON is required',
        });
      }

      // Validate GeoJSON structure
      if (
        !geoJSON.type ||
        !geoJSON.coordinates ||
        !['Polygon', 'MultiPolygon'].includes(geoJSON.type)
      ) {
        return res.status(400).json({
          error: 'Invalid GeoJSON format',
          message: 'Expected Polygon or MultiPolygon with coordinates',
        });
      }

      // Upload to Pinata
      if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
        const crypto = require('crypto');
        const mockHash = 'Qm' + crypto
          .createHash('sha256')
          .update(JSON.stringify(geoJSON))
          .digest('hex')
          .substring(0, 44);

        const { ethers } = require('ethers');
        const bytes32 = ethers.id(mockHash);

        return res.json({
          success: true,
          ipfsHash: mockHash,
          bytes32,
          message: 'Boundary uploaded (mock mode)',
        });
      }

      const response = await axios.post(
        `${PINATA_API_URL}/pinning/pinJSONToIPFS`,
        {
          pinataContent: geoJSON,
          pinataMetadata: {
            name: `cemetery-boundary-${Date.now()}`,
            keyvalues: {
              type: 'geojson-boundary',
            },
          },
        },
        {
          headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_KEY,
          },
        }
      );

      const ipfsHash = response.data.IpfsHash;
      const { ethers } = require('ethers');
      const bytes32 = ethers.id(ipfsHash);

      res.json({
        success: true,
        ipfsHash,
        bytes32,
        pinSize: response.data.PinSize,
      });
    } catch (error) {
      console.error('Boundary upload error:', error);
      res.status(500).json({
        error: 'Upload failed',
        message: error.message,
      });
    }
  }
);

/**
 * @route GET /api/ipfs/v2/health
 * @desc Check IPFS service health
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    pinataConfigured: !!(PINATA_API_KEY && PINATA_SECRET_KEY),
    gatewayUrl: process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs',
    timestamp: Date.now(),
  });
});

module.exports = router;
