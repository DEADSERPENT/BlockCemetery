import { Link } from 'react-router-dom';
import { FaShieldAlt, FaMapMarkedAlt, FaEthereum, FaLock, FaChartLine, FaUsers } from 'react-icons/fa';
import '../styles/modern.css';

const HomePageModern = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Dramatic and Modern */}
      <section className="hero-modern mx-4 md:mx-8 my-8 relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center py-20">
            <div className="mb-6">
              <span className="badge-modern badge-admin text-sm">
                🚀 Revolutionary Blockchain Technology
              </span>
            </div>

            <h1 className="text-6xl md:text-7xl font-extrabold mb-6 leading-tight">
              Cemetery Management
              <span className="block mt-2">Reimagined</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto font-light">
              Transparent, immutable, and secure grave allocation using cutting-edge
              Ethereum blockchain technology. The future of cemetery management is here.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/graveyards" className="btn-modern btn-accent-modern text-lg px-8 py-4 relative z-10">
                🔍 Explore Graveyards
              </Link>
              <a href="#features" className="btn-modern btn-outline-modern text-lg px-8 py-4 bg-white/10 border-white text-white hover:bg-white hover:text-gray-900">
                📚 Learn More
              </a>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">100%</div>
                <div className="text-white/80 text-sm">Transparent</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">∞</div>
                <div className="text-white/80 text-sm">Permanent</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">0</div>
                <div className="text-white/80 text-sm">Disputes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-6">
          <StatCardModern
            icon={<FaUsers />}
            value="5000+"
            label="Happy Users"
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />
          <StatCardModern
            icon={<FaMapMarkedAlt />}
            value="50+"
            label="Cemeteries"
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          />
          <StatCardModern
            icon={<FaEthereum />}            value="10K+"
            label="Transactions"
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          />
          <StatCardModern
            icon={<FaChartLine />}
            value="99.9%"
            label="Uptime"
            gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
          />
        </div>
      </section>

      {/* Features Section - Modern Grid */}
      <section id="features" className="max-w-7xl mx-auto px-4 md:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4 gradient-text">
            Why Choose Blockchain?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience the future of cemetery management with our revolutionary platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCardModern
            icon={<FaShieldAlt />}
            title="Immutable Records"
            description="All grave allocations permanently recorded on blockchain, preventing disputes and fraud forever."
            color="#667eea"
          />
          <FeatureCardModern
            icon={<FaMapMarkedAlt />}
            title="Interactive Maps"
            description="Visual grave selection with real-time availability status and detailed location information."
            color="#f093fb"
          />
          <FeatureCardModern
            icon={<FaEthereum />}
            title="Smart Contracts"
            description="Automated payment processing and ownership transfer with complete transparency."
            color="#4facfe"
          />
          <FeatureCardModern
            icon={<FaLock />}
            title="Privacy Protected"
            description="Sensitive burial records encrypted and stored off-chain with on-chain verification."
            color="#43e97b"
          />
        </div>
      </section>

      {/* How It Works - Step by Step */}
      <section className="bg-gradient-to-b from-purple-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              <span className="gradient-text">How It Works</span>
            </h2>
            <p className="text-xl text-gray-600">Simple, fast, and secure in 3 easy steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <StepCardModern
              number="1"
              title="Connect Wallet"
              description="Connect your MetaMask wallet securely to interact with the blockchain."
              icon="🔗"
            />
            <StepCardModern
              number="2"
              title="Browse & Select"
              description="Explore available graveyards and select your preferred grave plot on our interactive map."
              icon="🗺️"
            />
            <StepCardModern
              number="3"
              title="Reserve & Own"
              description="Complete reservation with cryptocurrency payment and receive immutable proof of ownership."
              icon="✅"
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6 gradient-text">
              Built for Trust & Transparency
            </h2>
            <div className="space-y-6">
              <BenefitItem
                icon="✓"
                title="No Hidden Fees"
                description="All pricing is transparent and recorded on-chain"
              />
              <BenefitItem
                icon="✓"
                title="Instant Ownership"
                description="Get immediate proof of ownership after reservation"
              />
              <BenefitItem
                icon="✓"
                title="24/7 Availability"
                description="Reserve graves anytime, anywhere in the world"
              />
              <BenefitItem
                icon="✓"
                title="Permanent Records"
                description="Your ownership is stored forever on blockchain"
              />
            </div>
          </div>
          <div className="relative">
            <div className="card-modern card-glass p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">🏛️</div>
                <h3 className="text-2xl font-bold mb-4">Trusted by Families Worldwide</h3>
                <p className="text-gray-600 mb-6">
                  Join thousands of families who have chosen blockchain for their cemetery needs
                </p>
                <div className="flex justify-center gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">98%</div>
                    <div className="text-sm text-gray-600">Satisfaction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">5.0</div>
                    <div className="text-sm text-gray-600">Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Final Push */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20">
        <div className="card-modern card-gradient text-center py-16 px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Connect your wallet and explore available grave plots today.
            Experience the future of cemetery management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/graveyards"
              className="btn-modern bg-white text-purple-600 hover:bg-gray-100 text-lg px-10 py-4 relative z-10"
            >
              View Available Graves →
            </Link>
            <a
              href="#features"
              className="btn-modern btn-outline-modern border-white text-white hover:bg-white hover:text-purple-600 text-lg px-10 py-4"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 gradient-text">Cemetery Blockchain</h3>
              <p className="text-gray-400">
                Revolutionary cemetery management powered by Ethereum blockchain technology.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/graveyards" className="hover:text-white transition">Browse Graveyards</Link></li>
                <li><Link to="/my-graves" className="hover:text-white transition">My Graves</Link></li>
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Built With</h4>
              <ul className="space-y-2 text-gray-400">
                <li>⛓️ Ethereum Blockchain</li>
                <li>🔒 OpenZeppelin Security</li>
                <li>⚛️ React & Vite</li>
                <li>🗺️ Leaflet Maps</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2025 Cemetery Blockchain. Built with ❤️ and blockchain technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Modern Feature Card Component
const FeatureCardModern = ({ icon, title, description, color }) => (
  <div className="feature-card-modern fade-in">
    <div className="feature-icon" style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)` }}>
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

// Modern Step Card Component
const StepCardModern = ({ number, title, description, icon }) => (
  <div className="card-modern text-center relative">
    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-xl">
      {number}
    </div>
    <div className="text-6xl mb-6 mt-4">{icon}</div>
    <h3 className="text-2xl font-bold mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

// Modern Stat Card Component
const StatCardModern = ({ icon, value, label, gradient }) => (
  <div className="stat-card-modern" style={{ borderLeftColor: gradient.match(/#[0-9a-f]{6}/i)?.[0] }}>
    <div className="flex items-center justify-between">
      <div>
        <div className="stat-value">{value}</div>
        <div className="text-gray-600 font-medium">{label}</div>
      </div>
      <div className="text-4xl opacity-20">
        {icon}
      </div>
    </div>
  </div>
);

// Benefit Item Component
const BenefitItem = ({ icon, title, description }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
      {icon}
    </div>
    <div>
      <h4 className="font-bold text-lg mb-1">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  </div>
);

export default HomePageModern;
