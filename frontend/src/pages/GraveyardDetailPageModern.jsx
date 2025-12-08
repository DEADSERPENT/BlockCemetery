import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import { FaMapMarkerAlt, FaLayerGroup, FaCheckCircle, FaLock, FaArrowLeft, FaEthereum, FaTree } from 'react-icons/fa';
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
  const [filterStatus, setFilterStatus] = useState('all');

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
      const tx = await contract.reserveGrave(graveId, metadataHash, {
        value: grave.price
      });
      toast.info('Transaction submitted...');
      await tx.wait();
      toast.success('Sanctuary reserved successfully.');
      await fetchGraveyardData();
      setSelectedGrave(null);
    } catch (error) {
      console.error('Error reserving:', error);
      toast.error('Failed to reserve.');
    } finally {
      setReserving(false);
    }
  };

  if (loading || !graveyard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const availableGraves = graves.filter(g => !g.reserved);
  const reservedGraves = graves.filter(g => g.reserved);
  const maintainedGraves = graves.filter(g => g.maintained);

  const filteredGraves = graves.filter(g => {
    if (filterStatus === 'available') return !g.reserved;
    if (filterStatus === 'reserved') return g.reserved;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Hero Banner */}
      <div className="relative h-64 bg-primary-900 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1518709414768-a88986a45ca5?q=80&w=2070&auto=format&fit=crop"
          alt="Peaceful"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex flex-col justify-center">
          <button onClick={() => navigate('/graveyards')} className="text-white/80 hover:text-white flex items-center gap-2 mb-4 transition-colors">
            <FaArrowLeft /> Back to Grounds
          </button>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-2">{graveyard.name}</h1>
          <div className="flex items-center gap-2 text-primary-200">
            <FaMapMarkerAlt /> {graveyard.location}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
        {/* Stats Strip */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <StatItem label="Total Plots" value={graveyard.numPlots} icon={<FaLayerGroup />} color="text-gray-400" />
          <StatItem label="Available" value={availableGraves.length} icon={<FaCheckCircle />} color="text-primary-600" />
          <StatItem label="Reserved" value={reservedGraves.length} icon={<FaLock />} color="text-accent-500" />
          <StatItem label="Maintained" value={maintainedGraves.length} icon={<FaTree />} color="text-green-600" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content: Map */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-serif font-bold text-gray-800">Grounds Map</h2>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary-500"></div> Available</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent-500"></div> Reserved</div>
                </div>
              </div>
              <div className="h-[500px] bg-gray-100">
                <GraveyardMap graveyardId={id} graves={graves} onGraveSelect={handleGraveSelect} />
              </div>
            </div>
          </div>

          {/* Sidebar: List */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-serif font-bold text-gray-800 mb-4">Select a Plot</h2>

              <div className="flex gap-2 mb-4">
                <button onClick={() => setFilterStatus('all')} className={`flex-1 py-2 text-sm rounded-lg ${filterStatus === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}>All</button>
                <button onClick={() => setFilterStatus('available')} className={`flex-1 py-2 text-sm rounded-lg ${filterStatus === 'available' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}>Available</button>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredGraves.map((grave) => (
                  <div
                    key={grave.id}
                    onClick={() => handleGraveSelect(grave)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      !grave.reserved
                        ? 'border-primary-100 bg-primary-50/50 hover:border-primary-300'
                        : 'border-gray-200 bg-gray-50 opacity-70'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-serif font-bold text-gray-900">Plot #{grave.id}</span>
                      <span className="text-sm font-bold text-accent-600 flex items-center">
                        <FaEthereum className="mr-1" /> {ethers.formatEther(grave.price)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className={`px-2 py-1 rounded-full ${!grave.reserved ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-600'}`}>
                         {!grave.reserved ? 'Available' : 'Reserved'}
                       </span>
                       <button className="text-primary-700 hover:underline">Details &rarr;</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

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

const StatItem = ({ label, value, icon, color }) => (
  <div className="flex items-center gap-4">
    <div className={`text-3xl ${color}`}>{icon}</div>
    <div>
      <div className="text-2xl font-bold font-serif text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 uppercase">{label}</div>
    </div>
  </div>
);

export default GraveyardDetailPageModern;
