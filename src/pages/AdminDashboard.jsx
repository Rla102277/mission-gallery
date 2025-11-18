import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Image as ImageIcon, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Plus,
  Camera,
  Grid,
  ShoppingCart,
  ExternalLink
} from 'lucide-react';

function AdminDashboard() {
  const navigate = useNavigate();
  const [galleries, setGalleries] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('galleries');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [galleriesRes, missionsRes] = await Promise.all([
        axios.get('/api/galleries', { withCredentials: true }),
        axios.get('/api/missions', { withCredentials: true })
      ]);
      setGalleries(galleriesRes.data);
      setMissions(missionsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGallery = async (id) => {
    if (!confirm('Are you sure you want to delete this gallery?')) return;

    try {
      await axios.delete(`/api/galleries/${id}`, { withCredentials: true });
      setGalleries(galleries.filter(g => g._id !== id));
    } catch (error) {
      console.error('Error deleting gallery:', error);
      alert('Failed to delete gallery');
    }
  };

  const handleDeleteMission = async (id) => {
    if (!confirm('Are you sure you want to delete this mission?')) return;

    try {
      await axios.delete(`/api/missions/${id}`, { withCredentials: true });
      setMissions(missions.filter(m => m._id !== id));
    } catch (error) {
      console.error('Error deleting mission:', error);
      alert('Failed to delete mission');
    }
  };

  const toggleGalleryVisibility = async (gallery) => {
    try {
      await axios.put(`/api/galleries/${gallery._id}`, 
        { isPublic: !gallery.isPublic },
        { withCredentials: true }
      );
      setGalleries(galleries.map(g => 
        g._id === gallery._id ? { ...g, isPublic: !g.isPublic } : g
      ));
    } catch (error) {
      console.error('Error updating gallery:', error);
      alert('Failed to update gallery visibility');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 flex items-center justify-center">
        <div className="text-stone-100 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-stone-100 mb-2">Admin Dashboard</h1>
          <p className="text-stone-300">Manage your galleries and missions</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            to="/galleries/create"
            className="bg-amber-600 hover:bg-amber-700 text-white p-6 rounded-lg transition-colors flex items-center justify-between"
          >
            <div>
              <h3 className="text-lg font-semibold mb-1">Create Gallery</h3>
              <p className="text-sm text-amber-100">Curate a new collection</p>
            </div>
            <Plus className="w-8 h-8" />
          </Link>

          <Link
            to="/missions/create"
            className="bg-stone-700 hover:bg-stone-600 text-white p-6 rounded-lg transition-colors flex items-center justify-between"
          >
            <div>
              <h3 className="text-lg font-semibold mb-1">Create Mission</h3>
              <p className="text-sm text-stone-300">Plan a new adventure</p>
            </div>
            <Camera className="w-8 h-8" />
          </Link>

          <div className="bg-stone-800/50 border border-stone-700 text-stone-100 p-6 rounded-lg flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Statistics</h3>
              <p className="text-sm text-stone-400">
                {galleries.length} galleries • {missions.length} missions
              </p>
            </div>
            <Grid className="w-8 h-8 text-amber-500" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-stone-700">
          <button
            onClick={() => setActiveTab('galleries')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'galleries'
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Galleries ({galleries.length})
          </button>
          <button
            onClick={() => setActiveTab('missions')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'missions'
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Missions ({missions.length})
          </button>
        </div>

        {/* Galleries Tab */}
        {activeTab === 'galleries' && (
          <div className="space-y-4">
            {galleries.length === 0 ? (
              <div className="bg-stone-800/50 border border-stone-700 rounded-lg p-12 text-center">
                <ImageIcon className="w-16 h-16 text-stone-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-stone-300 mb-2">No galleries yet</h3>
                <p className="text-stone-400 mb-6">Create your first gallery to get started</p>
                <Link
                  to="/galleries/create"
                  className="inline-flex items-center px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Gallery
                </Link>
              </div>
            ) : (
              galleries.map(gallery => (
                <div
                  key={gallery._id}
                  className="bg-stone-800/50 backdrop-blur-sm border border-stone-700 rounded-lg p-6 hover:border-stone-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-stone-100">
                          {gallery.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          gallery.isPublic
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-stone-600/50 text-stone-400'
                        }`}>
                          {gallery.isPublic ? 'Public' : 'Private'}
                        </span>
                        {gallery.enablePrints && (
                          <span className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-300 flex items-center">
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            Prints Available
                          </span>
                        )}
                      </div>
                      <p className="text-stone-400 mb-3">{gallery.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-stone-500">
                        <span>{gallery.images?.length || 0} images</span>
                        <span>•</span>
                        <span>{gallery.layout} layout</span>
                        {gallery.slug && (
                          <>
                            <span>•</span>
                            <a
                              href={`/gallery/${gallery.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-500 hover:text-amber-400 flex items-center"
                            >
                              View public page
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => toggleGalleryVisibility(gallery)}
                        className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-700 rounded-lg transition-colors"
                        title={gallery.isPublic ? 'Make private' : 'Make public'}
                      >
                        {gallery.isPublic ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => navigate(`/galleries/${gallery._id}/edit`)}
                        className="p-2 text-amber-400 hover:text-amber-300 hover:bg-stone-700 rounded-lg transition-colors"
                        title="Edit gallery"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteGallery(gallery._id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-stone-700 rounded-lg transition-colors"
                        title="Delete gallery"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Missions Tab */}
        {activeTab === 'missions' && (
          <div className="space-y-4">
            {missions.length === 0 ? (
              <div className="bg-stone-800/50 border border-stone-700 rounded-lg p-12 text-center">
                <Camera className="w-16 h-16 text-stone-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-stone-300 mb-2">No missions yet</h3>
                <p className="text-stone-400 mb-6">Create your first mission to get started</p>
                <Link
                  to="/missions/create"
                  className="inline-flex items-center px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Mission
                </Link>
              </div>
            ) : (
              missions.map(mission => (
                <div
                  key={mission._id}
                  className="bg-stone-800/50 backdrop-blur-sm border border-stone-700 rounded-lg p-6 hover:border-stone-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-stone-100 mb-2">
                        {mission.title}
                      </h3>
                      <p className="text-stone-400 mb-3">{mission.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-stone-500">
                        <span>{mission.location}</span>
                        {mission.startDate && (
                          <>
                            <span>•</span>
                            <span>{new Date(mission.startDate).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => navigate(`/missions/${mission._id}`)}
                        className="p-2 text-amber-400 hover:text-amber-300 hover:bg-stone-700 rounded-lg transition-colors"
                        title="View mission"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMission(mission._id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-stone-700 rounded-lg transition-colors"
                        title="Delete mission"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
