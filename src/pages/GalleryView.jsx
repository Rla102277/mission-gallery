import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, Layout, Grid, Columns, Save, Share2 } from 'lucide-react';

export default function GalleryView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [layoutType, setLayoutType] = useState('grid');

  useEffect(() => {
    fetchGallery();
  }, [id]);

  const fetchGallery = async () => {
    try {
      const response = await axios.get(`/api/galleries/${id}`, { withCredentials: true });
      setGallery(response.data);
      setLayoutType(response.data.layout || 'grid');
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePublic = async () => {
    try {
      const response = await axios.put(
        `/api/galleries/${id}`,
        { isPublic: !gallery.isPublic },
        { withCredentials: true }
      );
      setGallery(response.data);
    } catch (error) {
      console.error('Error updating gallery:', error);
    }
  };

  const updateLayout = async () => {
    try {
      const response = await axios.put(
        `/api/galleries/${id}`,
        { layout: layoutType },
        { withCredentials: true }
      );
      setGallery(response.data);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating layout:', error);
    }
  };

  const removeImage = async (imageId) => {
    try {
      await axios.delete(`/api/galleries/${id}/images/${imageId}`, { withCredentials: true });
      setGallery({
        ...gallery,
        images: gallery.images.filter((img) => img.imageId._id !== imageId),
      });
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  const copyPublicLink = () => {
    if (gallery.slug) {
      const url = `${window.location.origin}/gallery/${gallery.slug}`;
      navigator.clipboard.writeText(url);
      alert('Public link copied to clipboard!');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!gallery) {
    return <div className="flex items-center justify-center min-h-screen">Gallery not found</div>;
  }

  const getGridClass = () => {
    switch (layoutType) {
      case 'masonry':
        return 'columns-2 md:columns-3 lg:columns-4 gap-4';
      case 'grid':
        return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';
      case 'slideshow':
        return 'flex flex-col items-center space-y-4';
      default:
        return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Gallery Header */}
      <div className="card mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{gallery.title}</h1>
            {gallery.description && <p className="text-gray-600">{gallery.description}</p>}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={togglePublic}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                gallery.isPublic
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {gallery.isPublic ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              <span>{gallery.isPublic ? 'Public' : 'Private'}</span>
            </button>
            {gallery.isPublic && gallery.slug && (
              <button
                onClick={copyPublicLink}
                className="flex items-center space-x-2 btn-primary"
              >
                <Share2 className="h-5 w-5" />
                <span>Share</span>
              </button>
            )}
          </div>
        </div>

        {/* Layout Controls */}
        <div className="flex items-center space-x-4 pt-4 border-t">
          <span className="text-sm font-medium">Layout:</span>
          <button
            onClick={() => {
              setLayoutType('grid');
              setEditMode(true);
            }}
            className={`p-2 rounded ${layoutType === 'grid' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'}`}
            title="Grid"
          >
            <Grid className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              setLayoutType('masonry');
              setEditMode(true);
            }}
            className={`p-2 rounded ${layoutType === 'masonry' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'}`}
            title="Masonry"
          >
            <Columns className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              setLayoutType('slideshow');
              setEditMode(true);
            }}
            className={`p-2 rounded ${layoutType === 'slideshow' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'}`}
            title="Slideshow"
          >
            <Layout className="h-5 w-5" />
          </button>
          {editMode && (
            <button onClick={updateLayout} className="btn-primary flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>Save Layout</span>
            </button>
          )}
        </div>
      </div>

      {/* Gallery Images */}
      {gallery.images && gallery.images.length > 0 ? (
        <div className={getGridClass()}>
          {gallery.images.map((item) => {
            const image = item.imageId;
            if (!image) return null;

            return (
              <div key={image._id} className="relative group">
                <img
                  src={`/${image.path}`}
                  alt={image.caption || 'Gallery image'}
                  className={`w-full ${
                    layoutType === 'masonry' ? 'mb-4' : 'h-64 object-cover'
                  } rounded-lg`}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                  <button
                    onClick={() => removeImage(image._id)}
                    className="opacity-0 group-hover:opacity-100 bg-white px-4 py-2 rounded-lg hover:bg-gray-100"
                  >
                    Remove
                  </button>
                </div>
                {!image.isPublic && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                    Private
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-600">No images in this gallery yet.</p>
        </div>
      )}
    </div>
  );
}
