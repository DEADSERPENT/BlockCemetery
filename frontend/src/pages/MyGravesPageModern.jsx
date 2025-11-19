import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { FaMapMarkerAlt, FaEthereum, FaCalendar, FaLeaf, FaArrowRight, FaWallet, FaSync } from 'react-icons/fa';
import { useWeb3 } from '../context/Web3Context';
import { toast } from 'react-toastify';
import '../styles/modern.css';

const MyGravesPageModern = () => {
  const { account, contract, formatAddress } = useWeb3();
  const [graves, setGraves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (account && contract) {
      fetchMyGraves();
    } else {
      setLoading(false);
    }
  }, [account, contract]);

  const fetchMyGraves = async () => {
    if (!contract || !account) return;

    try {
      // Get user's grave IDs from contract
      const graveIds = await contract.getUserGraves(account);

      // Fetch details for each grave
      const gravesData = [];
      for (const graveId of graveIds) {
        try {
          const grave = await contract.getGrave(graveId);
          gravesData.push({
            id: Number(grave.id),
            graveyardId: Number(grave.graveyardId),
            owner: grave.owner,
            price: grave.price.toString(),
            reserved: grave.reserved,
            maintained: grave.maintained,
            locationHash: grave.locationHash,
            metadataHash: grave.metadataHash,
            timestamp: grave.timestamp.toString()
          });
        } catch (e) {
          console.error(`Error fetching grave ${graveId}:`, e);
        }
      }

      setGraves(gravesData);
    } catch (error) {
      console.error('Error fetching user graves:', error);
      toast.error('Failed to load your graves');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMyGraves();
  };

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="card-modern card-glass text-center py-16 px-8 max-w-md">
          <div className="text-6xl mb-6">
            <FaWallet className="mx-auto text-gray-300" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Wallet Not Connected</h3>
          <p className="text-gray-600 mb-6">
            Please connect your MetaMask wallet to view your reserved graves.
          </p>
          <div className="badge-modern badge-admin text-sm">
            🔒 Secure blockchain authentication required
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-modern mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-medium">Loading your graves...</p>
          <p className="text-gray-500 mt-2">Fetching your blockchain records</p>
        </div>
      </div>
    );
  }

  const totalSpent = graves.reduce((sum, g) => sum + Number(ethers.formatEther(g.price)), 0);
  const maintainedCount = graves.filter(g => g.maintained).length;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Account Info */}
        <div className="card-modern card-gradient mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">
                  My Graves
                </h1>
                <div className="flex items-center gap-2 text-white/90">
                  <span className="text-sm font-medium">Connected Account:</span>
                  <span className="badge-modern bg-white text-purple-600 font-mono">
                    {formatAddress(account)}
                  </span>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="badge-modern bg-white text-purple-600 shadow-xl text-sm px-4 py-2 flex items-center gap-2 hover:bg-gray-100"
              >
                <FaSync className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {/* Quick Stats */}
            {graves.length > 0 && (
              <div className="grid grid-cols-3 gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{graves.length}</div>
                  <div className="text-white/80 text-sm">Total Graves</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{maintainedCount}</div>
                  <div className="text-white/80 text-sm">Maintained</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{totalSpent.toFixed(4)} ETH</div>
                  <div className="text-white/80 text-sm">Total Spent</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Graves Content */}
        {graves.length === 0 ? (
          <div className="card-modern card-glass text-center py-16 px-8">
            <div className="text-8xl mb-6 opacity-20">⚰️</div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">No Graves Reserved</h3>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              You haven't reserved any graves yet. Explore our available graveyards and secure your plot on the blockchain.
            </p>
            <Link to="/graveyards" className="btn-modern btn-primary-modern text-lg px-8 py-4">
              Browse Available Graves
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">
                <span className="gradient-text">Your Reserved Plots</span>
              </h2>
              <p className="text-gray-600 mt-1">
                Manage and view details of your {graves.length} grave{graves.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {graves.map((grave) => (
                <GraveCardModern key={grave.id} grave={grave} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Modern Grave Card Component
const GraveCardModern = ({ grave }) => {
  const reservationDate = grave.timestamp !== '0'
    ? new Date(Number(grave.timestamp) * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Unknown';

  const reservationTime = grave.timestamp !== '0'
    ? new Date(Number(grave.timestamp) * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  return (
    <div className="card-modern group hover:scale-105 transition-transform duration-300">
      {/* Header with Gradient */}
      <div className="relative bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700 rounded-xl p-6 mb-6 overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">Grave #{grave.id}</h3>
              <p className="text-white/80 text-sm">Graveyard #{grave.graveyardId}</p>
            </div>
            {grave.maintained && (
              <span className="badge-modern bg-white text-green-600 shadow-lg flex items-center gap-1">
                <FaLeaf />
                Maintained
              </span>
            )}
          </div>
        </div>

        {/* Decorative element */}
        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
      </div>

      {/* Details Section */}
      <div className="space-y-4 mb-6">
        <DetailRow
          icon={<FaEthereum className="text-purple-600" />}
          label="Price Paid"
          value={`${ethers.formatEther(grave.price)} ETH`}
          highlight={true}
        />
        <DetailRow
          icon={<FaCalendar className="text-pink-600" />}
          label="Reserved On"
          value={reservationDate}
          subValue={reservationTime}
        />
        {grave.locationHash && (
          <DetailRow
            icon={<FaMapMarkerAlt className="text-blue-600" />}
            label="Location Data"
            value="Stored On-Chain"
          />
        )}
      </div>

      {/* Metadata Info */}
      {grave.metadataHash && grave.metadataHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Metadata Hash</p>
          <p className="text-xs font-mono text-gray-700 break-all">
            {grave.metadataHash.substring(0, 20)}...{grave.metadataHash.substring(grave.metadataHash.length - 20)}
          </p>
        </div>
      )}

      {/* Action Button */}
      <Link
        to={`/graveyards/${grave.graveyardId}`}
        className="btn-modern btn-primary-modern w-full flex items-center justify-center gap-2 group-hover:gap-3 transition-all"
      >
        <FaMapMarkerAlt />
        <span>View on Map</span>
        <FaArrowRight className="transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
};

// Detail Row Component
const DetailRow = ({ icon, label, value, subValue, highlight }) => (
  <div className="flex items-start justify-between">
    <div className="flex items-center gap-3">
      <div className="text-xl">{icon}</div>
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        {subValue && <p className="text-xs text-gray-500">{subValue}</p>}
      </div>
    </div>
    <div className={`text-right ${highlight ? 'font-bold text-purple-600 text-lg' : 'font-semibold text-gray-900'}`}>
      {value}
    </div>
  </div>
);

export default MyGravesPageModern;
