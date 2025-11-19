# Cemetery Allocation Management System

A blockchain-based cemetery management system built on Ethereum that provides transparent, immutable, and efficient grave allocation, reservation, and maintenance tracking.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-blue)
![React](https://img.shields.io/badge/React-18.2-blue)
![Node](https://img.shields.io/badge/Node-18+-green)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

The Cemetery Allocation Management System revolutionizes traditional cemetery management by leveraging blockchain technology to provide:

- **Immutable Ownership Records**: All grave allocations permanently recorded on blockchain
- **Transparent Pricing**: Clear, verifiable pricing with no hidden fees
- **Smart Contract Automation**: Automated payment processing and ownership transfer
- **Privacy Protection**: Sensitive data encrypted and stored off-chain
- **Interactive Mapping**: Visual grave selection with real-time availability

## ✨ Features

### Core Functionality

- **Grave Reservation**: Browse and reserve grave plots with cryptocurrency payments
- **Interactive Maps**: Leaflet-based mapping showing grave locations and availability
- **Smart Contracts**: Ethereum smart contracts for transparent operations
- **Wallet Integration**: MetaMask wallet connectivity
- **Admin Dashboard**: Cemetery management interface
- **Ownership Tracking**: View all graves owned by a user
- **Maintenance Records**: Track grave maintenance status
- **IPFS Storage**: Decentralized storage for burial metadata

### Smart Contract Features

- Role-based access control
- Batch grave creation for efficiency
- Pull payment pattern for security
- Event emission for transparency
- Reentrancy protection
- Gas-optimized operations

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (React)                    │
│  - MetaMask Integration                              │
│  - Interactive Maps (Leaflet)                        │
│  - User Interface                                    │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────┐
│              Backend API (Node.js)                   │
│  - REST API                                          │
│  - Blockchain Interaction                            │
│  - GeoJSON Management                                │
│  - IPFS Integration                                  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────┐
│           Ethereum Blockchain                        │
│  - CemeteryManager Smart Contract                    │
│  - Graveyard & Grave Records                         │
│  - Payment Processing                                │
└──────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Smart Contracts
- **Solidity** ^0.8.20
- **Hardhat** - Development environment
- **OpenZeppelin** - Security-audited contracts
- **Ethers.js** - Ethereum library

### Backend
- **Node.js** 18+
- **Express** - Web framework
- **Ethers.js** v6 - Blockchain interaction
- **Axios** - HTTP client

### Frontend
- **React** 18.2
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Leaflet** - Interactive maps
- **React Router** - Navigation
- **React Toastify** - Notifications

### Storage
- **IPFS** - Decentralized storage (via Pinata)
- **GeoJSON** - Geographic data

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**
- **MetaMask** browser extension
- **Code Editor** (VSCode recommended)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/DEADSERPENT/cemetery-blockchain.git
cd cemetery-blockchain
```

### 2. Install Root Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

## ⚙️ Configuration

### Environment Modes

The project supports **development** and **production** modes with separate configuration files:

- `.env.development` - Local Hardhat network settings
- `.env.production` - Testnet/Mainnet settings

### 1. Environment Variables

#### Root Directory

Create `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
# Wallet Private Key (DO NOT COMMIT)
PRIVATE_KEY=your_private_key_here

# RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
GOERLI_RPC_URL=https://goerli.infura.io/v3/YOUR_INFURA_KEY

# API Keys
ETHERSCAN_API_KEY=your_etherscan_api_key
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key

# IPFS (Pinata)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

#### Frontend

The frontend uses environment-specific files:

**Development** (`frontend/.env.development`):
```env
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_API_URL=http://localhost:3001
VITE_RPC_URL=http://127.0.0.1:8545
VITE_NETWORK_ID=1337
VITE_NETWORK_NAME=localhost
VITE_MODE=development
```

**Production** (`frontend/.env.production`):
```env
VITE_CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
VITE_API_URL=https://your-backend-url.com
VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
VITE_NETWORK_ID=11155111
VITE_NETWORK_NAME=sepolia
VITE_MODE=production
```

#### Backend

Similar environment-specific files in `backend/` directory.

### Auto-Update Contract Address

After deploying contracts, addresses are **automatically updated** in all environment files:

```bash
npx hardhat run scripts/deploy.js --network localhost
# Contract addresses updated automatically in .env files!
```

Manual update if needed:
```bash
node scripts/update-contract-address.js 0xYourNewAddress development
```

## 🎯 Usage

### Local Development

#### 1. Start Local Blockchain

```bash
# In terminal 1
npx hardhat node
```

This starts a local Ethereum network on `http://127.0.0.1:8545`

#### 2. Compile Smart Contracts

```bash
# In terminal 2
npx hardhat compile
```

#### 3. Deploy Smart Contracts

```bash
npx hardhat run scripts/deploy.js --network localhost
```

The deployment script automatically updates all environment files with the new contract address. Just restart your services after deployment.

#### 4. Start Backend Server

```bash
# In terminal 3
cd backend
npm run dev
```

Backend will run on `http://localhost:3001`

#### 5. Start Frontend

```bash
# In terminal 4
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

### MetaMask Setup

1. **Install MetaMask** browser extension
2. **Import Account**: Use one of the private keys from Hardhat local node
3. **Add Network**:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 1337
   - Currency Symbol: ETH

### Using the Application

1. **Connect Wallet**: Click "Connect Wallet" in the navbar
2. **Browse Graveyards**: Navigate to "Graveyards" page
3. **View Map**: Click on a graveyard to see interactive map
4. **Reserve Grave**:
   - Click on a grave plot (green = available)
   - Fill in optional metadata
   - Click "Reserve Grave"
   - Confirm transaction in MetaMask
5. **Admin Functions**:
   - Navigate to "Admin" dashboard
   - Add new graveyards
   - Add graves to graveyards
   - Withdraw funds

## 🧪 Testing

### Smart Contract Tests

Run the comprehensive test suite:

```bash
npx hardhat test
```

Run with gas reporting:

```bash
REPORT_GAS=true npx hardhat test
```

Run with coverage:

```bash
npx hardhat coverage
```

### Test Coverage

The test suite includes:

- ✅ Deployment tests
- ✅ Graveyard management
- ✅ Grave creation (single and batch)
- ✅ Reservation flow
- ✅ Payment handling
- ✅ Metadata updates
- ✅ Maintenance tracking
- ✅ Access control
- ✅ Security (reentrancy, validation)
- ✅ Gas optimization

Expected test output:

```
  CemeteryManager
    Deployment
      ✓ Should set the right owner
      ✓ Should initialize counters correctly
    Graveyard Management
      ✓ Should add a new graveyard by owner
      ✓ Should reject adding graveyard by non-owner
      ...

  65 passing (3s)
```

## 🌐 Deployment

### Testnet Deployment (Sepolia)

1. **Get Test ETH**:
   - Visit [Sepolia Faucet](https://sepoliafaucet.com/)
   - Enter your wallet address

2. **Configure `.env`**:
   ```env
   PRIVATE_KEY=your_private_key
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   ETHERSCAN_API_KEY=your_api_key
   ```

3. **Deploy**:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

4. **Verify Contract**:
   ```bash
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

5. **Update Frontend**:
   ```env
   VITE_CONTRACT_ADDRESS=<deployed_address>
   VITE_CHAIN_ID=11155111
   ```

### Mainnet Deployment

⚠️ **WARNING**: Deploying to mainnet requires real ETH and thorough security audits.

1. **Security Audit**: Have contracts professionally audited
2. **Testing**: Extensive testing on testnet
3. **Deploy**: Follow same process as testnet with mainnet RPC
4. **Monitor**: Set up monitoring and alerts

## 📚 API Documentation

### Blockchain Endpoints

#### GET `/api/blockchain/status`
Get blockchain connection status

**Response**:
```json
{
  "connected": true,
  "network": {
    "name": "hardhat",
    "chainId": "1337"
  },
  "blockNumber": 12345
}
```

#### GET `/api/blockchain/contract-info`
Get contract information

**Response**:
```json
{
  "address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "owner": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "totalGraveyards": "2",
  "totalGraves": "15"
}
```

### Graveyard Endpoints

#### GET `/api/graveyards`
Get all graveyards

#### GET `/api/graveyards/:id`
Get graveyard details

#### GET `/api/graveyards/:id/graves`
Get all graves in graveyard

#### GET `/api/graveyards/:id/map`
Get GeoJSON map data for graveyard

### Grave Endpoints

#### GET `/api/graves/:id`
Get grave details

#### GET `/api/graves/user/:address`
Get all graves owned by user

### IPFS Endpoints

#### POST `/api/ipfs/upload`
Upload encrypted metadata to IPFS

#### GET `/api/ipfs/:hash`
Retrieve data from IPFS

### Location Endpoints

Convert between different location formats (alternative to IPFS for simple coordinates).

#### POST `/api/location/encode`
Convert lat/lng to location hash

**Request**:
```json
{
  "lat": 51.505,
  "lng": -0.09,
  "type": "geohash"
}
```

**Response**:
```json
{
  "success": true,
  "locationHash": "geo:gcpvj0duq",
  "geohash": "gcpvj0duq",
  "coordinates": { "lat": 51.505, "lng": -0.09 },
  "googleMapsUrl": "https://maps.google.com/?q=51.505,-0.09"
}
```

#### POST `/api/location/decode`
Decode location hash to coordinates

#### POST `/api/location/geojson`
Generate GeoJSON polygon for a grave plot from coordinates

#### GET `/api/location/types`
Get supported location types (geohash, latlng, ipfs)

## 🔒 Security

### Smart Contract Security

- **OpenZeppelin**: Using audited contracts for access control and security
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Pull Payment Pattern**: Secure fund withdrawal mechanism
- **Access Control**: Role-based permissions
- **Input Validation**: All inputs validated and sanitized
- **Overflow Protection**: Solidity 0.8+ built-in overflow checks

### Privacy Measures

- **Off-chain Storage**: Sensitive data stored off-chain (IPFS)
- **Encryption**: AES-256 encryption for burial records
- **On-chain Hashes**: Only IPFS CIDs stored on blockchain
- **GDPR Compliance**: Right to erasure via key destruction

### Best Practices

- Never store private keys in code or `.env` files committed to Git
- Use environment variables for all sensitive data
- Keep dependencies updated
- Run security audits before mainnet deployment
- Use multi-signature wallets for admin functions
- Implement rate limiting on API endpoints

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow existing code style
- Update documentation
- Add comments for complex logic
- Run linter before committing

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **SAMARTHA H V** - Initial work

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- Ethereum community for development tools
- Leaflet for mapping capabilities
- All contributors and testers

## 📞 Support

For support, email samarthsmg14@gmail.com or open an issue on GitHub.

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Smart contract implementation
- ✅ Frontend with mapping
- ✅ Backend API
- ✅ Local development setup

### Phase 2 (Planned)
- [ ] NFT certificates for grave ownership
- [ ] Mobile application (React Native)
- [ ] Multi-chain support (Polygon, Arbitrum)
- [ ] Enhanced analytics dashboard
- [ ] Subscription-based maintenance fees

### Phase 3 (Future)
- [ ] DAO governance for cemetery management
- [ ] AR/VR grave site visualization
- [ ] Integration with funeral homes
- [ ] Marketplace for grave transfers
- [ ] Multi-language support

## 📊 Project Status

**Current Version**: 1.0.0
**Status**: Active Development
**Last Updated**: 2025-11-14

---

**Made using Blockchain Technology**
