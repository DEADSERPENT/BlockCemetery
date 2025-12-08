# Usage Guide

Complete user guide for Cemetery Manager V2.

## Table of Contents

- [Quick Start](#quick-start)
- [User Roles](#user-roles)
- [Common Workflows](#common-workflows)
- [Frontend Usage](#frontend-usage)
- [Command Line Operations](#command-line-operations)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

Get the system running in 5 minutes!

### Prerequisites

- Node.js 18+
- MetaMask browser extension
- Terminal/Command Prompt

### Installation (2 minutes)

```bash
# Clone repository
git clone <repository-url>
cd cemetery-blockchain

# Install all dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### Local Development (3 minutes)

**Terminal 1 - Blockchain:**
```bash
npx hardhat node
```

**Terminal 2 - Deploy Contract:**
```bash
npx hardhat run scripts/migrateToV2.js --network localhost
```

Save the contract address from output!

**Terminal 3 - Backend:**
```bash
cd backend && npm run dev
```

**Terminal 4 - Frontend:**
```bash
cd frontend && npm run dev
```

Open browser: **http://localhost:5173**

### MetaMask Setup

1. Add Hardhat Local network:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 1337 (or 31337)
   - Currency Symbol: ETH

2. Import test account:
   - Copy private key from Hardhat node output
   - MetaMask → Import Account → Paste key

## User Roles

### 1. Admin

**Can do:**
- Add new graveyards
- Grant roles to other users
- Manage system configuration

**Example: Add Graveyard**
```javascript
// 1. Upload boundary to IPFS
const boundary = {
  type: "Polygon",
  coordinates: [[[lon1, lat1], [lon2, lat2], ...]]
};

const response = await fetch('http://localhost:3000/api/ipfs/v2/upload-boundary', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ boundary })
});

const { bytes32: boundaryHash } = await response.json();

// 2. Add graveyard on contract
const tx = await contract.addGraveyardWithGPS(
  ownerAddress,
  "Green Valley Memorial",
  "123 Cemetery Road, City",
  100,                    // number of plots
  40748817,               // latitude * 1e6
  -73985428,              // longitude * 1e6
  boundaryHash,
  10000                   // area in sq meters
);

await tx.wait();
```

### 2. Graveyard Manager

**Can do:**
- Add graves to assigned graveyards
- Update grave information

**Example: Add Grave**
```javascript
const priceInEth = "0.05";
const priceInWei = ethers.parseEther(priceInEth);

const tx = await contract.addGraveWithGPS(
  graveyardId,
  priceInWei,
  40748900,         // grave latitude * 1e6
  -73985500,        // grave longitude * 1e6
  locationHash      // IPFS hash of detailed location
);

await tx.wait();
```

### 3. Regular User

**Can do:**
- Browse graveyards
- View available graves
- Reserve graves
- Update burial records (own graves only)
- Maintain graves (own graves only)

## Common Workflows

### Workflow 1: Reserve a Grave

**Step 1: Browse Available Graves**

Using The Graph (recommended):
```javascript
const { data } = useQuery(gql`
  query {
    graves(where: { reserved: false }) {
      id
      price
      graveyard {
        name
        location
      }
    }
  }
`);
```

Or direct contract query:
```javascript
const grave = await contract.getGraveInfo(graveId);
if (!grave.reserved) {
  // Grave is available
}
```

**Step 2: Prepare Burial Metadata**

```javascript
import { encryptionManager, hashForSearch } from './utils/encryption';

// 1. Create metadata
const metadata = {
  deceasedName: "John Doe",
  birthDate: "1950-01-01",
  deathDate: "2024-01-15",
  epitaph: "Beloved husband and father",
  additionalInfo: {
    religion: "...",
    nationality: "..."
  }
};

// 2. Encrypt metadata (client-side only!)
const encrypted = await encryptionManager.encryptBurialMetadata(
  graveId,
  metadata
);

// encrypted = { encrypted: [...], iv: [...] }
```

**Step 3: Upload to IPFS**

```javascript
const response = await fetch('http://localhost:3000/api/ipfs/v2/upload-metadata', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: encrypted })
});

const { bytes32: metadataHash } = await response.json();
```

**Step 4: Create Searchable Name Hash**

```javascript
const nameHash = await hashForSearch("John Doe");
```

**Step 5: Reserve on Blockchain**

```javascript
const grave = await contract.getGraveInfo(graveId);
const burialDate = Math.floor(new Date("2024-01-15").getTime() / 1000);

const tx = await contract.reserveGrave(
  graveId,
  metadataHash,
  nameHash,
  burialDate,
  { value: grave.price }
);

const receipt = await tx.wait();
console.log("Grave reserved! Transaction:", receipt.hash);
```

**Step 6: Verify Reservation**

```javascript
const updatedGrave = await contract.getGraveInfo(graveId);
console.log("Reserved:", updatedGrave.reserved);  // true
console.log("Owner:", updatedGrave.owner);         // your address
```

### Workflow 2: Search for a Burial

**Using Privacy-Preserving Search:**

```javascript
import { hashForSearch } from './utils/encryption';

// 1. Hash the name you're searching for
const nameHash = await hashForSearch("John Doe");

// 2. Search on-chain
const graveIds = await contract.searchByDeceasedName(nameHash);

// 3. Get grave details
for (const id of graveIds) {
  const grave = await contract.getGraveInfo(id);
  console.log("Found grave:", id, "in graveyard:", grave.graveyardId);
}
```

**Using The Graph (faster):**

```javascript
const { data } = useQuery(gql`
  query SearchGraves($nameHash: Bytes!) {
    graves(where: { deceasedNameHash: $nameHash }) {
      id
      graveyard {
        name
        location
      }
      burialDate
    }
  }
`, {
  variables: { nameHash }
});
```

### Workflow 3: Retrieve Burial Information

**Step 1: Get Grave Info**

```javascript
const grave = await contract.getGraveInfo(graveId);
const metadataHash = grave.metadataHash;
```

**Step 2: Retrieve from IPFS**

```javascript
import { ipfsHashManager } from './utils/ipfsHelpers';

// Get original CID from stored mapping
const cid = ipfsHashManager.retrieveCIDFromContract(metadataHash);

// Fetch from IPFS
const response = await fetch(`http://localhost:3000/api/ipfs/v2/${cid}`);
const { data: encryptedData } = await response.json();
```

**Step 3: Decrypt Metadata**

```javascript
import { encryptionManager } from './utils/encryption';

const metadata = await encryptionManager.decryptBurialMetadata(
  graveId,
  encryptedData.encrypted,
  encryptedData.iv
);

console.log("Deceased:", metadata.deceasedName);
console.log("Birth Date:", metadata.birthDate);
console.log("Epitaph:", metadata.epitaph);
```

**Note:** You must have the encryption key (stored in localStorage) to decrypt!

### Workflow 4: Update Burial Record

**Only grave owner can update.**

```javascript
// 1. Prepare updated metadata
const updatedMetadata = {
  ...originalMetadata,
  epitaph: "Updated epitaph text"
};

// 2. Encrypt
const encrypted = await encryptionManager.encryptBurialMetadata(
  graveId,
  updatedMetadata
);

// 3. Upload to IPFS
const { bytes32: newMetadataHash } = await uploadToIPFS(encrypted);

// 4. Update on blockchain
const newNameHash = await hashForSearch(updatedMetadata.deceasedName);
const burialDate = Math.floor(new Date(updatedMetadata.deathDate).getTime() / 1000);

const tx = await contract.updateBurialRecord(
  graveId,
  newMetadataHash,
  newNameHash,
  burialDate
);

await tx.wait();
```

### Workflow 5: Share Access with Family

**Export Key:**

```javascript
const key = await encryptionManager.exportKeyForGrave(graveId);

// Share this key securely with family members
// (e.g., via encrypted email, password manager, etc.)
console.log("Share this key:", JSON.stringify(key));
```

**Import Key (on another device):**

```javascript
const sharedKey = /* key received from owner */;

await encryptionManager.importKeyForGrave(graveId, sharedKey);

// Now you can decrypt burial records
const metadata = await encryptionManager.decryptBurialMetadata(
  graveId,
  encryptedData.encrypted,
  encryptedData.iv
);
```

### Workflow 6: Withdraw Payments (Graveyard Owner)

```javascript
// 1. Check pending balance
const pending = await contract.pendingWithdrawals(myAddress);
console.log("Pending:", ethers.formatEther(pending), "ETH");

// 2. Withdraw
if (pending > 0) {
  const tx = await contract.withdraw();
  await tx.wait();
  console.log("Withdrawn!");
}
```

## Frontend Usage

### Connect Wallet

```javascript
import { useWeb3 } from './context/Web3Context';

function MyComponent() {
  const { connect, account, contract } = useWeb3();

  return (
    <button onClick={connect}>
      {account ? `Connected: ${account}` : 'Connect Wallet'}
    </button>
  );
}
```

### Display Graveyards (using GraphQL)

```javascript
import { useQuery, gql } from '@apollo/client';

const GET_GRAVEYARDS = gql`
  query {
    graveyards(orderBy: createdAt, orderDirection: desc) {
      id
      name
      location
      latitude
      longitude
      graves(where: { reserved: false }) {
        id
      }
    }
  }
`;

function GraveyardsList() {
  const { loading, data } = useQuery(GET_GRAVEYARDS, {
    pollInterval: 5000  // Refresh every 5 seconds
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {data.graveyards.map(g => (
        <div key={g.id}>
          <h3>{g.name}</h3>
          <p>{g.location}</p>
          <p>GPS: {g.latitude / 1e6}, {g.longitude / 1e6}</p>
          <p>Available graves: {g.graves.length}</p>
        </div>
      ))}
    </div>
  );
}
```

### Display Map with Leaflet

```javascript
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

function GraveyardMap({ graveyard }) {
  const position = [
    graveyard.latitude / 1e6,
    graveyard.longitude / 1e6
  ];

  return (
    <MapContainer center={position} zoom={15} style={{ height: '400px' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      <Marker position={position}>
        <Popup>{graveyard.name}</Popup>
      </Marker>
    </MapContainer>
  );
}
```

### Analytics Dashboard

```javascript
const GET_ANALYTICS = gql`
  query {
    globalStats(id: "1") {
      totalGraveyards
      totalGraves
      totalReserved
      totalRevenue
      averagePrice
    }
  }
`;

function AnalyticsDashboard() {
  const { data } = useQuery(GET_ANALYTICS);
  const stats = data?.globalStats;

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard title="Total Graveyards" value={stats?.totalGraveyards} />
      <StatCard title="Total Graves" value={stats?.totalGraves} />
      <StatCard title="Reserved" value={stats?.totalReserved} />
      <StatCard
        title="Total Revenue"
        value={ethers.formatEther(stats?.totalRevenue || 0) + " ETH"}
      />
    </div>
  );
}
```

## Command Line Operations

### Run Tests

```bash
# All tests
npx hardhat test

# V2 tests only
npx hardhat test test/CemeteryManagerV2.test.js

# With gas reporting
REPORT_GAS=true npx hardhat test

# With coverage
npx hardhat coverage
```

### Deploy Contract

```bash
# Local
npx hardhat run scripts/migrateToV2.js --network localhost

# Sepolia testnet
npx hardhat run scripts/migrateToV2.js --network sepolia

# Mainnet (CAUTION!)
npx hardhat run scripts/migrateToV2.js --network mainnet
```

### Verify Contract

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Interact via Console

```bash
npx hardhat console --network sepolia
```

```javascript
// In console
const contract = await ethers.getContractAt("CemeteryManagerV2", "0xADDRESS");
const analytics = await contract.getAnalytics();
console.log(analytics);
```

### Check Gas Prices

```bash
# View current gas prices on Etherscan
# https://etherscan.io/gastracker
```

## Best Practices

### Security

**1. Never Share Private Keys**
- Private keys = full account access
- Store in .env, never commit to Git
- Use hardware wallet for mainnet

**2. Client-Side Encryption Only**
```javascript
// ✅ GOOD: Encrypt in browser
const encrypted = await encryptData(metadata, key);
await uploadToIPFS(encrypted);

// ❌ BAD: Send plaintext to server
await fetch('/api/encrypt', { body: metadata });
```

**3. Verify Transactions**
```javascript
// Always show transaction details before signing
console.log("Reserving grave:", graveId);
console.log("Price:", ethers.formatEther(price), "ETH");
// User clicks "Confirm" in MetaMask
```

**4. Handle Key Loss**
```javascript
// Export encryption keys regularly
const keys = encryptionManager.exportAll();
// Store securely (password manager, encrypted backup)
```

### Gas Optimization

**1. Batch Operations**
```javascript
// Instead of multiple transactions:
await contract.addGrave(1, ...);
await contract.addGrave(2, ...);
await contract.addGrave(3, ...);

// Consider adding batch function if adding many graves
```

**2. Check Gas Before Transactions**
```javascript
const gasEstimate = await contract.reserveGrave.estimateGas(
  graveId,
  metadataHash,
  nameHash,
  burialDate,
  { value: price }
);

console.log("Estimated gas:", gasEstimate.toString());
```

**3. Use The Graph for Queries**
```javascript
// ✅ Fast, free, no gas
const { data } = useQuery(GET_GRAVEYARDS);

// ❌ Slow, costs gas (for write operations only)
const grave = await contract.getGraveInfo(id);
```

### Data Management

**1. Store CID Mappings**
```javascript
// Always store when uploading to IPFS
ipfsHashManager.storeCIDMapping(cid, bytes32);

// Export periodically
const mappings = ipfsHashManager.exportAll();
// Backup somewhere safe
```

**2. Backup Encryption Keys**
```javascript
// Export all grave keys
const keys = {};
for (let graveId = 1; graveId <= myGraveCount; graveId++) {
  keys[graveId] = await encryptionManager.exportKeyForGrave(graveId);
}

// Store encrypted backup
```

**3. Use IPFS Pinning Service**
```
- Pinata (recommended): 1GB free
- Web3.Storage: Unlimited free
- Infura: Paid plans
```

## Troubleshooting

### Common Issues

**Issue: "Cannot read property 'abi' of undefined"**
```
Solution:
1. Ensure contract ABI is imported correctly
2. Check file path: import ABI from '../contracts/CemeteryManagerV2.json'
3. Verify artifacts exist: npm run compile
```

**Issue: "Transaction failed"**
```
Solution:
1. Check you have enough ETH for gas + price
2. Verify grave is not already reserved
3. Check MetaMask is on correct network
4. Look at error message in MetaMask
```

**Issue: "CID not found"**
```
Solution:
The IPFS hash mapping is stored locally. Either:
1. Use the same browser/device, or
2. Export and import mappings:
   const mappings = ipfsHashManager.exportAll();
   // On new device:
   ipfsHashManager.importAll(mappings);
```

**Issue: "Decryption failed"**
```
Solution:
Encryption keys are device-specific. Either:
1. Use the same device, or
2. Import the key:
   const key = await encryptionManager.exportKeyForGrave(graveId);
   // On new device:
   await encryptionManager.importKeyForGrave(graveId, key);
```

**Issue: "GraphQL queries return empty"**
```
Solution:
1. Wait for subgraph to sync (check indexing status)
2. Verify contract has activity (check Etherscan)
3. Check subgraph URL is correct in .env
```

**Issue: "Rate limit exceeded"**
```
Solution:
Backend has rate limits:
- General: 100 req/min
- Uploads: 50 req/min
- Metadata: 30 req/min
Wait and try again.
```

### Getting Help

1. **Check logs:**
   - Browser console (F12)
   - Backend terminal
   - Hardhat node terminal

2. **Review documentation:**
   - [API Reference](API_REFERENCE.md)
   - [Architecture](ARCHITECTURE.md)
   - [Deployment Guide](DEPLOYMENT.md)

3. **Test suite:**
   - Run tests to verify everything works
   - `npx hardhat test test/CemeteryManagerV2.test.js`

4. **GitHub Issues:**
   - Search existing issues
   - Open new issue with details

---

**Next Steps:**
- [Deploy to Testnet](DEPLOYMENT.md)
- [Review API Reference](API_REFERENCE.md)
- [Understand Architecture](ARCHITECTURE.md)
