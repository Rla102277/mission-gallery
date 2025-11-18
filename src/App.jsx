import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateMission from './pages/CreateMissionEnhanced';
import MissionDetail from './pages/MissionDetailEnhanced';
import GalleryView from './pages/GalleryView';
import PublicGallery from './pages/PublicGallery';
import AboutMe from './pages/AboutMe';
import CreateGallery from './pages/CreateGallery';
import AdminDashboard from './pages/AdminDashboard';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/missions/create" element={
              <PrivateRoute>
                <CreateMission />
              </PrivateRoute>
            } />
            <Route path="/missions/:id" element={
              <PrivateRoute>
                <MissionDetail />
              </PrivateRoute>
            } />
            <Route path="/galleries/:id" element={
              <PrivateRoute>
                <GalleryView />
              </PrivateRoute>
            } />
            <Route path="/gallery/:slug" element={<PublicGallery />} />
            <Route path="/about" element={
              <PrivateRoute>
                <AboutMe />
              </PrivateRoute>
            } />
            <Route path="/admin" element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            } />
            <Route path="/galleries/create" element={
              <PrivateRoute>
                <CreateGallery />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
