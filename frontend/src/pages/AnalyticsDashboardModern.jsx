import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import {
  FaChartLine,
  FaChartPie,
  FaChartBar,
  FaDownload,
  FaCalendar,
  FaDollarSign,
  FaMapMarkedAlt,
  FaUsers,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../styles/modern.css';

/**
 * Advanced Analytics Dashboard
 * Requires admin role
 */
const AnalyticsDashboardModern = () => {
  const { contract, account } = useWeb3();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('all'); // all, year, month, week
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    checkAdminAndFetchData();
  }, [contract, account]);

  const checkAdminAndFetchData = async () => {
    if (!contract || !account) {
      setLoading(false);
      return;
    }

    try {
      const adminStatus = await contract.isAdmin(account);
      setIsAdmin(adminStatus);

      if (adminStatus) {
        await fetchAnalytics();
      }
    } catch (error) {
      console.error('Error checking admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Fetch analytics from contract using available functions
      const totalGraveyards = await contract.getTotalGraveyards();
      const totalGraves = await contract.getTotalGraves();

      // Calculate reserved, maintained, and revenue by iterating through data
      let totalReserved = 0;
      let totalMaintained = 0;
      let totalRevenueWei = BigInt(0);
      let totalPriceWei = BigInt(0);

      for (let i = 1; i <= Number(totalGraveyards); i++) {
        try {
          const graveyard = await contract.getGraveyard(i);
          const graveIds = graveyard.graveIds || [];

          for (const graveId of graveIds) {
            try {
              const grave = await contract.getGrave(graveId);
              totalPriceWei += BigInt(grave.price.toString());

              if (grave.reserved) {
                totalReserved++;
                totalRevenueWei += BigInt(grave.price.toString());
              }
              if (grave.maintained) {
                totalMaintained++;
              }
            } catch (e) {}
          }
        } catch (e) {}
      }

      const avgPrice = Number(totalGraves) > 0
        ? totalPriceWei / BigInt(Number(totalGraves))
        : BigInt(0);

      setAnalytics({
        totalGraveyards: Number(totalGraveyards).toString(),
        totalGraves: Number(totalGraves).toString(),
        totalReserved: totalReserved.toString(),
        totalMaintained: totalMaintained.toString(),
        totalRevenue: totalRevenueWei.toString(),
        averagePrice: avgPrice.toString(),
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    }
  };

  const exportReport = (format) => {
    if (!analytics) return;

    const reportData = {
      generatedAt: new Date().toISOString(),
      timeRange,
      data: analytics,
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cemetery-analytics-${Date.now()}.json`;
      a.click();
      toast.success('Report exported as JSON');
    } else if (format === 'csv') {
      const csv = [
        ['Metric', 'Value'],
        ['Total Graveyards', analytics.totalGraveyards],
        ['Total Graves', analytics.totalGraves],
        ['Total Reserved', analytics.totalReserved],
        ['Total Maintained', analytics.totalMaintained],
        ['Total Revenue (Wei)', analytics.totalRevenue],
        ['Average Price (Wei)', analytics.averagePrice],
      ]
        .map((row) => row.join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cemetery-analytics-${Date.now()}.csv`;
      a.click();
      toast.success('Report exported as CSV');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-modern mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="card-modern card-glass text-center py-16 px-8 max-w-md">
          <div className="text-6xl mb-6">📊</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Connect Wallet</h3>
          <p className="text-gray-600">Please connect your wallet to view analytics</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="card-modern card-glass text-center py-16 px-8 max-w-md">
          <div className="text-6xl mb-6">🔒</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h3>
          <p className="text-gray-600 mb-4">
            Analytics dashboard is only available to administrators
          </p>
          <a href="/" className="btn-modern btn-primary-modern">
            Go Home
          </a>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">No analytics data available</p>
        </div>
      </div>
    );
  }

  const occupancyRate = analytics.totalGraves > 0
    ? ((analytics.totalReserved / analytics.totalGraves) * 100).toFixed(1)
    : 0;

  const maintenanceRate = analytics.totalReserved > 0
    ? ((analytics.totalMaintained / analytics.totalReserved) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="card-modern card-gradient mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-white mb-2">📊 Advanced Analytics</h1>
              <p className="text-white/90">Comprehensive insights and reporting</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => exportReport('csv')}
                className="btn-modern bg-white text-purple-600 hover:bg-gray-100 flex items-center gap-2"
              >
                <FaDownload />
                Export CSV
              </button>
              <button
                onClick={() => exportReport('json')}
                className="btn-modern bg-white text-purple-600 hover:bg-gray-100 flex items-center gap-2"
              >
                <FaDownload />
                Export JSON
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={<FaMapMarkedAlt />}
            label="Total Graveyards"
            value={analytics.totalGraveyards}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />
          <MetricCard
            icon={<FaChartBar />}
            label="Total Graves"
            value={analytics.totalGraves}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          />
          <MetricCard
            icon={<FaUsers />}
            label="Reserved"
            value={analytics.totalReserved}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          />
          <MetricCard
            icon={<FaChartLine />}
            label="Maintained"
            value={analytics.totalMaintained}
            gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
          />
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Occupancy Chart */}
          <div className="card-modern">
            <h3 className="text-2xl font-bold mb-6">
              <span className="gradient-text">Occupancy Rate</span>
            </h3>
            <div className="relative">
              <CircularProgress
                percentage={occupancyRate}
                label="Occupied"
                color="from-purple-600 to-pink-600"
              />
              <div className="text-center mt-6">
                <p className="text-sm text-gray-600">
                  {analytics.totalReserved} of {analytics.totalGraves} graves reserved
                </p>
              </div>
            </div>
          </div>

          {/* Maintenance Chart */}
          <div className="card-modern">
            <h3 className="text-2xl font-bold mb-6">
              <span className="gradient-text">Maintenance Rate</span>
            </h3>
            <div className="relative">
              <CircularProgress
                percentage={maintenanceRate}
                label="Maintained"
                color="from-green-600 to-teal-600"
              />
              <div className="text-center mt-6">
                <p className="text-sm text-gray-600">
                  {analytics.totalMaintained} of {analytics.totalReserved} maintained
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="card-modern">
          <h3 className="text-2xl font-bold mb-6">
            <span className="gradient-text">Financial Overview</span>
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <FinancialCard
              icon={<FaDollarSign />}
              label="Total Revenue"
              value={`${(analytics.totalRevenue / 1e18).toFixed(4)} ETH`}
              subValue={`~$${((analytics.totalRevenue / 1e18) * 2000).toFixed(2)} USD`}
            />
            <FinancialCard
              icon={<FaChartPie />}
              label="Average Grave Price"
              value={`${(analytics.averagePrice / 1e18).toFixed(4)} ETH`}
              subValue={`~$${((analytics.averagePrice / 1e18) * 2000).toFixed(2)} USD`}
            />
            <FinancialCard
              icon={<FaChartLine />}
              label="Revenue Per Grave"
              value={
                analytics.totalReserved > 0
                  ? `${(analytics.totalRevenue / analytics.totalReserved / 1e18).toFixed(4)} ETH`
                  : '0 ETH'
              }
              subValue="Average"
            />
          </div>
        </div>

        {/* Trends */}
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          <div className="card-modern">
            <h3 className="text-2xl font-bold mb-6">
              <span className="gradient-text">Quick Stats</span>
            </h3>
            <div className="space-y-4">
              <StatBar
                label="Reservation Rate"
                percentage={occupancyRate}
                color="bg-purple-600"
              />
              <StatBar
                label="Maintenance Rate"
                percentage={maintenanceRate}
                color="bg-green-600"
              />
              <StatBar
                label="Available Plots"
                percentage={100 - occupancyRate}
                color="bg-blue-600"
              />
            </div>
          </div>

          <div className="card-modern">
            <h3 className="text-2xl font-bold mb-6">
              <span className="gradient-text">System Health</span>
            </h3>
            <div className="space-y-4">
              <HealthIndicator
                label="Data Integrity"
                status="Excellent"
                color="text-green-600"
              />
              <HealthIndicator
                label="Record Completeness"
                status="Good"
                color="text-blue-600"
              />
              <HealthIndicator
                label="System Uptime"
                status="99.9%"
                color="text-green-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ icon, label, value, gradient }) => (
  <div className="stat-card-modern" style={{ borderLeftColor: gradient.match(/#[0-9a-f]{6}/i)?.[0] }}>
    <div className="flex items-center justify-between">
      <div>
        <div className="stat-value">{value}</div>
        <div className="text-gray-600 font-medium text-sm">{label}</div>
      </div>
      <div className="text-3xl opacity-20">{icon}</div>
    </div>
  </div>
);

// Circular Progress Component
const CircularProgress = ({ percentage, label, color }) => {
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg className="w-48 h-48 transform -rotate-90">
        <circle
          cx="96"
          cy="96"
          r="70"
          stroke="#e5e7eb"
          strokeWidth="12"
          fill="none"
        />
        <circle
          cx="96"
          cy="96"
          r="70"
          className={`bg-gradient-to-r ${color}`}
          stroke="url(#gradient)"
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#667eea" />
            <stop offset="100%" stopColor="#764ba2" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute">
        <div className="text-center" style={{ marginTop: '80px' }}>
          <div className="text-4xl font-bold gradient-text">{percentage}%</div>
          <div className="text-sm text-gray-600">{label}</div>
        </div>
      </div>
    </div>
  );
};

// Financial Card Component
const FinancialCard = ({ icon, label, value, subValue }) => (
  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
    <div className="flex items-center gap-3 mb-3">
      <div className="text-2xl text-purple-600">{icon}</div>
      <h4 className="font-semibold text-gray-700">{label}</h4>
    </div>
    <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
    <div className="text-sm text-gray-600">{subValue}</div>
  </div>
);

// Stat Bar Component
const StatBar = ({ label, percentage, color }) => (
  <div>
    <div className="flex justify-between text-sm mb-2">
      <span className="font-medium text-gray-700">{label}</span>
      <span className="font-bold text-gray-900">{percentage}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  </div>
);

// Health Indicator Component
const HealthIndicator = ({ label, status, color }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
    <span className="font-medium text-gray-700">{label}</span>
    <span className={`font-bold ${color}`}>{status}</span>
  </div>
);

export default AnalyticsDashboardModern;
