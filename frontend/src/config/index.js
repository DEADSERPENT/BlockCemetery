// Configuration utility for BlockCemetery
export const config = {
  // Environment
  mode: import.meta.env.VITE_MODE || 'development',
  isDevelopment: import.meta.env.VITE_MODE === 'development' || import.meta.env.DEV,
  isProduction: import.meta.env.VITE_MODE === 'production' || import.meta.env.PROD,

  // Blockchain
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || '',
  rpcUrl: import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545',
  networkId: import.meta.env.VITE_NETWORK_ID || '1337',
  networkName: import.meta.env.VITE_NETWORK_NAME || 'localhost',

  // API
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',

  // IPFS
  ipfsMock: import.meta.env.VITE_IPFS_MOCK === 'true',

  // Network configurations
  networks: {
    '1337': {
      name: 'Localhost (Hardhat)',
      rpcUrl: 'http://127.0.0.1:8545',
      chainId: '0x539',
      explorer: null
    },
    '11155111': {
      name: 'Sepolia Testnet',
      rpcUrl: 'https://sepolia.infura.io/v3/',
      chainId: '0xaa36a7',
      explorer: 'https://sepolia.etherscan.io'
    },
    '1': {
      name: 'Ethereum Mainnet',
      rpcUrl: 'https://mainnet.infura.io/v3/',
      chainId: '0x1',
      explorer: 'https://etherscan.io'
    }
  }
};

// Get network info by chain ID
export const getNetworkInfo = (chainId) => {
  return config.networks[chainId] || null;
};

// Check if connected to correct network
export const isCorrectNetwork = (chainId) => {
  return chainId === config.networkId;
};

// Get expected network name
export const getExpectedNetworkName = () => {
  return config.networks[config.networkId]?.name || `Chain ${config.networkId}`;
};

export default config;
