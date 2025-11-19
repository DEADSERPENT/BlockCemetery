import { useState, useEffect } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import { FaMapMarkerAlt, FaEthereum } from 'react-icons/fa';
import { useWeb3 } from '../context/Web3Context';
import { toast } from 'react-toastify';

const MyGravesPage = () => {
  const { account } = useWeb3();
  const [graves, setGraves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (account) {
      fetchMyGraves();
    } else {
      setLoading(false);
    }
  }, [account]);

  const fetchMyGraves = async () => {
    try {
      const response = await axios.get(`/api/graves/user/${account}`);
      setGraves(response.data.graves);
    } catch (error) {
      console.error('Error fetching user graves:', error);
      toast.error('Failed to load your graves');
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card text-center py-12">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Wallet Not Connected</h3>
          <p className="text-gray-500 mb-4">
            Please connect your wallet to view your graves.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your graves...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Graves</h1>
        <p className="text-gray-600">Manage your reserved grave plots</p>
      </div>

      {graves.length === 0 ? (
        <div className="card text-center py-12">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Graves Reserved</h3>
          <p className="text-gray-500 mb-4">
            You haven't reserved any graves yet.
          </p>
          <a href="/graveyards" className="btn btn-primary">
            Browse Available Graves
          </a>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {graves.map((grave) => (
            <GraveCard key={grave.id} grave={grave} />
          ))}
        </div>
      )}
    </div>
  );
};

const GraveCard = ({ grave }) => {
  const reservationDate = grave.timestamp !== '0'
    ? new Date(Number(grave.timestamp) * 1000).toLocaleDateString()
    : 'Unknown';

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Grave #{grave.id}</h3>
          <p className="text-sm text-gray-500">Graveyard #{grave.graveyardId}</p>
        </div>
        {grave.maintained && (
          <span className="badge badge-maintained">Maintained</span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Price Paid:</span>
          <span className="font-medium text-gray-900 flex items-center">
            <FaEthereum className="mr-1" />
            {ethers.formatEther(grave.price)} ETH
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Reserved On:</span>
          <span className="font-medium text-gray-900">{reservationDate}</span>
        </div>
        {grave.locationHash && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Location:</span>
            <span className="font-medium text-gray-900 flex items-center">
              <FaMapMarkerAlt className="mr-1" />
              On-chain
            </span>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <a
          href={`/graveyards/${grave.graveyardId}`}
          className="btn btn-secondary w-full"
        >
          View on Map
        </a>
      </div>
    </div>
  );
};

export default MyGravesPage;
