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
  const [filter, setFilter] = useState('all');
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
                const price = BigInt(grave.price.toString());
                if (minPrice === null || price < minPrice) minPrice = price;
              }
            } catch (e) {}
          }

          const avgPrice = graveIds.length > 0 ? totalPriceWei / BigInt(graveIds.length) : BigInt(0);

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
            isOwner: account ? graveyard.owner.toLowerCase() === account.toLowerCase() : false,
            image: i % 2 === 0
              ? "https://images.unsplash.com/photo-1596814648589-32219468e826?q=80&w=1000&auto=format&fit=crop"
              : "https://images.unsplash.com/photo-1507643179171-6b90b489803f?q=80&w=1000&auto=format&fit=crop"
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-serif">Loading Sanctums...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 bg-gray-50">
      {/* Hero Header with Background Image */}
      <div className="relative h-[300px] mb-12 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1464979681340-bdd28a61699e?q=80&w=2070&auto=format&fit=crop"
            alt="Peaceful Landscape"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary-900/80 backdrop-blur-[2px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex flex-col justify-center text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            Sacred Grounds
          </h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto font-light">
            Browse our blockchain-verified resting places. Peaceful, permanent, and secure.
          </p>

          {isAdmin && (
            <div className="mt-6">
              <Link to="/admin" className="badge-modern badge-admin inline-flex items-center gap-2 bg-accent-600 text-white border-none px-4 py-2">
                <FaUserShield /> Admin Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
             <FilterButton label="All Grounds" count={stats.total} active={filter === 'all'} onClick={() => setFilter('all')} />
             <FilterButton label="Active" count={stats.active} active={filter === 'active'} onClick={() => setFilter('active')} />
             <FilterButton label="Inactive" count={stats.total - stats.active} active={filter === 'inactive'} onClick={() => setFilter('inactive')} />
             {account && stats.myGraveyards > 0 && (
               <FilterButton label="My Grounds" count={stats.myGraveyards} active={filter === 'mine'} onClick={() => setFilter('mine')} special={true} />
             )}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-modern text-sm flex items-center gap-2 text-gray-500 hover:text-primary-600"
          >
            <FaSync className={refreshing ? 'animate-spin' : ''} />
            Refresh Data
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <StatCard icon={<FaLayerGroup />} value={stats.total} label="Total Grounds" color="text-primary-600" bg="bg-primary-50" />
          <StatCard icon={<FaTree />} value={stats.active} label="Active" color="text-green-600" bg="bg-green-50" />
          <StatCard icon={<FaMapMarkerAlt />} value={stats.totalGraves} label="Total Plots" color="text-accent-600" bg="bg-amber-50" />
          <StatCard icon={<FaChartPie />} value={stats.availableGraves} label="Available" color="text-blue-600" bg="bg-blue-50" />
        </div>

        {/* Graveyards Grid */}
        {filteredGraveyards.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <FaTree className="text-6xl text-gray-200 mx-auto mb-6" />
            <h3 className="text-2xl font-serif text-gray-600 mb-2">No Sacred Grounds Found</h3>
            <p className="text-gray-400">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredGraveyards.map((graveyard) => (
              <GraveyardCardModern key={graveyard.id} graveyard={graveyard} isAdmin={isAdmin} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Elegant Stat Card
const StatCard = ({ icon, value, label, color, bg }) => (
  <div className={`p-6 rounded-xl border border-gray-100 bg-white shadow-sm flex items-center justify-between`}>
    <div>
      <div className="text-2xl font-bold text-gray-900 font-serif">{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</div>
    </div>
    <div className={`text-2xl ${color} ${bg} p-3 rounded-lg`}>{icon}</div>
  </div>
);

// Elegant Filter Button
const FilterButton = ({ label, count, active, onClick, special }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
      active
        ? 'bg-primary-700 text-white shadow-md'
        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
    }`}
  >
    {label} <span className={`ml-1 opacity-70`}>({count})</span>
  </button>
);

// New Card Design
const GraveyardCardModern = ({ graveyard, isAdmin }) => {
  return (
    <div className="group bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      {/* Image Header */}
      <div className="h-48 overflow-hidden relative">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
           <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md ${graveyard.active ? 'bg-emerald-500/90 text-white' : 'bg-gray-500/90 text-white'}`}>
             {graveyard.active ? 'Active' : 'Inactive'}
           </span>
        </div>
        <img
          src={graveyard.image}
          alt={graveyard.name}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-4 left-4 text-white">
          <h2 className="text-2xl font-serif font-bold mb-1">{graveyard.name}</h2>
          <div className="flex items-center gap-1 text-sm text-gray-200">
            <FaMapMarkerAlt /> {graveyard.location}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Available</div>
            <div className="text-xl font-bold text-primary-700">{graveyard.availableGraves}</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
             <div className="text-sm text-gray-500 mb-1">Starting From</div>
             <div className="text-xl font-bold text-accent-600 flex items-center justify-center gap-1">
               <FaEthereum className="text-sm" />
               {graveyard.minPrice !== '0' ? parseFloat(ethers.formatEther(graveyard.minPrice)).toFixed(2) : '0'}
             </div>
          </div>
        </div>

        <Link
          to={`/graveyards/${graveyard.id}`}
          className="w-full btn-modern btn-primary-modern flex items-center justify-center gap-2"
        >
          View Details <FaArrowRight className="text-xs" />
        </Link>
      </div>
    </div>
  );
};

export default GraveyardsPageModern;
