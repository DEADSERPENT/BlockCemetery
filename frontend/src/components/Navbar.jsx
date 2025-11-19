import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEthereum, FaWallet } from 'react-icons/fa';
import { useWeb3 } from '../context/Web3Context';

const Navbar = () => {
  const { account, isConnecting, connectWallet, disconnectWallet, formatAddress, chainId } = useWeb3();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-2xl border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-gradient-to-br from-primary-400 to-primary-600 p-2 rounded-lg shadow-lg group-hover:shadow-primary-500/50 transition-all">
                <FaEthereum className="text-2xl text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
                  BlockCemetery
                </span>
                <span className="text-xs text-gray-400 -mt-1">Blockchain Memorial</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex ml-12 space-x-1">
              <NavLink to="/" label="Home" />
              <NavLink to="/graveyards" label="Graveyards" />
              {account && (
                <>
                  <NavLink to="/my-graves" label="My Graves" />
                  <NavLink to="/admin" label="Admin" />
                </>
              )}
            </div>
          </div>

          {/* Right Side - Connection Info */}
          <div className="flex items-center space-x-3">
            {/* Chain Badge */}
            {chainId && (
              <div className="hidden sm:flex items-center px-3 py-1.5 bg-gray-700/50 backdrop-blur-sm border border-gray-600 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <span className="text-xs font-medium text-gray-300">
                  Chain {chainId}
                </span>
              </div>
            )}

            {/* Wallet Connection */}
            {account ? (
              <div className="flex items-center space-x-2">
                <div className="hidden sm:flex items-center px-4 py-2 bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-sm border border-green-500/30 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-sm font-mono font-medium text-green-300">
                    {formatAddress(account)}
                  </span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-all"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-lg font-medium shadow-lg hover:shadow-primary-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaWallet className="text-lg" />
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-700">
            <div className="flex flex-col space-y-2">
              <MobileNavLink to="/" label="Home" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavLink to="/graveyards" label="Graveyards" onClick={() => setIsMobileMenuOpen(false)} />
              {account && (
                <>
                  <MobileNavLink to="/my-graves" label="My Graves" onClick={() => setIsMobileMenuOpen(false)} />
                  <MobileNavLink to="/admin" label="Admin" onClick={() => setIsMobileMenuOpen(false)} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

const NavLink = ({ to, label }) => (
  <Link
    to={to}
    className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg text-sm font-medium transition-all"
  >
    {label}
  </Link>
);

const MobileNavLink = ({ to, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg text-sm font-medium transition-all"
  >
    {label}
  </Link>
);

export default Navbar;
