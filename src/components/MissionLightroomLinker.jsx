import { useState, useEffect } from 'react';
import { X, FolderOpen, Check, Camera } from 'lucide-react';
import api from '../lib/api';

export default function MissionLightroomLinker({ missionId, onClose, onLinked }) {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      const catalogId = localStorage.getItem('lr_catalog_id');
      const token = localStorage.getItem('adobe_lightroom_token');
      const baseUrl = localStorage.getItem('lr_base_url');

      if (!catalogId || !token || !baseUrl) {
        alert('Please connect to Lightroom first (Admin → Lightroom tab)');
        onClose();
        return;
      }

      const response = await fetch(`${baseUrl}/albums`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': import.meta.env.VITE_ADOBE_CLIENT_ID || process.env.VITE_ADOBE_CLIENT_ID || process.env.ADOBE_CLIENT_ID,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Lightroom API error: ${response.status}`);
      }

      const data = await response.json();
      setAlbums(data.resources || []);
    } catch (error) {
      console.error('Error fetching albums:', error);
      alert('Failed to fetch Lightroom albums');
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    if (!selectedAlbum) return;

    try {
      const catalogId = localStorage.getItem('lr_catalog_id');
      
      await api.post(
        `/api/missions/${missionId}/link-lightroom`,
        {
          albumId: selectedAlbum.id,
          albumName: selectedAlbum.payload?.name || 'Untitled Album',
          catalogId: catalogId
        }
      );

      onLinked();
      onClose();
    } catch (error) {
      console.error('Error linking album:', error);
      alert('Failed to link Lightroom album');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-amber-600" />
            <h2 className="text-2xl font-bold text-gray-900">Link Lightroom Album</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Album List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading albums...</div>
            </div>
          ) : albums.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No Lightroom albums found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {albums.map(album => (
                <button
                  key={album.id}
                  onClick={() => setSelectedAlbum(album)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedAlbum?.id === album.id
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {album.payload?.name || 'Untitled Album'}
                      </h3>
                      {album.payload?.created && (
                        <p className="text-sm text-gray-500">
                          Created: {new Date(album.payload.created).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {selectedAlbum?.id === album.id && (
                      <Check className="w-6 h-6 text-amber-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleLink}
            disabled={!selectedAlbum}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Link Album
          </button>
        </div>
      </div>
    </div>
  );
}
