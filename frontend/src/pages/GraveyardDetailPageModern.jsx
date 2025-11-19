import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import { FaMapMarkerAlt, FaLayerGroup, FaCheckCircle, FaLock, FaArrowLeft, FaEthereum } from 'react-icons/fa';
import GraveyardMap from '../components/GraveyardMap';
import GraveModal from '../components/GraveModal';
import { useWeb3 } from '../context/Web3Context';
import '../styles/modern.css';

const GraveyardDetailPageModern = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contract, account } = useWeb3();
  const [graveyard, setGraveyard] = useState(null);
  const [graves, setGraves] = useState([]);
  const [selectedGrave, setSelectedGrave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, available, reserved

  useEffect(() => {
    fetchGraveyardData();
  }, [id]);

  const fetchGraveyardData = async () => {
    try {
      const [graveyardRes, gravesRes] = await Promise.all([
        axios.get(`/api/graveyards/${id}`),
        axios.get(`/api/graveyards/${id}/graves`)
      ]);

      setGraveyard(graveyardRes.data);
      setGraves(gravesRes.data.graves);
    } catch (error) {
      console.error('Error fetching graveyard:', error);
      toast.error('Failed to load graveyard data');
    } finally {
      setLoading(false);
    }
  };

  const handleGraveSelect = (grave) => {
    setSelectedGrave(grave);
  };

  const handleReserveGrave = async (graveId, metadataHash) => {
    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    setReserving(true);
    try {
      const grave = graves.find(g => g.id === graveId);
      if (!grave) {
        throw new Error('Grave not found');
      }

      const tx = await contract.reserveGrave(graveId, metadataHash, {
        value: grave.price
      });

      toast.info('Transaction submitted. Waiting for confirmation...');
      const receipt = await tx.wait();

      toast.success('🎉 Grave reserved successfully!');
      console.log('Transaction hash:', receipt.hash);

      // Refresh data
      await fetchGraveyardData();
      setSelectedGrave(null);
    } catch (error) {
      console.error('Error reserving grave:', error);
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction rejected by user');
      } else {
        toast.error(error.reason || 'Failed to reserve grave');
      }
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-modern mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-medium">Loading graveyard details...</p>
          <p className="text-gray-500 mt-2">Fetching grave plots and availability</p>
        </div>
      </div>
    );
  }

  if (!graveyard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card-modern card-glass text-center py-12 px-8 max-w-md">
          <h3 className="text-2xl font-bold text-gray-700 mb-4">Graveyard Not Found</h3>
          <p className="text-gray-600 mb-6">The requested graveyard does not exist or has been removed.</p>
          <button
            onClick={() => navigate('/graveyards')}
            className="btn-modern btn-primary-modern"
          >
            <FaArrowLeft className="inline mr-2" />
            Back to Graveyards
          </button>
        </div>
      </div>
    );
  }

  const availableGraves = graves.filter(g => !g.reserved);
  const reservedGraves = graves.filter(g => g.reserved);
  const maintainedGraves = graves.filter(g => g.maintained);
  const occupancyRate = ((reservedGraves.length / graves.length) * 100).toFixed(1);

  const filteredGraves = graves.filter(g => {
    if (filterStatus === 'available') return !g.reserved;
    if (filterStatus === 'reserved') return g.reserved;
    return true;
  });

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/graveyards')}
          className="btn-modern btn-outline-modern mb-6 flex items-center gap-2"
        >
          <FaArrowLeft />
          <span>Back to Graveyards</span>
        </button>

        {/* Header Section with Gradient Background */}
        <div className="card-modern card-gradient mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">
                  {graveyard.name}
                </h1>
                <div className="flex items-center gap-2 text-white/90 text-lg mb-4">
                  <FaMapMarkerAlt />
                  <span>{graveyard.location}</span>
                </div>
              </div>
              <div>
                {graveyard.active ? (
                  <span className="badge-modern bg-white text-purple-600 shadow-xl text-lg px-4 py-2">
                    ✓ Active
                  </span>
                ) : (
                  <span className="badge-modern bg-white/20 text-white shadow-xl text-lg px-4 py-2">
                    ⊗ Inactive
                  </span>
                )}
              </div>
            </div>

            {/* Occupancy Progress */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex justify-between text-white/90 text-sm mb-2">
                <span className="font-semibold">Overall Occupancy</span>
                <span className="font-bold text-lg">{occupancyRate}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500 shadow-glow"
                  style={{ width: `${occupancyRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <StatCardModern
            icon={<FaLayerGroup />}
            label="Total Plots"
            value={graveyard.numPlots}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />
          <StatCardModern
            icon={<FaCheckCircle />}
            label="Available"
            value={availableGraves.length}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          />
          <StatCardModern
            icon={<FaLock />}
            label="Reserved"
            value={reservedGraves.length}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          />
          <StatCardModern
            icon={<FaEthereum />}
            label="Maintained"
            value={maintainedGraves.length}
            gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
          />
        </div>

        {/* Interactive Map */}
        <div className="card-modern mb-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">
              <span className="gradient-text">Interactive Map</span>
            </h2>
            <p className="text-gray-600">Click on any plot to view details and reserve</p>
          </div>

          <div className="rounded-2xl overflow-hidden border-4 border-gray-100 shadow-xl mb-6">
            <div className="h-[600px]">
              <GraveyardMap
                graveyardId={id}
                graves={graves}
                onGraveSelect={handleGraveSelect}
              />
            </div>
          </div>

          {/* Map Legend */}
          <div className="flex items-center justify-center flex-wrap gap-6">
            <LegendItem color="bg-green-500" label="Available" count={availableGraves.length} />
            <LegendItem color="bg-red-500" label="Reserved" count={reservedGraves.length} />
            <LegendItem color="bg-yellow-500" label="Maintained" count={maintainedGraves.length} />
          </div>
        </div>

        {/* Graves List Section */}
        <div className="card-modern">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                <span className="gradient-text">Available Plots</span>
              </h2>
              <p className="text-gray-600">Browse and select your preferred grave plot</p>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-3">
              <FilterButton
                label="All"
                active={filterStatus === 'all'}
                onClick={() => setFilterStatus('all')}
                count={graves.length}
              />
              <FilterButton
                label="Available"
                active={filterStatus === 'available'}
                onClick={() => setFilterStatus('available')}
                count={availableGraves.length}
              />
              <FilterButton
                label="Reserved"
                active={filterStatus === 'reserved'}
                onClick={() => setFilterStatus('reserved')}
                count={reservedGraves.length}
              />
            </div>
          </div>

          {/* Graves Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredGraves.map((grave) => (
              <GraveCardModern
                key={grave.id}
                grave={grave}
                onSelect={() => handleGraveSelect(grave)}
              />
            ))}
          </div>

          {filteredGraves.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No graves found with the selected filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* Grave Modal */}
      {selectedGrave && (
        <GraveModal
          grave={selectedGrave}
          onClose={() => setSelectedGrave(null)}
          onReserve={handleReserveGrave}
          reserving={reserving}
        />
      )}
    </div>
  );
};

// Modern Stat Card Component
const StatCardModern = ({ icon, label, value, gradient }) => (
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

// Legend Item Component
const LegendItem = ({ color, label, count }) => (
  <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg">
    <div className={`w-5 h-5 ${color} rounded shadow-md`}></div>
    <span className="font-medium text-gray-700">{label}</span>
    <span className="badge-modern badge-admin text-xs">{count}</span>
  </div>
);

// Filter Button Component
const FilterButton = ({ label, active, onClick, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
      active
        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    {label} ({count})
  </button>
);

// Modern Grave Card Component
const GraveCardModern = ({ grave, onSelect }) => {
  const isAvailable = !grave.reserved;

  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-xl p-4 border-2 transition-all duration-200 ${
        isAvailable
          ? 'border-green-200 bg-green-50 hover:border-green-400 hover:shadow-lg'
          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="font-bold text-gray-900 text-lg">#{grave.id}</div>
        <div>
          {isAvailable ? (
            <span className="badge-modern badge-available text-xs">Available</span>
          ) : (
            <span className="badge-modern badge-reserved text-xs">Reserved</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Price:</span>
          <span className="font-bold text-purple-600 flex items-center gap-1">
            <FaEthereum className="text-sm" />
            {ethers.formatEther(grave.price)}
          </span>
        </div>

        {grave.maintained && (
          <div className="badge-modern badge-maintained text-xs w-full text-center">
            🌿 Maintained
          </div>
        )}
      </div>

      <button
        className={`mt-3 w-full py-2 px-3 rounded-lg font-semibold text-sm transition-all ${
          isAvailable
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
        }`}
      >
        {isAvailable ? 'View Details' : 'Reserved'}
      </button>
    </div>
  );
};

export default GraveyardDetailPageModern;
