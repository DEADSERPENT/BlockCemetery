import { Link } from 'react-router-dom';
import { FaShieldAlt, FaMapMarkedAlt, FaEthereum, FaLock } from 'react-icons/fa';

const HomePage = () => {
  return (
    <div className="bg-gradient-to-b from-primary-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
            Cemetery Allocation Management
            <span className="block text-primary-600">Powered by Blockchain</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transparent, immutable, and secure grave allocation using Ethereum blockchain technology.
            Reserve your final resting place with complete confidence and transparency.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/graveyards" className="btn btn-primary text-lg px-8 py-3">
              Browse Graveyards
            </Link>
            <a href="#features" className="btn btn-secondary text-lg px-8 py-3">
              Learn More
            </a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Why Choose Blockchain for Cemetery Management?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<FaShieldAlt className="text-4xl text-primary-600" />}
            title="Immutable Records"
            description="All grave allocations are permanently recorded on the blockchain, preventing disputes and fraud."
          />
          <FeatureCard
            icon={<FaMapMarkedAlt className="text-4xl text-primary-600" />}
            title="Interactive Maps"
            description="Visual grave selection with real-time availability status and detailed location information."
          />
          <FeatureCard
            icon={<FaEthereum className="text-4xl text-primary-600" />}
            title="Smart Contracts"
            description="Automated payment processing and ownership transfer with complete transparency."
          />
          <FeatureCard
            icon={<FaLock className="text-4xl text-primary-600" />}
            title="Privacy Protected"
            description="Sensitive burial records encrypted and stored off-chain with on-chain verification."
          />
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Connect Your Wallet"
              description="Connect your MetaMask wallet to interact with the blockchain securely."
            />
            <StepCard
              number="2"
              title="Browse & Select"
              description="Explore available graveyards and select your preferred grave plot on the interactive map."
            />
            <StepCard
              number="3"
              title="Reserve & Own"
              description="Complete the reservation with cryptocurrency payment and receive immutable proof of ownership."
            />
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <StatCard value="100%" label="Transparent" />
            <StatCard value="0" label="Disputes" />
            <StatCard value="∞" label="Permanent Records" />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Ready to Get Started?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Connect your wallet and explore available grave plots today.
        </p>
        <Link to="/graveyards" className="btn btn-primary text-lg px-8 py-3">
          View Available Graves
        </Link>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="card text-center hover:shadow-xl transition-shadow">
    <div className="flex justify-center mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const StepCard = ({ number, title, description }) => (
  <div className="card text-center">
    <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
      {number}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const StatCard = ({ value, label }) => (
  <div>
    <div className="text-4xl font-bold mb-2">{value}</div>
    <div className="text-primary-100 text-lg">{label}</div>
  </div>
);

export default HomePage;
