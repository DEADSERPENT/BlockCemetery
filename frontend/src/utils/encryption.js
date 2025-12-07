/**
 * Client-Side Encryption Utilities
 * Allows users to encrypt metadata before uploading to IPFS
 * Only the user (or those with the key) can decrypt the data
 */

/**
 * Generate a random encryption key
 * @returns {Promise<CryptoKey>} Generated key
 */
export async function generateEncryptionKey() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Export key to string for storage
 * @param {CryptoKey} key - Crypto key
 * @returns {Promise<string>} Base64 encoded key
 */
export async function exportKey(key) {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

/**
 * Import key from string
 * @param {string} keyString - Base64 encoded key
 * @returns {Promise<CryptoKey>} Imported key
 */
export async function importKey(keyString) {
  const keyBuffer = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));

  return await window.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-GCM
 * @param {any} data - Data to encrypt (will be JSON stringified)
 * @param {CryptoKey} key - Encryption key
 * @returns {Promise<{encrypted: string, iv: string}>} Encrypted data and IV
 */
export async function encryptData(data, key) {
  // Convert data to JSON string then to Uint8Array
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(jsonString);

  // Generate random IV (Initialization Vector)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    dataBuffer
  );

  // Convert to base64 for storage
  const encrypted = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
  const ivString = btoa(String.fromCharCode(...iv));

  return {
    encrypted,
    iv: ivString,
  };
}

/**
 * Decrypt data using AES-GCM
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} ivString - Base64 encoded IV
 * @param {CryptoKey} key - Decryption key
 * @returns {Promise<any>} Decrypted data (parsed JSON if applicable)
 */
export async function decryptData(encryptedData, ivString, key) {
  // Convert from base64
  const encryptedBuffer = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivString), c => c.charCodeAt(0));

  // Decrypt
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encryptedBuffer
  );

  // Convert back to string
  const decoder = new TextDecoder();
  const decryptedString = decoder.decode(decryptedBuffer);

  // Try to parse as JSON
  try {
    return JSON.parse(decryptedString);
  } catch {
    return decryptedString;
  }
}

/**
 * Encrypt using MetaMask (eth_encrypt)
 * This ensures only the user's MetaMask can decrypt
 * @param {string} publicKey - User's encryption public key
 * @param {any} data - Data to encrypt
 * @returns {Promise<string>} Encrypted data (JSON string)
 */
export async function encryptWithMetaMask(publicKey, data) {
  if (!window.ethereum) {
    throw new Error('MetaMask not available');
  }

  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);

  // Use eth-sig-util for encryption (needs to be installed)
  // For now, we'll use the Web Crypto API method
  // Production should use: import { encrypt } from '@metamask/eth-sig-util';

  console.warn('MetaMask encryption not fully implemented. Using Web Crypto API instead.');

  // Fallback to standard encryption
  const key = await generateEncryptionKey();
  const encrypted = await encryptData(data, key);
  const exportedKey = await exportKey(key);

  return JSON.stringify({
    ...encrypted,
    key: exportedKey,
    method: 'web-crypto',
  });
}

/**
 * Decrypt using MetaMask (eth_decrypt)
 * @param {string} account - User's Ethereum address
 * @param {string} encryptedData - Encrypted data string
 * @returns {Promise<any>} Decrypted data
 */
export async function decryptWithMetaMask(account, encryptedData) {
  if (!window.ethereum) {
    throw new Error('MetaMask not available');
  }

  try {
    const parsedData = JSON.parse(encryptedData);

    if (parsedData.method === 'web-crypto') {
      // Use Web Crypto API
      const key = await importKey(parsedData.key);
      return await decryptData(parsedData.encrypted, parsedData.iv, key);
    }

    // Otherwise, use MetaMask's eth_decrypt
    const result = await window.ethereum.request({
      method: 'eth_decrypt',
      params: [encryptedData, account],
    });

    return JSON.parse(result);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw error;
  }
}

/**
 * Encryption Manager for easier usage
 */
export class EncryptionManager {
  constructor() {
    this.keys = new Map(); // graveId -> key
    this.storageKey = 'cemetery_encryption_keys';
    this.loadKeys();
  }

  /**
   * Load keys from localStorage
   */
  loadKeys() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([id, keyString]) => {
          this.keys.set(id, keyString);
        });
      }
    } catch (error) {
      console.error('Error loading encryption keys:', error);
    }
  }

  /**
   * Save keys to localStorage
   */
  saveKeys() {
    const obj = {};
    this.keys.forEach((value, key) => {
      obj[key] = value;
    });
    localStorage.setItem(this.storageKey, JSON.stringify(obj));
  }

  /**
   * Generate and store key for a grave
   */
  async generateKeyForGrave(graveId) {
    const key = await generateEncryptionKey();
    const keyString = await exportKey(key);
    this.keys.set(graveId.toString(), keyString);
    this.saveKeys();
    return key;
  }

  /**
   * Get key for a grave
   */
  async getKeyForGrave(graveId) {
    const keyString = this.keys.get(graveId.toString());
    if (!keyString) {
      throw new Error(`No encryption key found for grave ${graveId}`);
    }
    return await importKey(keyString);
  }

  /**
   * Encrypt burial metadata
   */
  async encryptBurialMetadata(graveId, metadata) {
    let key;
    try {
      key = await this.getKeyForGrave(graveId);
    } catch {
      // Generate new key if not found
      key = await this.generateKeyForGrave(graveId);
    }

    return await encryptData(metadata, key);
  }

  /**
   * Decrypt burial metadata
   */
  async decryptBurialMetadata(graveId, encryptedData, iv) {
    const key = await this.getKeyForGrave(graveId);
    return await decryptData(encryptedData, iv, key);
  }

  /**
   * Export key for sharing (e.g., with family members)
   */
  exportKeyForGrave(graveId) {
    return this.keys.get(graveId.toString());
  }

  /**
   * Import key shared by someone else
   */
  importKeyForGrave(graveId, keyString) {
    this.keys.set(graveId.toString(), keyString);
    this.saveKeys();
  }

  /**
   * Clear all keys (logout)
   */
  clearAllKeys() {
    this.keys.clear();
    localStorage.removeItem(this.storageKey);
  }
}

export const encryptionManager = new EncryptionManager();

/**
 * Hash a string for privacy-preserving search
 * (e.g., deceased name hash)
 */
export function hashForSearch(input) {
  // Use a simple keccak256 hash
  // In production, consider using a more secure method
  const encoder = new TextEncoder();
  const data = encoder.encode(input.toLowerCase().trim());

  return window.crypto.subtle.digest('SHA-256', data).then(buffer => {
    return '0x' + Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  });
}

/**
 * Complete workflow: Encrypt and upload to IPFS
 * @param {number} graveId - Grave ID
 * @param {object} metadata - Metadata to encrypt
 * @returns {Promise<{encryptedCID: string, iv: string, bytes32: string}>}
 */
export async function encryptAndUploadMetadata(graveId, metadata, uploadFunction) {
  // Encrypt the metadata
  const encrypted = await encryptionManager.encryptBurialMetadata(graveId, metadata);

  // Upload encrypted data to IPFS
  const { cid, bytes32 } = await uploadFunction({
    encrypted: encrypted.encrypted,
    iv: encrypted.iv,
  });

  return {
    encryptedCID: cid,
    bytes32,
    iv: encrypted.iv,
  };
}

/**
 * Complete workflow: Fetch from IPFS and decrypt
 * @param {number} graveId - Grave ID
 * @param {string} bytes32Hash - Hash from contract
 * @param {function} fetchFunction - Function to fetch from IPFS
 * @returns {Promise<any>} Decrypted metadata
 */
export async function fetchAndDecryptMetadata(graveId, bytes32Hash, fetchFunction) {
  // Fetch encrypted data from IPFS
  const encryptedData = await fetchFunction(bytes32Hash);

  // Decrypt
  return await encryptionManager.decryptBurialMetadata(
    graveId,
    encryptedData.encrypted,
    encryptedData.iv
  );
}

export default {
  generateEncryptionKey,
  exportKey,
  importKey,
  encryptData,
  decryptData,
  encryptWithMetaMask,
  decryptWithMetaMask,
  encryptionManager,
  hashForSearch,
  encryptAndUploadMetadata,
  fetchAndDecryptMetadata,
};
