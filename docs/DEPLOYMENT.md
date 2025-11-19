# Deployment Guide

Complete guide for deploying Cemetery Blockchain to testnet and mainnet.

## Table of Contents

- [Local Development](#local-development)
- [Testnet Deployment (Sepolia)](#testnet-deployment-sepolia)
- [Mainnet Deployment](#mainnet-deployment)
- [Contract Verification](#contract-verification)
- [Post-Deployment](#post-deployment)

## Local Development

### 1. Start Local Network

```bash
npx hardhat node
```

### 2. Deploy Locally

```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Test Locally

```bash
npx hardhat test --network localhost
```

## Testnet Deployment (Sepolia)

### Prerequisites

1. **Get Test ETH**
   - Sepolia Faucet: https://sepoliafaucet.com/
   - Alchemy Faucet: https://sepoliafaucet.com/
   - Infura Faucet: https://www.infura.io/faucet/sepolia

2. **Create Infura Account** (or use Alchemy)
   - Sign up at https://infura.io
   - Create new project
   - Copy Project ID

3. **Get Etherscan API Key**
   - Sign up at https://etherscan.io
   - Go to API Keys
   - Create new key

### Configuration

1. **Update `.env`**

```env
# Your wallet private key (NEVER COMMIT THIS)
PRIVATE_KEY=your_private_key_without_0x_prefix

# Sepolia RPC URL
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID

# Etherscan API key for verification
ETHERSCAN_API_KEY=your_etherscan_api_key

# Optional: Gas reporter
COINMARKETCAP_API_KEY=your_cmc_api_key
```

2. **Verify Configuration**

Check `hardhat.config.js` has Sepolia network configured:

```javascript
sepolia: {
  url: process.env.SEPOLIA_RPC_URL || "",
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  chainId: 11155111
}
```

### Deployment Steps

1. **Compile Contracts**

```bash
npx hardhat compile
```

2. **Check Gas Prices**

Visit: https://etherscan.io/gastracker

Or use:

```bash
npx hardhat run scripts/check-gas.js --network sepolia
```

3. **Deploy to Sepolia**

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

**Expected Output**:

```
Deploying CemeteryManager contract...
Deploying with account: 0xYourAddress
Account balance: 0.5 ETH
CemeteryManager deployed to: 0x1234567890abcdef...
```

**Important**: Save the contract address!

4. **Verify Contract on Etherscan**

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

Example:

```bash
npx hardhat verify --network sepolia 0x1234567890abcdef1234567890abcdef12345678
```

### Configure Frontend for Sepolia

1. **Update `frontend/.env`**

```env
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
VITE_API_URL=https://your-backend-url.com
VITE_CHAIN_ID=11155111
VITE_NETWORK_NAME=sepolia
```

2. **Update Backend**

Edit `backend/src/config/blockchain.js`:

```javascript
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0xYourContractAddress';
const RPC_URL = process.env.RPC_URL || 'https://sepolia.infura.io/v3/YOUR_KEY';
```

Update `backend/.env`:

```env
CONTRACT_ADDRESS=0xYourDeployedContractAddress
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
```

### Test on Sepolia

1. **Switch MetaMask to Sepolia**
   - Open MetaMask
   - Select "Sepolia Test Network"

2. **Test the Application**
   - Connect wallet
   - Try creating a graveyard (if you're the owner)
   - Try reserving a grave

3. **Monitor on Etherscan**
   - View contract: https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS
   - View transactions in real-time

## Mainnet Deployment

⚠️ **WARNING**: Mainnet deployment costs real money and requires extreme caution!

### Pre-Deployment Checklist

- [ ] Smart contracts have been **professionally audited**
- [ ] All tests passing with 100% coverage
- [ ] Thoroughly tested on testnet for at least 2 weeks
- [ ] Security review completed
- [ ] Gas optimization completed
- [ ] Emergency pause mechanism tested
- [ ] Multi-sig wallet setup for ownership
- [ ] Sufficient ETH for deployment (~0.2-0.5 ETH recommended)
- [ ] Legal review completed
- [ ] Terms of service and privacy policy ready
- [ ] Monitoring and alerting systems in place

### Security Audit

Before mainnet deployment, get a professional audit from:

- OpenZeppelin
- ConsenSys Diligence
- Trail of Bits
- CertiK
- Quantstamp

### Mainnet Configuration

1. **Update `.env`**

```env
PRIVATE_KEY=your_mainnet_wallet_private_key
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
ETHERSCAN_API_KEY=your_etherscan_api_key
```

2. **Add Mainnet to `hardhat.config.js`**

```javascript
mainnet: {
  url: process.env.MAINNET_RPC_URL || "",
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  chainId: 1,
  gasPrice: "auto" // Or set specific gas price
}
```

### Deployment Process

1. **Final Testing**

```bash
# Run all tests
npx hardhat test

# Check gas usage
REPORT_GAS=true npx hardhat test

# Check contract size
npx hardhat size-contracts
```

2. **Dry Run on Fork**

```bash
npx hardhat run scripts/deploy.js --network hardhat
```

3. **Check Gas Prices**

Visit: https://etherscan.io/gastracker

Wait for low gas prices (typically weekends or late nights UTC).

4. **Deploy to Mainnet**

```bash
npx hardhat run scripts/deploy.js --network mainnet
```

5. **Verify Immediately**

```bash
npx hardhat verify --network mainnet <CONTRACT_ADDRESS>
```

6. **Transfer Ownership to Multi-Sig**

```bash
npx hardhat run scripts/transfer-ownership.js --network mainnet
```

## Contract Verification

### Automatic Verification

The deploy script includes automatic verification:

```javascript
await hre.run("verify:verify", {
  address: contractAddress,
  constructorArguments: [],
});
```

### Manual Verification

If automatic verification fails:

1. **Via Command Line**

```bash
npx hardhat verify --network sepolia <ADDRESS> <CONSTRUCTOR_ARGS>
```

2. **Via Etherscan UI**

- Go to contract page on Etherscan
- Click "Contract" tab
- Click "Verify and Publish"
- Select "Solidity (Single file)"
- Upload flattened source code

3. **Flatten Contract**

```bash
npx hardhat flatten contracts/CemeteryManager.sol > flattened.sol
```

## Post-Deployment

### 1. Initialize Contract

If deploying to mainnet, you may want to:

```javascript
// Add initial graveyard
await contract.addGraveyard(
  ownerAddress,
  "First Cemetery",
  "Location",
  100
);
```

### 2. Update Frontend

```env
VITE_CONTRACT_ADDRESS=<deployed_address>
VITE_CHAIN_ID=1  # or 11155111 for Sepolia
```

### 3. Update Documentation

- Update README with contract address
- Document all deployment parameters
- Create changelog entry

### 4. Monitoring

Set up monitoring for:

- Transaction failures
- Gas price spikes
- Unusual activity
- Error events

Tools:
- Tenderly
- Defender (OpenZeppelin)
- Custom scripts

### 5. Announce Deployment

- Update website
- Social media announcement
- Blog post
- Documentation update

## Deployment Cost Estimates

### Sepolia (Free - Testnet)
- Contract Deployment: ~2,500,000 gas (Test ETH)
- Total Cost: $0 (test network)

### Mainnet (Real Costs)

Assuming 50 Gwei gas price and $2000 ETH:

| Action | Gas | Cost (ETH) | Cost (USD) |
|--------|-----|------------|------------|
| Contract Deployment | ~2,500,000 | 0.125 | $250 |
| Add Graveyard | ~150,000 | 0.0075 | $15 |
| Add Grave | ~100,000 | 0.005 | $10 |
| Verification | Free | 0 | $0 |
| **Total Initial** | ~2,650,000 | **0.1325** | **$265** |

**Note**: Costs vary based on gas prices. Check current prices at etherscan.io/gastracker

## Troubleshooting

### Deployment Fails

```
Error: insufficient funds for gas * price + value
```

**Solution**: Add more ETH to your deployment wallet

### Verification Fails

```
Error: Contract source code already verified
```

**Solution**: Contract is already verified, no action needed

### Wrong Network

```
Error: network not supported
```

**Solution**: Check `hardhat.config.js` has correct network configuration

### Gas Price Too High

**Solution**: Wait for lower gas prices or increase gas limit in config

## Rollback Plan

If something goes wrong:

1. **Pause Contract** (if pause functionality exists)
2. **Deploy Fix** to new address
3. **Migrate Data** if needed
4. **Update Frontend** to point to new contract
5. **Communicate** with users

## Security Best Practices

1. **Never commit private keys** to Git
2. **Use hardware wallet** for mainnet deployment
3. **Test everything** on testnet first
4. **Use multi-sig wallet** for contract ownership
5. **Implement timelock** for critical functions
6. **Monitor contract** continuously
7. **Have emergency plan** ready
8. **Keep detailed logs** of all deployments

## Upgrade Strategy

For future upgrades:

1. **Use Proxy Pattern** (OpenZeppelin Upgradeable)
2. **Thorough Testing** of upgrade process
3. **Announcement** before upgrade
4. **Monitoring** after upgrade
5. **Rollback Plan** ready

## Resources

- [Hardhat Deployment](https://hardhat.org/guides/deploying.html)
- [Etherscan Verification](https://hardhat.org/plugins/nomiclabs-hardhat-etherscan.html)
- [OpenZeppelin Defender](https://defender.openzeppelin.com/)
- [Tenderly Monitoring](https://tenderly.co/)

## Support

For deployment assistance:
- GitHub Issues
- Discord Community
- Email: support@example.com

---

**Remember**: Deploying to mainnet is permanent. Double-check everything!
