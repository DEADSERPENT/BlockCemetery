# Changelog

All notable changes to Cemetery Manager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Emergency pause mechanism
- MultiSig wallet integration
- NFT integration (ERC-721)
- Subscription model for maintenance
- Layer 2 deployment (Polygon/Arbitrum)

## [2.0.0] - 2025-01-15

### Added

#### Smart Contract (CemeteryManagerV2)
- **O(1) Analytics**: Constant-time analytics using state counters instead of loops
  - `reservedGravesCount`, `maintainedGravesCount`, `totalPriceSum`
  - Gas cost: Always ~34.7k regardless of data size
  - Prevents DoS attacks from unbounded loops
- **bytes32 Storage**: IPFS hashes stored as bytes32 instead of string
  - 75% gas savings on hash fields (~15-20k gas per operation)
  - `locationHash`, `metadataHash`, `boundaryHash` now bytes32
- **Off-Chain Boundary Storage**: GeoJSON boundaries stored on IPFS
  - Only bytes32 hash stored on-chain
  - 33% gas savings on graveyard creation (130k gas)
  - Unlimited boundary complexity without gas concerns
- **Privacy-Preserving Search**: Hash-based deceased name search
  - `searchByDeceasedName(bytes32 nameHash)` function
  - Names not stored in plaintext on-chain
  - `deceasedNameHash` field in Grave struct
- **Enhanced Events**: All events now indexed for efficient filtering
  - `graveyardId` indexed in GraveReserved event
  - Enables fast subgraph queries
- **Burial Date Tracking**: Unix timestamp for burial dates
  - `burialDate` field in Grave struct
  - Enables time-based analytics

#### Frontend Utilities
- **IPFS Helpers** (`frontend/src/utils/ipfsHelpers.js`)
  - `cidToBytes32()`: Convert IPFS CID to bytes32
  - `IPFSHashManager`: Manage CID ↔ bytes32 mappings
  - `storeCIDMapping()`, `retrieveCIDFromContract()`
  - LocalStorage persistence for mappings
- **Encryption Utilities** (`frontend/src/utils/encryption.js`)
  - Client-side AES-GCM encryption (256-bit keys)
  - Web Crypto API integration
  - `EncryptionManager` class for key management
  - `encryptBurialMetadata()`, `decryptBurialMetadata()`
  - `hashForSearch()` for privacy-preserving name search
  - Key export/import for sharing with family

#### Backend
- **Caching Layer** (`backend/src/utils/cache.js`)
  - Redis support with in-memory fallback
  - 10-minute TTL for IPFS fetches
  - Target: 80%+ cache hit rate
- **Input Validation** (`backend/src/middleware/validation.js`)
  - IPFS hash format validation
  - Metadata structure validation
  - File size limits (10MB max)
  - XSS prevention via sanitization
- **Rate Limiting**
  - General endpoints: 100 requests/minute
  - Upload endpoints: 50 requests/minute
  - Metadata uploads: 30 requests/minute
- **V2 IPFS Routes** (`backend/src/routes/ipfsV2.js`)
  - POST `/api/ipfs/v2/upload-metadata`: Upload encrypted metadata
  - POST `/api/ipfs/v2/upload-boundary`: Upload GeoJSON boundaries
  - GET `/api/ipfs/v2/:hash`: Fetch from IPFS (cached)
  - GET `/api/ipfs/v2/health`: Health check endpoint
  - Returns both `ipfsHash` (CID) and `bytes32` for contract use

#### The Graph Subgraph
- **Complete Schema** (`subgraph/schema.graphql`)
  - 9 entities: Graveyard, Grave, Reservation, User, GlobalStats, etc.
  - Derived fields for relationships
  - BigInt for all numeric values
- **Event Mappings** (`subgraph/src/mapping.ts`)
  - handleGraveyardAdded
  - handleGraveAdded
  - handleGraveReserved
  - handleGraveMaintained
  - handleBurialRecordUpdated
- **Example Queries**
  - Get all graveyards with available graves
  - User reservations
  - Global analytics
  - Search by various filters

#### Testing
- **Comprehensive Test Suite** (`test/CemeteryManagerV2.test.js`)
  - 32 tests covering all V2 features
  - Gas cost verification
  - Analytics O(1) complexity verification
  - Encryption/decryption tests
  - IPFS hash conversion tests
  - All tests passing ✅

#### Documentation
- **Complete Documentation Suite**
  - `README.md`: Project overview with V2 highlights
  - `docs/DEPLOYMENT.md`: Complete deployment guide
  - `docs/ARCHITECTURE.md`: Technical architecture
  - `docs/API_REFERENCE.md`: Full API documentation
  - `docs/USAGE.md`: User guide and workflows
  - `docs/ROADMAP.md`: Future development plans
  - `SECURITY.md`: Security policy and best practices
  - `CHANGELOG.md`: This file
  - `CODE_OF_CONDUCT.md`: Community guidelines

#### Scripts
- **Migration Script** (`scripts/migrateToV2.js`)
  - Automated V2 deployment
  - V1 data export to JSON
  - Deployment info saving
  - Boundary migration instructions

### Changed

#### Smart Contract Breaking Changes
- **Grave struct**: `locationHash` and `metadataHash` changed from `string` to `bytes32`
- **Graveyard struct**: `boundary` removed, replaced with `boundaryHash` (bytes32)
- **reserveGrave()**: Now requires `bytes32 _metadataHash`, `bytes32 _deceasedNameHash`, `uint256 _burialDate`
  - Old signature: `reserveGrave(uint256 _graveId, string _metadataHash)`
  - New signature: `reserveGrave(uint256 _graveId, bytes32 _metadataHash, bytes32 _deceasedNameHash, uint256 _burialDate)`
- **getAnalytics()**: Return type changed to include new fields
  - Added: `totalReserved`, `totalMaintained`, `averagePrice`
  - All values computed from state counters (O(1))

#### Gas Costs
- **Increased**: reserveGrave now costs more (~337k vs ~180k in V1)
  - Includes analytics counter updates
  - Additional metadata (nameHash, burialDate)
- **Decreased**: addGraveyardWithGPS with large boundaries (~270k vs 400k+ in V1)
  - 33% savings from off-chain boundary storage
- **Constant**: getAnalytics always ~34.7k (vs 50k-200k+ in V1)
  - Infinite scalability improvement

### Deprecated
- **V1 Contract**: CemeteryManager.sol
  - All V1 deployments should migrate to V2
  - V1 will not receive updates
  - Migration guide provided in documentation

### Security
- **Client-Side Encryption**: Zero-trust architecture
  - Platform cannot decrypt user data
  - Keys stored only on user's device
  - AES-256-GCM encryption
- **ReentrancyGuard**: All payment functions protected
- **AccessControl**: Role-based permissions enforced
- **Input Validation**: All contract inputs validated
- **Rate Limiting**: DoS protection on backend API
- **Pull Payment Pattern**: Secure fund withdrawal mechanism

### Performance
- **Analytics Scalability**: O(1) complexity enables:
  - Real-time dashboards with no performance degradation
  - Works with millions of graves
  - No risk of exceeding block gas limit
- **Subgraph Integration**: Query times <100ms
  - vs 10-30 seconds for RPC calls
  - Complex filtering and sorting
  - Real-time updates

## [1.0.0] - 2024-12-01

### Added
- Initial release
- Basic cemetery management
- Smart contract for grave allocation
- Frontend with React
- Backend API
- IPFS integration
- MetaMask integration
- Interactive maps with Leaflet

### Known Issues
- Analytics function uses loops (O(N) complexity)
- String storage for IPFS hashes (expensive)
- Raw GeoJSON stored on-chain (400k+ gas)
- No client-side encryption
- Limited privacy features

## Migration Guide: V1 to V2

### Breaking Changes

**Smart Contract:**
```javascript
// V1
await contract.reserveGrave(graveId, "QmMetadataHash");

// V2
const bytes32Hash = cidToBytes32("QmMetadataHash");
const nameHash = await hashForSearch("Deceased Name");
const burialDate = Math.floor(new Date().getTime() / 1000);
await contract.reserveGrave(graveId, bytes32Hash, nameHash, burialDate);
```

**Frontend:**
```javascript
// V1
import CemeteryManager from './contracts/CemeteryManager.json';

// V2
import CemeteryManagerV2 from './contracts/CemeteryManagerV2.json';
import { ipfsHashManager } from './utils/ipfsHelpers';
import { encryptionManager } from './utils/encryption';
```

**Backend:**
```javascript
// V1
POST /api/ipfs/upload

// V2
POST /api/ipfs/v2/upload-metadata
POST /api/ipfs/v2/upload-boundary
```

### Migration Steps

1. **Deploy V2 Contract**
   ```bash
   npx hardhat run scripts/migrateToV2.js --network sepolia
   ```

2. **Export V1 Data** (if applicable)
   - Script generates `migration-data.json`
   - Contains all V1 graveyards and graves

3. **Upload Boundaries to IPFS**
   - Use `/api/ipfs/v2/upload-boundary` endpoint
   - Get bytes32 hashes for contract

4. **Recreate Graveyards in V2**
   - Use bytes32 hashes from IPFS uploads
   - Call `addGraveyardWithGPS()` with new parameters

5. **Update Frontend**
   - Install new dependencies: `npm install bs58`
   - Copy utility files
   - Update contract ABI import
   - Convert all string hashes to bytes32
   - Implement client-side encryption

6. **Update Backend**
   - Copy new route files
   - Install dependencies: `npm install redis validator`
   - Update environment variables

7. **Deploy Subgraph**
   - Follow subgraph deployment guide
   - Configure with V2 contract address

8. **Test Thoroughly**
   - Test all workflows
   - Verify analytics work correctly
   - Test encryption/decryption
   - Verify IPFS integration

## Version Numbering

We use [Semantic Versioning](https://semver.org/):

- **MAJOR** version: Incompatible API changes (e.g., 1.0.0 → 2.0.0)
- **MINOR** version: Backwards-compatible functionality (e.g., 2.0.0 → 2.1.0)
- **PATCH** version: Backwards-compatible bug fixes (e.g., 2.1.0 → 2.1.1)

## Links

- **Repository**: https://github.com/DEADSERPENT/cemetery-blockchain
- **Documentation**: [docs/](docs/)
- **Security**: [SECURITY.md](SECURITY.md)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)

---

**Note:** This changelog follows the Keep a Changelog format. Each version lists changes in categories: Added, Changed, Deprecated, Removed, Fixed, and Security.
