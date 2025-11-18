import { useState, useEffect } from 'react';
import { Camera, Upload, Link as LinkIcon, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';

function ApplePhotosTest() {
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Check if we're on macOS and can access local files
  const isMacOS = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const supportsFileSystemAccess = 'showDirectoryPicker' in window;

  const connectToPhotosLibrary = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!supportsFileSystemAccess) {
        throw new Error('File System Access API not supported in this browser. Please use Chrome or Edge.');
      }

      // Request access to Photos Library directory
      // On macOS, this is typically ~/Pictures/Photos Library.photoslibrary
      const dirHandle = await window.showDirectoryPicker({
        id: 'photos-library',
        mode: 'read',
        startIn: 'pictures'
      });

      setConnectionStatus('connected');
      
      // Scan for albums (look for folders)
      await scanForAlbums(dirHandle);
      
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Access cancelled by user');
      } else {
        setError(`Failed to connect: ${err.message}`);
      }
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  const scanForAlbums = async (dirHandle) => {
    const foundAlbums = [];
    
    try {
      // Look for Masters or Originals folder
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'directory') {
          foundAlbums.push({
            name: entry.name,
            handle: entry
          });
        }
      }
      
      setAlbums(foundAlbums);
    } catch (err) {
      console.error('Error scanning albums:', err);
      setError('Failed to scan albums');
    }
  };

  const loadPhotosFromAlbum = async (albumHandle) => {
    setLoading(true);
    const foundPhotos = [];

    try {
      for await (const entry of albumHandle.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          
          // Check if it's an image
          if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            foundPhotos.push({
              name: file.name,
              url: url,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified
            });
          }
        }
      }
      
      setPhotos(foundPhotos);
    } catch (err) {
      console.error('Error loading photos:', err);
      setError('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  // Alternative: Use iCloud Photos Web API approach
  const connectToiCloudPhotos = () => {
    setError('iCloud Photos Web API requires authentication. Consider using:');
    // This would require OAuth with Apple and iCloud API access
    window.open('https://www.icloud.com/photos/', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-heritage-canvas-50 via-heritage-sand-50 to-heritage-forest-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-heritage-leather-900 mb-2">
            Apple Photos Integration Test
          </h1>
          <p className="text-heritage-leather-600">
            Connect to your local Photos library or iCloud Photos
          </p>
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
              connectionStatus === 'connected' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-heritage-sand-100 text-heritage-leather-600'
            }`}>
              {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </div>
          </div>

          {/* Browser Compatibility Check */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-2">
              {isMacOS ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              <span className="text-heritage-leather-700">
                macOS Detected: {isMacOS ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {supportsFileSystemAccess ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="text-heritage-leather-700">
                File System Access API: {supportsFileSystemAccess ? 'Supported' : 'Not Supported'}
              </span>
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

          {/* Connection Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={connectToPhotosLibrary}
              disabled={loading || !supportsFileSystemAccess}
              className="flex items-center justify-center space-x-2 px-6 py-4 bg-heritage-forest-600 hover:bg-heritage-forest-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5" />
              <span>Connect to Local Photos Library</span>
            </button>

            <button
              onClick={connectToiCloudPhotos}
              className="flex items-center justify-center space-x-2 px-6 py-4 bg-heritage-brass-600 hover:bg-heritage-brass-700 text-white rounded-lg transition-colors"
            >
              <LinkIcon className="w-5 h-5" />
              <span>Open iCloud Photos</span>
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-heritage-sand-50 border border-heritage-sand-200 rounded-lg p-4">
            <h3 className="font-semibold text-heritage-leather-900 mb-2">
              How This Works:
            </h3>
            <ul className="space-y-2 text-sm text-heritage-leather-700">
              <li className="flex items-start space-x-2">
                <span className="text-heritage-forest-600 font-bold">1.</span>
                <span>
                  <strong>Local Access:</strong> Uses File System Access API to read your Photos Library directly (Chrome/Edge only)
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-heritage-forest-600 font-bold">2.</span>
                <span>
                  <strong>No Upload:</strong> Photos stay on your device, we just create links to them
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-heritage-forest-600 font-bold">3.</span>
                <span>
                  <strong>iCloud Photos:</strong> For cloud access, we'd need Apple OAuth integration (future feature)
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Albums List */}
        {albums.length > 0 && (
          <div className="bg-white border border-heritage-sand-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-heritage-leather-900 mb-4">
              Found Albums/Folders ({albums.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {albums.map((album, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedAlbum(album);
                    loadPhotosFromAlbum(album.handle);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedAlbum?.name === album.name
                      ? 'border-heritage-forest-600 bg-heritage-forest-50'
                      : 'border-heritage-sand-200 hover:border-heritage-sand-300'
                  }`}
                >
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-heritage-forest-600" />
                  <p className="text-sm font-medium text-heritage-leather-900 truncate">
                    {album.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Photos Grid */}
        {photos.length > 0 && (
          <div className="bg-white border border-heritage-sand-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-heritage-leather-900 mb-4">
              Photos in {selectedAlbum?.name} ({photos.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative group rounded-lg overflow-hidden border border-heritage-sand-200 hover:border-heritage-forest-400 transition-all"
                >
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-end">
                    <div className="p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs font-medium truncate">{photo.name}</p>
                      <p className="text-xs opacity-75">
                        {(photo.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Implementation Notes */}
        <div className="mt-8 bg-heritage-canvas-50 border border-heritage-sand-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-heritage-leather-900 mb-4">
            Implementation Options
          </h2>
          <div className="space-y-4 text-heritage-leather-700">
            <div>
              <h3 className="font-semibold text-heritage-leather-900 mb-2">
                Option 1: File System Access API (Current)
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>✅ No upload needed - direct file access</li>
                <li>✅ Works with local Photos Library</li>
                <li>❌ Chrome/Edge only</li>
                <li>❌ Requires manual folder selection each time</li>
                <li>❌ URLs are temporary (blob URLs)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-heritage-leather-900 mb-2">
                Option 2: Apple PhotoKit (Native App)
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>✅ Full Photos library access</li>
                <li>✅ Album metadata, faces, places</li>
                <li>✅ Persistent access</li>
                <li>❌ Requires native macOS/iOS app</li>
                <li>❌ Can't be done in web browser</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-heritage-leather-900 mb-2">
                Option 3: iCloud Photos Web API
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>✅ Access from any device</li>
                <li>✅ Cloud-based, no local storage needed</li>
                <li>❌ Requires Apple OAuth integration</li>
                <li>❌ May have API limitations</li>
                <li>❌ Requires Apple Developer account</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-heritage-leather-900 mb-2">
                Option 4: Hybrid Approach (Recommended)
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>✅ Keep Cloudinary for main storage</li>
                <li>✅ Add "Import from Photos" feature</li>
                <li>✅ Use File System API to browse and select</li>
                <li>✅ Upload selected photos to Cloudinary</li>
                <li>✅ Best of both worlds</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplePhotosTest;
