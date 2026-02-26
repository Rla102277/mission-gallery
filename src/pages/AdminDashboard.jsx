import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
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
  ExternalLink,
  User,
  Settings,
  FlaskConical,
} from 'lucide-react';
import AboutMeEditor from '../components/AboutMeEditor';
import FujifilmRecipeGuide from '../components/FujifilmRecipeGuide';
import GearEditor from '../components/GearEditor';
import LightroomTest from './LightroomTest';
import PortfolioManager from '../components/PortfolioManager';
import MentorEditManager from '../components/MentorEditManager';
import StaticSiteManager from '../components/StaticSiteManager';

function AdminDashboard() {
  const navigate = useNavigate();
  const [galleries, setGalleries] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('galleries');
  const [selectedGalleries, setSelectedGalleries] = useState([]);
  const [selectedMissions, setSelectedMissions] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [galleriesRes, missionsRes] = await Promise.all([
        api.get('/api/galleries'),
        api.get('/api/missions'),
      ]);
      setGalleries(galleriesRes.data);
      setMissions(missionsRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGalleryVisibility = async (gallery) => {
    try {
      await api.put(`/api/galleries/${gallery._id}/visibility`, {
        isPublic: !gallery.isPublic,
      });
      setGalleries((prev) =>
        prev.map((g) => (g._id === gallery._id ? { ...g, isPublic: !g.isPublic } : g))
      );
    } catch (error) {
      console.error('Error updating gallery visibility:', error);
    }
  };

  const handleDeleteGallery = async (galleryId) => {
    if (!window.confirm('Are you sure you want to delete this gallery?')) return;
    try {
      await api.delete(`/api/galleries/${galleryId}`);
      setGalleries((prev) => prev.filter((gallery) => gallery._id !== galleryId));
    } catch (error) {
      console.error('Error deleting gallery:', error);
      alert('Failed to delete gallery. Please try again.');
    }
  };

  const handleBulkDeleteGalleries = async () => {
    if (!window.confirm('Delete selected galleries?')) return;
    try {
      await api.post('/api/galleries/bulk-delete', { ids: selectedGalleries });
      setGalleries((prev) => prev.filter((gallery) => !selectedGalleries.includes(gallery._id)));
      setSelectedGalleries([]);
    } catch (error) {
      console.error('Error deleting galleries:', error);
      alert('Failed to delete selected galleries.');
    }
  };

  const handleDeleteMission = async (missionId) => {
    if (!window.confirm('Are you sure you want to delete this mission?')) return;
    try {
      await api.delete(`/api/missions/${missionId}`);
      setMissions((prev) => prev.filter((mission) => mission._id !== missionId));
    } catch (error) {
      console.error('Error deleting mission:', error);
      alert('Failed to delete mission. Please try again.');
    }
  };

  const handleBulkDeleteMissions = async () => {
    if (!window.confirm('Delete selected missions?')) return;
    try {
      await api.post('/api/missions/bulk-delete', { ids: selectedMissions });
      setMissions((prev) => prev.filter((mission) => !selectedMissions.includes(mission._id)));
      setSelectedMissions([]);
    } catch (error) {
      console.error('Error deleting missions:', error);
      alert('Failed to delete selected missions.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 text-stone-100 flex items-center justify-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-stone-400">Manage your galleries and missions</p>
          </div>
          <div className="flex space-x-4">
            <Link
              to="/galleries/create"
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Gallery
            </Link>
            <Link
              to="/missions/create"
              className="bg-stone-700 hover:bg-stone-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Create Mission
            </Link>
          </div>
        </div>

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

        <div className="flex space-x-4 mb-6 border-b border-stone-700 overflow-x-auto">
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
            onClick={() => setActiveTab('mentor')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'mentor'
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            MentorEdit
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
          <button
            onClick={() => setActiveTab('about')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'about'
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            About Me
          </button>
          <button
            onClick={() => setActiveTab('portfolios')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'portfolios'
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Portfolios
          </button>
          <button
            onClick={() => setActiveTab('static')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'static'
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Static Site
          </button>
          <button
            onClick={() => setActiveTab('gear')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'gear'
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            My Gear
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'recipes'
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Film Recipes
          </button>
          <button
            onClick={() => setActiveTab('experimental')}
            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'experimental'
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            Experimental
          </button>
        </div>

        {activeTab === 'galleries' && (
          <div className="space-y-4">
            {selectedGalleries.length > 0 && (
              <div className="bg-amber-600/20 border border-amber-600 rounded-lg p-4 flex items-center justify-between">
                <span className="text-amber-100">
                  {selectedGalleries.length} {selectedGalleries.length === 1 ? 'gallery' : 'galleries'} selected
                </span>
                <button
                  onClick={handleBulkDeleteGalleries}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </button>
              </div>
            )}
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
              galleries.map((gallery) => (
                <div
                  key={gallery._id}
                  className="bg-stone-800/50 backdrop-blur-sm border border-stone-700 rounded-lg p-6 hover:border-stone-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <input
                      type="checkbox"
                      checked={selectedGalleries.includes(gallery._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGalleries([...selectedGalleries, gallery._id]);
                        } else {
                          setSelectedGalleries(selectedGalleries.filter((id) => id !== gallery._id));
                        }
                      }}
                      className="mt-1 mr-4 w-4 h-4 rounded border-stone-600 bg-stone-700 text-amber-600 focus:ring-amber-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-stone-100">{gallery.title}</h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            gallery.isPublic ? 'bg-green-500/20 text-green-300' : 'bg-stone-600/50 text-stone-400'
                          }`}
                        >
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
                        onClick={() => navigate(`/galleries/${gallery._id}`)}
                        className="p-2 text-amber-400 hover:text-amber-300 hover:bg-stone-700 rounded-lg transition-colors"
                        title="View gallery"
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

        {activeTab === 'about' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-stone-100 mb-2">About Me Editor</h2>
              <p className="text-stone-400">Create and manage your About Me page with AI assistance</p>
            </div>
            <AboutMeEditor />
          </div>
        )}

        {activeTab === 'portfolios' && <PortfolioManager galleries={galleries} />}

        {activeTab === 'static' && <StaticSiteManager />}

        {activeTab === 'gear' && <GearEditor />}

        {activeTab === 'recipes' && <FujifilmRecipeGuide />}

        {activeTab === 'experimental' && (
          <div className="space-y-6">
            <div className="bg-stone-800 rounded-lg p-6 border border-stone-700">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <FlaskConical className="w-6 h-6 text-amber-500" />
                Lightroom Integration (Experimental)
              </h2>
              <p className="text-sm text-stone-400 mb-4">
                Experimental features may require Lightroom OAuth and can change without notice.
              </p>
              <LightroomTest />
            </div>
            <div className="bg-stone-800 rounded-lg p-6 border border-stone-700">
              <h3 className="text-xl font-semibold text-white mb-2">MentorEdit Lightroom Import</h3>
              <p className="text-sm text-stone-400">
                MentorEdit supports Lightroom import from here. Launch MentorEdit to try it.
              </p>
              <Link
                to="/admin?tab=mentor"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
              >
                Go to MentorEdit
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'missions' && (
          <div className="space-y-4">
            {selectedMissions.length > 0 && (
              <div className="bg-amber-600/20 border border-amber-600 rounded-lg p-4 flex items-center justify-between">
                <span className="text-amber-100">
                  {selectedMissions.length} {selectedMissions.length === 1 ? 'mission' : 'missions'} selected
                </span>
                <button
                  onClick={handleBulkDeleteMissions}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </button>
              </div>
            )}
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
              missions.map((mission) => (
                <div
                  key={mission._id}
                  className="bg-stone-800/50 backdrop-blur-sm border border-stone-700 rounded-lg p-6 hover:border-stone-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <input
                      type="checkbox"
                      checked={selectedMissions.includes(mission._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMissions([...selectedMissions, mission._id]);
                        } else {
                          setSelectedMissions(selectedMissions.filter((id) => id !== mission._id));
                        }
                      }}
                      className="mt-1 mr-4 w-4 h-4 rounded border-stone-600 bg-stone-700 text-amber-600 focus:ring-amber-500"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-stone-100 mb-2">{mission.title}</h3>
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
                        onClick={() => navigate(`/missions/${mission._id}/edit`)}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-stone-700 rounded-lg transition-colors"
                        title="Edit mission"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => navigate(`/missions/${mission._id}`)}
                        className="p-2 text-amber-400 hover:text-amber-300 hover:bg-stone-700 rounded-lg transition-colors"
                        title="View mission"
                      >
                        <ExternalLink className="h-5 w-5" />
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

        {activeTab === 'mentor' && <MentorEditManager />}
      </div>
    </div>
  );
}

export default AdminDashboard;
