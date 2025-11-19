const { ethers } = require('ethers');
require('dotenv').config();

// Contract ABI - Load from local contracts folder
const CEMETERY_MANAGER_ABI = require('../contracts/CemeteryManager.json').abi;

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';

let provider;
let contract;

function initializeBlockchain() {
  try {
    // Initialize provider
    provider = new ethers.JsonRpcProvider(RPC_URL);

    // Initialize contract
    if (CONTRACT_ADDRESS) {
      contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CEMETERY_MANAGER_ABI,
        provider
      );
      console.log('✅ Blockchain connection initialized');
      console.log('📍 Contract address:', CONTRACT_ADDRESS);
    } else {
      console.warn('⚠️  CONTRACT_ADDRESS not set in environment variables');
    }
  } catch (error) {
    console.error('❌ Error initializing blockchain:', error);
  }
}

function getProvider() {
  if (!provider) {
    initializeBlockchain();
  }
  return provider;
}

function getContract() {
  if (!contract) {
    initializeBlockchain();
  }
  return contract;
}

function getContractWithSigner(privateKey) {
  const provider = getProvider();
  const wallet = new ethers.Wallet(privateKey, provider);
  return new ethers.Contract(CONTRACT_ADDRESS, CEMETERY_MANAGER_ABI, wallet);
}

module.exports = {
  initializeBlockchain,
  getProvider,
  getContract,
  getContractWithSigner,
  CONTRACT_ADDRESS,
  CEMETERY_MANAGER_ABI
};
