import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import CemeteryManagerABI from '../contracts/CemeteryManager.json';
import { config, isCorrectNetwork, getExpectedNetworkName } from '../config';

const Web3Context = createContext(null);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  const CONTRACT_ADDRESS = config.contractAddress;

  // Validate contract address on mount
  useEffect(() => {
    if (CONTRACT_ADDRESS && !ethers.isAddress(CONTRACT_ADDRESS)) {
      console.warn('VITE_CONTRACT_ADDRESS is not a valid Ethereum address:', CONTRACT_ADDRESS);
    }
  }, [CONTRACT_ADDRESS]);

  // Initialize contract helper
  const initializeContract = useCallback((ethSigner) => {
    if (CONTRACT_ADDRESS && ethers.isAddress(CONTRACT_ADDRESS) && ethSigner) {
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        CemeteryManagerABI.abi,
        ethSigner
      );
      setContract(contractInstance);
      return contractInstance;
    } else {
      setContract(null);
      return null;
    }
  }, [CONTRACT_ADDRESS]);

  // Initialize provider and auto-reconnect (only if user didn't manually disconnect)
  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const ethProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(ethProvider);

        // Check if user manually disconnected
        const wasDisconnected = localStorage.getItem('wallet_disconnected') === 'true';
        if (wasDisconnected) {
          return;
        }

        // Check if already connected (auto-reconnect)
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });

          if (accounts.length > 0) {
            const ethSigner = await ethProvider.getSigner();
            const network = await ethProvider.getNetwork();

            setAccount(accounts[0]);
            setSigner(ethSigner);
            setChainId(network.chainId.toString());
            initializeContract(ethSigner);
          }
        } catch (error) {
          console.error('Auto-reconnect error:', error);
        }
      }
    };

    init();
  }, [CONTRACT_ADDRESS, initializeContract]);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      toast.error('MetaMask is not installed!');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      const ethSigner = await ethProvider.getSigner();
      const network = await ethProvider.getNetwork();

      const currentChainId = network.chainId.toString();
      setAccount(accounts[0]);
      setProvider(ethProvider);
      setSigner(ethSigner);
      setChainId(currentChainId);
      initializeContract(ethSigner);

      // Check network
      const wrongNetwork = !isCorrectNetwork(currentChainId);
      setIsWrongNetwork(wrongNetwork);

      // Clear disconnected flag
      localStorage.removeItem('wallet_disconnected');

      if (wrongNetwork) {
        toast.warning(`Wrong network! Please switch to ${getExpectedNetworkName()}`);
      } else {
        toast.success('Wallet connected successfully!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error(error?.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, [initializeContract]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setContract(null);
    setChainId(null);
    localStorage.setItem('wallet_disconnected', 'true');
    toast.info('Wallet disconnected');
  }, []);

  // Listen for account and chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
        return;
      }

      const newAccount = accounts[0];
      if (newAccount !== account) {
        setAccount(newAccount);

        try {
          const ethProvider = new ethers.BrowserProvider(window.ethereum);
          const newSigner = await ethProvider.getSigner();
          setProvider(ethProvider);
          setSigner(newSigner);
          initializeContract(newSigner);

          toast.info('Account changed');
        } catch (err) {
          console.error('Error updating signer after account change:', err);
          toast.error('Failed to update account');
          disconnectWallet();
        }
      }
    };

    const handleChainChanged = async (hexChainId) => {
      try {
        const numericChainId = parseInt(hexChainId, 16).toString();
        setChainId(numericChainId);

        // Check network
        const wrongNetwork = !isCorrectNetwork(numericChainId);
        setIsWrongNetwork(wrongNetwork);

        // Recreate provider & signer
        const ethProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(ethProvider);

        const ethSigner = await ethProvider.getSigner().catch(() => null);
        setSigner(ethSigner);
        initializeContract(ethSigner);

        if (wrongNetwork) {
          toast.warning(`Wrong network! Please switch to ${getExpectedNetworkName()}`);
        } else {
          toast.info(`Network changed to ${getExpectedNetworkName()}`);
        }
      } catch (err) {
        console.error('handleChainChanged error:', err);
        // Fallback to reload if state is inconsistent
        window.location.reload();
      }
    };

    const handleConnect = () => {
      console.log('MetaMask connected');
    };

    const handleDisconnect = (error) => {
      console.log('MetaMask disconnected:', error);
      disconnectWallet();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('connect', handleConnect);
    window.ethereum.on('disconnect', handleDisconnect);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('connect', handleConnect);
      window.ethereum.removeListener('disconnect', handleDisconnect);
    };
  }, [account, disconnectWallet, initializeContract]);

  // Get contract with read-only provider
  const getReadOnlyContract = useCallback(() => {
    if (!CONTRACT_ADDRESS || !ethers.isAddress(CONTRACT_ADDRESS) || !provider) {
      return null;
    }

    return new ethers.Contract(
      CONTRACT_ADDRESS,
      CemeteryManagerABI.abi,
      provider
    );
  }, [CONTRACT_ADDRESS, provider]);

  // Format address
  const formatAddress = useCallback((address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }, []);

  // Switch network helper
  const switchNetwork = useCallback(async (targetChainId) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${parseInt(targetChainId).toString(16)}` }]
      });
    } catch (error) {
      console.error('Error switching network:', error);
      toast.error('Failed to switch network');
    }
  }, []);

  // Switch to configured network
  const switchToCorrectNetwork = useCallback(async () => {
    await switchNetwork(config.networkId);
  }, [switchNetwork]);

  const value = {
    account,
    provider,
    signer,
    contract,
    chainId,
    isConnecting,
    isWrongNetwork,
    connectWallet,
    disconnectWallet,
    getReadOnlyContract,
    formatAddress,
    switchNetwork,
    switchToCorrectNetwork,
    isConnected: !!account,
    CONTRACT_ADDRESS,
    expectedNetworkName: getExpectedNetworkName(),
    config
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
