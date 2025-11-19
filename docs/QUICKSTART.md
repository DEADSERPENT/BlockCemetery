# Quick Start Guide

Get the Cemetery Blockchain system running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- MetaMask browser extension installed
- Terminal/Command Prompt

## Step-by-Step Setup

### 1. Clone and Install (2 minutes)

```bash
# Clone the repository
git clone <your-repo-url>
cd cemetery-blockchain

# Install all dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Start Local Blockchain (30 seconds)

```bash
# Terminal 1 - Start Hardhat network
npx hardhat node
```

Keep this terminal open. You should see:

```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

Copy one of the private keys shown (you'll need it for MetaMask).

### 3. Deploy Smart Contract (30 seconds)

```bash
# Terminal 2 - Deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

**Important**: Copy the contract address from the output:

```
CemeteryManager deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 4. Configure Environment (1 minute)

Create `frontend/.env`:

```bash
cd frontend
echo VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3 > .env
echo VITE_API_URL=http://localhost:3001 >> .env
cd ..
```

Replace `0x5FbDB...` with your actual contract address.

### 5. Start Backend (30 seconds)

```bash
# Terminal 3 - Start backend server
cd backend
npm run dev
```

You should see:

```
✅ Cemetery Backend API running on port 3001
```

### 6. Start Frontend (30 seconds)

```bash
# Terminal 4 - Start frontend
cd frontend
npm run dev
```

Open browser to: **http://localhost:5173**

### 7. Setup MetaMask (1 minute)

1. Click MetaMask extension
2. Click network dropdown → "Add Network" → "Add network manually"
3. Enter:
   - **Network Name**: Hardhat Local
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 1337
   - **Currency Symbol**: ETH
4. Click "Save"
5. Import Account:
   - Click account icon → "Import Account"
   - Paste one of the private keys from step 2
   - Click "Import"

### 8. Use the Application!

1. Go to http://localhost:5173
2. Click "Connect Wallet"
3. Approve connection in MetaMask
4. Navigate to "Graveyards"
5. Click "View Details" on the test graveyard
6. Click on a green grave plot
7. Click "Reserve Grave"
8. Confirm transaction in MetaMask

**Congratulations!** You've just reserved a grave on the blockchain! 🎉

## Quick Commands Reference

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to localhost
npx hardhat run scripts/deploy.js --network localhost

# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Clean and rebuild
npx hardhat clean
npx hardhat compile
```

## Troubleshooting

### Contract address not found
- Make sure you copied the correct address from deployment output
- Check `frontend/.env` file exists and has correct address

### MetaMask won't connect
- Make sure you're on Hardhat Local network in MetaMask
- Try refreshing the page
- Check console for errors

### Backend API errors
- Make sure Hardhat node is running
- Check backend terminal for errors
- Verify contract address in backend config

### Transactions failing
- Make sure you have ETH in your MetaMask account (local accounts have 10000 ETH)
- Check you're connected to the right network
- Look at MetaMask error message

## Next Steps

- Read the full [README.md](../README.md)
- Explore the [API Documentation](API.md)
- Learn about [Smart Contract Architecture](ARCHITECTURE.md)
- Try deploying to [Testnet](DEPLOYMENT.md)

## Support

Having issues? Check:
1. All 4 terminals are running
2. Contract address is correct in `.env`
3. MetaMask is on Hardhat Local network
4. No port conflicts (3001, 5173, 8545)

Still stuck? Open an issue on GitHub!
