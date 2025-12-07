/**
 * IPFS Helper Utilities for CemeteryManagerV2
 * Converts between IPFS CID strings and bytes32 for gas-efficient storage
 */

import { ethers } from 'ethers';

/**
 * Convert IPFS CID to bytes32 for storage in smart contract
 * @param {string} cid - IPFS CID (v0 or v1)
 * @returns {string} bytes32 representation
 *
 * Note: For production, this uses keccak256 hash of the CID.
 * In a real-world scenario, you'd want to decode base58/base32 and store the actual hash.
 */
export function cidToBytes32(cid) {
  if (!cid || cid === '') {
    return ethers.ZeroHash;
  }

  // For CIDv0 (Qm...) and CIDv1, we hash the string
  // This is a simplified approach - production should decode the CID properly
  return ethers.id(cid);
}

/**
 * Convert bytes32 back to IPFS CID
 * @param {string} bytes32Hash - bytes32 from contract
 * @param {string} originalCid - Original CID (needed because hashing is one-way)
 * @returns {string} IPFS CID
 *
 * IMPORTANT: Because we use keccak256, we need to store the original CID off-chain
 * and use bytes32 only for verification. The frontend should maintain a mapping.
 */
export function bytes32ToCid(bytes32Hash, originalCid) {
  // Verify the hash matches
  if (cidToBytes32(originalCid) === bytes32Hash) {
    return originalCid;
  }
  throw new Error('Hash mismatch - invalid CID');
}

/**
 * Alternative: Store IPFS hash components directly
 * For CIDv0, we can extract the multihash and store it as bytes32
 * This requires base58 decoding
 */
import bs58 from 'bs58';

/**
 * Convert IPFS CIDv0 to bytes32 (proper method)
 * @param {string} cid - IPFS CIDv0 (Qm...)
 * @returns {string} bytes32 representation of the multihash
 */
export function cidV0ToBytes32Proper(cid) {
  if (!cid || !cid.startsWith('Qm')) {
    throw new Error('Invalid CIDv0 format');
  }

  try {
    // Decode base58
    const decoded = bs58.decode(cid);

    // Remove the first 2 bytes (multihash prefix: 0x1220 for sha256)
    // Keep only the 32-byte hash
    const hashBytes = decoded.slice(2);

    // Convert to hex string
    return '0x' + Buffer.from(hashBytes).toString('hex');
  } catch (error) {
    console.error('Error decoding CID:', error);
    // Fallback to simple hash
    return ethers.id(cid);
  }
}

/**
 * Convert bytes32 back to IPFS CIDv0 (proper method)
 * @param {string} bytes32Hash - bytes32 from contract
 * @returns {string} IPFS CIDv0
 */
export function bytes32ToCidV0Proper(bytes32Hash) {
  try {
    // Remove '0x' prefix
    const hashHex = bytes32Hash.replace('0x', '');

    // Add multihash prefix (0x1220 = sha256)
    const multihash = Buffer.from('1220' + hashHex, 'hex');

    // Encode to base58
    return bs58.encode(multihash);
  } catch (error) {
    console.error('Error encoding to CID:', error);
    throw error;
  }
}

/**
 * Simplified approach for the project:
 * Store CID -> bytes32 mapping in localStorage/database
 */
class IPFSHashManager {
  constructor() {
    this.storageKey = 'ipfs_hash_mapping';
  }

  /**
   * Store CID and its bytes32 hash
   */
  storeCIDMapping(cid, bytes32Hash) {
    const mappings = this.getAllMappings();
    mappings[bytes32Hash] = cid;
    localStorage.setItem(this.storageKey, JSON.stringify(mappings));
  }

  /**
   * Get CID from bytes32 hash
   */
  getCIDFromHash(bytes32Hash) {
    const mappings = this.getAllMappings();
    return mappings[bytes32Hash] || null;
  }

  /**
   * Get all mappings
   */
  getAllMappings() {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : {};
  }

  /**
   * Clear all mappings
   */
  clearMappings() {
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Convert and store CID for contract use
   */
  prepareCIDForContract(cid) {
    const bytes32Hash = cidToBytes32(cid);
    this.storeCIDMapping(cid, bytes32Hash);
    return bytes32Hash;
  }

  /**
   * Retrieve CID from contract bytes32
   */
  retrieveCIDFromContract(bytes32Hash) {
    return this.getCIDFromHash(bytes32Hash);
  }
}

export const ipfsHashManager = new IPFSHashManager();

/**
 * Fetch content from IPFS using CID
 * @param {string} cid - IPFS CID
 * @param {string} gatewayUrl - IPFS gateway URL (default: ipfs.io)
 * @returns {Promise<any>} Content from IPFS
 */
export async function fetchFromIPFS(cid, gatewayUrl = 'https://ipfs.io/ipfs/') {
  try {
    const response = await fetch(`${gatewayUrl}${cid}`);

    if (!response.ok) {
      throw new Error(`IPFS fetch failed: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  } catch (error) {
    console.error('Error fetching from IPFS:', error);
    throw error;
  }
}

/**
 * Upload content to IPFS via Pinata API
 * @param {any} content - Content to upload (JSON object or string)
 * @param {string} pinataApiKey - Pinata API key
 * @param {string} pinataSecretKey - Pinata secret key
 * @returns {Promise<string>} IPFS CID
 */
export async function uploadToIPFS(content, pinataApiKey, pinataSecretKey) {
  const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

  const body = typeof content === 'string'
    ? { pinataContent: { data: content } }
    : { pinataContent: content };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.IpfsHash;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
}

/**
 * Upload and prepare CID for contract
 * @param {any} content - Content to upload
 * @param {string} pinataApiKey - Pinata API key
 * @param {string} pinataSecretKey - Pinata secret key
 * @returns {Promise<{cid: string, bytes32: string}>} CID and bytes32 hash
 */
export async function uploadAndPrepareForContract(content, pinataApiKey, pinataSecretKey) {
  const cid = await uploadToIPFS(content, pinataApiKey, pinataSecretKey);
  const bytes32 = ipfsHashManager.prepareCIDForContract(cid);

  return { cid, bytes32 };
}

/**
 * Fetch content from contract bytes32 hash
 * @param {string} bytes32Hash - bytes32 from contract
 * @param {string} gatewayUrl - IPFS gateway URL
 * @returns {Promise<any>} Content from IPFS
 */
export async function fetchFromContractHash(bytes32Hash, gatewayUrl = 'https://ipfs.io/ipfs/') {
  const cid = ipfsHashManager.retrieveCIDFromContract(bytes32Hash);

  if (!cid) {
    throw new Error('CID not found in local storage. Cannot retrieve content.');
  }

  return await fetchFromIPFS(cid, gatewayUrl);
}

export default {
  cidToBytes32,
  bytes32ToCid,
  cidV0ToBytes32Proper,
  bytes32ToCidV0Proper,
  ipfsHashManager,
  fetchFromIPFS,
  uploadToIPFS,
  uploadAndPrepareForContract,
  fetchFromContractHash,
};
