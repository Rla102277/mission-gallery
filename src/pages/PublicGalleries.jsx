import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Camera, Eye, Calendar } from 'lucide-react';

export default function PublicGalleries() {
  const navigate = useNavigate();
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicGalleries();
  }, []);

  const fetchPublicGalleries = async () => {
    try {
      const response = await axios.get('/api/galleries/public/all');
      setGalleries(response.data);
    } catch (error) {
      console.error('Error fetching galleries:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Camera className="w-16 h-16 text-amber-500 animate-pulse mx-auto mb-4" />
          <p className="text-stone-600">Loading galleries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900">
      {/* Hero Section */}
      <div className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Camera className="w-16 h-16 text-amber-500 mx-auto mb-6" />
          <h1 className="text-5xl md:text-6xl font-bold text-stone-100 mb-4">
            Photo Galleries
          </h1>
          <p className="text-xl text-stone-300 max-w-2xl mx-auto">
            Explore curated collections from my photography adventures
          </p>
        </div>
      </div>

      {/* Galleries Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        {galleries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-stone-400 text-lg">No public galleries yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {galleries.map((gallery) => (
              <div
                key={gallery._id}
                onClick={() => navigate(`/gallery/${gallery.slug}`)}
                className="group cursor-pointer bg-stone-800/50 backdrop-blur-sm border border-stone-700 rounded-lg overflow-hidden hover:border-amber-500 transition-all duration-300 hover:transform hover:scale-105"
              >
                {/* Gallery Preview Image */}
                <div className="relative h-64 bg-stone-900 overflow-hidden">
                  {gallery.images && gallery.images[0] ? (
                    <img
                      src={`/${gallery.images[0].imageId?.path}`}
                      alt={gallery.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-16 h-16 text-stone-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Image Count Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full text-white text-sm flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    {gallery.lightroomAlbum ? 'Lightroom' : `${gallery.images?.length || 0} photos`}
                  </div>
                </div>

                {/* Gallery Info */}
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-stone-100 mb-2 group-hover:text-amber-400 transition-colors">
                    {gallery.title}
                  </h3>
                  {gallery.description && (
                    <p className="text-stone-400 mb-4 line-clamp-2">
                      {gallery.description}
                    </p>
                  )}
                  <div className="flex items-center text-stone-500 text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(gallery.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
