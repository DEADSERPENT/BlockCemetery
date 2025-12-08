# Security Policy

## Supported Versions

| Version | Supported | Status |
|---------|-----------|--------|
| 2.0.x | ✅ Yes | Current, Production-Ready (Testnet) |
| 1.0.x | ❌ No | Deprecated |

## Reporting a Vulnerability

**IMPORTANT:** Please do NOT open public GitHub issues for security vulnerabilities!

### How to Report

**Email:** samarthsmg14@gmail.com

**Subject:** `[SECURITY] Brief description`

**Include:**
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

**Response Time:**
- Acknowledgment: Within 48 hours
- Initial assessment: Within 7 days
- Fix timeline: Depends on severity

### Severity Levels

**Critical:**
- Loss of funds
- Unauthorized access to all data
- Contract takeover
- Response: Immediate (24-48 hours)

**High:**
- Partial loss of funds
- Data exposure
- DoS affecting all users
- Response: 1-2 weeks

**Medium:**
- Limited DoS
- Information disclosure
- Logic errors
- Response: 2-4 weeks

**Low:**
- Minor issues
- Best practice violations
- Response: As resources allow

### Responsible Disclosure

We follow responsible disclosure:

1. **You report** the vulnerability privately
2. **We acknowledge** and investigate
3. **We fix** the issue
4. **We deploy** the fix to mainnet
5. **We publish** advisory (with your credit, if desired)
6. **You publish** details after 90 days

### Bug Bounty

**Status:** Not yet implemented

**Planned:**
- Critical: $500 - $5,000
- High: $250 - $2,500
- Medium: $100 - $1,000
- Low: Recognition only

Bounty program to launch after mainnet deployment.

## Security Features

### Smart Contract Security

#### Access Control

```solidity
// OpenZeppelin AccessControl
bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
bytes32 public constant GRAVEYARD_MANAGER_ROLE = keccak256("GRAVEYARD_MANAGER_ROLE");

// Admin-only functions
function addGraveyardWithGPS(...) external onlyRole(ADMIN_ROLE) { }

// Manager-only functions
function addGraveWithGPS(...) external onlyRole(GRAVEYARD_MANAGER_ROLE) { }
```

**Security Measures:**
- Default admin set at deployment
- Roles can only be granted by admins
- Role checks on all sensitive functions
- Events emitted for role changes

#### Reentrancy Protection

```solidity
// OpenZeppelin ReentrancyGuard
function withdraw() external nonReentrant {
    uint256 amount = pendingWithdrawals[msg.sender];
    require(amount > 0, "No funds");

    // Checks-Effects-Interactions pattern
    pendingWithdrawals[msg.sender] = 0;  // Effect first
    (bool success, ) = payable(msg.sender).call{value: amount}("");  // Interaction last
    require(success, "Transfer failed");
}
```

**Protection Against:**
- Reentrancy attacks
- Cross-function reentrancy
- Read-only reentrancy

#### Integer Overflow

```solidity
// Solidity 0.8.20 has built-in overflow protection
reservedGravesCount++;  // Reverts on overflow
totalRevenue += amount;  // Safe
```

**Note:** One potential issue identified:
```solidity
// TODO: Add explicit check
totalPriceSum += _price;  // Could overflow with billions of graves
```

#### Input Validation

All functions validate inputs:

```solidity
require(_graveId > 0 && _graveId < _graveIdCounter.current(), "Invalid ID");
require(msg.value == grave.price, "Incorrect payment");
require(!grave.reserved, "Already reserved");
require(_price > 0, "Price must be positive");
```

#### Pull Payment Pattern

```solidity
// Pull over push for withdrawals
mapping(address => uint256) public pendingWithdrawals;

function reserveGrave(...) external payable {
    // Credit graveyard owner
    pendingWithdrawals[graveyard.owner] += msg.value;
}

function withdraw() external {
    // User pulls their funds
    uint256 amount = pendingWithdrawals[msg.sender];
    pendingWithdrawals[msg.sender] = 0;
    payable(msg.sender).call{value: amount}("");
}
```

**Benefits:**
- No external calls in main logic
- User controls timing of withdrawal
- Reduces attack surface

### Client-Side Encryption

**Zero-Trust Architecture:**

```javascript
// ✅ GOOD: Encrypt in browser
const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
);

const encrypted = await encryptData(metadata, key);
await uploadToIPFS(encrypted);

// ❌ BAD: Never do this
await fetch('/api/encrypt', { body: plaintext });
```

**Security Properties:**
- AES-256-GCM encryption
- Web Crypto API (browser native)
- Keys stored in localStorage (user device only)
- Platform cannot decrypt data
- IV generated with crypto.getRandomValues()

**Key Management:**
```javascript
// Export for backup/sharing
const key = await encryptionManager.exportKeyForGrave(graveId);
// Store securely (password manager, encrypted backup)

// Import on new device
await encryptionManager.importKeyForGrave(graveId, key);
```

### Backend Security

#### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// General endpoints: 100 requests/minute
app.use('/api', rateLimit({
  windowMs: 60 * 1000,
  max: 100
}));

// Upload endpoints: 50 requests/minute
app.use('/api/ipfs/v2/upload', rateLimit({
  windowMs: 60 * 1000,
  max: 50
}));
```

**Protection Against:**
- DoS attacks
- Brute force attempts
- Resource exhaustion

#### Input Validation

```javascript
const { body, validationResult } = require('express-validator');

router.post('/upload-metadata',
  body('data').isObject(),
  body('data.encrypted').isArray(),
  body('data.iv').isArray(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process request
  }
);
```

#### File Upload Restrictions

```javascript
// Max file size: 10MB
const MAX_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = ['application/json', 'application/geo+json'];

// XSS prevention
const sanitize = require('validator').escape;
```

#### CORS Configuration

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true
}));
```

### Frontend Security

#### XSS Protection

```javascript
// React escapes by default ✅
<div>{userInput}</div>

// NEVER do this with user input ❌
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

#### CSRF Protection

Not needed - using wallet signatures for authentication.

#### Secure Key Storage

```javascript
// Keys in localStorage (acceptable for prototype)
// TODO: Consider hardware wallet for production

// Always warn users
console.warn("Clearing browser data will delete encryption keys!");
```

### Infrastructure Security

#### Environment Variables

```bash
# .env file (NEVER commit!)
PRIVATE_KEY=0x...
SEPOLIA_RPC_URL=https://...
ETHERSCAN_API_KEY=...
PINATA_API_KEY=...
PINATA_SECRET_KEY=...
```

**Checklist:**
- [ ] .env in .gitignore ✅
- [ ] Different keys for dev/prod ✅
- [ ] Keys rotated regularly
- [ ] No keys in client-side code ✅

#### IPFS Security

```javascript
// Always encrypt before uploading
const encrypted = await encryptData(sensitiveData, key);
await uploadToIPFS(encrypted);

// Never upload plaintext sensitive data
// ❌ await uploadToIPFS(sensitiveData);
```

## Security Checklist

### Pre-Deployment

**Smart Contract:**
- [ ] All tests passing (32/32)
- [ ] No compiler warnings
- [ ] Gas costs acceptable
- [ ] Access control verified
- [ ] Reentrancy protection confirmed
- [ ] Input validation on all functions
- [ ] Events emitted for all state changes
- [ ] No unbounded loops

**Backend:**
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] File size limits enforced
- [ ] CORS configured correctly
- [ ] No sensitive data logged
- [ ] Environment variables secured

**Frontend:**
- [ ] Client-side encryption only
- [ ] No private keys in code
- [ ] XSS protection (React defaults)
- [ ] Wallet connection secure
- [ ] Transaction details shown before signing

**Infrastructure:**
- [ ] .env files not committed
- [ ] API keys rotated
- [ ] Monitoring setup
- [ ] Backup strategy defined
- [ ] Incident response plan ready

### Pre-Mainnet (CRITICAL)

- [ ] **Professional security audit completed** ($20k-100k)
- [ ] All critical issues fixed
- [ ] High/medium issues addressed
- [ ] Audit report published
- [ ] Re-audit after fixes
- [ ] Legal review completed
- [ ] MultiSig wallet setup (Gnosis Safe)
- [ ] Emergency pause mechanism tested
- [ ] Tested on testnet for 30+ days
- [ ] Monitoring infrastructure ready
- [ ] Team trained on incident response
- [ ] Insurance obtained (if applicable)

## Known Issues

### Identified

**1. totalPriceSum Overflow (Low Priority)**

**Issue:** `totalPriceSum` could overflow with billions of graves.

**Impact:** Analytics would show incorrect average price.

**Mitigation:** Unlikely in practice (2^256 is huge), but could add check:

```solidity
function addGraveWithGPS(...) external {
    require(totalPriceSum + _price >= totalPriceSum, "Price sum overflow");
    totalPriceSum += _price;
    // ...
}
```

**Status:** Under review

**2. GPS Coordinate Bounds (Low Priority)**

**Issue:** No validation on latitude/longitude bounds.

**Valid Ranges:**
- Latitude: -90,000,000 to 90,000,000 (scaled)
- Longitude: -180,000,000 to 180,000,000 (scaled)

**Impact:** Invalid coordinates could be stored.

**Mitigation:** Add validation:

```solidity
require(_latitude >= -90000000 && _latitude <= 90000000, "Invalid latitude");
require(_longitude >= -180000000 && _longitude <= 180000000, "Invalid longitude");
```

**Status:** Planned for v2.1

**3. Front-Running (Accepted Risk)**

**Issue:** User A tries to reserve grave, User B front-runs with higher gas.

**Impact:** User A's transaction fails, User B gets the grave.

**Mitigation:** Accept as expected behavior (first-come-first-serve).

**Status:** Expected behavior, not a bug

## Audit History

**V2.0.0:**
- **Status:** Not yet audited
- **Recommendation:** Required before mainnet deployment
- **Estimated Cost:** $20k-100k
- **Recommended Firms:**
  - OpenZeppelin ($50k-100k)
  - Trail of Bits ($40k-80k)
  - Consensys Diligence ($30k-60k)
  - CertiK ($20k-50k)

## Security Best Practices for Users

### Wallet Security

1. **Never share private keys**
   - Not with support
   - Not via email/chat
   - Not on websites

2. **Use hardware wallet for mainnet**
   - Ledger
   - Trezor
   - Keep seed phrase offline

3. **Verify transaction details**
   - Check contract address
   - Verify amounts
   - Review gas fees
   - Double-check recipient

### Encryption Key Management

1. **Backup encryption keys**
```javascript
const keys = encryptionManager.exportAll();
// Store in password manager or encrypted backup
```

2. **Share keys securely**
   - Use encrypted channels
   - Never via plain email
   - Consider key splitting

3. **Key loss = data loss**
   - No recovery possible
   - Platform cannot help
   - Backup is essential

### IPFS Data

1. **Always encrypt sensitive data**
2. **Verify IPFS hashes match**
3. **Use pinning service**
4. **Keep CID mappings backed up**

### General

1. **Keep software updated**
2. **Use strong passwords**
3. **Enable 2FA where available**
4. **Be wary of phishing**
5. **Verify contract addresses**

## Incident Response

### If You Discover a Vulnerability

1. **DO NOT exploit it**
2. **Report privately to samarthsmg14@gmail.com**
3. **Wait for response**
4. **Coordinate disclosure**

### If You're Affected

1. **Stop using the affected feature**
2. **Monitor your transactions**
3. **Wait for official fix**
4. **Update to patched version**

### Our Response Plan

1. **Assess severity**
2. **Develop fix**
3. **Test thoroughly**
4. **Deploy to testnet**
5. **Deploy to mainnet (if needed)**
6. **Notify affected users**
7. **Publish post-mortem**

## Security Resources

**Documentation:**
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethereum Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [Solidity Security Considerations](https://docs.soliditylang.org/en/latest/security-considerations.html)

**Tools:**
- [Slither](https://github.com/crytic/slither) - Static analysis
- [Mythril](https://github.com/ConsenSys/mythril) - Security analysis
- [Echidna](https://github.com/crytic/echidna) - Fuzzing

**Monitoring:**
- [OpenZeppelin Defender](https://defender.openzeppelin.com/)
- [Tenderly](https://tenderly.co/)
- [Etherscan Alerts](https://etherscan.io/)

## Contact

**Security Issues:** samarthsmg14@gmail.com

**General Support:** GitHub Issues

**Please report security issues privately!**

---

**Last Updated:** January 2025

**Next Review:** After security audit
