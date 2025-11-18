import { useState } from 'react';
import { Camera, Upload, Link as LinkIcon, AlertCircle, CheckCircle, Image as ImageIcon, ExternalLink } from 'lucide-react';

function GooglePhotosTest() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Google OAuth configuration
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_PHOTOS_CLIENT_ID || 'YOUR_CLIENT_ID';
  const REDIRECT_URI = window.location.origin + '/test/google-photos';
  const SCOPES = [
    'https://www.googleapis.com/auth/photoslibrary.readonly',
    'https://www.googleapis.com/auth/photoslibrary.appendonly'
  ].join(' ');

  const authenticateWithGoogle = () => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(SCOPES)}`;
    
    window.location.href = authUrl;
  };

  const handleAuthCallback = () => {
    // Check for access token in URL hash
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    
    if (accessToken) {
      localStorage.setItem('google_photos_token', accessToken);
      setIsAuthenticated(true);
      window.history.replaceState({}, document.title, window.location.pathname);
      loadAlbums(accessToken);
    }
  };

  const loadAlbums = async (token) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load albums');
      }

      const data = await response.json();
      setAlbums(data.albums || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPhotosFromAlbum = async (albumId) => {
    const token = localStorage.getItem('google_photos_token');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          albumId: albumId,
          pageSize: 100
        })
      });

      if (!response.ok) {
        throw new Error('Failed to load photos');
      }

      const data = await response.json();
      setPhotos(data.mediaItems || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadToGooglePhotos = async (files) => {
    const token = localStorage.getItem('google_photos_token');
    setLoading(true);
    setError(null);

    try {
      // Step 1: Upload bytes
      const uploadedTokens = [];
      
      for (const file of files) {
        const uploadResponse = await fetch('https://photoslibrary.googleapis.com/v1/uploads', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/octet-stream',
            'X-Goog-Upload-File-Name': file.name,
            'X-Goog-Upload-Protocol': 'raw'
          },
          body: file
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const uploadToken = await uploadResponse.text();
        uploadedTokens.push({
          description: file.name,
          simpleMediaItem: {
            uploadToken: uploadToken
          }
        });
      }

      // Step 2: Create media items
      const createResponse = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newMediaItems: uploadedTokens
        })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create media items');
      }

      const result = await createResponse.json();
      alert(`Successfully uploaded ${result.newMediaItemResults?.length || 0} photos!`);
      
      // Refresh albums
      loadAlbums(token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      await uploadToGooglePhotos(files);
    }
  };

  // Check for auth callback on mount
  useState(() => {
    handleAuthCallback();
    const token = localStorage.getItem('google_photos_token');
    if (token) {
      setIsAuthenticated(true);
      loadAlbums(token);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-heritage-canvas-50 via-heritage-sand-50 to-heritage-forest-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-heritage-leather-900 mb-2">
            Google Photos Integration Test
          </h1>
          <p className="text-heritage-leather-600">
            Connect to Google Photos - Free, unlimited storage, better API
          </p>
        </div>

        {/* Benefits Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-green-900 mb-3">
            ✨ Why Google Photos is Better:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-green-800">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span><strong>Free Storage:</strong> 15 GB free (vs Cloudinary's 25 GB)</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span><strong>Better API:</strong> Official, well-documented REST API</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span><strong>Direct Links:</strong> Permanent URLs to photos</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span><strong>Already Using It:</strong> Most people already have Google Photos</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span><strong>Smart Features:</strong> Auto-organize, search, face detection</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span><strong>No Vendor Lock-in:</strong> Easy to export if needed</span>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-white border border-heritage-sand-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Camera className="w-6 h-6 text-heritage-forest-600" />
              <h2 className="text-xl font-semibold text-heritage-leather-900">
                Connection Status
              </h2>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isAuthenticated 
                ? 'bg-green-100 text-green-800' 
                : 'bg-heritage-sand-100 text-heritage-leather-600'
            }`}>
              {isAuthenticated ? 'Connected' : 'Not Connected'}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!isAuthenticated ? (
            <div>
              <button
                onClick={authenticateWithGoogle}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-heritage-forest-600 hover:bg-heritage-forest-700 text-white rounded-lg transition-colors"
              >
                <LinkIcon className="w-5 h-5" />
                <span>Connect to Google Photos</span>
              </button>
              
              <div className="mt-4 bg-heritage-sand-50 border border-heritage-sand-200 rounded-lg p-4">
                <h3 className="font-semibold text-heritage-leather-900 mb-2">
                  Setup Required:
                </h3>
                <ol className="space-y-2 text-sm text-heritage-leather-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-heritage-forest-600 font-bold">1.</span>
                    <span>Create Google Cloud Project at <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-heritage-forest-600 underline">console.cloud.google.com</a></span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-heritage-forest-600 font-bold">2.</span>
                    <span>Enable Google Photos Library API</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-heritage-forest-600 font-bold">3.</span>
                    <span>Create OAuth 2.0 credentials (Web application)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-heritage-forest-600 font-bold">4.</span>
                    <span>Add redirect URI: <code className="bg-heritage-sand-100 px-1 rounded">{REDIRECT_URI}</code></span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-heritage-forest-600 font-bold">5.</span>
                    <span>Add Client ID to <code className="bg-heritage-sand-100 px-1 rounded">.env</code> as <code className="bg-heritage-sand-100 px-1 rounded">VITE_GOOGLE_PHOTOS_CLIENT_ID</code></span>
                  </li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-heritage-leather-700">
                  ✅ Connected to Google Photos
                </p>
                <button
                  onClick={() => {
                    localStorage.removeItem('google_photos_token');
                    setIsAuthenticated(false);
                    setAlbums([]);
                    setPhotos([]);
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Disconnect
                </button>
              </div>

              {/* Upload Section */}
              <div className="border-t border-heritage-sand-200 pt-4">
                <h3 className="font-semibold text-heritage-leather-900 mb-3">
                  Upload Photos to Google Photos
                </h3>
                <label className="flex items-center justify-center space-x-2 px-6 py-4 bg-heritage-brass-600 hover:bg-heritage-brass-700 text-white rounded-lg transition-colors cursor-pointer">
                  <Upload className="w-5 h-5" />
                  <span>Select Photos to Upload</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Albums List */}
        {albums.length > 0 && (
          <div className="bg-white border border-heritage-sand-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-heritage-leather-900 mb-4">
              Your Albums ({albums.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {albums.map((album) => (
                <button
                  key={album.id}
                  onClick={() => {
                    setSelectedAlbum(album);
                    loadPhotosFromAlbum(album.id);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedAlbum?.id === album.id
                      ? 'border-heritage-forest-600 bg-heritage-forest-50'
                      : 'border-heritage-sand-200 hover:border-heritage-sand-300'
                  }`}
                >
                  {album.coverPhotoBaseUrl && (
                    <img
                      src={`${album.coverPhotoBaseUrl}=w200-h200-c`}
                      alt={album.title}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  )}
                  <p className="font-medium text-heritage-leather-900 truncate">
                    {album.title}
                  </p>
                  <p className="text-xs text-heritage-leather-600">
                    {album.mediaItemsCount || 0} photos
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Photos Grid */}
        {photos.length > 0 && (
          <div className="bg-white border border-heritage-sand-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-heritage-leather-900">
                Photos in {selectedAlbum?.title} ({photos.length})
              </h2>
              <a
                href={selectedAlbum?.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-heritage-forest-600 hover:text-heritage-forest-700 flex items-center space-x-1"
              >
                <span>View in Google Photos</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group rounded-lg overflow-hidden border border-heritage-sand-200 hover:border-heritage-forest-400 transition-all"
                >
                  <img
                    src={`${photo.baseUrl}=w400-h400`}
                    alt={photo.filename}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-end">
                    <div className="p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity w-full">
                      <p className="text-xs font-medium truncate">{photo.filename}</p>
                      <p className="text-xs opacity-75">
                        {photo.mediaMetadata?.width} × {photo.mediaMetadata?.height}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${photo.baseUrl}=w2048`);
                          alert('URL copied to clipboard!');
                        }}
                        className="mt-2 text-xs bg-white text-heritage-leather-900 px-2 py-1 rounded hover:bg-heritage-sand-100"
                      >
                        Copy URL
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Implementation Guide */}
        <div className="mt-8 bg-heritage-canvas-50 border border-heritage-sand-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-heritage-leather-900 mb-4">
            Implementation Plan
          </h2>
          <div className="space-y-4 text-heritage-leather-700">
            <div>
              <h3 className="font-semibold text-heritage-leather-900 mb-2">
                Phase 1: Replace Cloudinary with Google Photos
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Add Google OAuth to backend</li>
                <li>Replace Cloudinary upload with Google Photos API</li>
                <li>Store Google Photos URLs in database</li>
                <li>Update image display to use Google Photos URLs</li>
                <li>Add URL parameters for size/quality (=w2048, =h1080, etc.)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-heritage-leather-900 mb-2">
                Phase 2: Smart Workflow
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>User organizes photos in Apple Photos "Finished" album</li>
                <li>Export from Apple Photos to local folder</li>
                <li>Upload to Google Photos via Mission Gallery</li>
                <li>Google Photos becomes the source of truth</li>
                <li>Mission Gallery links to Google Photos URLs</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-heritage-leather-900 mb-2">
                Benefits Over Cloudinary
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>✅ Free 15 GB storage (expandable to 100 GB for $1.99/mo)</li>
                <li>✅ Better API with official support</li>
                <li>✅ Automatic backup of all photos</li>
                <li>✅ Smart features (search, face detection, auto-enhance)</li>
                <li>✅ Can access from Google Photos app</li>
                <li>✅ No vendor lock-in</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GooglePhotosTest;
