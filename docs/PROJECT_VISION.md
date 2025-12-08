# Cemetery Allocation Management System - Project Vision

## Executive Summary

The Cemetery Allocation Management System is a blockchain-based solution that revolutionizes cemetery management by providing transparent, immutable, and efficient grave allocation, reservation, and maintenance tracking. Built on Ethereum blockchain technology, this system addresses key challenges in traditional cemetery management including record disputes, fraud, double-booking, and lack of transparency.

---

## Problem Statement

### Current Challenges in Cemetery Management

1. **Record Integrity Issues**
   - Paper-based records prone to loss, damage, or tampering
   - Disputes over grave ownership and allocation
   - Difficulty in verifying historical records

2. **Transparency Gaps**
   - Opaque pricing and allocation processes
   - Lack of real-time availability information
   - No audit trail for transactions

3. **Operational Inefficiencies**
   - Manual booking processes prone to double-allocation
   - Difficulty tracking maintenance schedules
   - Poor coordination between families and cemetery administrators

4. **Trust Deficits**
   - Concerns about fraudulent practices
   - Lack of verifiable proof of ownership
   - No standardized record-keeping across cemeteries

---

## Solution Overview

### Core Innovation

A decentralized application (DApp) combining:
- **Ethereum Smart Contracts** for immutable record-keeping and transparent transactions
- **Interactive Mapping Interface** for visual grave plot selection and availability
- **IPFS Storage** for secure, encrypted burial records and documents
- **Payment Automation** through blockchain-based cryptocurrency transactions

### Key Benefits

**For Cemetery Administrators:**
- Automated allocation and payment processing
- Reduced administrative overhead
- Transparent financial records
- Maintenance tracking and scheduling

**For Families/Customers:**
- Visual plot selection via interactive maps
- Transparent pricing and availability
- Immutable proof of ownership
- Secure access to burial records
- 24/7 reservation capability

**For Regulators/Auditors:**
- Complete transaction history
- Verifiable ownership records
- Compliance tracking
- Transparent pricing verification

---

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ React Web App  │  │ MetaMask     │  │ Leaflet Maps    │ │
│  │ - Grave Search │  │ Integration  │  │ - Plot Display  │ │
│  │ - Reservation  │  │ - Wallet     │  │ - Availability  │ │
│  │ - Admin Panel  │  │ - Signing    │  │ - Selection     │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend Layer                            │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Node.js/Express│  │ Web3.js/     │  │ IPFS Client     │ │
│  │ REST API       │  │ Ethers.js    │  │ - Upload/Pin    │ │
│  │ - GeoJSON API  │  │ - Contract   │  │ - Retrieval     │ │
│  │ - User Data    │  │   Interaction│  │ - Encryption    │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Blockchain Layer                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Ethereum Smart Contracts                   │   │
│  │  ┌─────────────────┐  ┌─────────────────────────┐   │   │
│  │  │ CemeteryManager │  │ GraveRegistry           │   │   │
│  │  │ - Add Cemetery  │  │ - Grave Metadata        │   │   │
│  │  │ - Add Graves    │  │ - Reservation Logic     │   │   │
│  │  │ - Owner Control │  │ - Payment Handling      │   │   │
│  │  └─────────────────┘  └─────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────┐     │   │
│  │  │        Events & Access Control              │     │   │
│  │  │ - GraveReserved, FeePaid, Maintained        │     │   │
│  │  │ - Role-based permissions (OpenZeppelin)     │     │   │
│  │  └─────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Storage Layer                         │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ PostgreSQL +   │  │ IPFS Network │  │ Ethereum        │ │
│  │ PostGIS        │  │ - Burial Docs│  │ Blockchain      │ │
│  │ - GeoJSON Data │  │ - Images     │  │ - Grave Records │ │
│  │ - Map Polygons │  │ - Encrypted  │  │ - Ownership     │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Smart Contracts:**
- Solidity ^0.8.20
- OpenZeppelin Contracts (Security, Access Control)
- Hardhat Development Environment

**Backend:**
- Node.js 18+ with Express
- Ethers.js v6 for blockchain interaction
- PostgreSQL 15+ with PostGIS extension
- IPFS via Pinata or local node

**Frontend:**
- React 18+ with TypeScript
- Vite build tool
- Leaflet or Mapbox GL JS for mapping
- MetaMask SDK for wallet integration
- TailwindCSS for styling

**Development & Testing:**
- Hardhat for local blockchain (Ganache alternative)
- Chai/Mocha for smart contract testing
- Jest for backend testing
- React Testing Library for frontend
- Sepolia/Goerli testnet for staging

---

## Core Features & Functionality

### 1. Cemetery Management

**Administrator Functions:**
- Register new cemeteries with geographic coordinates
- Define grave plots with pricing and location metadata
- Upload cemetery maps and plot layouts (GeoJSON)
- Set maintenance schedules and fees
- Manage access permissions

**Data Model:**
```solidity
struct Graveyard {
  address owner;           // Cemetery administrator
  string name;             // Cemetery name
  string location;         // Geographic location
  uint256 numPlots;        // Total number of plots
  uint256[] graveIds;      // Array of grave IDs
  bool active;             // Operational status
}
```

### 2. Grave Allocation & Reservation

**Customer Journey:**
1. Browse interactive map of available graves
2. View grave details (price, location, size, features)
3. Connect wallet (MetaMask)
4. Reserve grave with payment
5. Upload burial metadata (encrypted) to IPFS
6. Receive immutable proof of ownership (NFT-like record)

**Smart Contract Logic:**
```solidity
struct Grave {
  uint256 id;
  address owner;           // Current owner or cemetery if unreserved
  uint256 price;           // Price in wei
  bool reserved;
  bool maintained;
  string locationHash;     // IPFS hash for detailed location data
  string metadataHash;     // IPFS hash for burial records
  uint256 timestamp;       // Reservation timestamp
}
```

**Key Functions:**
- `reserveGrave(graveId, metadataHash) payable` - Reserve with payment
- `isReserved(graveId) view` - Check availability
- `getGrave(graveId) view` - Retrieve grave details
- `updateBurialRecord(graveId, newHash)` - Update metadata (owner only)

### 3. Payment Processing

**Automated Payment Flow:**
1. Smart contract holds grave price as constant
2. Customer sends exact payment with reservation transaction
3. Contract validates payment amount
4. Funds transferred to cemetery owner address (or held in contract)
5. Emit `FeePaid` event for transparency
6. Ownership transferred to customer

**Security Features:**
- Reentrancy guards (OpenZeppelin ReentrancyGuard)
- Pull-over-push payment pattern for withdrawals
- Exact payment validation (no overpayment accepted without refund logic)
- Multi-signature support for large transactions (optional)

### 4. Maintenance Tracking

**Maintenance Features:**
- Cemetery staff can mark graves as maintained
- Maintenance history stored on-chain via events
- Optional: Recurring maintenance fees via subscription model
- Families can request maintenance via smart contract

**Function:**
```solidity
function maintainGrave(uint256 graveId) external onlyGraveyardOwner
```

### 5. Record Management & Privacy

**On-Chain Data:**
- Grave ID, ownership address, reservation status
- Transaction hashes and timestamps
- IPFS content hashes (CIDs)

**Off-Chain Data (IPFS):**
- Personal burial information (encrypted)
- Legal documents (wills, permits)
- Photos and memorial content
- Maintenance logs and reports

**Privacy Measures:**
- End-to-end encryption of sensitive data
- Only CID stored on-chain, not actual data
- Access control via cryptographic keys
- GDPR compliance considerations (right to be forgotten implemented via key destruction)

### 6. Interactive Mapping

**Map Features:**
- Visual representation of cemetery layout
- Color-coded grave status:
  - 🟢 Green: Available for reservation
  - 🔴 Red: Reserved/Occupied
  - 🟡 Yellow: Recently maintained
  - ⚫ Grey: Not available for sale
- Click to view grave details
- Filter by price, size, location within cemetery
- Search by grave ID or owner address

**Data Format (GeoJSON Example):**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "graveId": 1,
        "section": "A",
        "plot": "12",
        "size": "single"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[...]]
      }
    }
  ]
}
```

---

## Security Architecture

### Smart Contract Security

1. **Access Control**
   - Role-based permissions (OpenZeppelin AccessControl)
   - Owner-only functions for critical operations
   - Modifiers for authorization checks

2. **Reentrancy Protection**
   - OpenZeppelin ReentrancyGuard
   - Checks-Effects-Interactions pattern
   - Pull payment pattern for fund withdrawals

3. **Input Validation**
   - Require statements for all inputs
   - Overflow protection (Solidity 0.8+ built-in)
   - Address validation (non-zero checks)

4. **Upgrade Strategy**
   - Proxy pattern for upgradeable contracts (optional)
   - Migration path for critical bug fixes
   - Emergency pause functionality

### Application Security

1. **Wallet Security**
   - Never request private keys
   - MetaMask signature verification
   - Transaction simulation before signing

2. **Data Encryption**
   - AES-256 for sensitive documents
   - Public/private key encryption for records
   - Secure key management (user-controlled)

3. **API Security**
   - Rate limiting
   - Authentication tokens
   - CORS policies
   - Input sanitization

### Privacy Compliance

- **GDPR Considerations:**
  - Right to erasure (destroy encryption keys)
  - Data minimization (only hashes on-chain)
  - Consent management
  - Data portability (export IPFS records)

---

## User Roles & Permissions

### 1. System Administrator (Contract Owner)
- Deploy and configure smart contracts
- Add/remove cemetery administrators
- Emergency pause/unpause system
- Upgrade contracts (if proxy pattern used)

### 2. Cemetery Administrator (Graveyard Owner)
- Add/manage cemeteries
- Create grave plots
- Set pricing
- Mark graves as maintained
- Withdraw collected funds
- View analytics and reports

### 3. Customer (Grave Owner)
- Browse available graves
- Reserve and pay for graves
- Upload burial metadata
- Update records (own graves only)
- Transfer ownership (if allowed)
- View transaction history

### 4. Public/Visitor
- View cemetery map (read-only)
- Search for graves (public information only)
- View availability statistics
- No wallet required for browsing

---

## Data Flow Scenarios

### Scenario 1: Grave Reservation

```
1. Customer visits website
2. Browses map, selects available grave
3. Clicks "Reserve Grave"
4. Prompted to connect MetaMask wallet
5. (Optional) Uploads burial metadata → Encrypted → IPFS → Gets CID
6. Clicks "Confirm Reservation"
7. MetaMask shows transaction:
   - To: CemeteryContract
   - Function: reserveGrave(graveId, metadataCID)
   - Value: 0.5 ETH (example)
8. Customer signs transaction
9. Smart contract:
   - Validates payment amount
   - Checks grave is unreserved
   - Transfers funds to cemetery owner
   - Updates grave record (owner = customer, reserved = true)
   - Stores metadata CID
   - Emits GraveReserved event
10. Frontend listens for event → Shows success message + transaction hash
11. Customer receives proof of ownership (can view on Etherscan)
```

### Scenario 2: Cemetery Admin Adds New Graves

```
1. Admin logs into admin panel (wallet-based auth)
2. Navigates to "Add Graves" section
3. Uploads GeoJSON file with grave plot coordinates
4. Sets pricing for each grave or section
5. Reviews preview on map
6. Clicks "Submit to Blockchain"
7. For each grave:
   - Smart contract call: addGrave(graveyardId, graveId, price, locationHash)
8. Transactions confirmed → Graves now visible on public map
9. Backend syncs GeoJSON with on-chain grave IDs
```

### Scenario 3: Maintenance Update

```
1. Cemetery staff performs grave maintenance
2. Admin logs in, navigates to "Maintenance"
3. Searches for grave by ID or clicks on map
4. Clicks "Mark as Maintained"
5. Smart contract call: maintainGrave(graveId)
6. Emits GraveMaintained event
7. Map updates grave color to yellow (maintained)
8. Grave owner receives notification (optional off-chain)
```

---

## Smart Contract Functions Reference

### CemeteryManager.sol

```solidity
// Admin Functions
function addGraveyard(
  address _owner,
  string calldata _name,
  string calldata _location,
  uint256 _numPlots
) external onlyOwner

function pauseGraveyard(uint256 _graveyardId) external onlyOwner

// Graveyard Owner Functions
function addGrave(
  uint256 _graveyardId,
  uint256 _graveId,
  uint256 _price,
  string calldata _locationHash
) external onlyGraveyardOwner(_graveyardId)

function maintainGrave(uint256 _graveId) external onlyGraveyardOwner

function withdrawFunds() external nonReentrant onlyGraveyardOwner

// Public Functions
function reserveGrave(
  uint256 _graveId,
  string calldata _metadataHash
) external payable nonReentrant

function getGrave(uint256 _graveId) external view returns (Grave memory)

function getGraveyard(uint256 _graveyardId) external view returns (Graveyard memory)

function isReserved(uint256 _graveId) external view returns (bool)

function getUserGraves(address _user) external view returns (uint256[] memory)
```

### Events

```solidity
event GraveyardAdded(uint256 indexed graveyardId, address owner, string name);
event GraveAdded(uint256 indexed graveId, uint256 indexed graveyardId, uint256 price);
event GraveReserved(uint256 indexed graveId, address indexed owner, uint256 price, uint256 timestamp);
event FeePaid(uint256 indexed graveId, address payer, uint256 amount);
event GraveMaintained(uint256 indexed graveId, uint256 timestamp);
event FundsWithdrawn(address indexed owner, uint256 amount);
```

---

## Performance & Gas Optimization

### Gas-Efficient Design Choices

1. **Storage Optimization**
   - Pack variables in 32-byte slots
   - Use `uint128` instead of `uint256` where possible
   - Store large data off-chain (IPFS) with on-chain hashes

2. **Event-Driven Architecture**
   - Emit events instead of storing redundant data
   - Off-chain indexing of events for history

3. **Batch Operations**
   - Add multiple graves in single transaction (where feasible)
   - Bulk maintenance updates

### Expected Gas Costs (Estimated)

| Operation | Estimated Gas | Cost @ 50 Gwei |
|-----------|---------------|----------------|
| Deploy Contract | ~2,500,000 | ~0.125 ETH |
| Add Graveyard | ~150,000 | ~0.0075 ETH |
| Add Grave | ~100,000 | ~0.005 ETH |
| Reserve Grave | ~120,000 | ~0.006 ETH |
| Maintain Grave | ~50,000 | ~0.0025 ETH |

*Note: Actual costs will be measured during testing*

---

## Testing Strategy

### Unit Tests (Smart Contracts)

```javascript
describe("CemeteryManager", function() {
  describe("Graveyard Management", function() {
    it("Should add a new graveyard")
    it("Should reject non-owner adding graveyard")
    it("Should emit GraveyardAdded event")
  })

  describe("Grave Operations", function() {
    it("Should add grave with correct price")
    it("Should reserve grave with exact payment")
    it("Should reject double reservation")
    it("Should revert if payment amount is incorrect")
    it("Should transfer funds to graveyard owner")
    it("Should store metadata hash correctly")
  })

  describe("Maintenance", function() {
    it("Should allow graveyard owner to mark maintained")
    it("Should reject non-owner maintenance calls")
    it("Should emit GraveMaintained event")
  })

  describe("Security", function() {
    it("Should prevent reentrancy attacks")
    it("Should validate all address inputs")
    it("Should enforce access control")
  })
})
```

### Integration Tests

1. **End-to-End Reservation Flow**
   - Frontend → Backend → Smart Contract → Event Listener
   - Verify map updates after reservation
   - Check IPFS upload and retrieval

2. **Payment Flow**
   - Test exact payment acceptance
   - Test overpayment rejection
   - Test fund withdrawal by owner

3. **Multi-User Scenarios**
   - Concurrent reservation attempts
   - Multiple cemeteries with different owners

### Performance Tests

- Gas usage profiling
- Transaction throughput testing
- Frontend map rendering with 1000+ graves
- IPFS upload/download speed

---

## Deployment Strategy

### Phase 1: Local Development
- Hardhat local network
- Test with 10+ graves across 2 cemeteries
- Full feature implementation

### Phase 2: Testnet Deployment (Sepolia)
- Deploy contracts to Sepolia
- Configure frontend to testnet
- Public beta testing
- Gather gas metrics and optimization data

### Phase 3: Mainnet Deployment (Production)
- Security audit (Certora, OpenZeppelin, or manual)
- Deploy to Ethereum mainnet
- Verify contracts on Etherscan
- Monitor transactions and gas costs

### Deployment Checklist

- [ ] Smart contracts audited
- [ ] Test coverage >95%
- [ ] Frontend security review
- [ ] Backend API hardening
- [ ] IPFS backup strategy configured
- [ ] Database backups automated
- [ ] Monitoring and alerts set up
- [ ] Documentation complete
- [ ] User guide published
- [ ] Terms of service and privacy policy

---

## Success Metrics

### Technical Metrics
- **Transaction Success Rate:** >99%
- **Average Gas Cost:** <$10 per reservation (at standard gas prices)
- **System Uptime:** >99.9%
- **Test Coverage:** >95%
- **Page Load Time:** <2 seconds

### Business Metrics
- **Number of Cemeteries Onboarded:** Target 5+ for pilot
- **Graves Managed:** 500+ plots
- **Reservations Processed:** 50+ in first 6 months
- **User Satisfaction:** >4.5/5 rating
- **Cost Reduction:** 30% reduction in administrative overhead for cemetery operators

---

## Risks & Mitigation

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Smart contract bugs | High | Comprehensive testing, audit, formal verification |
| Gas price volatility | Medium | Layer 2 scaling solutions (Polygon), gas price monitoring |
| IPFS data loss | Medium | Multiple IPFS pinning services, regular backups |
| Network congestion | Low | Queue system, user notifications |

### Business Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low adoption | High | Pilot programs, partnerships with cemeteries |
| Regulatory challenges | High | Legal consultation, compliance framework |
| User experience complexity | Medium | Intuitive UI, tutorials, customer support |
| Cryptocurrency barriers | Medium | Fiat on-ramp options, educational materials |

### Legal & Compliance Risks

- **Data Protection:** GDPR compliance via encryption and key destruction
- **Financial Regulations:** Consult legal team on payment processing laws
- **Cemetery Regulations:** Work with local authorities for compliance
- **Liability:** Clear terms of service, insurance considerations

---

## Future Enhancements

### Phase 2 Features (Post-MVP)
1. **NFT Certificates** - Mint NFT for each grave ownership
2. **Mobile App** - iOS/Android native apps
3. **Multi-chain Support** - Deploy to Polygon, Arbitrum for lower fees
4. **Virtual Memorials** - AR/VR grave site tours
5. **Family Trees** - Link graves to genealogy data
6. **Subscription Model** - Recurring maintenance fees via smart contracts
7. **Marketplace** - Secondary market for grave transfers
8. **Integration APIs** - Connect with funeral homes, legal services

### Research Opportunities
- **Zero-Knowledge Proofs** - Private burial records with public verification
- **DAOs for Cemetery Governance** - Community-managed cemeteries
- **Oracle Integration** - Real-world maintenance verification
- **Cross-Chain Bridges** - Interoperability between blockchain networks

---

## Project Timeline

### Month 1: Foundation
- Week 1: Project setup, smart contract skeleton
- Week 2: Core smart contract logic + unit tests
- Week 3: Backend API + database setup
- Week 4: IPFS integration + encryption

### Month 2: Application Development
- Week 1: Frontend setup + wallet integration
- Week 2: Map implementation + UI components
- Week 3: Reservation flow + admin panel
- Week 4: Integration testing

### Month 3: Testing & Deployment
- Week 1: Security testing + gas optimization
- Week 2: Testnet deployment + public testing
- Week 3: Bug fixes + documentation
- Week 4: Mainnet deployment + launch

### Month 4: Research & Documentation
- Week 1: Performance analysis + gas metrics
- Week 2: Security analysis + comparison with existing solutions
- Week 3: Research paper writing
- Week 4: Presentation preparation + final demo

---

## Team & Resources

### Required Roles
- **Smart Contract Developer:** Solidity, security best practices
- **Backend Developer:** Node.js, Web3.js, database management
- **Frontend Developer:** React, Web3 integration, mapping libraries
- **UI/UX Designer:** User flows, wireframes, responsive design
- **Security Auditor:** Smart contract review, penetration testing
- **Project Manager:** Timeline, coordination, stakeholder management

### Solo Implementation Path
For individual implementation (M.Tech project):
1. Focus on core features first (grave reservation, payment)
2. Use templates for frontend (React templates)
3. Leverage OpenZeppelin for security
4. Start with GeoJSON files instead of full PostGIS setup
5. Use Pinata for IPFS (no local node management)

---

## Documentation Deliverables

### Technical Documentation
1. **README.md** - Setup instructions, architecture overview
2. **API Documentation** - Swagger/OpenAPI specs
3. **Smart Contract Documentation** - NatSpec comments, function reference
4. **Deployment Guide** - Step-by-step testnet/mainnet deployment

### Research Documentation
1. **Research Paper** (IEEE/ACM format)
   - Abstract
   - Introduction
   - Literature Review
   - Methodology
   - System Architecture
   - Implementation Details
   - Results and Analysis (Gas costs, performance metrics)
   - Security Analysis
   - Comparison with Existing Solutions
   - Future Work
   - Conclusion

2. **Presentation Slides** (30-40 slides)
   - Problem statement
   - Solution overview
   - Architecture diagrams
   - Demo screenshots/video
   - Performance results
   - Security features
   - Future roadmap

3. **User Manual**
   - For cemetery administrators
   - For customers
   - For system operators

---

## References & Prior Art

### Academic Research
- Blockchain-based land registry systems
- Smart contract security patterns
- Decentralized storage solutions
- Privacy-preserving blockchain applications

### Industry Solutions
- Traditional cemetery management software
- Blockchain-based record management systems
- NFT marketplaces (for ownership model reference)
- Decentralized applications (DApps) architecture patterns

### Technical Standards
- ERC-721 (NFT standard) - for ownership certificates
- ERC-1155 (Multi-token standard) - if supporting multiple asset types
- OpenZeppelin Contracts - security-audited implementations
- GeoJSON RFC 7946 - geographic data format

---

## Conclusion

The Cemetery Allocation Management System represents a significant innovation in cemetery management, combining the transparency and immutability of blockchain technology with modern web development practices and geographic information systems.

**Core Value Propositions:**
1. **Transparency:** All transactions visible on blockchain
2. **Security:** Immutable ownership records, cryptographic proof
3. **Efficiency:** Automated payments, reduced administrative burden
4. **Accessibility:** 24/7 online reservation system
5. **Trust:** No central authority can manipulate records

**Innovation Highlights:**
- First blockchain-based cemetery management system with interactive mapping
- Integration of IPFS for privacy-preserving record storage
- Smart contract automation for payments and maintenance tracking
- User-friendly DApp accessible to non-technical users

This project serves as both a practical solution to real-world problems in cemetery management and a research contribution demonstrating the application of blockchain technology beyond cryptocurrency, addressing trust, transparency, and record-keeping challenges in a traditionally paper-based industry.

---

## Contact & Support

For questions, contributions, or partnership inquiries:
- GitHub: [Repository URL]
- Email: [Contact Email]
- Documentation: [Docs Site URL]
- Demo: [Live Demo URL]

---

**Document Version:** 1.0
**Last Updated:** 2025-11-14
**Status:** Active Development
**License:** MIT (or specify your license)
