import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { useWeb3 } from '../context/Web3Context';
import { FaPlus, FaTree, FaCoins, FaEthereum } from 'react-icons/fa';

const AdminDashboard = () => {
  const { contract, account } = useWeb3();
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingWithdrawal, setPendingWithdrawal] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contract && account) {
      fetchPendingWithdrawal();
    }
  }, [contract, account]);

  const fetchPendingWithdrawal = async () => {
    try {
      const amount = await contract.getPendingWithdrawal(account);
      setPendingWithdrawal(amount.toString());
    } catch (error) {
      console.error('Error fetching pending withdrawal:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!contract) return;

    setLoading(true);
    try {
      const tx = await contract.withdraw();
      toast.info('Withdrawal transaction submitted...');

      await tx.wait();
      toast.success('Funds withdrawn successfully!');

      await fetchPendingWithdrawal();
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      toast.error('Failed to withdraw funds');
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card text-center py-12">
          <h3 className="text-xl font-semibold text-gray-700">Connect Wallet</h3>
          <p className="text-gray-500 mt-2">
            Please connect your wallet to access the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage graveyards and graves</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            label="Overview"
          />
          <TabButton
            active={activeTab === 'add-graveyard'}
            onClick={() => setActiveTab('add-graveyard')}
            label="Add Graveyard"
          />
          <TabButton
            active={activeTab === 'add-graves'}
            onClick={() => setActiveTab('add-graves')}
            label="Add Graves"
          />
          <TabButton
            active={activeTab === 'finances'}
            onClick={() => setActiveTab('finances')}
            label="Finances"
          />
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab contract={contract} />}
      {activeTab === 'add-graveyard' && <AddGraveyardTab contract={contract} />}
      {activeTab === 'add-graves' && <AddGravesTab contract={contract} />}
      {activeTab === 'finances' && (
        <FinancesTab
          pendingWithdrawal={pendingWithdrawal}
          onWithdraw={handleWithdraw}
          loading={loading}
        />
      )}
    </div>
  );
};

const TabButton = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`
      py-4 px-1 border-b-2 font-medium text-sm
      ${active
        ? 'border-primary-500 text-primary-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }
    `}
  >
    {label}
  </button>
);

const OverviewTab = ({ contract }) => {
  const [stats, setStats] = useState({
    totalGraveyards: 0,
    totalGraves: 0,
    reservedGraves: 0,
    loading: true
  });
  const [graveyards, setGraveyards] = useState([]);
  const [graves, setGraves] = useState([]);

  useEffect(() => {
    if (contract) {
      fetchStats();
      fetchGraveyards();
    }
  }, [contract]);

  const fetchStats = async () => {
    try {
      const graveyardCount = await contract.graveyardCount();
      const graveCount = await contract.graveCount();

      // Count reserved graves by checking each grave
      let reserved = 0;
      for (let i = 1; i <= Number(graveCount); i++) {
        const grave = await contract.graves(i);
        if (grave.reserved) {
          reserved++;
        }
      }

      setStats({
        totalGraveyards: Number(graveyardCount),
        totalGraves: Number(graveCount),
        reservedGraves: reserved,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchGraveyards = async () => {
    try {
      const graveyardCount = await contract.graveyardCount();
      const graveyardData = [];

      for (let i = 1; i <= Number(graveyardCount); i++) {
        const graveyard = await contract.graveyards(i);
        graveyardData.push({
          id: i,
          name: graveyard.name,
          location: graveyard.location,
          owner: graveyard.owner,
          numPlots: Number(graveyard.numPlots)
        });
      }

      setGraveyards(graveyardData);
    } catch (error) {
      console.error('Error fetching graveyards:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Graveyards</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.loading ? '...' : stats.totalGraveyards}
              </p>
            </div>
            <FaTree className="text-4xl text-primary-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Graves</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.loading ? '...' : stats.totalGraves}
              </p>
            </div>
            <FaPlus className="text-4xl text-primary-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Reserved</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.loading ? '...' : stats.reservedGraves}
              </p>
            </div>
            <FaCoins className="text-4xl text-green-600" />
          </div>
        </div>
      </div>

      {/* Graveyards List */}
      {graveyards.length > 0 && (
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Graveyards</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plots
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {graveyards.map((graveyard) => (
                  <tr key={graveyard.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{graveyard.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {graveyard.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {graveyard.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {graveyard.numPlots}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const AddGraveyardTab = ({ contract }) => {
  const [formData, setFormData] = useState({
    owner: '',
    name: '',
    location: '',
    numPlots: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract) {
      toast.error('Contract not initialized');
      return;
    }

    setSubmitting(true);
    try {
      const tx = await contract.addGraveyard(
        formData.owner,
        formData.name,
        formData.location,
        formData.numPlots
      );

      toast.info('Transaction submitted...');
      await tx.wait();
      toast.success('Graveyard added successfully!');

      setFormData({ owner: '', name: '', location: '', numPlots: '' });
    } catch (error) {
      console.error('Error adding graveyard:', error);
      toast.error(error.reason || 'Failed to add graveyard');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Graveyard</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Owner Address *
          </label>
          <input
            type="text"
            className="input"
            value={formData.owner}
            onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
            placeholder="0x..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cemetery Name *
          </label>
          <input
            type="text"
            className="input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Green Valley Memorial Park"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location *
          </label>
          <input
            type="text"
            className="input"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="123 Cemetery Road, City, State"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Plots *
          </label>
          <input
            type="number"
            className="input"
            value={formData.numPlots}
            onChange={(e) => setFormData({ ...formData, numPlots: e.target.value })}
            placeholder="100"
            min="1"
            required
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary w-full"
        >
          {submitting ? 'Adding Graveyard...' : 'Add Graveyard'}
        </button>
      </form>
    </div>
  );
};

const AddGravesTab = ({ contract }) => {
  const [formData, setFormData] = useState({
    graveyardId: '',
    price: '',
    locationHash: '',
    count: '1'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract) {
      toast.error('Contract not initialized');
      return;
    }

    setSubmitting(true);
    try {
      const priceInWei = ethers.parseEther(formData.price);

      if (parseInt(formData.count) === 1) {
        const tx = await contract.addGrave(
          formData.graveyardId,
          priceInWei,
          formData.locationHash
        );
        await tx.wait();
      } else {
        const prices = Array(parseInt(formData.count)).fill(priceInWei);
        const hashes = Array(parseInt(formData.count)).fill(formData.locationHash);

        const tx = await contract.addGravesBatch(
          formData.graveyardId,
          prices,
          hashes
        );
        await tx.wait();
      }

      toast.success(`${formData.count} grave(s) added successfully!`);
      setFormData({ graveyardId: '', price: '', locationHash: '', count: '1' });
    } catch (error) {
      console.error('Error adding graves:', error);
      toast.error(error.reason || 'Failed to add graves');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Graves</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Graveyard ID *
          </label>
          <input
            type="number"
            className="input"
            value={formData.graveyardId}
            onChange={(e) => setFormData({ ...formData, graveyardId: e.target.value })}
            placeholder="1"
            min="1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price (ETH) *
          </label>
          <input
            type="text"
            className="input"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="0.5"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location Hash (IPFS) *
          </label>
          <input
            type="text"
            className="input"
            value={formData.locationHash}
            onChange={(e) => setFormData({ ...formData, locationHash: e.target.value })}
            placeholder="QmHash..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Graves
          </label>
          <input
            type="number"
            className="input"
            value={formData.count}
            onChange={(e) => setFormData({ ...formData, count: e.target.value })}
            min="1"
            max="100"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary w-full"
        >
          {submitting ? 'Adding Graves...' : `Add ${formData.count} Grave(s)`}
        </button>
      </form>
    </div>
  );
};

const FinancesTab = ({ pendingWithdrawal, onWithdraw, loading }) => (
  <div className="card max-w-2xl">
    <h2 className="text-2xl font-bold text-gray-900 mb-6">Finances</h2>
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
      <p className="text-sm text-green-600 mb-2">Available for Withdrawal</p>
      <p className="text-4xl font-bold text-green-700 flex items-center">
        <FaEthereum className="mr-2" />
        {ethers.formatEther(pendingWithdrawal)} ETH
      </p>
    </div>
    <button
      onClick={onWithdraw}
      disabled={loading || pendingWithdrawal === '0'}
      className="btn btn-primary w-full"
    >
      {loading ? 'Withdrawing...' : 'Withdraw Funds'}
    </button>
  </div>
);

export default AdminDashboard;
