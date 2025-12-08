import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { FaMapMarkerAlt, FaEthereum, FaCalendar, FaLeaf, FaArrowRight, FaWallet, FaSync, FaFileContract } from 'react-icons/fa';
import { useWeb3 } from '../context/Web3Context';
import '../styles/modern.css';

const MyGravesPageModern = () => {
  const { account, contract, formatAddress } = useWeb3();
  const [graves, setGraves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (account && contract) fetchMyGraves();
    else setLoading(false);
  }, [account, contract]);

  const fetchMyGraves = async () => {
    if (!contract || !account) return;
    try {
      const graveIds = await contract.getUserGraves(account);
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
        } catch (e) { console.error(e); }
      }
      setGraves(gravesData);
    } catch (error) {
      console.error('Error fetching user graves:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMyGraves();
  };

  if (!account) return <WalletConnectPrompt />;
  if (loading) return <LoadingView />;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-primary-900 text-white py-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-4xl font-serif font-bold mb-2">My Deeds</h1>
            <p className="text-primary-200">Manage your immutable ownership records.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20">
             <div className="text-xs text-primary-200 uppercase tracking-wider mb-1">Connected Wallet</div>
             <div className="font-mono text-lg">{formatAddress(account)}</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8">
        <div className="flex justify-end mb-6">
          <button onClick={handleRefresh} className="btn-modern bg-white text-gray-600 shadow-sm text-sm flex items-center gap-2">
            <FaSync className={refreshing ? 'animate-spin' : ''} /> Sync Chain
          </button>
        </div>

        {graves.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaFileContract className="text-3xl text-gray-400" />
            </div>
            <h3 className="text-2xl font-serif text-gray-900 mb-2">No Deeds Found</h3>
            <p className="text-gray-500 mb-8">You do not own any plots yet.</p>
            <Link to="/graveyards" className="btn-modern btn-primary-modern">Explore Sacred Grounds</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {graves.map((grave) => (
              <DeedCard key={grave.id} grave={grave} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Deed Style Card
const DeedCard = ({ grave }) => {
  const date = new Date(Number(grave.timestamp) * 1000).toLocaleDateString();

  return (
    <div className="bg-[#fffdf5] rounded-xl border-2 border-[#e5e0cf] p-8 shadow-sm relative overflow-hidden">
      {/* Gold Border Effect */}
      <div className="absolute top-0 left-0 w-full h-2 bg-accent-500"></div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900">Certificate of Ownership</h2>
          <p className="text-accent-600 font-serif italic">Immutable Blockchain Record</p>
        </div>
        <FaEthereum className="text-4xl text-gray-200" />
      </div>

      <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Plot Number</div>
          <div className="text-xl font-mono text-gray-800">#{grave.id}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Graveyard ID</div>
          <div className="text-xl font-mono text-gray-800">#{grave.graveyardId}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Acquired Date</div>
          <div className="text-lg text-gray-800">{date}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Value</div>
          <div className="text-lg text-gray-800">{ethers.formatEther(grave.price)} ETH</div>
        </div>
      </div>

      {grave.maintained && (
         <div className="mb-6 bg-green-50 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm border border-green-100">
           <FaLeaf /> Maintenance Plan Active
         </div>
      )}

      <div className="border-t border-gray-200 pt-6 flex justify-between items-center">
        <div className="text-xs text-gray-400 font-mono">
           Metadata: {grave.metadataHash.substring(0, 10)}...
        </div>
        <Link to={`/graveyards/${grave.graveyardId}`} className="text-primary-700 font-bold hover:text-primary-900 flex items-center gap-1">
           View Location <FaArrowRight />
        </Link>
      </div>
    </div>
  );
};

const WalletConnectPrompt = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center p-8">
      <FaWallet className="text-5xl text-gray-300 mx-auto mb-4" />
      <h2 className="text-2xl font-serif font-bold text-gray-700">Wallet Disconnected</h2>
      <p className="text-gray-500 mt-2">Connect your wallet to view your deeds.</p>
    </div>
  </div>
);

const LoadingView = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

export default MyGravesPageModern;
