import { useState } from 'react';
import { ethers } from 'ethers';
import { FaSearch, FaMapMarkerAlt, FaCalendar, FaUser, FaCross, FaEthereum } from 'react-icons/fa';
import { useWeb3 } from '../context/Web3Context';
import { toast } from 'react-toastify';
import '../styles/modern.css';

/**
 * Public Search Portal - No wallet required
 * Search graves and graveyards on the blockchain
 */
const PublicSearchPageModern = () => {
  const { contract, getReadOnlyContract } = useWeb3();
  const [searchType, setSearchType] = useState('graveyard'); // graveyard, grave, owner
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    // Use connected contract or read-only contract
    const searchContract = contract || getReadOnlyContract();
    if (!searchContract) {
      toast.error('Unable to connect to blockchain. Please check your connection.');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      let searchResults = [];

      if (searchType === 'grave') {
        // Search by grave ID
        const graveId = parseInt(searchQuery);
        if (isNaN(graveId) || graveId < 1) {
          toast.error('Please enter a valid grave ID');
          setLoading(false);
          return;
        }

        try {
          const grave = await searchContract.getGrave(graveId);
          const graveyard = await searchContract.getGraveyard(grave.graveyardId);

          searchResults.push({
            type: 'grave',
            graveId: Number(grave.id),
            graveyardId: Number(grave.graveyardId),
            graveyardName: graveyard.name,
            location: graveyard.location,
            price: grave.price.toString(),
            reserved: grave.reserved,
            maintained: grave.maintained,
            timestamp: grave.timestamp.toString(),
            owner: grave.owner
          });
        } catch (e) {
          // Grave not found
        }
      } else if (searchType === 'graveyard') {
        // Search graveyards by name
        const totalGraveyards = await searchContract.getTotalGraveyards();
        const query = searchQuery.toLowerCase();

        for (let i = 1; i <= Number(totalGraveyards); i++) {
          try {
            const graveyard = await searchContract.getGraveyard(i);
            if (graveyard.name.toLowerCase().includes(query) ||
                graveyard.location.toLowerCase().includes(query)) {

              const graveIds = graveyard.graveIds || [];
              let reservedCount = 0;
              let availableCount = 0;

              for (const graveId of graveIds) {
                try {
                  const grave = await searchContract.getGrave(graveId);
                  if (grave.reserved) reservedCount++;
                  else availableCount++;
                } catch (e) {}
              }

              searchResults.push({
                type: 'graveyard',
                graveyardId: Number(graveyard.id),
                name: graveyard.name,
                location: graveyard.location,
                totalPlots: Number(graveyard.numPlots),
                currentGraves: graveIds.length,
                reserved: reservedCount,
                available: availableCount,
                active: graveyard.active,
                owner: graveyard.owner
              });
            }
          } catch (e) {}
        }
      } else if (searchType === 'owner') {
        // Search graves by owner address
        if (!ethers.isAddress(searchQuery)) {
          toast.error('Please enter a valid Ethereum address');
          setLoading(false);
          return;
        }

        try {
          const graveIds = await searchContract.getUserGraves(searchQuery);

          for (const graveId of graveIds) {
            try {
              const grave = await searchContract.getGrave(graveId);
              const graveyard = await searchContract.getGraveyard(grave.graveyardId);

              searchResults.push({
                type: 'grave',
                graveId: Number(grave.id),
                graveyardId: Number(grave.graveyardId),
                graveyardName: graveyard.name,
                location: graveyard.location,
                price: grave.price.toString(),
                reserved: grave.reserved,
                maintained: grave.maintained,
                timestamp: grave.timestamp.toString(),
                owner: grave.owner
              });
            } catch (e) {}
          }
        } catch (e) {
          // No graves found for this owner
        }
      }

      setResults(searchResults);

      if (searchResults.length === 0) {
        toast.info('No results found');
      } else {
        toast.success(`Found ${searchResults.length} result(s)`);
      }
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card-modern card-gradient mb-8 text-center py-16">
          <h1 className="text-5xl font-extrabold text-white mb-4">
            🕊️ Find a Loved One
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Search our records to locate burial information and pay respects
          </p>
          <div className="mt-6 badge-modern bg-white text-purple-600 text-sm inline-block">
            🔓 No account required • Free public access
          </div>
        </div>

        {/* Search Form */}
        <div className="card-modern max-w-3xl mx-auto mb-8">
          <h2 className="text-2xl font-bold mb-6">
            <span className="gradient-text">Search Options</span>
          </h2>

          {/* Search Type Selector */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <SearchTypeButton
              icon={<FaMapMarkerAlt />}
              label="By Cemetery"
              active={searchType === 'graveyard'}
              onClick={() => setSearchType('graveyard')}
            />
            <SearchTypeButton
              icon={<FaCross />}
              label="By Grave ID"
              active={searchType === 'grave'}
              onClick={() => setSearchType('grave')}
            />
            <SearchTypeButton
              icon={<FaUser />}
              label="By Owner"
              active={searchType === 'owner'}
              onClick={() => setSearchType('owner')}
            />
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {searchType === 'graveyard' && 'Enter Cemetery Name or Location'}
                {searchType === 'grave' && 'Enter Grave ID'}
                {searchType === 'owner' && 'Enter Owner Wallet Address'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="input-modern pl-12"
                  placeholder={
                    searchType === 'graveyard'
                      ? 'e.g., Green Valley or City Name'
                      : searchType === 'grave'
                      ? 'e.g., 1, 2, 3...'
                      : 'e.g., 0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {searchType === 'graveyard' && 'Search by cemetery name or location'}
                {searchType === 'grave' && 'Enter the numeric grave ID'}
                {searchType === 'owner' && 'Enter the Ethereum wallet address'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-modern btn-primary-modern w-full text-lg py-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <FaSearch />
                  Search Records
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {searched && (
          <div className="card-modern">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                <span className="gradient-text">Search Results</span>
              </h2>
              <span className="badge-modern badge-admin">
                {results.length} {results.length === 1 ? 'result' : 'results'} found
              </span>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="loading-modern mx-auto mb-4"></div>
                <p className="text-gray-600">Searching records...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-8xl mb-6 opacity-20">🔍</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No Results Found</h3>
                <p className="text-gray-600 mb-6">
                  We couldn't find any records matching your search criteria.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-blue-800">
                    💡 Try different search terms or use a different search type
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((result, idx) => (
                  <ResultCard key={idx} result={result} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Information Panel */}
        {!searched && (
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <InfoCard
              icon="🔍"
              title="Search Records"
              description="Find burial information by name, location, or date"
            />
            <InfoCard
              icon="📍"
              title="View Location"
              description="See cemetery locations on interactive maps"
            />
            <InfoCard
              icon="🔒"
              title="Privacy Protected"
              description="Sensitive information is encrypted and secure"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Search Type Button Component
const SearchTypeButton = ({ icon, label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
      active
        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// Result Card Component
const ResultCard = ({ result }) => {
  if (result.type === 'graveyard') {
    return (
      <div className="card-modern hover:scale-105 transition-transform">
        <div className="bg-gradient-to-br from-green-600 via-teal-500 to-green-700 rounded-xl p-6 mb-4 text-white">
          <div className="flex items-center gap-3 mb-2">
            <FaMapMarkerAlt className="text-2xl" />
            <h3 className="text-xl font-bold">{result.name}</h3>
          </div>
          <p className="text-white/80 text-sm">Graveyard #{result.graveyardId}</p>
        </div>

        <div className="space-y-3">
          <DetailRow icon={<FaMapMarkerAlt />} label="Location" value={result.location} />
          <DetailRow icon={<FaCross />} label="Total Capacity" value={`${result.totalPlots} plots`} />
          <DetailRow icon={<FaCross />} label="Current Graves" value={result.currentGraves} />
          <DetailRow icon={<FaUser />} label="Reserved" value={result.reserved} />
          <DetailRow icon={<FaSearch />} label="Available" value={result.available} />
        </div>

        <div className="mt-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            result.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {result.active ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <a href={`/graveyards/${result.graveyardId}`} className="btn-modern btn-outline-modern w-full block text-center">
            <FaMapMarkerAlt className="inline mr-2" />
            View Cemetery
          </a>
        </div>
      </div>
    );
  }

  // Grave result
  const reservationDate = result.timestamp !== '0'
    ? new Date(Number(result.timestamp) * 1000).toLocaleDateString()
    : 'Not reserved';

  return (
    <div className="card-modern hover:scale-105 transition-transform">
      <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700 rounded-xl p-6 mb-4 text-white">
        <div className="flex items-center gap-3 mb-2">
          <FaCross className="text-2xl" />
          <h3 className="text-xl font-bold">Grave #{result.graveId}</h3>
        </div>
        <p className="text-white/80 text-sm">{result.graveyardName}</p>
      </div>

      <div className="space-y-3">
        <DetailRow icon={<FaMapMarkerAlt />} label="Location" value={result.location} />
        <DetailRow icon={<FaEthereum />} label="Price" value={`${ethers.formatEther(result.price)} ETH`} />
        <DetailRow icon={<FaCalendar />} label="Reserved On" value={reservationDate} />
        <DetailRow icon={<FaUser />} label="Status" value={result.reserved ? 'Reserved' : 'Available'} />
        {result.maintained && (
          <DetailRow icon={<FaSearch />} label="Maintenance" value="Maintained" />
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <a href={`/graveyards/${result.graveyardId}`} className="btn-modern btn-outline-modern w-full block text-center">
          <FaMapMarkerAlt className="inline mr-2" />
          View on Map
        </a>
      </div>
    </div>
  );
};

// Detail Row Component
const DetailRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="text-purple-600 text-lg mt-1">{icon}</div>
    <div className="flex-1">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="font-semibold text-gray-900">{value || 'N/A'}</p>
    </div>
  </div>
);

// Info Card Component
const InfoCard = ({ icon, title, description }) => (
  <div className="card-modern text-center hover:scale-105 transition-transform">
    <div className="text-6xl mb-4">{icon}</div>
    <h3 className="text-lg font-bold mb-2">{title}</h3>
    <p className="text-gray-600 text-sm">{description}</p>
  </div>
);

export default PublicSearchPageModern;
