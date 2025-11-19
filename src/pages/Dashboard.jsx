import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Plus, MapPin, Calendar, Eye, EyeOff, Trash2, Star } from 'lucide-react';

export default function Dashboard() {
  const [missions, setMissions] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [missionsRes, galleriesRes] = await Promise.all([
        api.get('/api/missions'),
        api.get('/api/galleries'),
      ]);
      setMissions(missionsRes.data);
      setGalleries(galleriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteGallery = async (e, galleryId) => {
    e.preventDefault(); // Prevent navigation to gallery
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this gallery?')) {
      return;
    }

    try {
      await api.delete(`/api/galleries/${galleryId}`);
      setGalleries(galleries.filter(g => g._id !== galleryId));
      alert('Gallery deleted successfully!');
    } catch (error) {
      console.error('Error deleting gallery:', error);
      alert('Failed to delete gallery. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link to="/missions/create" className="btn-primary flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>New Mission</span>
        </Link>
      </div>

      {/* Missions Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Your Missions</h2>
        {missions.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">No missions yet. Create your first mission!</p>
            <Link to="/missions/create" className="btn-primary">
              Create Mission
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {missions.map((mission) => (
              <Link
                key={mission._id}
                to={`/missions/${mission._id}`}
                className="card hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">{mission.title}</h3>
                {mission.location && (
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{mission.location}</span>
                  </div>
                )}
                {mission.startDate && (
                  <div className="flex items-center text-gray-600 mb-2">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span className="text-sm">
                      {new Date(mission.startDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <p className="text-gray-600 text-sm line-clamp-2">{mission.description}</p>
                {mission.aiGenerated && (
                  <span className="inline-block mt-2 px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded">
                    AI Generated
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Galleries Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Your Galleries</h2>
        {galleries.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">No galleries yet. Create a mission and add images to create galleries!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleries.map((gallery) => (
              <div key={gallery._id} className="relative group">
                <Link
                  to={`/galleries/${gallery._id}`}
                  className="card hover:shadow-lg transition-shadow block"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold">{gallery.title}</h3>
                    <div className="flex gap-2">
                      {gallery.isPortfolio && (
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      )}
                      {gallery.isPublic ? (
                        <Eye className="h-5 w-5 text-green-600" />
                      ) : (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{gallery.description}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{gallery.images.length} images</span>
                    {gallery.isPortfolio && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">
                        Portfolio
                      </span>
                    )}
                  </div>
                  {gallery.isPublic && gallery.slug && (
                    <div className="mt-2 text-xs text-primary-600">
                      Public URL: /gallery/{gallery.slug}
                    </div>
                  )}
                </Link>
                <button
                  onClick={(e) => deleteGallery(e, gallery._id)}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-all shadow-lg"
                  title="Delete gallery"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
