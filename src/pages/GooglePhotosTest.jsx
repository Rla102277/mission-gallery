import { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader, LogIn, RefreshCw, FolderOpen } from 'lucide-react';

const GOOGLE_PHOTOS_SCOPES = [
  'https://www.googleapis.com/auth/photoslibrary.readonly'
];

export default function GooglePhotosTest() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);

  useEffect(() => {
    // Check if we have a token in localStorage
    const token = localStorage.getItem('google_photos_token');
    if (token) {
      setAccessToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_PHOTOS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const redirectUri = window.location.origin + '/test/google-photos';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(GOOGLE_PHOTOS_SCOPES.join(' '))}&` +
      `prompt=consent`; // Force consent screen to show

    window.location.href = authUrl;
  };

  const checkTokenInfo = async () => {
    if (!accessToken) return;
    
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
      const data = await response.json();
      setTokenInfo(data);
      console.log('Token Info:', data);
      
      // Also test a simple API call
      console.log('Testing Photos API access...');
      const testResponse = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=1', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      console.log('Test API Response Status:', testResponse.status);
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log('Test API Success:', testData);
      } else {
        const errorData = await testResponse.json().catch(() => ({}));
        console.log('Test API Error:', errorData);
      }
    } catch (err) {
      console.error('Error checking token:', err);
    }
  };

  useEffect(() => {
    // Handle OAuth redirect
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      
      if (token) {
        localStorage.setItem('google_photos_token', token);
        setAccessToken(token);
        setIsAuthenticated(true);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const fetchAlbums = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching albums with token:', accessToken.substring(0, 20) + '...');
      const response = await fetch('https://photoslibrary.googleapis.com/v1/albums?pageSize=50', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        
        if (response.status === 403) {
          throw new Error('Access denied. Please ensure:\n1. Google Photos Library API is enabled in Google Cloud Console\n2. You granted the photoslibrary.readonly permission during OAuth');
        }
        throw new Error(`Failed to fetch albums: ${response.statusText} (${response.status})`);
      }

      const data = await response.json();
      setAlbums(data.albums || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching albums:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbumPhotos = async (albumId) => {
    if (!accessToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          albumId: albumId,
          pageSize: 50
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch photos: ${response.statusText}`);
      }

      const data = await response.json();
      setPhotos(data.mediaItems || []);
      setSelectedAlbum(albumId);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching photos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('google_photos_token');
    setAccessToken(null);
    setIsAuthenticated(false);
    setAlbums([]);
    setPhotos([]);
    setSelectedAlbum(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Google Photos Integration Test</h1>
          <p className="text-purple-200">Connect and browse your Google Photos albums</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 rounded-lg p-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Authentication Section */}
        {!isAuthenticated ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl border border-white/20 text-center">
            <ImageIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Connect to Google Photos</h2>
            <p className="text-purple-200 mb-6">
              Authorize access to read your Google Photos albums and images
            </p>
            <button
              onClick={handleGoogleLogin}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-lg flex items-center gap-2 mx-auto"
            >
              <LogIn className="w-5 h-5" />
              Connect Google Photos
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Connected Status */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-white font-medium">Connected to Google Photos</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={checkTokenInfo}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                  >
                    Check Token
                  </button>
                  <button
                    onClick={fetchAlbums}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Load Albums
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
              
              {/* Token Info Display */}
              {tokenInfo && (
                <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                  <h3 className="text-sm font-semibold text-purple-300 mb-2">Token Information</h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-white">
                      <span className="text-purple-200">Scopes:</span> {tokenInfo.scope}
                    </p>
                    <p className="text-white">
                      <span className="text-purple-200">Expires in:</span> {tokenInfo.expires_in} seconds
                    </p>
                    {!tokenInfo.scope?.includes('photoslibrary') && (
                      <p className="text-red-400 mt-2">
                        ⚠️ Missing photoslibrary scope! Click Disconnect and reconnect to grant permission.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Albums List */}
            {albums.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <FolderOpen className="w-6 h-6 text-purple-400" />
                  Your Albums ({albums.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {albums.map((album) => (
                    <button
                      key={album.id}
                      onClick={() => fetchAlbumPhotos(album.id)}
                      className={`bg-white/5 border rounded-lg p-4 hover:bg-white/10 transition-colors text-left ${
                        selectedAlbum === album.id ? 'border-purple-500' : 'border-white/20'
                      }`}
                    >
                      {album.coverPhotoBaseUrl && (
                        <img
                          src={`${album.coverPhotoBaseUrl}=w300-h200-c`}
                          alt={album.title}
                          className="w-full h-32 object-cover rounded mb-3"
                        />
                      )}
                      <h3 className="text-white font-semibold mb-1">{album.title}</h3>
                      <p className="text-purple-200 text-sm">
                        {album.mediaItemsCount || 0} items
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Photos Grid */}
            {photos.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <ImageIcon className="w-6 h-6 text-purple-400" />
                  Photos ({photos.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="bg-white/5 border border-white/20 rounded-lg overflow-hidden">
                      <img
                        src={`${photo.baseUrl}=w400-h400-c`}
                        alt={photo.filename}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-2">
                        <p className="text-white text-sm truncate">{photo.filename}</p>
                        <p className="text-purple-200 text-xs">
                          {photo.mediaMetadata?.width} × {photo.mediaMetadata?.height}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 shadow-2xl border border-white/20 text-center">
                <Loader className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                <p className="text-white">Loading...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && albums.length === 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 shadow-2xl border border-white/20 text-center">
                <FolderOpen className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
                <p className="text-white mb-4">No albums loaded yet</p>
                <button
                  onClick={fetchAlbums}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className="w-5 h-5" />
                  Load Albums
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
