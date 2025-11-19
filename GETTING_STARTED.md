# 🚀 Getting Started - Cemetery Blockchain

**Welcome!** This guide will get you from zero to running in under 10 minutes.

## ⚡ Quick Start (5 Commands)

```bash
# 1. Install dependencies (run this once)
npm install
cd backend && npm install && cd ../frontend && npm install && cd ..

# 2. Start local blockchain (Terminal 1 - keep running)
npx hardhat node

# 3. Deploy smart contracts (Terminal 2)
npx hardhat run scripts/deploy.js --network localhost
# ⚠️ IMPORTANT: Copy the contract address from output!

# 4. Configure frontend
# Edit frontend/.env and add: VITE_CONTRACT_ADDRESS=<your_address>

# 5. Start services (Terminal 3 & 4)
cd backend && npm run dev    # Terminal 3
cd frontend && npm run dev   # Terminal 4
```

**Done!** Open http://localhost:5173 in your browser.

---

## 📋 Prerequisites

Make sure you have installed:

- ✅ **Node.js** (v18+): Download from https://nodejs.org
- ✅ **Git**: Download from https://git-scm.com
- ✅ **MetaMask**: Install browser extension from https://metamask.io

Check versions:
```bash
node --version   # Should show v18 or higher
npm --version    # Should show 8 or higher
git --version    # Any recent version
```

---

## 📦 Step-by-Step Installation

### 1. Get the Code

```bash
# If you cloned from Git
cd cemetery-blockchain

# Or if you have the folder
cd BlockCemetery
```

### 2. Install All Dependencies

```bash
# Root dependencies (Hardhat, etc.)
npm install

# Backend dependencies
cd backend
npm install
cd ..

# Frontend dependencies
cd frontend
npm install
cd ..
```

**Expected time**: 2-3 minutes (depending on internet speed)

### 3. Start Local Blockchain

Open a new terminal (Terminal 1) and run:

```bash
npx hardhat node
```

**You should see:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...
```

**Important**:
- Keep this terminal running!
- Copy one of the private keys (you'll need it for MetaMask)

### 4. Deploy Smart Contracts

Open another terminal (Terminal 2) and run:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

**You should see:**
```
Deploying CemeteryManager contract...
Deploying with account: 0xf39Fd...
CemeteryManager deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Test graveyard added!
Test graves added!
```

**Critical Step**: Copy the contract address (starts with 0x...)

### 5. Configure Frontend

Create `frontend/.env` file:

```bash
# Windows
cd frontend
echo VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3 > .env
echo VITE_API_URL=http://localhost:3001 >> .env

# Mac/Linux
cd frontend
cat > .env << EOF
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_API_URL=http://localhost:3001
EOF

cd ..
```

**Replace** `0x5FbDB...` with YOUR actual contract address from step 4!

### 6. Start Backend API

Open another terminal (Terminal 3):

```bash
cd backend
npm run dev
```

**You should see:**
```
✅ Cemetery Backend API running on port 3001
📡 API endpoint: http://localhost:3001
```

### 7. Start Frontend

Open another terminal (Terminal 4):

```bash
cd frontend
npm run dev
```

**You should see:**
```
  VITE v5.0.8  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 8. Setup MetaMask

1. **Install MetaMask** extension if you haven't
2. **Open MetaMask** and click network dropdown
3. **Add Custom Network**:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `1337`
   - Currency Symbol: `ETH`
4. **Import Account**:
   - Click account icon → "Import Account"
   - Paste the private key from step 3
   - Click "Import"

### 9. Use the Application!

1. **Open browser** to http://localhost:5173
2. **Click "Connect Wallet"** in the navbar
3. **Approve** the connection in MetaMask
4. **Navigate to "Graveyards"**
5. **Click** on "Green Valley Memorial Park"
6. **Click** on a green grave plot on the map
7. **Click "Reserve Grave"**
8. **Confirm** the transaction in MetaMask
9. **Success!** You've reserved a grave on the blockchain!

---

## 🧪 Testing Everything Works

Run the test suite:

```bash
npx hardhat test
```

**Expected output:**
```
  CemeteryManager
    Deployment
      ✓ Should set the right owner
      ✓ Should initialize counters correctly
    ...
  65 passing (3s)
```

If all tests pass, everything is working correctly! ✅

---

## 🎯 Quick Tour of Features

### 1. Browse Graveyards
- Navigate to "Graveyards" page
- See list of available cemeteries
- Click "View Details" for any graveyard

### 2. Interactive Map
- Pan and zoom the map
- Green plots = Available
- Red plots = Reserved
- Yellow plots = Maintained
- Click any plot for details

### 3. Reserve a Grave
- Click on available (green) grave
- Fill in optional burial information
- Click "Reserve Grave"
- Confirm payment in MetaMask
- Receive confirmation

### 4. View Your Graves
- Click "My Graves" in navbar
- See all graves you own
- View details and status

### 5. Admin Functions
- Click "Admin" in navbar
- Add new graveyards
- Add graves to graveyards
- Withdraw accumulated funds

---

## 🔧 Troubleshooting

### Problem: "Cannot connect to blockchain"
**Solution**:
- Make sure `npx hardhat node` is running in Terminal 1
- Check it's on port 8545

### Problem: "Contract not found"
**Solution**:
- Verify contract address in `frontend/.env` is correct
- Redeploy if needed: `npx hardhat run scripts/deploy.js --network localhost`

### Problem: "MetaMask transaction fails"
**Solution**:
- Make sure you're on "Hardhat Local" network in MetaMask
- Try resetting MetaMask: Settings → Advanced → Reset Account
- Make sure you have enough ETH (local accounts have 10000 ETH)

### Problem: "Backend API not responding"
**Solution**:
- Check Terminal 3 - backend should be running
- Visit http://localhost:3001 to test
- Check for port conflicts

### Problem: "Frontend won't load"
**Solution**:
- Check Terminal 4 - frontend should be running
- Make sure port 5173 isn't in use
- Try clearing browser cache

### Problem: "Transactions pending forever"
**Solution**:
- Restart Hardhat node (Terminal 1)
- Redeploy contracts (Terminal 2)
- Reset MetaMask account

---

## 📚 Next Steps

Once everything is running:

1. **Explore the Code**
   - Smart Contract: `contracts/CemeteryManager.sol`
   - Backend API: `backend/src/`
   - Frontend: `frontend/src/`

2. **Read Documentation**
   - [README.md](README.md) - Full documentation
   - [PROJECT_VISION.md](PROJECT_VISION.md) - Project overview
   - [docs/QUICKSTART.md](docs/QUICKSTART.md) - Quick reference
   - [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - Deploy to testnet

3. **Modify and Learn**
   - Add new features
   - Customize the UI
   - Deploy to testnet (Sepolia)

---

## 📞 Getting Help

- **Documentation**: Check `docs/` folder
- **Code Issues**: Review error messages
- **Questions**: Create GitHub issue

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Hardhat node running (Terminal 1)
- [ ] Contract deployed successfully
- [ ] Backend API running on port 3001
- [ ] Frontend running on port 5173
- [ ] MetaMask connected to Hardhat Local
- [ ] Can browse graveyards
- [ ] Can view map
- [ ] Can reserve grave
- [ ] Transaction succeeds

If all checked, **congratulations!** You're ready to go! 🎉

---

## 🎓 Learning Path

**Beginner**:
1. Use the application
2. Read the README
3. Explore the UI code

**Intermediate**:
1. Modify frontend components
2. Add new API endpoints
3. Customize smart contract

**Advanced**:
1. Add new features
2. Optimize gas usage
3. Deploy to testnet
4. Contribute back!

---

**Questions?** Start with:
1. Check this guide
2. Read [README.md](README.md)
3. Review error messages
4. Create GitHub issue

**Happy coding!** 🚀⛓️
