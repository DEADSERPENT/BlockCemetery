# API Reference

Complete API documentation for Cemetery Manager V2.

## Table of Contents

- [Smart Contract API](#smart-contract-api)
- [Backend API](#backend-api)
- [GraphQL API (The Graph)](#graphql-api)
- [Frontend Utilities](#frontend-utilities)

## Smart Contract API

**Contract Address:** See `deployment-v2-info.json` after deployment

**Network:** Sepolia Testnet (for testing) | Ethereum Mainnet (production)

### Administrative Functions

#### addGraveyardWithGPS

Add a new graveyard with GPS coordinates.

```solidity
function addGraveyardWithGPS(
    address _owner,
    string memory _name,
    string memory _location,
    uint256 _numPlots,
    int256 _latitude,
    int256 _longitude,
    bytes32 _boundaryHash,
    uint256 _area
) external onlyRole(ADMIN_ROLE) returns (uint256)
```

**Parameters:**
- `_owner` (address): Owner of the graveyard
- `_name` (string): Name of the graveyard
- `_location` (string): Physical location/address
- `_numPlots` (uint256): Number of plots available
- `_latitude` (int256): Latitude × 1,000,000 (e.g., 40.748817 → 40748817)
- `_longitude` (int256): Longitude × 1,000,000 (e.g., -73.985428 → -73985428)
- `_boundaryHash` (bytes32): IPFS hash of GeoJSON boundary
- `_area` (uint256): Area in square meters

**Returns:** `uint256` - Graveyard ID

**Events Emitted:** `GraveyardAdded`

**Gas Cost:** ~268k

**Access:** Admin only

**Example:**
```javascript
const tx = await contract.addGraveyardWithGPS(
  "0xOwnerAddress",
  "Green Valley Memorial",
  "123 Cemetery Road, City, State",
  100,
  40748817,   // 40.748817° N
  -73985428,  // -73.985428° W
  boundaryBytes32,
  10000
);
```

#### addGraveWithGPS

Add a new grave to a graveyard.

```solidity
function addGraveWithGPS(
    uint256 _graveyardId,
    uint256 _price,
    int256 _latitude,
    int256 _longitude,
    bytes32 _locationHash
) external onlyRole(GRAVEYARD_MANAGER_ROLE) returns (uint256)
```

**Parameters:**
- `_graveyardId` (uint256): ID of the graveyard
- `_price` (uint256): Price in wei
- `_latitude` (int256): Grave latitude × 1,000,000
- `_longitude` (int256): Grave longitude × 1,000,000
- `_locationHash` (bytes32): IPFS hash of detailed GPS data

**Returns:** `uint256` - Grave ID

**Events Emitted:** `GraveAdded`

**Gas Cost:** 264k-339k

**Access:** Graveyard Manager role

**Example:**
```javascript
const priceInWei = ethers.parseEther("0.05"); // 0.05 ETH

const tx = await contract.addGraveWithGPS(
  1,              // graveyardId
  priceInWei,
  40748900,
  -73985500,
  locationBytes32
);
```

#### grantRole

Grant a role to an address (OpenZeppelin AccessControl).

```solidity
function grantRole(bytes32 role, address account) external
```

**Parameters:**
- `role` (bytes32): Role identifier (ADMIN_ROLE, GRAVEYARD_MANAGER_ROLE)
- `account` (address): Address to grant role to

**Access:** Admin only

**Example:**
```javascript
const MANAGER_ROLE = ethers.id("GRAVEYARD_MANAGER_ROLE");
await contract.grantRole(MANAGER_ROLE, "0xManagerAddress");
```

### User Functions

#### reserveGrave

Reserve a grave with payment.

```solidity
function reserveGrave(
    uint256 _graveId,
    bytes32 _metadataHash,
    bytes32 _deceasedNameHash,
    uint256 _burialDate
) external payable nonReentrant
```

**Parameters:**
- `_graveId` (uint256): ID of the grave to reserve
- `_metadataHash` (bytes32): IPFS hash of encrypted burial metadata
- `_deceasedNameHash` (bytes32): Hash of deceased name (for privacy-preserving search)
- `_burialDate` (uint256): Burial date as Unix timestamp

**Payment:** `msg.value` must equal grave price

**Events Emitted:** `GraveReserved`

**Gas Cost:** 237k-377k (includes analytics tracking)

**Access:** Public

**Example:**
```javascript
const grave = await contract.getGraveInfo(graveId);
const price = grave.price;

// Encrypt metadata first
const encrypted = await encryptMetadata(graveId, metadata);

// Upload to IPFS
const { bytes32: metadataHash } = await uploadToIPFS(encrypted);

// Create searchable name hash
const nameHash = await hashForSearch("John Doe");

// Reserve
const tx = await contract.reserveGrave(
  graveId,
  metadataHash,
  nameHash,
  Math.floor(new Date("2024-01-15").getTime() / 1000),
  { value: price }
);
```

#### maintainGrave

Mark a grave as maintained.

```solidity
function maintainGrave(uint256 _graveId) external
```

**Parameters:**
- `_graveId` (uint256): ID of the grave

**Events Emitted:** `GraveMaintained`

**Gas Cost:** 32k-57k

**Access:** Grave owner only

**Example:**
```javascript
await contract.maintainGrave(graveId);
```

#### updateBurialRecord

Update burial record metadata.

```solidity
function updateBurialRecord(
    uint256 _graveId,
    bytes32 _metadataHash,
    bytes32 _deceasedNameHash,
    uint256 _burialDate
) external
```

**Parameters:**
- `_graveId` (uint256): ID of the grave
- `_metadataHash` (bytes32): New IPFS hash
- `_deceasedNameHash` (bytes32): New name hash
- `_burialDate` (uint256): New burial date

**Events Emitted:** `BurialRecordUpdated`

**Access:** Grave owner only

**Example:**
```javascript
const newMetadataHash = await uploadUpdatedMetadata(graveId, newData);
const newNameHash = await hashForSearch("Updated Name");

await contract.updateBurialRecord(
  graveId,
  newMetadataHash,
  newNameHash,
  newBurialTimestamp
);
```

#### withdraw

Withdraw pending payments (pull payment pattern).

```solidity
function withdraw() external nonReentrant
```

**Events Emitted:** `PaymentWithdrawn`

**Access:** Anyone with pending withdrawals

**Example:**
```javascript
const pending = await contract.pendingWithdrawals(myAddress);
if (pending > 0) {
  await contract.withdraw();
}
```

### View Functions

#### getAnalytics

Get system-wide analytics (O(1) constant gas).

```solidity
function getAnalytics() external view returns (AnalyticsData memory)
```

**Returns:**
```solidity
struct AnalyticsData {
    uint256 totalGraveyards;
    uint256 totalGraves;
    uint256 totalReserved;
    uint256 totalMaintained;
    uint256 totalRevenue;
    uint256 averagePrice;
}
```

**Gas Cost:** ~34.7k (constant)

**Example:**
```javascript
const analytics = await contract.getAnalytics();
console.log("Total Reserved:", analytics.totalReserved.toString());
console.log("Average Price:", ethers.formatEther(analytics.averagePrice));
```

#### getGraveyardInfo

Get graveyard details.

```solidity
function getGraveyardInfo(uint256 _graveyardId)
    external view returns (Graveyard memory)
```

**Parameters:**
- `_graveyardId` (uint256): Graveyard ID

**Returns:**
```solidity
struct Graveyard {
    uint256 id;
    address owner;
    string name;
    string location;
    uint256 numPlots;
    int256 latitude;
    int256 longitude;
    bytes32 boundaryHash;
    uint256 area;
    bool active;
    uint256 createdAt;
}
```

**Example:**
```javascript
const graveyard = await contract.getGraveyardInfo(1);
console.log("Name:", graveyard.name);
console.log("GPS:", graveyard.latitude / 1e6, graveyard.longitude / 1e6);
```

#### getGraveInfo

Get grave details.

```solidity
function getGraveInfo(uint256 _graveId)
    external view returns (Grave memory)
```

**Returns:**
```solidity
struct Grave {
    uint256 id;
    uint256 graveyardId;
    bytes32 locationHash;
    bytes32 metadataHash;
    uint256 price;
    bool reserved;
    address owner;
    bool maintained;
    bytes32 deceasedNameHash;
    uint256 burialDate;
    uint256 createdAt;
}
```

**Example:**
```javascript
const grave = await contract.getGraveInfo(42);
console.log("Price:", ethers.formatEther(grave.price), "ETH");
console.log("Reserved:", grave.reserved);
```

#### searchByDeceasedName

Search graves by deceased name hash.

```solidity
function searchByDeceasedName(bytes32 _nameHash)
    external view returns (uint256[] memory)
```

**Parameters:**
- `_nameHash` (bytes32): Hash of the name to search for

**Returns:** `uint256[]` - Array of grave IDs

**Example:**
```javascript
const nameHash = await hashForSearch("John Doe");
const graveIds = await contract.searchByDeceasedName(nameHash);
console.log("Found graves:", graveIds);
```

#### isAdmin

Check if an address has admin role.

```solidity
function isAdmin(address _account) external view returns (bool)
```

**Example:**
```javascript
const isUserAdmin = await contract.isAdmin(userAddress);
```

### Events

#### GraveyardAdded
```solidity
event GraveyardAdded(
    uint256 indexed graveyardId,
    address indexed owner,
    string name,
    string location,
    int256 latitude,
    int256 longitude
);
```

#### GraveAdded
```solidity
event GraveAdded(
    uint256 indexed graveId,
    uint256 indexed graveyardId,
    uint256 price,
    int256 latitude,
    int256 longitude
);
```

#### GraveReserved
```solidity
event GraveReserved(
    uint256 indexed graveId,
    uint256 indexed graveyardId,
    address indexed reservedBy,
    uint256 price,
    uint256 timestamp
);
```

#### GraveMaintained
```solidity
event GraveMaintained(
    uint256 indexed graveId,
    address indexed maintainedBy,
    uint256 timestamp
);
```

#### BurialRecordUpdated
```solidity
event BurialRecordUpdated(
    uint256 indexed graveId,
    bytes32 newMetadataHash,
    uint256 timestamp
);
```

## Backend API

**Base URL:** `http://localhost:3000/api` (development) | `https://your-domain.com/api` (production)

**Content-Type:** `application/json`

### IPFS Endpoints

#### Upload Metadata

Upload encrypted burial metadata to IPFS.

```http
POST /ipfs/v2/upload-metadata
```

**Request Body:**
```json
{
  "data": {
    "encrypted": [1, 2, 3, ...],  // Array of encrypted bytes
    "iv": [4, 5, 6, ...],          // Initialization vector
    "graveId": 42
  }
}
```

**Response:**
```json
{
  "success": true,
  "ipfsHash": "QmXYZ123...",
  "bytes32": "0xabc123...",
  "timestamp": 1234567890
}
```

**Rate Limit:** 30 requests/minute

**Example:**
```javascript
const response = await fetch('http://localhost:3000/api/ipfs/v2/upload-metadata', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: {
      encrypted: encryptedData,
      iv: initializationVector,
      graveId: 42
    }
  })
});

const { ipfsHash, bytes32 } = await response.json();
```

#### Upload Boundary

Upload GeoJSON boundary to IPFS.

```http
POST /ipfs/v2/upload-boundary
```

**Request Body:**
```json
{
  "boundary": {
    "type": "Polygon",
    "coordinates": [[[lon1, lat1], [lon2, lat2], ...]]
  }
}
```

**Response:**
```json
{
  "success": true,
  "ipfsHash": "QmBoundary123...",
  "bytes32": "0xdef456...",
  "size": 4567
}
```

**Rate Limit:** 50 requests/minute

**Max Size:** 10MB

**Example:**
```javascript
const geoJSON = {
  type: "Polygon",
  coordinates: [
    [
      [-73.985, 40.748],
      [-73.984, 40.748],
      [-73.984, 40.749],
      [-73.985, 40.749],
      [-73.985, 40.748]
    ]
  ]
};

const response = await fetch('http://localhost:3000/api/ipfs/v2/upload-boundary', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ boundary: geoJSON })
});

const { bytes32 } = await response.json();
```

#### Fetch from IPFS

Fetch data from IPFS by hash (cached).

```http
GET /ipfs/v2/:hash
```

**Parameters:**
- `hash` (string): IPFS CID (e.g., `QmXYZ123...`)

**Response:**
```json
{
  "success": true,
  "data": { /* Original JSON data */ },
  "cached": true
}
```

**Cache TTL:** 10 minutes

**Example:**
```javascript
const response = await fetch(`http://localhost:3000/api/ipfs/v2/${ipfsHash}`);
const { data } = await response.json();
```

#### Health Check

Check API and IPFS configuration status.

```http
GET /ipfs/v2/health
```

**Response:**
```json
{
  "success": true,
  "pinataConfigured": true,
  "gatewayUrl": "https://gateway.pinata.cloud/ipfs/",
  "timestamp": 1234567890
}
```

**Example:**
```javascript
const response = await fetch('http://localhost:3000/api/ipfs/v2/health');
const status = await response.json();
```

### Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Invalid data format"
}
```

**413 Payload Too Large:**
```json
{
  "success": false,
  "error": "File size exceeds 10MB limit"
}
```

**429 Too Many Requests:**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again later."
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "IPFS upload failed"
}
```

## GraphQL API

**Endpoint:** Get from The Graph Studio after deployment

**Example:** `https://api.studio.thegraph.com/query/<ID>/cemetery-manager-v2/v0.1.0`

### Queries

#### Get All Graveyards

```graphql
query {
  graveyards(
    first: 10
    skip: 0
    orderBy: createdAt
    orderDirection: desc
  ) {
    id
    name
    location
    latitude
    longitude
    owner
    active
    createdAt
    graves {
      id
      reserved
    }
  }
}
```

#### Get Available Graves

```graphql
query AvailableGraves($minPrice: BigInt, $maxPrice: BigInt) {
  graves(
    where: {
      reserved: false
      price_gte: $minPrice
      price_lte: $maxPrice
    }
    orderBy: price
  ) {
    id
    price
    graveyard {
      name
      location
    }
  }
}
```

**Variables:**
```json
{
  "minPrice": "10000000000000000",
  "maxPrice": "100000000000000000"
}
```

#### Get User Reservations

```graphql
query UserReservations($userAddress: Bytes!) {
  reservations(
    where: { reservedBy: $userAddress }
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    grave {
      id
      graveyard {
        name
        location
      }
    }
    amount
    timestamp
    transactionHash
  }
}
```

**Variables:**
```json
{
  "userAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
}
```

#### Get Global Analytics

```graphql
query Analytics {
  globalStats(id: "1") {
    totalGraveyards
    totalGraves
    totalReserved
    totalRevenue
    averagePrice
  }
}
```

#### Get Graveyard Details

```graphql
query Graveyard($id: ID!) {
  graveyard(id: $id) {
    id
    name
    location
    latitude
    longitude
    boundaryHash
    owner
    active
    createdAt
    graves {
      id
      price
      reserved
      owner
    }
    reservedCount
    totalRevenue
  }
}
```

### Entities

#### Graveyard
```graphql
type Graveyard @entity {
  id: ID!
  owner: Bytes!
  name: String!
  location: String!
  latitude: BigInt!
  longitude: BigInt!
  boundaryHash: Bytes!
  active: Boolean!
  createdAt: BigInt!
  graves: [Grave!]! @derivedFrom(field: "graveyard")
  reservedCount: BigInt!
  totalRevenue: BigInt!
}
```

#### Grave
```graphql
type Grave @entity {
  id: ID!
  graveyard: Graveyard!
  locationHash: Bytes!
  price: BigInt!
  reserved: Boolean!
  owner: Bytes
  createdAt: BigInt!
}
```

#### Reservation
```graphql
type Reservation @entity {
  id: ID!
  grave: Grave!
  reservedBy: Bytes!
  amount: BigInt!
  timestamp: BigInt!
  transactionHash: Bytes!
}
```

## Frontend Utilities

### IPFS Helpers

**Import:**
```javascript
import {
  ipfsHashManager,
  cidToBytes32,
  uploadAndPrepareForContract
} from './utils/ipfsHelpers';
```

#### cidToBytes32

Convert IPFS CID to bytes32 for contract use.

```javascript
function cidToBytes32(cid: string): string
```

**Example:**
```javascript
const bytes32 = cidToBytes32("QmXYZ123...");
// "0xabc123..."
```

#### IPFSHashManager.storeCIDMapping

Store CID ↔ bytes32 mapping in localStorage.

```javascript
ipfsHashManager.storeCIDMapping(cid: string, bytes32: string): void
```

**Example:**
```javascript
ipfsHashManager.storeCIDMapping("QmXYZ123...", "0xabc123...");
```

#### IPFSHashManager.retrieveCIDFromContract

Retrieve CID from bytes32 hash.

```javascript
ipfsHashManager.retrieveCIDFromContract(bytes32: string): string | null
```

**Example:**
```javascript
const cid = ipfsHashManager.retrieveCIDFromContract("0xabc123...");
// "QmXYZ123..." or null
```

#### uploadAndPrepareForContract

Upload data to IPFS and prepare for contract.

```javascript
async function uploadAndPrepareForContract(
  data: object,
  pinataApiKey: string,
  pinataSecretKey: string
): Promise<{ cid: string, bytes32: string }>
```

**Example:**
```javascript
const { cid, bytes32 } = await uploadAndPrepareForContract(
  { encrypted: [...], iv: [...] },
  PINATA_API_KEY,
  PINATA_SECRET_KEY
);
```

### Encryption Utilities

**Import:**
```javascript
import {
  encryptionManager,
  hashForSearch,
  encryptData,
  decryptData
} from './utils/encryption';
```

#### encryptionManager.generateKeyForGrave

Generate encryption key for a specific grave.

```javascript
async function generateKeyForGrave(graveId: number): Promise<CryptoKey>
```

**Example:**
```javascript
const key = await encryptionManager.generateKeyForGrave(42);
```

#### encryptionManager.encryptBurialMetadata

Encrypt burial metadata.

```javascript
async function encryptBurialMetadata(
  graveId: number,
  metadata: object
): Promise<{ encrypted: number[], iv: number[] }>
```

**Example:**
```javascript
const encrypted = await encryptionManager.encryptBurialMetadata(42, {
  deceasedName: "John Doe",
  birthDate: "1950-01-01",
  deathDate: "2024-01-15",
  epitaph: "Beloved husband and father"
});
```

#### encryptionManager.decryptBurialMetadata

Decrypt burial metadata.

```javascript
async function decryptBurialMetadata(
  graveId: number,
  encrypted: number[],
  iv: number[]
): Promise<object>
```

**Example:**
```javascript
const metadata = await encryptionManager.decryptBurialMetadata(
  42,
  encrypted,
  iv
);
```

#### hashForSearch

Create searchable hash of a name.

```javascript
async function hashForSearch(name: string): Promise<string>
```

**Example:**
```javascript
const nameHash = await hashForSearch("John Doe");
// "0xdef456..."
```

#### encryptionManager.exportKeyForGrave

Export encryption key for sharing.

```javascript
async function exportKeyForGrave(graveId: number): Promise<object>
```

**Example:**
```javascript
const exportedKey = await encryptionManager.exportKeyForGrave(42);
// Share exportedKey with family members
```

#### encryptionManager.importKeyForGrave

Import encryption key.

```javascript
async function importKeyForGrave(graveId: number, keyData: object): Promise<void>
```

**Example:**
```javascript
await encryptionManager.importKeyForGrave(42, exportedKey);
```

---

**Questions?** See [Architecture](ARCHITECTURE.md) for system design details.

**Examples?** Check the test files in `test/` directory for usage examples.
