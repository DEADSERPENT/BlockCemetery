const express = require('express');
const multer = require('multer');
const CryptoJS = require('crypto-js');
const axios = require('axios');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_API_URL = 'https://api.pinata.cloud';

/**
 * @route POST /api/ipfs/upload
 * @desc Upload encrypted metadata to IPFS via Pinata
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { data, encrypt } = req.body;

    let contentToUpload = data;

    // Encrypt if requested
    if (encrypt === 'true' && process.env.ENCRYPTION_KEY) {
      contentToUpload = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        process.env.ENCRYPTION_KEY
      ).toString();
    }

    // If file is provided, use file instead
    if (req.file) {
      contentToUpload = req.file.buffer.toString('base64');
    }

    // Upload to Pinata
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      // Fallback: return mock IPFS hash for development
      const mockHash = 'Qm' + CryptoJS.SHA256(contentToUpload).toString().substring(0, 44);
      return res.json({
        success: true,
        ipfsHash: mockHash,
        message: 'Mock IPFS hash (Pinata not configured)'
      });
    }

    const formData = new FormData();
    const blob = new Blob([contentToUpload], { type: 'application/json' });
    formData.append('file', blob);

    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    res.json({
      success: true,
      ipfsHash: response.data.IpfsHash,
      pinSize: response.data.PinSize,
      timestamp: response.data.Timestamp
    });
  } catch (error) {
    console.error('IPFS upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/ipfs/:hash
 * @desc Retrieve and optionally decrypt data from IPFS
 */
router.get('/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const { decrypt } = req.query;

    // Fetch from IPFS gateway
    const ipfsGateway = process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
    const response = await axios.get(`${ipfsGateway}/${hash}`);

    let data = response.data;

    // Decrypt if requested
    if (decrypt === 'true' && process.env.ENCRYPTION_KEY) {
      try {
        const bytes = CryptoJS.AES.decrypt(data, process.env.ENCRYPTION_KEY);
        data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      } catch (decryptError) {
        return res.status(400).json({ error: 'Decryption failed' });
      }
    }

    res.json({
      success: true,
      hash,
      data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/ipfs/upload-metadata
 * @desc Upload burial metadata (structured)
 */
router.post('/upload-metadata', async (req, res) => {
  try {
    const metadata = req.body;

    // Validate required fields
    if (!metadata.graveId) {
      return res.status(400).json({ error: 'graveId is required' });
    }

    // Encrypt sensitive data
    const encryptedMetadata = {
      graveId: metadata.graveId,
      timestamp: Date.now(),
      data: CryptoJS.AES.encrypt(
        JSON.stringify(metadata),
        process.env.ENCRYPTION_KEY || 'default-key'
      ).toString()
    };

    // Mock upload for development
    const mockHash = 'Qm' + CryptoJS.SHA256(JSON.stringify(encryptedMetadata))
      .toString()
      .substring(0, 44);

    res.json({
      success: true,
      ipfsHash: mockHash,
      message: 'Metadata uploaded (mock mode)'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
