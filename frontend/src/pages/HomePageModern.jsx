import { Link } from 'react-router-dom';
import { FaShieldAlt, FaMapMarkedAlt, FaEthereum, FaLock, FaLeaf, FaInfinity } from 'react-icons/fa';
import '../styles/modern.css';

const HomePageModern = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative mx-4 md:mx-8 my-6">
        <div className="hero-modern rounded-3xl overflow-hidden min-h-[600px] flex items-center relative">

          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1518709414768-a88986a45ca5?q=80&w=2070&auto=format&fit=crop"
              alt="Peaceful Nature"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 to-primary-800/80"></div>
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10 w-full grid md:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium mb-6 backdrop-blur-sm">
                ✨ The Future of Legacy Preservation
              </span>
              <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight text-white">
                Eternal Peace, <br/>
                <span className="text-accent-400">Secured Forever.</span>
              </h1>
              <p className="text-xl text-gray-100 mb-8 font-light leading-relaxed max-w-xl">
                Secure your family's legacy on the immutable Ethereum blockchain.
                Transparent, permanent, and peaceful allocation management.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/graveyards" className="btn-modern btn-accent-modern shadow-lg shadow-accent-500/30">
                  Find a Resting Place
                </Link>
                <a href="#learn" className="btn-modern btn-outline-modern">
                  How it Works
                </a>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="hidden md:block relative">
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 transform rotate-2 hover:rotate-0 transition-all duration-500">
                <img
                  src="https://images.unsplash.com/photo-1596814648589-32219468e826?q=80&w=1000&auto=format&fit=crop"
                  alt="Peaceful Cemetery Map"
                  className="w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md p-4 text-white">
                  <div className="flex items-center gap-3">
                    <FaLock className="text-accent-400" />
                    <div>
                      <p className="text-sm font-bold">Block #1829402</p>
                      <p className="text-xs text-gray-300">Verified Ownership</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="learn" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">Why Blockchain?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Combining the serenity of traditional cemeteries with the immutability of modern technology.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<FaInfinity className="text-3xl text-primary-600" />}
            title="Permanent Records"
            desc="Unlike paper records that can be lost, blockchain records exist forever."
            img="https://images.unsplash.com/photo-1639322537228-ad7117a3a63b?q=80&w=1000&auto=format&fit=crop"
          />
          <FeatureCard
            icon={<FaShieldAlt className="text-3xl text-primary-600" />}
            title="Fraud Proof"
            desc="Cryptographic proof of ownership prevents double-booking and disputes."
            img="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop"
          />
          <FeatureCard
            icon={<FaLeaf className="text-3xl text-primary-600" />}
            title="Eco-Friendly"
            desc="Digital management reduces paper waste and physical infrastructure overhead."
            img="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000&auto=format&fit=crop"
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Simple, secure, and permanent in three steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <StepCard
              number="1"
              title="Connect Your Wallet"
              description="Securely connect your MetaMask wallet to interact with the blockchain."
              icon="🔗"
            />
            <StepCard
              number="2"
              title="Browse & Select"
              description="Explore available graveyards and select your preferred grave plot."
              icon="🗺️"
            />
            <StepCard
              number="3"
              title="Reserve Forever"
              description="Complete your reservation and receive immutable proof of ownership."
              icon="✅"
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-serif font-bold mb-6 text-gradient">
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
            <div className="card-modern p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">🏛️</div>
                <h3 className="text-2xl font-bold mb-4">Trusted by Families Worldwide</h3>
                <p className="text-gray-600 mb-6">
                  Join thousands of families who have chosen blockchain for their cemetery needs
                </p>
                <div className="flex justify-center gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600">98%</div>
                    <div className="text-sm text-gray-600">Satisfaction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600">5.0</div>
                    <div className="text-sm text-gray-600">Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="card-modern text-center py-16 px-8" style={{ background: 'var(--gradient-hero)' }}>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Connect your wallet and explore available grave plots today.
            Experience the future of cemetery management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/graveyards"
              className="btn-modern bg-white text-primary-700 hover:bg-gray-100 text-lg px-10 py-4 relative z-10 shadow-xl"
            >
              View Available Graves →
            </Link>
            <a
              href="#learn"
              className="btn-modern btn-outline-modern text-lg px-10 py-4"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-serif font-bold mb-4 text-gradient-gold">Cemetery Blockchain</h3>
              <p className="text-gray-400">
                Revolutionary cemetery management powered by Ethereum blockchain technology.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/graveyards" className="hover:text-white transition">Browse Graveyards</Link></li>
                <li><Link to="/my-graves" className="hover:text-white transition">My Graves</Link></li>
                <li><a href="#learn" className="hover:text-white transition">Features</a></li>
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
            <p>© 2025 Cemetery Blockchain. Built with care and blockchain technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Updated Card Component with Image Support
const FeatureCard = ({ icon, title, desc, img }) => (
  <div className="card-modern group overflow-hidden">
    <div className="h-48 overflow-hidden relative">
      <div className="absolute inset-0 bg-primary-900/10 group-hover:bg-transparent transition-colors z-10"></div>
      <img src={img} alt={title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
    </div>
    <div className="p-8">
      <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2 font-serif">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);

// Step Card Component
const StepCard = ({ number, title, description, icon }) => (
  <div className="card-modern text-center relative">
    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-xl">
      {number}
    </div>
    <div className="text-6xl mb-6 mt-4">{icon}</div>
    <h3 className="text-2xl font-serif font-bold mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

// Benefit Item Component
const BenefitItem = ({ icon, title, description }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 flex items-center justify-center text-white font-bold">
      {icon}
    </div>
    <div>
      <h4 className="font-bold text-lg mb-1">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  </div>
);

export default HomePageModern;
