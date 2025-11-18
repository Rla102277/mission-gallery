import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Camera } from 'lucide-react';

export default function PublicGallery() {
  const { slug } = useParams();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchGallery();
  }, [slug]);

  const fetchGallery = async () => {
    try {
      const response = await axios.get(`/api/galleries/public/${slug}`);
      setGallery(response.data);
    } catch (error) {
      console.error('Error fetching gallery:', error);
      setError('Gallery not found or is private');
    } finally {
      setLoading(false);
    }
  };

  const getGridClass = () => {
    const layout = gallery?.layout || 'grid';
    switch (layout) {
      case 'masonry':
        return 'columns-2 md:columns-3 lg:columns-4 gap-4';
      case 'grid':
        return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';
      case 'slideshow':
        return 'flex flex-col items-center space-y-4 max-w-4xl mx-auto';
      default:
        return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading gallery...</div>
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Camera className="h-16 w-16 text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Gallery Not Found</h1>
        <p className="text-gray-600">{error || 'This gallery does not exist or is private.'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold mb-2">{gallery.title}</h1>
          {gallery.description && (
            <p className="text-xl text-gray-600">{gallery.description}</p>
          )}
          {gallery.missionId && (
            <p className="text-sm text-gray-500 mt-2">
              Mission: {gallery.missionId.title}
              {gallery.missionId.location && ` • ${gallery.missionId.location}`}
            </p>
          )}
        </div>
      </div>

      {/* Gallery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {gallery.images && gallery.images.length > 0 ? (
          <div className={getGridClass()}>
            {gallery.images.map((item) => {
              const image = item.imageId;
              if (!image || !image.isPublic) return null;

              return (
                <div
                  key={image._id}
                  className="cursor-pointer group"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={`/${image.path}`}
                    alt={image.caption || 'Gallery image'}
                    className={`w-full ${
                      gallery.layout === 'masonry'
                        ? 'mb-4'
                        : gallery.layout === 'slideshow'
                        ? 'max-h-[600px] object-contain'
                        : 'h-64 object-cover'
                    } rounded-lg shadow-md hover:shadow-xl transition-shadow`}
                  />
                  {image.caption && (
                    <p className="mt-2 text-sm text-gray-600 text-center">{image.caption}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No public images in this gallery yet.</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-7xl max-h-full">
            <img
              src={`/${selectedImage.path}`}
              alt={selectedImage.caption || 'Gallery image'}
              className="max-w-full max-h-[90vh] object-contain"
            />
            {selectedImage.caption && (
              <p className="text-white text-center mt-4 text-lg">{selectedImage.caption}</p>
            )}
          </div>
          <button
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
            onClick={() => setSelectedImage(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-gray-600">
            Powered by <span className="font-semibold">Mission Gallery</span>
          </p>
        </div>
      </div>
    </div>
  );
}
