import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import PublicGalleries from './pages/PublicGalleries';
import PublicGallery from './pages/PublicGallery';
import AboutMe from './pages/AboutMe';
import MyGear from './pages/MyGear';
import AdminDashboard from './pages/AdminDashboard';
import GalleryView from './pages/GalleryView';
import CreateGallery from './pages/CreateGallery';
import CreateMission from './pages/CreateMissionEnhanced';
import MissionDetail from './pages/MissionDetailEnhanced';
import MissionEdit from './pages/MissionEdit';
import LightroomTest from './pages/LightroomTest';

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
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/galleries" element={<PublicGalleries />} />
            <Route path="/gallery/:slug" element={<PublicGallery />} />
            <Route path="/about" element={<AboutMe />} />
            <Route path="/gear" element={<MyGear />} />
            
            {/* Auth */}
            <Route path="/login" element={<Login />} />
            
            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <PrivateRoute>
                <AdminDashboard />
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
            <Route path="/missions/:id/edit" element={
              <PrivateRoute>
                <MissionEdit />
              </PrivateRoute>
            } />
            <Route path="/galleries/create" element={
              <PrivateRoute>
                <CreateGallery />
              </PrivateRoute>
            } />
            <Route path="/galleries/:id" element={
              <PrivateRoute>
                <GalleryView />
              </PrivateRoute>
            } />
            <Route path="/test/lightroom" element={
              <PrivateRoute>
                <LightroomTest />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
