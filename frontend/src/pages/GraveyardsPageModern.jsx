import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { FaMapMarkerAlt, FaTree, FaLayerGroup, FaChartPie, FaArrowRight, FaSync, FaUserShield, FaEthereum, FaCog } from 'react-icons/fa';
import { useWeb3 } from '../context/Web3Context';
import { toast } from 'react-toastify';
import '../styles/modern.css';

const GraveyardsPageModern = () => {
  const { contract, account, getReadOnlyContract } = useWeb3();
  const [graveyards, setGraveyards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, inactive, mine
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchGraveyards();
    checkAdminStatus();
  }, [contract, account]);

  const checkAdminStatus = async () => {
    if (contract && account) {
      try {
        const adminStatus = await contract.isAdmin(account);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    }
  };

  const fetchGraveyards = async () => {
    const searchContract = contract || getReadOnlyContract();
    if (!searchContract) {
      setLoading(false);
      return;
    }

    try {
      const totalGraveyards = await searchContract.getTotalGraveyards();
      const graveyardsList = [];

      for (let i = 1; i <= Number(totalGraveyards); i++) {
        try {
          const graveyard = await searchContract.getGraveyard(i);
          const graveIds = graveyard.graveIds || [];

          // Count reserved and available graves
          let reservedCount = 0;
          let totalPriceWei = BigInt(0);
          let minPrice = null;

          for (const graveId of graveIds) {
            try {
              const grave = await searchContract.getGrave(graveId);
              totalPriceWei += BigInt(grave.price.toString());

              if (grave.reserved) {
                reservedCount++;
              } else {
                // Track minimum price for available graves
                const price = BigInt(grave.price.toString());
                if (minPrice === null || price < minPrice) {
                  minPrice = price;
                }
              }
            } catch (e) {}
          }

          const avgPrice = graveIds.length > 0
            ? totalPriceWei / BigInt(graveIds.length)
            : BigInt(0);

          graveyardsList.push({
            id: Number(graveyard.id),
            name: graveyard.name,
            location: graveyard.location,
            owner: graveyard.owner,
            numPlots: Number(graveyard.numPlots),
            totalGraves: graveIds.length,
            reservedGraves: reservedCount,
            availableGraves: graveIds.length - reservedCount,
            active: graveyard.active,
            avgPrice: avgPrice.toString(),
            minPrice: minPrice ? minPrice.toString() : '0',
            isOwner: account ? graveyard.owner.toLowerCase() === account.toLowerCase() : false
          });
        } catch (e) {
          console.error(`Error fetching graveyard ${i}:`, e);
        }
      }

      setGraveyards(graveyardsList);
    } catch (error) {
      console.error('Error fetching graveyards:', error);
      toast.error('Failed to load graveyards');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchGraveyards();
  };

  const filteredGraveyards = graveyards.filter(g => {
    if (filter === 'active') return g.active;
    if (filter === 'inactive') return !g.active;
    if (filter === 'mine') return g.isOwner;
    return true;
  });

  const stats = {
    total: graveyards.length,
    active: graveyards.filter(g => g.active).length,
    totalPlots: graveyards.reduce((sum, g) => sum + g.numPlots, 0),
    totalGraves: graveyards.reduce((sum, g) => sum + g.totalGraves, 0),
    reservedGraves: graveyards.reduce((sum, g) => sum + g.reservedGraves, 0),
    availableGraves: graveyards.reduce((sum, g) => sum + g.availableGraves, 0),
    myGraveyards: graveyards.filter(g => g.isOwner).length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-modern mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-medium">Loading graveyards...</p>
          <p className="text-gray-500 mt-2">Fetching data from blockchain</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
            <span className="gradient-text">Explore Graveyards</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Browse our blockchain-verified cemetery locations and find the perfect resting place
          </p>
          {isAdmin && (
            <div className="mt-4">
              <Link to="/admin" className="badge-modern badge-admin inline-flex items-center gap-2">
                <FaUserShield /> Admin Access
              </Link>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-modern bg-white text-purple-600 shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <FaSync className={refreshing ? 'animate-spin' : ''} />
            Refresh Data
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<FaLayerGroup />}
            value={stats.total}
            label="Total Graveyards"
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />
          <StatCard
            icon={<FaTree />}
            value={stats.active}
            label="Active"
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          />
          <StatCard
            icon={<FaMapMarkerAlt />}
            value={stats.totalGraves}
            label="Total Graves"
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          />
          <StatCard
            icon={<FaChartPie />}
            value={stats.availableGraves}
            label="Available"
            gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center gap-3 flex-wrap">
          <FilterButton
            label="All"
            count={stats.total}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <FilterButton
            label="Active"
            count={stats.active}
            active={filter === 'active'}
            onClick={() => setFilter('active')}
          />
          <FilterButton
            label="Inactive"
            count={stats.total - stats.active}
            active={filter === 'inactive'}
            onClick={() => setFilter('inactive')}
          />
          {account && stats.myGraveyards > 0 && (
            <FilterButton
              label="My Graveyards"
              count={stats.myGraveyards}
              active={filter === 'mine'}
              onClick={() => setFilter('mine')}
              special={true}
            />
          )}
        </div>
      </div>

      {/* Graveyards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredGraveyards.length === 0 ? (
          <div className="card-modern card-glass text-center py-16">
            <FaTree className="text-8xl text-gray-300 mx-auto mb-6 opacity-50" />
            <h3 className="text-2xl font-bold text-gray-700 mb-3">No Graveyards Found</h3>
            <p className="text-gray-500 mb-6">
              {filter !== 'all'
                ? 'Try adjusting your filters or check back later'
                : 'No graveyards available yet.'}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="btn-modern btn-primary-modern"
              >
                Show All Graveyards
              </button>
            )}
            {isAdmin && filter === 'all' && (
              <Link to="/admin" className="btn-modern btn-primary-modern">
                Add First Graveyard
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[400px]">
            {filteredGraveyards.map((graveyard) => (
              <GraveyardCardModern key={graveyard.id} graveyard={graveyard} isAdmin={isAdmin} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Modern Stat Card Component
const StatCard = ({ icon, value, label, gradient }) => (
  <div className="stat-card-modern" style={{ borderLeftColor: gradient.match(/#[0-9a-f]{6}/i)?.[0] }}>
    <div className="flex items-center justify-between">
      <div>
        <div className="stat-value">{value}</div>
        <div className="text-gray-600 font-medium text-sm">{label}</div>
      </div>
      <div className="text-3xl opacity-20">
        {icon}
      </div>
    </div>
  </div>
);

// Modern Filter Button Component
const FilterButton = ({ label, count, active, onClick, special }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 text-sm ${
      active
        ? special
          ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg scale-105'
          : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
        : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'
    }`}
  >
    {label} <span className={`ml-1 ${active ? 'text-white/80' : 'text-gray-500'}`}>({count})</span>
  </button>
);

// Modern Graveyard Card Component
const GraveyardCardModern = ({ graveyard, isAdmin }) => {
  const occupancyRate = graveyard.totalGraves > 0
    ? ((graveyard.reservedGraves / graveyard.totalGraves) * 100).toFixed(1)
    : 0;

  const capacityUsed = graveyard.numPlots > 0
    ? ((graveyard.totalGraves / graveyard.numPlots) * 100).toFixed(1)
    : 0;

  return (
    <div className="group">
      <div className="card-modern relative overflow-hidden h-full flex flex-col">
        {/* Animated Background Gradient */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700 opacity-90">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        </div>

        {/* Status Badges */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {graveyard.isOwner && (
            <span className="badge-modern bg-yellow-100 text-yellow-700 shadow-lg text-xs">
              Owner
            </span>
          )}
          {graveyard.active ? (
            <span className="badge-modern badge-available shadow-lg">
              Active
            </span>
          ) : (
            <span className="badge-modern bg-gray-100 text-gray-600 shadow-lg">
              Inactive
            </span>
          )}
        </div>

        {/* Header */}
        <div className="relative z-10 pt-8 pb-4 px-6 text-white">
          <h2 className="text-2xl font-bold mb-2 group-hover:scale-105 transition-transform">
            {graveyard.name}
          </h2>
          <div className="flex items-center gap-2 text-white/90">
            <FaMapMarkerAlt />
            <span className="text-sm font-medium truncate">{graveyard.location}</span>
          </div>
        </div>

        {/* Stats Section */}
        <div className="flex-1 px-6 pb-6">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Capacity</p>
              <p className="text-xl font-bold text-gray-900">{graveyard.totalGraves}/{graveyard.numPlots}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Reserved</p>
              <p className="text-xl font-bold text-gray-900">{graveyard.reservedGraves}</p>
            </div>
          </div>

          {/* Capacity Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Capacity Used</span>
              <span className="font-semibold">{capacityUsed}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-500"
                style={{ width: `${capacityUsed}%` }}
              ></div>
            </div>
          </div>

          {/* Occupancy Progress Bar */}
          {graveyard.totalGraves > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Occupancy</span>
                <span className="font-semibold">{occupancyRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${occupancyRate}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Price & Available Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm">
              <span className="text-gray-600">Available: </span>
              <span className={`font-bold ${graveyard.availableGraves > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {graveyard.availableGraves}
              </span>
            </div>
            {graveyard.minPrice !== '0' && graveyard.availableGraves > 0 && (
              <div className="text-sm flex items-center gap-1">
                <span className="text-gray-600">From:</span>
                <FaEthereum className="text-purple-600" />
                <span className="font-bold text-purple-600">
                  {parseFloat(ethers.formatEther(graveyard.minPrice)).toFixed(3)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 space-y-2">
          <Link
            to={`/graveyards/${graveyard.id}`}
            className="btn-modern btn-primary-modern w-full flex items-center justify-center gap-2 group-hover:gap-3 transition-all"
          >
            <span>View Details</span>
            <FaArrowRight className="transition-transform group-hover:translate-x-1" />
          </Link>

          {graveyard.isOwner && (
            <Link
              to="/admin"
              className="btn-modern btn-outline-modern w-full flex items-center justify-center gap-2 text-sm"
            >
              <FaCog />
              <span>Manage</span>
            </Link>
          )}
        </div>

        {/* Hover Effect Border */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-purple-400 rounded-2xl transition-colors pointer-events-none"></div>
      </div>
    </div>
  );
};

export default GraveyardsPageModern;
