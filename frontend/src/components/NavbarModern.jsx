import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FaEthereum, FaWallet, FaUserShield, FaBars, FaTimes } from 'react-icons/fa';
import { useWeb3 } from '../context/Web3Context';
import '../styles/modern.css';

const NavbarModern = () => {
  const { account, isConnecting, connectWallet, disconnectWallet, formatAddress, chainId, contract } = useWeb3();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (contract && account) {
        try {
          const adminStatus = await contract.isAdmin(account);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [contract, account]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`nav-modern transition-all duration-300 ${scrolled ? 'shadow-lg' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <FaEthereum className="text-4xl text-purple-600 group-hover:text-purple-700 transition-all duration-300 group-hover:rotate-180" />
              <div className="absolute inset-0 bg-purple-600 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            </div>
            <div>
              <span className="text-2xl font-bold gradient-text">
                Cemetery Blockchain
              </span>
              <div className="text-xs text-gray-500 -mt-1">Powered by Ethereum</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <NavLink to="/" label="Home" active={isActive('/')} />
            <NavLink to="/graveyards" label="Graveyards" active={isActive('/graveyards')} />
            <NavLink to="/search" label="🔍 Search" active={isActive('/search')} />

            {account && (
              <>
                <NavLink to="/my-graves" label="My Graves" active={isActive('/my-graves')} />

                {/* Admin Links - Only show if user is admin */}
                {isAdmin && (
                  <>
                    <NavLink to="/analytics" label="📊 Analytics" active={isActive('/analytics')} />
                    <NavLink
                      to="/admin"
                      label={
                        <span className="flex items-center gap-2">
                          <FaUserShield />
                          Admin
                        </span>
                      }
                      active={isActive('/admin')}
                      isAdmin={true}
                    />
                  </>
                )}
              </>
            )}
          </div>

          {/* Wallet Connection */}
          <div className="hidden md:flex items-center space-x-4">
            {chainId && (
              <div className="badge-modern badge-admin text-sm">
                Chain: {chainId}
              </div>
            )}

            {account ? (
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <div className="badge-modern badge-available px-4 py-2 cursor-pointer">
                    {formatAddress(account)}
                  </div>
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="text-xs text-gray-500 mb-1">Connected Address</div>
                    <div className="text-sm font-mono break-all mb-2">{account}</div>
                    {isAdmin && (
                      <div className="badge-modern badge-admin text-xs mt-2">
                        ⚡ Admin Access
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="btn-modern btn-outline-modern text-sm px-4 py-2"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="btn-modern btn-primary-modern flex items-center space-x-2 px-6 py-3"
              >
                <FaWallet />
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700 hover:text-purple-600 transition-colors p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-4 space-y-2">
            <MobileNavLink to="/" label="Home" onClick={() => setMobileMenuOpen(false)} />
            <MobileNavLink to="/graveyards" label="Graveyards" onClick={() => setMobileMenuOpen(false)} />

            {account && (
              <>
                <MobileNavLink to="/my-graves" label="My Graves" onClick={() => setMobileMenuOpen(false)} />

                {isAdmin && (
                  <MobileNavLink
                    to="/admin"
                    label="Admin Panel"
                    onClick={() => setMobileMenuOpen(false)}
                    isAdmin={true}
                  />
                )}
              </>
            )}

            {/* Mobile Wallet Button */}
            <div className="pt-4 border-t border-gray-200">
              {account ? (
                <div>
                  <div className="badge-modern badge-available text-sm mb-2">
                    {formatAddress(account)}
                  </div>
                  {isAdmin && (
                    <div className="badge-modern badge-admin text-xs mb-2">
                      ⚡ Admin Access
                    </div>
                  )}
                  <button
                    onClick={disconnectWallet}
                    className="btn-modern btn-outline-modern w-full text-sm"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="btn-modern btn-primary-modern w-full flex items-center justify-center space-x-2"
                >
                  <FaWallet />
                  <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

// Desktop Nav Link Component
const NavLink = ({ to, label, active, isAdmin }) => (
  <Link
    to={to}
    className={`nav-link-modern ${active ? 'active' : ''} ${isAdmin ? 'badge-admin text-white' : ''}`}
  >
    {label}
  </Link>
);

// Mobile Nav Link Component
const MobileNavLink = ({ to, label, onClick, isAdmin }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
      isAdmin
        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
        : 'hover:bg-purple-50 text-gray-700'
    }`}
  >
    {label}
  </Link>
);

export default NavbarModern;
