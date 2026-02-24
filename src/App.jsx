import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import PublicGalleries from './pages/PublicGalleries';
import PublicGallery from './pages/PublicGallery';
import AboutMe from './pages/AboutMe';
import PortfolioView from './pages/PortfolioView';

// Original admin/mission pages kept unchanged
import AdminDashboard from './pages/AdminDashboard';
import GalleryView from './pages/GalleryView';
import CreateGallery from './pages/CreateGallery';
import CreateMission from './pages/CreateMissionEnhanced';
import MissionDetail from './pages/MissionDetailEnhanced';
import MissionEdit from './pages/MissionEdit';
import MyGear from './pages/MyGear';
import LightroomTest from './pages/LightroomTest';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="tia-spinner" />
    </div>
  );
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ minHeight: '100vh', background: 'var(--ink)', color: 'var(--cream)' }}>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/galleries" element={<PublicGalleries />} />
            <Route path="/gallery/:slug" element={<PublicGallery />} />
            <Route path="/portfolio/:slug" element={<PortfolioView />} />
            <Route path="/about" element={<AboutMe />} />
            <Route path="/gear" element={<MyGear />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/*" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
            <Route path="/missions/create" element={<PrivateRoute><CreateMission /></PrivateRoute>} />
            <Route path="/missions/:id" element={<PrivateRoute><MissionDetail /></PrivateRoute>} />
            <Route path="/missions/:id/edit" element={<PrivateRoute><MissionEdit /></PrivateRoute>} />
            <Route path="/galleries/create" element={<PrivateRoute><CreateGallery /></PrivateRoute>} />
            <Route path="/galleries/:id" element={<PrivateRoute><GalleryView /></PrivateRoute>} />
            <Route path="/test/lightroom" element={<PrivateRoute><LightroomTest /></PrivateRoute>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
