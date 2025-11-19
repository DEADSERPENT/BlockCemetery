import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import GraveyardMap from '../components/GraveyardMap';
import GraveModal from '../components/GraveModal';
import { useWeb3 } from '../context/Web3Context';

const GraveyardDetailPage = () => {
  const { id } = useParams();
  const { contract, account } = useWeb3();
  const [graveyard, setGraveyard] = useState(null);
  const [graves, setGraves] = useState([]);
  const [selectedGrave, setSelectedGrave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);

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

      toast.success('Grave reserved successfully!');
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading graveyard...</p>
        </div>
      </div>
    );
  }

  if (!graveyard) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card text-center py-12">
          <h3 className="text-xl font-semibold text-gray-700">Graveyard not found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{graveyard.name}</h1>
        <p className="text-gray-600">{graveyard.location}</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Plots" value={graveyard.numPlots} />
        <StatCard label="Total Graves" value={graveyard.totalGraves} />
        <StatCard label="Available" value={graveyard.availableCount} color="green" />
        <StatCard
          label="Reserved"
          value={graveyard.totalGraves - graveyard.availableCount}
          color="red"
        />
      </div>

      {/* Map */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Interactive Map</h2>
        <div className="h-[600px] rounded-lg overflow-hidden border border-gray-200">
          <GraveyardMap
            graveyardId={id}
            graves={graves}
            onGraveSelect={handleGraveSelect}
          />
        </div>
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-cemetery-available rounded mr-2"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-cemetery-reserved rounded mr-2"></div>
            <span>Reserved</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-cemetery-maintained rounded mr-2"></div>
            <span>Maintained</span>
          </div>
        </div>
      </div>

      {/* Grave List */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">All Graves</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {graves.map((grave) => (
                <tr key={grave.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{grave.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ethers.formatEther(grave.price)} ETH
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {grave.reserved ? (
                      <span className="badge badge-reserved">Reserved</span>
                    ) : (
                      <span className="badge badge-available">Available</span>
                    )}
                    {grave.maintained && (
                      <span className="badge badge-maintained ml-2">Maintained</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleGraveSelect(grave)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

const StatCard = ({ label, value, color = 'primary' }) => {
  const colorClass = {
    green: 'text-green-600',
    red: 'text-red-600',
    primary: 'text-primary-600'
  }[color];

  return (
    <div className="card text-center">
      <p className="text-gray-500 text-sm mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
    </div>
  );
};

export default GraveyardDetailPage;
