import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaMapMarkerAlt, FaTree } from 'react-icons/fa';
import { toast } from 'react-toastify';

const GraveyardsPage = () => {
  const [graveyards, setGraveyards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGraveyards();
  }, []);

  const fetchGraveyards = async () => {
    try {
      const response = await axios.get('/api/graveyards');
      setGraveyards(response.data.graveyards);
    } catch (error) {
      console.error('Error fetching graveyards:', error);
      toast.error('Failed to load graveyards');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading graveyards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Available Graveyards</h1>
        <p className="text-gray-600">Browse and select from our registered cemeteries</p>
      </div>

      {graveyards.length === 0 ? (
        <div className="card text-center py-12">
          <FaTree className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Graveyards Available</h3>
          <p className="text-gray-500">Check back later or contact an administrator.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {graveyards.map((graveyard) => (
            <GraveyardCard key={graveyard.id} graveyard={graveyard} />
          ))}
        </div>
      )}
    </div>
  );
};

const GraveyardCard = ({ graveyard }) => {
  return (
    <Link to={`/graveyards/${graveyard.id}`} className="card hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">{graveyard.name}</h3>
          <div className="flex items-center text-gray-600 text-sm">
            <FaMapMarkerAlt className="mr-1" />
            <span>{graveyard.location}</span>
          </div>
        </div>
        {graveyard.active ? (
          <span className="badge badge-available">Active</span>
        ) : (
          <span className="badge bg-gray-100 text-gray-800">Inactive</span>
        )}
      </div>

      <div className="border-t pt-4 mt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Total Plots</p>
            <p className="font-semibold text-gray-900">{graveyard.numPlots}</p>
          </div>
          <div>
            <p className="text-gray-500">Created Graves</p>
            <p className="font-semibold text-gray-900">{graveyard.totalGraves}</p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button className="w-full btn btn-primary">View Details</button>
      </div>
    </Link>
  );
};

export default GraveyardsPage;
