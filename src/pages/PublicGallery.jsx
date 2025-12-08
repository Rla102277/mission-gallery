import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api, { getApiUrl } from '../lib/api';
import { Camera } from 'lucide-react';
import ImageViewer from '../components/ImageViewer';

export default function PublicGallery() {
  const { slug } = useParams();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightroomPhotos, setLightroomPhotos] = useState([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchGallery();
  }, [slug]);

  const fetchGallery = async () => {
    try {
      const response = await api.get(`/api/galleries/public/${slug}`);
      setGallery(response.data);
      
      // Fetch Lightroom photos if this is a Lightroom gallery
      if (response.data.lightroomAlbum) {
        await fetchLightroomPhotos(response.data);
      }
    } catch (error) {
      console.error('Error fetching gallery:', error);
      setError('Gallery not found or is private');
    } finally {
      setLoading(false);
    }
  };

  const fetchLightroomPhotos = async (galleryData) => {
    try {
      const token = localStorage.getItem('adobe_lightroom_token');
      if (!token) return;

      const { catalogId, id: albumId } = galleryData.lightroomAlbum;
      const response = await fetch(
        `https://lr.adobe.io/v2/catalogs/${catalogId}/albums/${albumId}/assets?embed=asset&subtype=image`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-API-Key': import.meta.env.VITE_ADOBE_CLIENT_ID
          }
        }
      );

      let responseText = await response.text();
      if (responseText.trim().startsWith('while')) {
        const firstBrace = responseText.indexOf('{');
        const secondBrace = responseText.indexOf('{', firstBrace + 1);
        if (secondBrace > 0) {
          responseText = responseText.substring(secondBrace);
        }
      }

      const photosData = JSON.parse(responseText);
      const allPhotos = photosData.resources || [];
      
      // Filter to only show visible photos
      const visiblePhotoIds = galleryData.visibleLightroomPhotos || [];
      const visiblePhotos = allPhotos.filter(photo => visiblePhotoIds.includes(photo.id));
      
      setLightroomPhotos(visiblePhotos);
    } catch (error) {
      console.error('Error fetching Lightroom photos:', error);
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
        {lightroomPhotos.length > 0 ? (
          <div className={getGridClass()}>
            {lightroomPhotos.map((photo) => {
              const thumbnailHref = photo.asset?.links?.['/rels/rendition_type/thumbnail2x']?.href;
              const baseUrl = localStorage.getItem('lr_base_url') || `https://lr.adobe.io/v2/catalogs/${gallery.lightroomAlbum.catalogId}/`;
              const lrUrl = thumbnailHref ? `${baseUrl}${thumbnailHref}` : null;
              const thumbnailUrl = lrUrl ? getApiUrl(`/api/adobe/image-proxy?url=${encodeURIComponent(lrUrl)}&token=${localStorage.getItem('adobe_lightroom_token')}`) : null;
              const fileName = photo.asset?.payload?.importSource?.fileName || 'Photo';

              return (
                <div
                  key={photo.id}
                  className="cursor-pointer group"
                  onClick={() => {
                    setCurrentImageIndex(lightroomPhotos.indexOf(photo));
                    setViewerOpen(true);
                  }}
                >
                  <img
                    src={thumbnailUrl}
                    alt={fileName}
                    className={`w-full ${
                      gallery.layout === 'masonry'
                        ? 'mb-4'
                        : gallery.layout === 'slideshow'
                        ? 'max-h-[600px] object-contain'
                        : 'h-64 object-cover'
                    } rounded-lg shadow-md hover:shadow-xl transition-shadow`}
                  />
                </div>
              );
            })}
          </div>
        ) : gallery.images && gallery.images.length > 0 ? (
          <div className={getGridClass()}>
            {gallery.images.map((item) => {
              const image = item.imageId;
              if (!image || !image.isPublic) return null;

              return (
                <div
                  key={image._id}
                  className="cursor-pointer group"
                  onClick={() => {
                    const publicImages = gallery.images.filter(item => item.imageId?.isPublic);
                    setCurrentImageIndex(publicImages.indexOf(item));
                    setViewerOpen(true);
                  }}
                >
                  <img
                    src={image.thumbnailUrl || image.url}
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

      {/* Image Viewer */}
      <ImageViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        images={lightroomPhotos.length > 0 ? lightroomPhotos.map((photo) => {
          // Use larger 2048px rendition for viewer
          const largeHref = photo.asset?.links?.['/rels/rendition_type/2048']?.href;
          const baseUrl = localStorage.getItem('lr_base_url') || `https://lr.adobe.io/v2/catalogs/${gallery?.lightroomAlbum?.catalogId}/`;
          const lrUrl = largeHref ? `${baseUrl}${largeHref}` : null;
          const largeUrl = lrUrl ? getApiUrl(`/api/adobe/image-proxy?url=${encodeURIComponent(lrUrl)}&token=${localStorage.getItem('adobe_lightroom_token')}`) : null;
          
          return {
            url: largeUrl,
            title: photo.asset?.payload?.importSource?.fileName || 'Photo',
            date: photo.asset?.payload?.captureDate ? new Date(photo.asset.payload.captureDate).toLocaleDateString() : null
          };
        }) : gallery?.images?.map((item) => {
          const image = item.imageId;
          return {
            url: image.url,
            title: image.caption || image.filename || 'Photo',
            date: image.uploadDate ? new Date(image.uploadDate).toLocaleDateString() : null
          };
        }).filter(img => img.url) || []}
        currentIndex={currentImageIndex}
        onNavigate={setCurrentImageIndex}
      />

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
