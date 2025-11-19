# Web Platform Deployment Guide

This guide explains how to deploy BlockCemetery to various web platforms.

## Prerequisites

Before deploying to production:

1. **Deploy Smart Contract** to Sepolia testnet (or mainnet)
2. **Set up IPFS** - Get Pinata API keys
3. **Update environment files** with production values

## Option 1: Vercel (Recommended for Frontend)

### Deploy Frontend

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/BlockCemetery.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Import your repository
   - Set root directory to `frontend`

3. **Configure Environment Variables**
   In Vercel dashboard → Settings → Environment Variables:
   ```
   VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
   VITE_API_URL=https://your-backend-url.com
   VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   VITE_NETWORK_ID=11155111
   VITE_NETWORK_NAME=sepolia
   VITE_MODE=production
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel auto-builds and deploys

### Custom Domain
- Add custom domain in Vercel settings
- Configure DNS as instructed

## Option 2: Netlify (Alternative for Frontend)

1. **Build Command**: `npm run build`
2. **Publish Directory**: `dist`
3. **Environment Variables**: Same as Vercel

## Option 3: Railway (Recommended for Backend)

### Deploy Backend

1. **Go to [railway.app](https://railway.app)**

2. **Create New Project** → Deploy from GitHub

3. **Select Repository** and set:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

4. **Add Environment Variables**:
   ```
   PORT=3001
   NODE_ENV=production
   CONTRACT_ADDRESS=0xYourContractAddress
   RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   PINATA_API_KEY=your_key
   PINATA_SECRET_KEY=your_secret
   JWT_SECRET=generate_strong_secret
   ENCRYPTION_KEY=generate_strong_key
   ```

5. **Generate Domain**
   - Railway provides a `.railway.app` subdomain
   - Or add custom domain

## Option 4: Render (Alternative for Backend)

1. **Create Web Service** at [render.com](https://render.com)
2. **Connect GitHub repo**
3. **Configure**:
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `npm start`
4. **Add environment variables**

## Option 5: DigitalOcean App Platform

### Full Stack Deployment

1. **Create App** at [digitalocean.com](https://digitalocean.com)

2. **Add Components**:
   - Static Site (frontend)
   - Web Service (backend)

3. **Configure each component** with environment variables

## Smart Contract Deployment

### Deploy to Sepolia Testnet

1. **Get Sepolia ETH**
   - Faucet: https://sepoliafaucet.com
   - Or: https://faucet.sepolia.dev

2. **Configure Root `.env`**
   ```env
   PRIVATE_KEY=your_wallet_private_key
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   ETHERSCAN_API_KEY=your_etherscan_key
   ```

3. **Deploy**
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

4. **Verify Contract**
   ```bash
   npx hardhat verify --network sepolia 0xYourContractAddress
   ```

5. **Save Contract Address**
   - Update frontend production env
   - Update backend production env

## CORS Configuration

Update `backend/src/server.js` for production:

```javascript
app.use(cors({
  origin: [
    'https://your-frontend-domain.vercel.app',
    'https://yourdomain.com'
  ],
  credentials: true
}));
```

## Deployment Checklist

### Before Deployment

- [ ] Smart contract deployed to testnet/mainnet
- [ ] Contract verified on Etherscan
- [ ] Pinata IPFS account set up
- [ ] Strong secrets generated for JWT and encryption
- [ ] Frontend `.env.production` configured
- [ ] Backend environment variables set
- [ ] CORS origins configured

### After Deployment

- [ ] Test wallet connection
- [ ] Test graveyard creation (admin)
- [ ] Test grave reservation
- [ ] Test IPFS upload
- [ ] Monitor error logs
- [ ] Set up alerts (optional)

## Cost Estimates

### Free Tier Options

| Service | Free Tier |
|---------|-----------|
| Vercel | 100GB bandwidth/month |
| Netlify | 100GB bandwidth/month |
| Railway | $5 credit/month |
| Render | 750 hours/month |

### Blockchain Costs

- Sepolia: Free (testnet)
- Mainnet: ~$10-50 per transaction (varies with gas)

## Monitoring & Maintenance

### Recommended Tools

- **Etherscan**: Monitor contract transactions
- **Vercel Analytics**: Frontend performance
- **Railway Logs**: Backend errors
- **Pinata Dashboard**: IPFS usage

### Regular Tasks

- Monitor gas prices for mainnet
- Check IPFS pin status
- Update dependencies monthly
- Review security alerts

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check backend CORS configuration
2. **Contract Not Found**: Verify address matches deployed contract
3. **Network Mismatch**: Ensure frontend and contract on same network
4. **IPFS Upload Fails**: Check Pinata API keys

### Debug Steps

1. Check browser console for errors
2. Check backend logs
3. Verify environment variables
4. Test contract on Etherscan

## Security Recommendations

1. **Use environment variables** - Never hardcode secrets
2. **Enable HTTPS** - All platforms provide free SSL
3. **Rate limiting** - Already configured in backend
4. **Monitor access** - Review logs regularly
5. **Keep updated** - Regular dependency updates

---

## Quick Start Commands

```bash
# Deploy contract to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Build frontend for production
cd frontend && npm run build

# Test backend locally with production config
NODE_ENV=production npm start
```

For questions or issues, open a GitHub issue or check the main README.
