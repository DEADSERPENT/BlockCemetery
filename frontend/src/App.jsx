import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { lazy, Suspense } from 'react';
import 'react-toastify/dist/ReactToastify.css';

import { Web3Provider } from './context/Web3Context';
import NavbarModern from './components/NavbarModern';

// Lazy load page components for code splitting
const HomePageModern = lazy(() => import('./pages/HomePageModern'));
const GraveyardsPageModern = lazy(() => import('./pages/GraveyardsPageModern'));
const GraveyardDetailPageModern = lazy(() => import('./pages/GraveyardDetailPageModern'));
const MyGravesPageModern = lazy(() => import('./pages/MyGravesPageModern'));
const AdminDashboardModern = lazy(() => import('./pages/AdminDashboardModern'));
const PublicSearchPageModern = lazy(() => import('./pages/PublicSearchPageModern'));
const AnalyticsDashboardModern = lazy(() => import('./pages/AnalyticsDashboardModern'));

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <NavbarModern />
          <main className="flex-1">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomePageModern />} />
                <Route path="/graveyards" element={<GraveyardsPageModern />} />
                <Route path="/graveyards/:id" element={<GraveyardDetailPageModern />} />
                <Route path="/my-graves" element={<MyGravesPageModern />} />
                <Route path="/admin" element={<AdminDashboardModern />} />
                <Route path="/search" element={<PublicSearchPageModern />} />
                <Route path="/analytics" element={<AnalyticsDashboardModern />} />
              </Routes>
            </Suspense>
          </main>
          <ToastContainer position="bottom-right" />
        </div>
      </Router>
    </Web3Provider>
  );
}

export default App;
