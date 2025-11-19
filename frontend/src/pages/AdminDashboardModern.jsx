import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { useWeb3 } from '../context/Web3Context';
import { FaPlus, FaTree, FaCoins, FaUserShield, FaLock, FaChartLine, FaEthereum, FaWallet, FaSync } from 'react-icons/fa';
import '../styles/modern.css';

const AdminDashboardModern = () => {
  const { contract, account } = useWeb3();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingWithdrawal, setPendingWithdrawal] = useState('0');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [graveyards, setGraveyards] = useState([]);
  const [stats, setStats] = useState({
    totalGraveyards: 0,
    totalGraves: 0,
    reservedGraves: 0,
    availableGraves: 0,
    totalRevenue: '0'
  });

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (contract && account) {
        try {
          const adminStatus = await contract.isAdmin(account);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setCheckingRole(false);
    };

    checkAdminStatus();
  }, [contract, account]);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    if (!contract || !account) return;

    setRefreshing(true);
    try {
      await Promise.all([
        fetchPendingWithdrawal(),
        fetchStats(),
        fetchGraveyards()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [contract, account]);

  // Fetch data if admin
  useEffect(() => {
    if (isAdmin && contract && account) {
      fetchAllData();
    }
  }, [isAdmin, contract, account, fetchAllData]);

  const fetchPendingWithdrawal = async () => {
    try {
      const amount = await contract.getPendingWithdrawal(account);
      setPendingWithdrawal(amount.toString());
    } catch (error) {
      console.error('Error fetching pending withdrawal:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const totalGraveyards = await contract.getTotalGraveyards();
      const totalGraves = await contract.getTotalGraves();

      // Calculate reserved graves and revenue
      let reservedCount = 0;
      let totalRevenueWei = BigInt(0);

      for (let i = 1; i <= Number(totalGraveyards); i++) {
        try {
          const graveyard = await contract.getGraveyard(i);
          const graveIds = graveyard.graveIds || [];

          for (const graveId of graveIds) {
            try {
              const grave = await contract.getGrave(graveId);
              if (grave.reserved) {
                reservedCount++;
                totalRevenueWei += BigInt(grave.price.toString());
              }
            } catch (e) {}
          }
        } catch (e) {}
      }

      setStats({
        totalGraveyards: Number(totalGraveyards),
        totalGraves: Number(totalGraves),
        reservedGraves: reservedCount,
        availableGraves: Number(totalGraves) - reservedCount,
        totalRevenue: totalRevenueWei.toString()
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchGraveyards = async () => {
    try {
      const totalGraveyards = await contract.getTotalGraveyards();
      const graveyardsList = [];

      for (let i = 1; i <= Number(totalGraveyards); i++) {
        try {
          const graveyard = await contract.getGraveyard(i);
          const graveIds = graveyard.graveIds || [];

          let reservedCount = 0;
          for (const graveId of graveIds) {
            try {
              const grave = await contract.getGrave(graveId);
              if (grave.reserved) reservedCount++;
            } catch (e) {}
          }

          graveyardsList.push({
            id: Number(graveyard.id),
            name: graveyard.name,
            location: graveyard.location,
            owner: graveyard.owner,
            numPlots: Number(graveyard.numPlots),
            currentGraves: graveIds.length,
            reservedGraves: reservedCount,
            active: graveyard.active,
            isOwner: graveyard.owner.toLowerCase() === account.toLowerCase()
          });
        } catch (e) {}
      }

      setGraveyards(graveyardsList);
    } catch (error) {
      console.error('Error fetching graveyards:', error);
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
      toast.error(error.reason || 'Failed to withdraw funds');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-modern mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-medium">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Not connected
  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="card-modern card-glass text-center py-16 px-8 max-w-md">
          <FaWallet className="text-6xl mx-auto text-gray-300 mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Wallet Not Connected</h3>
          <p className="text-gray-600">Please connect your wallet to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  // Access Denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="card-modern card-glass text-center py-16 px-8 max-w-md">
          <FaLock className="text-6xl mx-auto text-red-400 mb-6" />
          <h3 className="text-3xl font-bold text-gray-900 mb-3">Access Denied</h3>
          <p className="text-lg text-gray-600 mb-6">You do not have administrator privileges.</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-xs text-red-600">Your wallet: {account}</p>
          </div>
          <a href="/graveyards" className="btn-modern btn-primary-modern">Return to Graveyards</a>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="card-modern card-gradient mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <FaUserShield className="text-4xl text-white" />
                  <h1 className="text-4xl md:text-5xl font-extrabold text-white">Admin Dashboard</h1>
                </div>
                <p className="text-white/90 text-lg">Manage graveyards, graves, and finances</p>
              </div>
              <button
                onClick={fetchAllData}
                disabled={refreshing}
                className="badge-modern bg-white text-purple-600 shadow-xl text-sm px-4 py-2 flex items-center gap-2 hover:bg-gray-100"
              >
                <FaSync className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCardModern icon={<FaTree />} label="Graveyards" value={stats.totalGraveyards} color="purple" />
          <StatCardModern icon={<FaPlus />} label="Total Graves" value={stats.totalGraves} color="blue" />
          <StatCardModern icon={<FaCoins />} label="Reserved" value={stats.reservedGraves} color="pink" />
          <StatCardModern icon={<FaChartLine />} label="Available" value={stats.availableGraves} color="green" />
          <StatCardModern
            icon={<FaEthereum />}
            label="Pending"
            value={`${parseFloat(ethers.formatEther(pendingWithdrawal)).toFixed(4)} ETH`}
            color="yellow"
          />
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            <TabButtonModern active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Overview" icon={<FaChartLine />} />
            <TabButtonModern active={activeTab === 'graveyards'} onClick={() => setActiveTab('graveyards')} label="Graveyards" icon={<FaTree />} />
            <TabButtonModern active={activeTab === 'add-graveyard'} onClick={() => setActiveTab('add-graveyard')} label="Add Graveyard" icon={<FaPlus />} />
            <TabButtonModern active={activeTab === 'add-graves'} onClick={() => setActiveTab('add-graves')} label="Add Graves" icon={<FaPlus />} />
            <TabButtonModern active={activeTab === 'finances'} onClick={() => setActiveTab('finances')} label="Finances" icon={<FaCoins />} />
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTabModern stats={stats} graveyards={graveyards} />}
        {activeTab === 'graveyards' && <GraveyardsTabModern graveyards={graveyards} contract={contract} account={account} onRefresh={fetchAllData} />}
        {activeTab === 'add-graveyard' && <AddGraveyardTabModern contract={contract} account={account} onSuccess={fetchAllData} />}
        {activeTab === 'add-graves' && <AddGravesTabModern contract={contract} graveyards={graveyards} account={account} onSuccess={fetchAllData} />}
        {activeTab === 'finances' && (
          <FinancesTabModern
            pendingWithdrawal={pendingWithdrawal}
            totalRevenue={stats.totalRevenue}
            onWithdraw={handleWithdraw}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

// Tab Button
const TabButtonModern = ({ active, onClick, label, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
      active
        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
        : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// Stat Card
const StatCardModern = ({ icon, label, value, color }) => {
  const colors = {
    purple: 'border-l-purple-500',
    blue: 'border-l-blue-500',
    pink: 'border-l-pink-500',
    green: 'border-l-green-500',
    yellow: 'border-l-yellow-500'
  };

  return (
    <div className={`stat-card-modern border-l-4 ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="stat-value text-lg">{value}</div>
          <div className="text-gray-600 font-medium text-xs">{label}</div>
        </div>
        <div className="text-2xl opacity-20">{icon}</div>
      </div>
    </div>
  );
};

// Overview Tab
const OverviewTabModern = ({ stats, graveyards }) => (
  <div className="space-y-6">
    <div className="card-modern">
      <h2 className="text-2xl font-bold mb-4">
        <span className="gradient-text">System Overview</span>
      </h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Statistics Summary</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>Total Graveyards: {stats.totalGraveyards}</li>
            <li>Total Grave Plots: {stats.totalGraves}</li>
            <li>Reserved: {stats.reservedGraves} ({stats.totalGraves > 0 ? ((stats.reservedGraves / stats.totalGraves) * 100).toFixed(1) : 0}%)</li>
            <li>Available: {stats.availableGraves}</li>
            <li>Total Revenue: {parseFloat(ethers.formatEther(stats.totalRevenue)).toFixed(4)} ETH</li>
          </ul>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-green-900 mb-2">Quick Actions</h3>
          <p className="text-sm text-green-700">
            Use the tabs above to add new graveyards, create grave plots, view existing graveyards, and manage finances.
          </p>
        </div>
      </div>
    </div>

    {graveyards.length > 0 && (
      <div className="card-modern">
        <h3 className="text-xl font-bold mb-4">Recent Graveyards</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">ID</th>
                <th className="text-left py-2 px-3">Name</th>
                <th className="text-left py-2 px-3">Graves</th>
                <th className="text-left py-2 px-3">Reserved</th>
                <th className="text-left py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {graveyards.slice(0, 5).map((gy) => (
                <tr key={gy.id} className="border-b">
                  <td className="py-2 px-3">{gy.id}</td>
                  <td className="py-2 px-3">{gy.name}</td>
                  <td className="py-2 px-3">{gy.currentGraves}/{gy.numPlots}</td>
                  <td className="py-2 px-3">{gy.reservedGraves}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-1 rounded text-xs ${gy.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {gy.active ? 'Active' : 'Inactive'}
                    </span>
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

// Graveyards List Tab
const GraveyardsTabModern = ({ graveyards, contract, account, onRefresh }) => {
  const [togglingStatus, setTogglingStatus] = useState(null);

  const handleToggleStatus = async (graveyardId, currentStatus) => {
    if (!contract) return;

    setTogglingStatus(graveyardId);
    try {
      const tx = await contract.setGraveyardStatus(graveyardId, !currentStatus);
      toast.info('Updating graveyard status...');
      await tx.wait();
      toast.success(`Graveyard ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      onRefresh();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error(error.reason || 'Failed to update status');
    } finally {
      setTogglingStatus(null);
    }
  };

  if (graveyards.length === 0) {
    return (
      <div className="card-modern text-center py-12">
        <FaTree className="text-6xl text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-600 mb-2">No Graveyards Yet</h3>
        <p className="text-gray-500">Add your first graveyard using the "Add Graveyard" tab.</p>
      </div>
    );
  }

  return (
    <div className="card-modern">
      <h2 className="text-2xl font-bold mb-6">
        <span className="gradient-text">All Graveyards</span>
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left py-3 px-4">ID</th>
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Location</th>
              <th className="text-left py-3 px-4">Owner</th>
              <th className="text-left py-3 px-4">Plots</th>
              <th className="text-left py-3 px-4">Reserved</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {graveyards.map((gy) => (
              <tr key={gy.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{gy.id}</td>
                <td className="py-3 px-4">{gy.name}</td>
                <td className="py-3 px-4 text-xs text-gray-600">{gy.location}</td>
                <td className="py-3 px-4 text-xs font-mono">
                  {gy.owner.substring(0, 6)}...{gy.owner.substring(38)}
                  {gy.isOwner && <span className="ml-1 text-purple-600">(You)</span>}
                </td>
                <td className="py-3 px-4">{gy.currentGraves}/{gy.numPlots}</td>
                <td className="py-3 px-4">{gy.reservedGraves}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${gy.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {gy.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {gy.isOwner && (
                    <button
                      onClick={() => handleToggleStatus(gy.id, gy.active)}
                      disabled={togglingStatus === gy.id}
                      className={`text-xs px-3 py-1 rounded ${
                        gy.active
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {togglingStatus === gy.id ? '...' : (gy.active ? 'Deactivate' : 'Activate')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Add Graveyard Tab
const AddGraveyardTabModern = ({ contract, account, onSuccess }) => {
  const [formData, setFormData] = useState({
    owner: '',
    name: '',
    location: '',
    numPlots: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [useCurrentAccount, setUseCurrentAccount] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract) {
      toast.error('Contract not initialized');
      return;
    }

    const ownerAddress = useCurrentAccount ? account : formData.owner;

    if (!ethers.isAddress(ownerAddress)) {
      toast.error('Invalid owner address');
      return;
    }

    setSubmitting(true);
    try {
      const tx = await contract.addGraveyard(
        ownerAddress,
        formData.name,
        formData.location,
        parseInt(formData.numPlots)
      );

      toast.info('Transaction submitted...');
      await tx.wait();
      toast.success('Graveyard added successfully!');

      setFormData({ owner: '', name: '', location: '', numPlots: '' });
      onSuccess();
    } catch (error) {
      console.error('Error adding graveyard:', error);
      toast.error(error.reason || 'Failed to add graveyard');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card-modern max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        <span className="gradient-text">Add New Graveyard</span>
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Owner Address</label>
          <div className="flex items-center gap-3 mb-2">
            <input
              type="checkbox"
              checked={useCurrentAccount}
              onChange={(e) => setUseCurrentAccount(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Use my address</span>
          </div>
          {!useCurrentAccount && (
            <input
              type="text"
              className="input-modern"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              placeholder="0x..."
              required={!useCurrentAccount}
            />
          )}
          {useCurrentAccount && (
            <p className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded">{account}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Cemetery Name *</label>
          <input
            type="text"
            className="input-modern"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Green Valley Memorial Park"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
          <input
            type="text"
            className="input-modern"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="123 Cemetery Road, City, State"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Maximum Plots *</label>
          <input
            type="number"
            className="input-modern"
            value={formData.numPlots}
            onChange={(e) => setFormData({ ...formData, numPlots: e.target.value })}
            placeholder="100"
            min="1"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Maximum capacity of grave plots</p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-modern btn-primary-modern w-full text-lg py-4"
        >
          {submitting ? 'Adding Graveyard...' : 'Add Graveyard'}
        </button>
      </form>
    </div>
  );
};

// Add Graves Tab
const AddGravesTabModern = ({ contract, graveyards, account, onSuccess }) => {
  const [formData, setFormData] = useState({
    graveyardId: '',
    price: '',
    locationHash: '',
    count: '1'
  });
  const [submitting, setSubmitting] = useState(false);

  // Filter graveyards owned by current user
  const myGraveyards = graveyards.filter(gy => gy.isOwner && gy.active);
  const selectedGraveyard = myGraveyards.find(gy => gy.id === parseInt(formData.graveyardId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract) {
      toast.error('Contract not initialized');
      return;
    }

    if (!formData.graveyardId) {
      toast.error('Please select a graveyard');
      return;
    }

    const count = parseInt(formData.count);
    if (selectedGraveyard && selectedGraveyard.currentGraves + count > selectedGraveyard.numPlots) {
      toast.error(`Cannot add ${count} graves. Only ${selectedGraveyard.numPlots - selectedGraveyard.currentGraves} slots available.`);
      return;
    }

    setSubmitting(true);
    try {
      const priceInWei = ethers.parseEther(formData.price);

      if (count === 1) {
        const tx = await contract.addGrave(
          parseInt(formData.graveyardId),
          priceInWei,
          formData.locationHash || 'default'
        );
        await tx.wait();
      } else {
        const prices = Array(count).fill(priceInWei);
        const hashes = Array(count).fill(formData.locationHash || 'default');

        const tx = await contract.addGravesBatch(
          parseInt(formData.graveyardId),
          prices,
          hashes
        );
        await tx.wait();
      }

      toast.success(`${count} grave(s) added successfully!`);
      setFormData({ graveyardId: formData.graveyardId, price: '', locationHash: '', count: '1' });
      onSuccess();
    } catch (error) {
      console.error('Error adding graves:', error);
      toast.error(error.reason || 'Failed to add graves');
    } finally {
      setSubmitting(false);
    }
  };

  if (myGraveyards.length === 0) {
    return (
      <div className="card-modern text-center py-12 max-w-2xl mx-auto">
        <FaTree className="text-6xl text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-600 mb-2">No Graveyards Available</h3>
        <p className="text-gray-500">You need to create a graveyard first before adding graves.</p>
      </div>
    );
  }

  return (
    <div className="card-modern max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        <span className="gradient-text">Add Grave Plots</span>
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Graveyard *</label>
          <select
            className="input-modern"
            value={formData.graveyardId}
            onChange={(e) => setFormData({ ...formData, graveyardId: e.target.value })}
            required
          >
            <option value="">Choose a graveyard...</option>
            {myGraveyards.map((gy) => (
              <option key={gy.id} value={gy.id}>
                {gy.name} (ID: {gy.id}) - {gy.currentGraves}/{gy.numPlots} plots used
              </option>
            ))}
          </select>
          {selectedGraveyard && (
            <p className="text-xs text-gray-500 mt-1">
              Available slots: {selectedGraveyard.numPlots - selectedGraveyard.currentGraves}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Price per Grave (ETH) *</label>
          <input
            type="text"
            className="input-modern"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="0.5"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Location Hash (IPFS)</label>
          <input
            type="text"
            className="input-modern"
            value={formData.locationHash}
            onChange={(e) => setFormData({ ...formData, locationHash: e.target.value })}
            placeholder="QmHash... (optional)"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Graves</label>
          <input
            type="number"
            className="input-modern"
            value={formData.count}
            onChange={(e) => setFormData({ ...formData, count: e.target.value })}
            min="1"
            max={selectedGraveyard ? selectedGraveyard.numPlots - selectedGraveyard.currentGraves : 100}
          />
          <p className="text-xs text-gray-500 mt-1">Batch add multiple graves at same price</p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-modern btn-primary-modern w-full text-lg py-4"
        >
          {submitting ? 'Adding Graves...' : `Add ${formData.count} Grave(s)`}
        </button>
      </form>
    </div>
  );
};

// Finances Tab
const FinancesTabModern = ({ pendingWithdrawal, totalRevenue, onWithdraw, loading }) => {
  const pendingAmount = parseFloat(ethers.formatEther(pendingWithdrawal));
  const totalAmount = parseFloat(ethers.formatEther(totalRevenue));
  const hasBalance = pendingAmount > 0;

  return (
    <div className="card-modern max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        <span className="gradient-text">Financial Management</span>
      </h2>

      <div className="grid gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <p className="text-sm text-blue-700 font-semibold mb-2">Total Revenue Generated</p>
          <p className="text-3xl font-bold text-blue-800 flex items-center">
            <FaEthereum className="mr-2" />
            {totalAmount.toFixed(6)} ETH
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <p className="text-sm text-green-700 font-semibold mb-2">Available for Withdrawal</p>
          <p className="text-4xl font-bold text-green-800 flex items-center">
            <FaEthereum className="mr-2" />
            {pendingAmount.toFixed(6)} ETH
          </p>
          {hasBalance && (
            <p className="text-sm text-green-600 mt-1">
              ~${(pendingAmount * 2000).toFixed(2)} USD (estimated)
            </p>
          )}
        </div>
      </div>

      <button
        onClick={onWithdraw}
        disabled={loading || !hasBalance}
        className={`btn-modern w-full text-lg py-4 ${
          hasBalance
            ? 'btn-primary-modern'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Processing...
          </span>
        ) : hasBalance ? (
          'Withdraw Funds'
        ) : (
          'No Funds Available'
        )}
      </button>

      {!hasBalance && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            Funds become available when users reserve graves in your graveyards.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardModern;
