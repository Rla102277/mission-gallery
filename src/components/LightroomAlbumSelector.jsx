import { useState, useEffect } from 'react';
import { Camera, Loader, LogIn, FolderOpen, Check, Plus } from 'lucide-react';

export default function LightroomAlbumSelector({ onSelect, selectedAlbumId, allowCreate = false, missionTitle = '' }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adobe_lightroom_token');
    if (token) {
      setAccessToken(token);
      setIsAuthenticated(true);
      loadAlbums(token);
    }
    
    // Pre-fill album name with mission title if provided
    if (missionTitle && !newAlbumName) {
      setNewAlbumName(missionTitle);
    }
  }, [missionTitle]);

  const loadAlbums = async (token) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get account
      const accountResponse = await fetch('https://lr.adobe.io/v2/account', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': import.meta.env.VITE_ADOBE_CLIENT_ID
        }
      });

      let accountText = await accountResponse.text();
      if (accountText.trim().startsWith('while')) {
        const firstBrace = accountText.indexOf('{');
        const secondBrace = accountText.indexOf('{', firstBrace + 1);
        if (secondBrace > 0) {
          accountText = accountText.substring(secondBrace);
        }
      }
      const accountData = JSON.parse(accountText);

      // Get catalog
      const catalogResponse = await fetch('https://lr.adobe.io/v2/catalog', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': import.meta.env.VITE_ADOBE_CLIENT_ID
        }
      });

      let catalogText = await catalogResponse.text();
      if (catalogText.trim().startsWith('while')) {
        const firstBrace = catalogText.indexOf('{');
        const secondBrace = catalogText.indexOf('{', firstBrace + 1);
        if (secondBrace > 0) {
          catalogText = catalogText.substring(secondBrace);
        }
      }
      const catalogData = JSON.parse(catalogText);
      
      // Store catalog ID for later use
      localStorage.setItem('lr_catalog_id', catalogData.id);

      // Get albums
      const albumsResponse = await fetch(`https://lr.adobe.io/v2/catalogs/${catalogData.id}/albums`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': import.meta.env.VITE_ADOBE_CLIENT_ID
        }
      });

      let albumsText = await albumsResponse.text();
      if (albumsText.trim().startsWith('while')) {
        const firstBrace = albumsText.indexOf('{');
        const secondBrace = albumsText.indexOf('{', firstBrace + 1);
        if (secondBrace > 0) {
          albumsText = albumsText.substring(secondBrace);
        }
      }
      const albumsData = JSON.parse(albumsText);
      setAlbums(albumsData.resources || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading albums:', err);
    } finally {
      setLoading(false);
    }
  };

  const createAlbum = async () => {
    if (!newAlbumName.trim()) {
      alert('Please enter an album name');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const catalogId = localStorage.getItem('lr_catalog_id');
      if (!catalogId) {
        throw new Error('Catalog ID not found. Please reconnect to Lightroom.');
      }

      const response = await fetch(`https://lr.adobe.io/v2/catalogs/${catalogId}/albums`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-API-Key': import.meta.env.VITE_ADOBE_CLIENT_ID,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subtype: 'collection',
          payload: {
            name: newAlbumName.trim(),
            userCreated: new Date().toISOString(),
            userUpdated: new Date().toISOString()
          }
        })
      });

      let responseText = await response.text();
      if (responseText.trim().startsWith('while')) {
        const firstBrace = responseText.indexOf('{');
        const secondBrace = responseText.indexOf('{', firstBrace + 1);
        if (secondBrace > 0) {
          responseText = responseText.substring(secondBrace);
        }
      }

      if (!response.ok) {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.message || 'Failed to create album');
      }

      const newAlbum = JSON.parse(responseText);
      
      // Add to albums list and select it
      setAlbums([newAlbum, ...albums]);
      onSelect(newAlbum);
      setNewAlbumName('');
      setCreating(false);
      
      alert(`Album "${newAlbumName}" created successfully in Lightroom!`);
    } catch (err) {
      setError(err.message);
      console.error('Error creating album:', err);
      setCreating(false);
    }
  };

  const handleConnect = () => {
    window.open('https://localhost:5173/test/lightroom', '_blank');
    alert('Please connect to Lightroom in the new tab, then come back here and refresh.');
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-stone-800 rounded-lg p-6 border border-stone-700">
        <div className="text-center">
          <Camera className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-stone-100 mb-2">Connect to Adobe Lightroom</h3>
          <p className="text-stone-400 text-sm mb-4">
            Link your Lightroom albums to this gallery
          </p>
          <button
            onClick={handleConnect}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <LogIn className="w-4 h-4" />
            Connect Lightroom
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-stone-800 rounded-lg p-6 border border-stone-700">
        <div className="text-center">
          <Loader className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
          <p className="text-stone-400">Loading Lightroom albums...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-stone-800 rounded-lg p-6 border border-stone-700">
        <div className="text-center">
          <p className="text-red-400 mb-3">{error}</p>
          <button
            onClick={() => loadAlbums(accessToken)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-800 rounded-lg p-6 border border-stone-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-stone-100 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-amber-500" />
          Select Lightroom Album
        </h3>
        <span className="text-sm text-stone-400">{albums.length} albums</span>
      </div>

      {/* Create New Album */}
      {allowCreate && (
        <div className="mb-4 p-4 bg-stone-900/50 border border-stone-700 rounded-lg">
          <h4 className="text-sm font-semibold text-stone-200 mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-500" />
            Create New Album in Lightroom
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              placeholder="Album name..."
              className="flex-1 px-3 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              onKeyPress={(e) => e.key === 'Enter' && createAlbum()}
            />
            <button
              onClick={createAlbum}
              disabled={creating || !newAlbumName.trim()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-700 disabled:text-stone-500 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {creating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {albums.length === 0 && !allowCreate ? (
        <p className="text-stone-400 text-center py-4">No albums found</p>
      ) : albums.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {albums.map((album) => (
            <button
              key={album.id}
              onClick={() => onSelect(album)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedAlbumId === album.id
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-stone-700 hover:border-stone-600 bg-stone-900/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-stone-100 mb-1">
                    {album.payload?.name || 'Untitled Album'}
                  </h4>
                  <p className="text-xs text-stone-400">
                    {album.payload?.userUpdated ? new Date(album.payload.userUpdated).toLocaleDateString() : 'No date'}
                  </p>
                </div>
                {selectedAlbumId === album.id && (
                  <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
