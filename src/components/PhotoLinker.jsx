import { useState, useEffect } from 'react';
import { X, Check, Image as ImageIcon } from 'lucide-react';
import api, { getApiUrl } from '../lib/api';

export default function PhotoLinker({ missionId, ideaId, linkedPhotos = [], lightroomPhotoIds = [], onClose, onUpdate }) {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [lightroomPhotos, setLightroomPhotos] = useState([]);
  const [selectedImages, setSelectedImages] = useState([...linkedPhotos]);
  const [selectedLrPhotos, setSelectedLrPhotos] = useState([...lightroomPhotoIds]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('uploaded');

  useEffect(() => {
    fetchPhotos();
  }, [missionId]);

  const fetchPhotos = async () => {
    try {
      // Fetch uploaded images for this mission
      const imagesRes = await api.get(`/api/images/mission/${missionId}`);
      setUploadedImages(imagesRes.data);

      // Fetch mission to get Lightroom album
      const missionRes = await api.get(`/api/missions/${missionId}`);
      
      if (missionRes.data.lightroomAlbum) {
        // Fetch Lightroom photos
        const token = localStorage.getItem('adobe_lightroom_token');
        const baseUrl = localStorage.getItem('lr_base_url');
        
        if (token && baseUrl) {
          const lrRes = await api.get(
            `${baseUrl}/assets?album=${missionRes.data.lightroomAlbum.id}`,
            {
              headers: { 'Authorization': `Bearer ${token}` },
              withCredentials: true
            }
          );
          setLightroomPhotos(lrRes.data.resources || []);
        }
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleImage = (imageId) => {
    setSelectedImages(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const toggleLrPhoto = (photoId) => {
    setSelectedLrPhotos(prev =>
      prev.includes(photoId)
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleSave = async () => {
    try {
      await api.post(
        `/api/missions/${missionId}/ideas/${ideaId}/link-photos`,
        {
          imageIds: selectedImages,
          lightroomPhotoIds: selectedLrPhotos
        },
        { withCredentials: true }
      );
      
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error linking photos:', error);
      alert('Failed to link photos');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Link Photos to Mission Idea</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('uploaded')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'uploaded'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Uploaded Photos ({uploadedImages.length})
            </button>
            <button
              onClick={() => setActiveTab('lightroom')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'lightroom'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Lightroom Photos ({lightroomPhotos.length})
            </button>
          </div>
        </div>

        {/* Photo Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading photos...</div>
            </div>
          ) : (
            <>
              {activeTab === 'uploaded' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {uploadedImages.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No uploaded photos yet</p>
                    </div>
                  ) : (
                    uploadedImages.map(image => (
                      <button
                        key={image._id}
                        onClick={() => toggleImage(image._id)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-4 transition-all ${
                          selectedImages.includes(image._id)
                            ? 'border-blue-500 shadow-lg'
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={image.url}
                          alt={image.title}
                          className="w-full h-full object-cover"
                        />
                        {selectedImages.includes(image._id) && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'lightroom' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {lightroomPhotos.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No Lightroom album linked</p>
                      <p className="text-sm mt-2">Link a Lightroom album to select photos</p>
                    </div>
                  ) : (
                    lightroomPhotos.map(photo => {
                      const thumbnail = photo.links?.['/rels/thumbnail_2048']?.href;
                      return (
                        <button
                          key={photo.id}
                          onClick={() => toggleLrPhoto(photo.id)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-4 transition-all ${
                            selectedLrPhotos.includes(photo.id)
                              ? 'border-blue-500 shadow-lg'
                              : 'border-transparent hover:border-gray-300'
                          }`}
                        >
                          {thumbnail && (
                            <img
                              src={getApiUrl(`/api/adobe/image-proxy?url=${encodeURIComponent(thumbnail)}&token=${localStorage.getItem('adobe_lightroom_token')}`)}
                              alt="Lightroom photo"
                              className="w-full h-full object-cover"
                            />
                          )}
                          {selectedLrPhotos.includes(photo.id) && (
                            <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedImages.length + selectedLrPhotos.length} photo(s) selected
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Link Photos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
