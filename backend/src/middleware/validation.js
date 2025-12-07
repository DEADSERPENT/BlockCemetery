/**
 * Validation Middleware for API Routes
 * Prevents malicious uploads and validates input
 */

const validator = require('validator');

/**
 * Validate IPFS hash format
 */
function isValidIPFSHash(hash) {
  // CIDv0: Qm followed by 44 base58 characters
  const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  // CIDv1: bafy... or other prefixes
  const cidv1Regex = /^b[a-z2-7]{58,}$/;

  return cidv0Regex.test(hash) || cidv1Regex.test(hash);
}

/**
 * Validate metadata structure
 */
function validateMetadata(metadata) {
  const errors = [];

  // Check required fields
  if (!metadata.graveId || typeof metadata.graveId !== 'number') {
    errors.push('graveId must be a valid number');
  }

  // Validate optional text fields
  if (metadata.deceasedName && typeof metadata.deceasedName !== 'string') {
    errors.push('deceasedName must be a string');
  }

  if (metadata.epitaph && typeof metadata.epitaph !== 'string') {
    errors.push('epitaph must be a string');
  }

  // Check string lengths to prevent abuse
  if (metadata.deceasedName && metadata.deceasedName.length > 200) {
    errors.push('deceasedName is too long (max 200 characters)');
  }

  if (metadata.epitaph && metadata.epitaph.length > 1000) {
    errors.push('epitaph is too long (max 1000 characters)');
  }

  // Validate dates
  if (metadata.birthDate && !validator.isISO8601(String(metadata.birthDate))) {
    errors.push('birthDate must be a valid date');
  }

  if (metadata.deathDate && !validator.isISO8601(String(metadata.deathDate))) {
    errors.push('deathDate must be a valid date');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate file upload
 */
function validateFileUpload(file) {
  const errors = [];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/json',
  ];

  if (!file) {
    return { valid: true, errors: [] }; // File is optional
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    errors.push(`File type ${file.mimetype} is not allowed`);
  }

  // Check for malicious content in filename
  if (file.originalname.includes('..') || file.originalname.includes('/')) {
    errors.push('Invalid filename');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Rate limiting map (in-memory)
 * Production should use Redis for distributed rate limiting
 */
const rateLimitMap = new Map();

/**
 * Simple rate limiter middleware
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 */
function rateLimiter(maxRequests = 100, windowMs = 60000) {
  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimitMap.has(identifier)) {
      rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    const record = rateLimitMap.get(identifier);

    if (now > record.resetTime) {
      // Reset window
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
    }

    record.count++;
    next();
  };
}

/**
 * Cleanup rate limit map periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime + 60000) {
      // Clean up records older than 1 minute past reset
      rateLimitMap.delete(key);
    }
  }
}, 60000);

/**
 * Middleware to validate IPFS upload request
 */
function validateIPFSUpload(req, res, next) {
  const errors = [];

  // Check if data or file is provided
  if (!req.body.data && !req.file) {
    errors.push('Either data or file must be provided');
  }

  // Validate file if provided
  if (req.file) {
    const fileValidation = validateFileUpload(req.file);
    if (!fileValidation.valid) {
      errors.push(...fileValidation.errors);
    }
  }

  // Validate data size if JSON
  if (req.body.data) {
    try {
      const dataSize = JSON.stringify(req.body.data).length;
      const MAX_JSON_SIZE = 1024 * 1024; // 1MB

      if (dataSize > MAX_JSON_SIZE) {
        errors.push(`JSON data exceeds maximum size of ${MAX_JSON_SIZE / 1024}KB`);
      }
    } catch (e) {
      errors.push('Invalid JSON data');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors,
    });
  }

  next();
}

/**
 * Middleware to validate metadata upload
 */
function validateMetadataUpload(req, res, next) {
  const validation = validateMetadata(req.body);

  if (!validation.valid) {
    return res.status(400).json({
      error: 'Metadata validation failed',
      details: validation.errors,
    });
  }

  next();
}

/**
 * Middleware to validate IPFS hash parameter
 */
function validateIPFSHashParam(req, res, next) {
  const { hash } = req.params;

  if (!isValidIPFSHash(hash)) {
    return res.status(400).json({
      error: 'Invalid IPFS hash format',
    });
  }

  next();
}

/**
 * Sanitize user input to prevent XSS
 */
function sanitizeInput(input) {
  if (typeof input === 'string') {
    return validator.escape(input);
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input;
}

/**
 * Middleware to sanitize request body
 */
function sanitizeRequestBody(req, res, next) {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  next();
}

module.exports = {
  isValidIPFSHash,
  validateMetadata,
  validateFileUpload,
  validateIPFSUpload,
  validateMetadataUpload,
  validateIPFSHashParam,
  rateLimiter,
  sanitizeInput,
  sanitizeRequestBody,
};
