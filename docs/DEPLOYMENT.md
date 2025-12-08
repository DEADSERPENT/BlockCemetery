# Deployment Guide

Complete deployment guide for Cemetery Manager V2, from local development to production mainnet deployment.

## Table of Contents

- [Quick Start](#quick-start)
- [Local Development](#local-development)
- [Testnet Deployment](#testnet-deployment)
- [The Graph Subgraph](#the-graph-subgraph)
- [Frontend Integration](#frontend-integration)
- [Backend Deployment](#backend-deployment)
- [Production Checklist](#production-checklist)
- [Mainnet Deployment](#mainnet-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Quick Start

**For testing V2 immediately:**

```bash
# 1. Run tests
npx hardhat test test/CemeteryManagerV2.test.js

# 2. Start local network
npx hardhat node

# 3. Deploy locally (in new terminal)
npx hardhat run scripts/migrateToV2.js --network localhost

# 4. Start backend
cd backend && npm run dev

# 5. Start frontend
cd frontend && npm run dev
```

Access at: `http://localhost:5173`

## Local Development

### Prerequisites

- Node.js 18+
- Git
- MetaMask browser extension

### Setup

1. **Clone and Install**

```bash
git clone <repository-url>
cd cemetery-blockchain
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

2. **Configure Environment**

Create `.env` in project root:

```bash
# Local development (optional)
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_PROJECT_ID"
PRIVATE_KEY="0xYOUR_PRIVATE_KEY"
```

3. **Start Hardhat Node**

```bash
npx hardhat node
```

Leaves running in terminal. You'll see 20 test accounts with 10,000 ETH each.

4. **Deploy Contracts**

In a new terminal:

```bash
npx hardhat run scripts/migrateToV2.js --network localhost
```

Save the contract address from output.

5. **Configure Frontend**

Edit `frontend/.env`:

```bash
VITE_CONTRACT_ADDRESS=<your_local_contract_address>
VITE_NETWORK=localhost
VITE_CHAIN_ID=31337
VITE_API_URL=http://localhost:3000/api
```

6. **Start Services**

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

Access at: `http://localhost:5173`

## Testnet Deployment

Deploy to Sepolia testnet for public testing.

### Phase 1: Prerequisites

#### 1.1 Get Testnet ETH

Visit a faucet to get 0.5 ETH on Sepolia:
- https://sepoliafaucet.com/ (recommended)
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia

**Required:** ~0.2 ETH for contract deployment + testing

#### 1.2 Get API Keys

**Infura or Alchemy (RPC Provider):**
1. Sign up at https://infura.io or https://alchemy.com
2. Create new project
3. Copy Project ID/API Key

**Etherscan (for verification):**
1. Sign up at https://etherscan.io
2. Go to API Keys
3. Create new key

**Pinata (for IPFS):**
1. Sign up at https://pinata.cloud
2. Get API Key and Secret Key

#### 1.3 Configure Environment

Create `.env` in project root:

```bash
# Network Configuration
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID"
PRIVATE_KEY="0xYOUR_PRIVATE_KEY_HERE"

# Etherscan (for verification)
ETHERSCAN_API_KEY="YOUR_ETHERSCAN_API_KEY"

# IPFS/Pinata
PINATA_API_KEY="YOUR_PINATA_API_KEY"
PINATA_SECRET_KEY="YOUR_PINATA_SECRET_KEY"
```

**⚠️ Security Warning:** NEVER commit `.env` to Git!

Verify `.gitignore` includes:
```
.env
.env.local
*.key
deployment-*.json
```

### Phase 2: Smart Contract Deployment

#### 2.1 Verify Configuration

Check `hardhat.config.js` has Sepolia configured:

```javascript
module.exports = {
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111
    }
  }
};
```

#### 2.2 Compile Contracts

```bash
npx hardhat clean
npx hardhat compile
```

Expected: No errors or warnings.

#### 2.3 Run Tests

```bash
npx hardhat test test/CemeteryManagerV2.test.js
```

Expected: **32/32 tests passing** ✅

#### 2.4 Deploy to Sepolia

```bash
npx hardhat run scripts/migrateToV2.js --network sepolia
```

**Expected Output:**

```
============================================================
Cemetery Manager V1 to V2 Migration Script
============================================================

Deploying contracts with account: 0xYourAddress
Account balance: 0.5 ETH

Step 1: Deploying CemeteryManagerV2...
✅ CemeteryManagerV2 deployed to: 0xNEW_CONTRACT_ADDRESS

✅ Deployment info saved to: deployment-v2-info.json
```

**⚠️ SAVE THIS FILE!** `deployment-v2-info.json` contains:
- Contract address
- Deployment block number
- Network information
- Deployer address

#### 2.5 Verify Contract

Make your contract publicly verifiable on Etherscan:

```bash
npx hardhat verify --network sepolia 0xYOUR_DEPLOYED_ADDRESS
```

Expected:
```
Successfully verified contract CemeteryManagerV2 on Etherscan.
https://sepolia.etherscan.io/address/0xYOUR_DEPLOYED_ADDRESS#code
```

**Benefits:**
- Users can read contract code
- Interact directly via Etherscan UI
- Builds trust and transparency

#### 2.6 Test Deployed Contract

**Via Hardhat Console:**

```bash
npx hardhat console --network sepolia
```

```javascript
// Get contract instance
const contract = await ethers.getContractAt(
  "CemeteryManagerV2",
  "0xYOUR_ADDRESS"
);

// Check deployer is admin
const [deployer] = await ethers.getSigners();
const isAdmin = await contract.isAdmin(deployer.address);
console.log("Is Admin:", isAdmin); // Should be true

// Get analytics
const analytics = await contract.getAnalytics();
console.log("Initial Analytics:", analytics);
```

**Via Etherscan:**
1. Go to: `https://sepolia.etherscan.io/address/0xYOUR_ADDRESS`
2. Click "Contract" → "Read Contract"
3. Try `isAdmin()` with your address
4. Try `getAnalytics()` to see initial state

## The Graph Subgraph

Deploy a subgraph for fast GraphQL queries instead of slow RPC calls.

### Why Use The Graph?

**Without Subgraph:**
- ❌ Slow queries (10-30 seconds)
- ❌ Expensive RPC calls
- ❌ Limited filtering/sorting
- ❌ Rate limits

**With Subgraph:**
- ✅ Fast queries (<100ms)
- ✅ Free unlimited queries
- ✅ Complex filtering/pagination
- ✅ Real-time updates

### Phase 3: Subgraph Deployment

#### 3.1 Install Graph CLI

```bash
npm install -g @graphprotocol/graph-cli
```

Verify:
```bash
graph --version
```

#### 3.2 Create The Graph Studio Account

1. Go to: https://thegraph.com/studio/
2. Connect MetaMask
3. Create account (free)

#### 3.3 Create Subgraph

1. Click "Create a Subgraph"
2. Name: `cemetery-manager-v2`
3. Network: Sepolia
4. Copy your **DEPLOY KEY**

#### 3.4 Update Subgraph Configuration

Edit `subgraph/subgraph.yaml`:

```yaml
source:
  address: "0xYOUR_CONTRACT_ADDRESS"  # From deployment-v2-info.json
  startBlock: YOUR_DEPLOYMENT_BLOCK     # From Etherscan or deployment-v2-info.json
network: sepolia
```

**Get start block:**
1. Go to `https://sepolia.etherscan.io/address/0xYOUR_ADDRESS`
2. Find "Contract Creation" transaction
3. Note the block number

#### 3.5 Generate and Build

```bash
cd subgraph
graph codegen
graph build
```

Expected: No errors, `generated/` and `build/` folders created.

#### 3.6 Authenticate

```bash
graph auth --studio YOUR_DEPLOY_KEY
```

#### 3.7 Deploy

```bash
graph deploy --studio cemetery-manager-v2
```

Prompts:
```
? Version Label (e.g. v0.0.1) › v0.1.0
? Build subgraph before deploying? › Yes
```

**Save the endpoint URL!**
```
Queries (HTTP): https://api.studio.thegraph.com/query/<ID>/cemetery-manager-v2/v0.1.0
```

#### 3.8 Monitor Indexing

Wait 5-10 minutes for initial indexing.

Test in The Graph Studio Playground:

```graphql
query {
  _meta {
    block {
      number
    }
    hasIndexingErrors
  }
}
```

Expected: `hasIndexingErrors: false`

#### 3.9 Test Queries

```graphql
query {
  graveyards(first: 5) {
    id
    name
    location
    reservedCount
    totalRevenue
  }
}
```

If no graveyards yet, create one via Hardhat console or frontend.

## Frontend Integration

### Phase 4: Frontend Setup

#### 4.1 Install Dependencies

```bash
cd frontend
npm install bs58 @apollo/client graphql
```

#### 4.2 Copy Utility Files

From project root:

```bash
# Create utils directory
mkdir -p frontend/src/utils

# Copy helper files
cp frontend/src/utils/ipfsHelpers.js frontend/src/utils/
cp frontend/src/utils/encryption.js frontend/src/utils/
```

#### 4.3 Update Environment

Edit `frontend/.env`:

```bash
# V2 Contract Address
VITE_CONTRACT_ADDRESS=0xYOUR_V2_CONTRACT_ADDRESS

# Network
VITE_NETWORK=sepolia
VITE_CHAIN_ID=11155111

# The Graph Subgraph
VITE_SUBGRAPH_URL=https://api.studio.thegraph.com/query/YOUR_ID/cemetery-manager-v2/v0.1.0

# IPFS Gateway
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/

# Backend API
VITE_API_URL=http://localhost:3000/api
```

**Restart dev server after changing `.env`!**

#### 4.4 Update Contract ABI

```bash
# From frontend directory
cp ../artifacts/contracts/CemeteryManagerV2.sol/CemeteryManagerV2.json src/contracts/
```

#### 4.5 Configure Apollo Client

Create `frontend/src/lib/apollo.js`:

```javascript
import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
  uri: import.meta.env.VITE_SUBGRAPH_URL,
  cache: new InMemoryCache(),
});

export default client;
```

Update `frontend/src/main.jsx`:

```javascript
import { ApolloProvider } from '@apollo/client';
import apolloClient from './lib/apollo';

ReactDOM.createRoot(document.getElementById('root')).render(
  <ApolloProvider client={apolloClient}>
    <App />
  </ApolloProvider>
);
```

#### 4.6 Test Frontend

```bash
npm run dev
```

Checklist:
- [ ] App starts without errors
- [ ] Can connect MetaMask
- [ ] Contract address recognized
- [ ] GraphQL queries work
- [ ] No console errors

## Backend Deployment

### Phase 5: Backend Setup

#### 5.1 Install Dependencies

```bash
cd backend
npm install redis validator
```

#### 5.2 Configure Environment

Edit `backend/.env`:

```bash
# IPFS
PINATA_API_KEY="YOUR_KEY"
PINATA_SECRET_KEY="YOUR_SECRET"
IPFS_GATEWAY="https://gateway.pinata.cloud/ipfs/"

# Redis (optional, fallback to in-memory)
REDIS_URL="redis://localhost:6379"

# Port
PORT=3000
```

#### 5.3 Start Backend

```bash
# Development
npm run dev

# Production
npm start
```

#### 5.4 Test IPFS Upload

```bash
curl -X POST http://localhost:3000/api/ipfs/v2/upload-metadata \
  -H "Content-Type: application/json" \
  -d '{"data": {"test": "data"}}'
```

Expected: Returns `ipfsHash` and `bytes32`.

## Production Checklist

### Phase 6: Pre-Production Validation

#### 6.1 Testing Checklist

- [ ] All 32 smart contract tests passing
- [ ] Gas costs verified and acceptable
- [ ] Contract verified on Etherscan
- [ ] Subgraph indexing without errors
- [ ] Frontend fully functional
- [ ] Backend APIs working
- [ ] IPFS uploads/downloads working
- [ ] Encryption/decryption tested
- [ ] End-to-end reservation flow tested

#### 6.2 Security Checklist

- [ ] `.env` files not committed to Git
- [ ] Private keys secure
- [ ] Access control verified
- [ ] Reentrancy protection confirmed
- [ ] Input validation implemented
- [ ] Rate limiting active
- [ ] Client-side encryption working
- [ ] No sensitive data logged

#### 6.3 Performance Checklist

- [ ] Analytics query gas: ~35k (constant)
- [ ] GraphQL queries <200ms
- [ ] Backend cache hit rate >80%
- [ ] Frontend Lighthouse score >90
- [ ] No memory leaks

### Phase 7: Testnet Operation

**Run on testnet for 30+ days before mainnet:**

- [ ] Create test graveyards
- [ ] Test grave reservations
- [ ] Test analytics updates
- [ ] Monitor for errors
- [ ] Test edge cases
- [ ] Gather user feedback
- [ ] Fix any issues found

## Mainnet Deployment

⚠️ **CRITICAL: Do NOT deploy to mainnet until ALL items below are complete!**

### Phase 8: Pre-Mainnet Requirements

#### 8.1 Security Audit

**Required before mainnet:**

- [ ] Professional security audit completed ($20k-100k)
- [ ] All critical issues fixed
- [ ] High/medium issues addressed
- [ ] Audit report published
- [ ] Re-audit after fixes

**Recommended audit firms:**
- OpenZeppelin ($50k-100k)
- Trail of Bits ($40k-80k)
- Consensys Diligence ($30k-60k)
- CertiK ($20k-50k)

#### 8.2 Legal Review

- [ ] Terms of Service drafted
- [ ] Privacy Policy complete
- [ ] GDPR compliance (if EU users)
- [ ] Data retention policy
- [ ] Liability disclaimers
- [ ] Legal entity established

#### 8.3 Infrastructure

- [ ] Production RPC provider (Infura/Alchemy)
- [ ] Dedicated IPFS pinning service
- [ ] Redis production setup
- [ ] CDN for frontend (Cloudflare/Vercel)
- [ ] Domain name configured
- [ ] SSL certificates

#### 8.4 Operations

- [ ] MultiSig wallet for admin (Gnosis Safe)
- [ ] Emergency pause mechanism tested
- [ ] Backup admin accounts
- [ ] On-call rotation defined
- [ ] Incident response playbook
- [ ] Insurance obtained (if applicable)

### Phase 9: Mainnet Deployment Steps

#### 9.1 Final Preparation

```bash
# Run full test suite
npx hardhat test

# Check gas reporter
REPORT_GAS=true npx hardhat test

# Verify compilation
npx hardhat clean && npx hardhat compile
```

#### 9.2 Configure Mainnet

Update `.env`:

```bash
MAINNET_RPC_URL="https://mainnet.infura.io/v3/YOUR_PROJECT_ID"
PRIVATE_KEY="0xYOUR_MAINNET_PRIVATE_KEY"
ETHERSCAN_API_KEY="YOUR_KEY"
```

Verify `hardhat.config.js`:

```javascript
mainnet: {
  url: process.env.MAINNET_RPC_URL,
  accounts: [process.env.PRIVATE_KEY],
  chainId: 1
}
```

#### 9.3 Deploy Contract

**Check gas prices first:** https://etherscan.io/gastracker

Wait for low gas (typically weekends or late nights UTC).

```bash
npx hardhat run scripts/migrateToV2.js --network mainnet
```

**Cost estimate (at 50 gwei, $2000/ETH):**
- Deploy: ~3.1M gas = ~0.155 ETH = ~$310

#### 9.4 Verify Immediately

```bash
npx hardhat verify --network mainnet 0xYOUR_DEPLOYED_ADDRESS
```

#### 9.5 Transfer to MultiSig

**CRITICAL:** Transfer admin role to MultiSig wallet (e.g., Gnosis Safe):

```bash
npx hardhat run scripts/transfer-admin.js --network mainnet
```

#### 9.6 Deploy Subgraph

```bash
cd subgraph

# Update subgraph.yaml with mainnet address and block
# network: mainnet
# address: "0xYOUR_MAINNET_ADDRESS"

graph deploy --studio cemetery-manager-v2-mainnet
```

#### 9.7 Update Frontend

```bash
# Update frontend/.env
VITE_CONTRACT_ADDRESS=0xYOUR_MAINNET_ADDRESS
VITE_NETWORK=mainnet
VITE_CHAIN_ID=1
VITE_SUBGRAPH_URL=https://api.studio.thegraph.com/query/YOUR_ID/cemetery-manager-v2-mainnet/v0.1.0

# Deploy to production (Vercel/Netlify)
npm run build
```

## Monitoring

### Phase 10: Post-Deployment Monitoring

#### 10.1 Contract Monitoring

**Etherscan Alerts:**
- Bookmark: `https://etherscan.io/address/0xYOUR_ADDRESS`
- Enable email alerts for transactions

**Event Monitoring:**
```javascript
contract.on("GraveyardAdded", (id, owner, name) => {
  console.log("New Graveyard:", { id, owner, name });
});

contract.on("GraveReserved", (graveId, user, price) => {
  console.log("Grave Reserved:", { graveId, user, price });
});
```

#### 10.2 Subgraph Monitoring

- [ ] Studio dashboard bookmarked
- [ ] Check indexing status daily
- [ ] Monitor query performance
- [ ] Set up error alerts

#### 10.3 Backend Monitoring

**Recommended tools:**
- Sentry for error tracking
- LogRocket for session replay
- Datadog/NewRelic for APM
- UptimeRobot for uptime

#### 10.4 Alert Setup

**Setup alerts for:**
- Large transactions (>1 ETH)
- Failed transactions
- Subgraph indexing errors
- Backend errors/downtime
- API rate limit breaches
- Unusual gas prices

### Ongoing Maintenance

**Daily:**
- [ ] Check Etherscan for activity
- [ ] Monitor subgraph health
- [ ] Review error logs

**Weekly:**
- [ ] Analyze gas costs
- [ ] Review user feedback
- [ ] Check for vulnerabilities

**Monthly:**
- [ ] Security review
- [ ] Dependency updates
- [ ] Performance optimization
- [ ] Backup verification

## Troubleshooting

### Contract Deployment Issues

**Issue: "insufficient funds"**
```
Solution: Get more ETH. Need ~0.2 ETH for Sepolia deployment.
```

**Issue: "nonce too low"**
```
Solution: Reset MetaMask account in Settings → Advanced → Reset Account
```

**Issue: "invalid address"**
```
Solution: Ensure PRIVATE_KEY in .env starts with 0x
```

### Verification Issues

**Issue: Verification fails**
```
Solution:
1. Wait 1-2 minutes after deployment
2. Ensure Etherscan API key is correct
3. Try manual verification on Etherscan website
```

### Subgraph Issues

**Issue: "Indexing failed"**
```
Solution:
1. Check contract address correct in subgraph.yaml
2. Verify startBlock is correct (deployment block)
3. Check network matches (sepolia vs mainnet)
4. Re-deploy: graph deploy --studio cemetery-manager-v2
```

**Issue: "Queries return empty"**
```
Solution:
1. Check subgraph is fully synced (_meta.block.number)
2. Verify contract has activity (check Etherscan)
3. Ensure events are being emitted
```

### Frontend Issues

**Issue: "Cannot read property 'abi' of undefined"**
```
Solution: Ensure ABI file correctly imported:
import ABI from '../contracts/CemeteryManagerV2.json';
const contract = new ethers.Contract(address, ABI.abi, signer);
```

**Issue: "CID not found in localStorage"**
```
Solution: IPFS mapping is stored locally. Export/import:
const data = ipfsHashManager.exportAll();
// On new device:
ipfsHashManager.importAll(data);
```

### Backend Issues

**Issue: "IPFS upload fails"**
```
Solution:
1. Check Pinata API keys are correct
2. Verify file size <10MB
3. Check network connectivity
```

## Gas Cost Estimates

### Testnet (Sepolia) - Free

All operations use test ETH (free).

### Mainnet Costs

**At 50 gwei gas price and $2000/ETH:**

| Operation | Gas | ETH Cost | USD Cost |
|-----------|-----|----------|----------|
| Deploy Contract | 3,096,696 | 0.155 | $310 |
| Add Graveyard | 268,456 | 0.013 | $26 |
| Reserve Grave | 336,905 | 0.017 | $34 |
| **Analytics Query** | **34,690** | **0.002** | **$4** |
| Maintain Grave | 45,000 | 0.002 | $4 |

**Note:** Costs vary based on gas prices. Check current prices at https://etherscan.io/gastracker

## Rollback Plan

If critical issues found after deployment:

1. **Pause Contract** (if pause mechanism exists)
2. **Stop Frontend** (take down website)
3. **Investigate** root cause
4. **Fix** and re-test on testnet
5. **Re-audit** if needed
6. **Deploy Fix** (new contract if needed)
7. **Communicate** with users
8. **Resume Operations**

**Important:** Cannot modify deployed contract! Must deploy new version if needed.

## Support Resources

### Documentation
- [Quick Start](../V2_QUICKSTART.md)
- [Architecture](ARCHITECTURE.md)
- [API Reference](API_REFERENCE.md)
- [Security](../SECURITY.md)

### External Resources
- **Hardhat:** https://hardhat.org/docs
- **The Graph:** https://thegraph.com/docs/
- **OpenZeppelin:** https://docs.openzeppelin.com/
- **Etherscan:** https://etherscan.io/
- **Sepolia Faucet:** https://sepoliafaucet.com/

### Community
- GitHub Issues: Report bugs
- Email: samarthsmg14@gmail.com

---

**Remember:** Mainnet deployment is permanent and expensive. Test thoroughly on testnet first!

**Questions?** Review the deployment scripts in `scripts/` directory.
