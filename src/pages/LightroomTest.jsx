import { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader, LogIn, RefreshCw, FolderOpen, ExternalLink, Link as LinkIcon } from 'lucide-react';
import api, { getApiUrl } from '../lib/api';
import {
  saveLightroomAuth,
  getValidLightroomAccessToken,
  clearLightroomAuth,
  getLightroomMetadata,
  setLightroomCatalogInfo,
  saveLightroomMetadata,
} from '../lib/lightroomAuth';

// Adobe IMS (Identity Management Services) configuration
const ADOBE_IMS_CONFIG = {
  scopes: 'openid,AdobeID,lr_partner_apis,lr_partner_rendition_apis',
  redirectUri: window.location.origin + '/test/lightroom' // Will be https://localhost:5173/test/lightroom
};

export default function LightroomTest() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [catalogs, setCatalogs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [adobeClientId, setAdobeClientId] = useState(import.meta.env.VITE_ADOBE_CLIENT_ID || '');

  const resolveAdobeClientId = async () => {
    if (adobeClientId) return adobeClientId;

    try {
      const response = await fetch(getApiUrl('/api/adobe/config'), { credentials: 'include' });
      if (!response.ok) return '';
      const data = await response.json();
      if (data?.clientId) {
        setAdobeClientId(data.clientId);
        return data.clientId;
      }
      return '';
    } catch {
      return '';
    }
  };
  
  // Simple gallery link management (Option A)
  const [galleryLinks, setGalleryLinks] = useState([]);
  const [newGalleryLink, setNewGalleryLink] = useState('');
  const [newGalleryTitle, setNewGalleryTitle] = useState('');

  useEffect(() => {
    const initializeAuth = async () => {
      const token = await getValidLightroomAccessToken();
      if (token) {
        setAccessToken(token);
        setIsAuthenticated(true);
        const metadata = getLightroomMetadata();
        if (metadata?.catalogId) {
          setSelectedCatalog(metadata.catalogId);
        }
      }
    };

    initializeAuth();

    // Load saved gallery links
    const savedLinks = localStorage.getItem('lightroom_gallery_links');
    if (savedLinks) {
      setGalleryLinks(JSON.parse(savedLinks));
    }

    const loadAdobeConfig = async () => {
      try {
        const response = await fetch(getApiUrl('/api/adobe/config'), { credentials: 'include' });
        if (!response.ok) return;
        const data = await response.json();
        if (data?.clientId) {
          setAdobeClientId(data.clientId);
        }
      } catch {
        // keep env/local fallback if backend config is unavailable
      }
    };

    loadAdobeConfig();
  }, []);

  const handleAdobeLogin = async () => {
    const { scopes, redirectUri } = ADOBE_IMS_CONFIG;
    const clientId = await resolveAdobeClientId();
    
    console.log('Adobe Client ID:', clientId);
    console.log('Redirect URI:', redirectUri);
    console.log('Scopes:', scopes);
    
    if (!clientId) {
      setError('Adobe Lightroom is not configured on backend. Set ADOBE_CLIENT_ID and ADOBE_CLIENT_SECRET on your backend service.');
      alert('Adobe Lightroom is not configured on backend. Set ADOBE_CLIENT_ID and ADOBE_CLIENT_SECRET in Render env, then redeploy backend.');
      return;
    }
    
    const authUrl = `https://ims-na1.adobelogin.com/ims/authorize/v2?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` + // Changed from 'token' to 'code'
      `scope=${encodeURIComponent(scopes)}`;

    console.log('Auth URL:', authUrl);
    window.location.href = authUrl;
  };

  useEffect(() => {
    // Handle OAuth redirect with authorization code
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
      setError(`OAuth error: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    
    if (code) {
      // Exchange code for access token
      exchangeCodeForToken(code);
    }
  }, []);

  const exchangeCodeForToken = async (code) => {
    setLoading(true);
    try {
      console.log('Exchanging code for token:', code.substring(0, 20) + '...');
      const response = await api.post('/api/adobe/token', {
        code,
        redirectUri: ADOBE_IMS_CONFIG.redirectUri,
      });

      const data = response.data;
      console.log('Token exchange response:', data);

      saveLightroomAuth(data);
      setAccessToken(data.access_token);
      setIsAuthenticated(true);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      setError(err.message);
      console.error('Token exchange error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalogs = async () => {
    const token = await getValidLightroomAccessToken();
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Try to get account info first
      const accountResponse = await fetch('https://lr.adobe.io/v2/account', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': adobeClientId
        }
      });

      // Adobe returns response with while(1); prefix for security
      let accountText = await accountResponse.text();
      console.log('Raw account response:', accountText.substring(0, 100));
      
      if (!accountResponse.ok) {
        console.error('Account API Error:', accountText);
        throw new Error(`Failed to fetch account: ${accountResponse.statusText} (${accountResponse.status})`);
      }
      
      // Remove while(1); or while (1) {} prefix if present
      if (accountText.trim().startsWith('while')) {
        // Adobe sends: while (1) {}\n{actual json}
        // Find the second { which is the start of the real JSON
        const firstBrace = accountText.indexOf('{');
        const secondBrace = accountText.indexOf('{', firstBrace + 1);
        if (secondBrace > 0) {
          accountText = accountText.substring(secondBrace);
        }
      }
      
      console.log('Cleaned account text:', accountText.substring(0, 200));
      const accountData = JSON.parse(accountText);
      console.log('Account data:', accountData);
      
      // Now fetch the actual catalog
      const catalogResponse = await fetch('https://lr.adobe.io/v2/catalog', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': adobeClientId
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
      console.log('Catalog data:', catalogData);
      
      if (catalogData.id) {
        setLightroomCatalogInfo({ catalogId: catalogData.id, baseUrl: catalogData.base });
        setCatalogs([{ 
          id: catalogData.id, 
          name: catalogData.payload?.name || 'My Lightroom Catalog' 
        }]);
        // Auto-fetch albums for this catalog
        fetchAlbums(catalogData.id);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching catalogs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbums = async (catalogId) => {
    const token = await getValidLightroomAccessToken();
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use the catalog-based albums endpoint
      const response = await fetch(`https://lr.adobe.io/v2/catalogs/${catalogId}/albums`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': adobeClientId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch albums: ${response.statusText}`);
      }

      let responseText = await response.text();
      if (responseText.trim().startsWith('while')) {
        const firstBrace = responseText.indexOf('{');
        const secondBrace = responseText.indexOf('{', firstBrace + 1);
        if (secondBrace > 0) {
          responseText = responseText.substring(secondBrace);
        }
      }
      
      const data = JSON.parse(responseText);
      setAlbums(data.resources || []);
      setSelectedCatalog(catalogId);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching albums:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbumPhotos = async (catalogId, albumId) => {
    const token = await getValidLightroomAccessToken();
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Request assets with embed=asset to get full asset details including renditions
      const response = await fetch(`https://lr.adobe.io/v2/catalogs/${catalogId}/albums/${albumId}/assets?embed=asset`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': adobeClientId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch photos: ${response.statusText}`);
      }

      let responseText = await response.text();
      if (responseText.trim().startsWith('while')) {
        const firstBrace = responseText.indexOf('{');
        const secondBrace = responseText.indexOf('{', firstBrace + 1);
        if (secondBrace > 0) {
          responseText = responseText.substring(secondBrace);
        }
      }
      
      const data = JSON.parse(responseText);
      console.log('Photos data:', data);
      console.log('First photo:', data.resources?.[0]);
      console.log('Base URL:', data.base);
      setPhotos(data.resources || []);
      // Store base URL for constructing image URLs
      if (data.base) {
        saveLightroomMetadata({ baseUrl: data.base });
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching photos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearLightroomAuth();
    setAccessToken(null);
    setIsAuthenticated(false);
    setCatalogs([]);
    setAlbums([]);
    setPhotos([]);
    setSelectedCatalog(null);
  };

  // Gallery link management functions
  const addGalleryLink = () => {
    if (!newGalleryLink.trim() || !newGalleryTitle.trim()) {
      alert('Please enter both title and URL');
      return;
    }

    const newLink = {
      id: Date.now().toString(),
      title: newGalleryTitle,
      url: newGalleryLink,
      createdAt: new Date().toISOString()
    };

    const updatedLinks = [...galleryLinks, newLink];
    setGalleryLinks(updatedLinks);
    localStorage.setItem('lightroom_gallery_links', JSON.stringify(updatedLinks));
    
    setNewGalleryLink('');
    setNewGalleryTitle('');
  };

  const removeGalleryLink = (id) => {
    const updatedLinks = galleryLinks.filter(link => link.id !== id);
    setGalleryLinks(updatedLinks);
    localStorage.setItem('lightroom_gallery_links', JSON.stringify(updatedLinks));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Adobe Lightroom Integration</h1>
          <p className="text-purple-200">Manage your Lightroom galleries and API access</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 rounded-lg p-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Gallery Links Management (Option A - Simple) */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl border border-white/20 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <LinkIcon className="w-6 h-6 text-purple-400" />
            Lightroom Gallery Links
          </h2>
          <p className="text-purple-200 text-sm mb-4">
            Add public Lightroom gallery URLs to embed in your missions
          </p>

          {/* Add New Link Form */}
          <div className="bg-white/5 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="Gallery Title (e.g., Iceland Trip 2024)"
                value={newGalleryTitle}
                onChange={(e) => setNewGalleryTitle(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="url"
                placeholder="Lightroom Gallery URL"
                value={newGalleryLink}
                onChange={(e) => setNewGalleryLink(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={addGalleryLink}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold"
            >
              Add Gallery Link
            </button>
          </div>

          {/* Gallery Links List */}
          {galleryLinks.length > 0 ? (
            <div className="space-y-3">
              {galleryLinks.map((link) => (
                <div key={link.id} className="bg-white/5 border border-white/20 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">{link.title}</h3>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-300 text-sm hover:text-purple-200 flex items-center gap-1"
                    >
                      {link.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <button
                    onClick={() => removeGalleryLink(link.id)}
                    className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-purple-300">
              <p>No gallery links added yet</p>
            </div>
          )}
        </div>

        {/* API Integration Section (Option B - Advanced) */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-purple-400" />
            Lightroom API Integration
          </h2>
          
          {!isAuthenticated ? (
            <div className="text-center py-8">
              <ImageIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-4">Connect to Adobe Lightroom</h3>
              <p className="text-purple-200 mb-6">
                Authorize access to your Lightroom catalogs and albums via Adobe API
              </p>
              <button
                onClick={handleAdobeLogin}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-lg flex items-center gap-2 mx-auto"
              >
                <LogIn className="w-5 h-5" />
                Connect Adobe Lightroom
              </button>
              <p className="text-purple-300 text-sm mt-4">
                Requires Adobe Developer account and API credentials
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Connected Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-white font-medium">Connected to Adobe Lightroom</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={fetchCatalogs}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Load Catalogs
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>

              {/* Catalogs List */}
              {catalogs.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-3">Your Catalogs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {catalogs.map((catalog) => (
                      <button
                        key={catalog.id}
                        onClick={() => fetchAlbums(catalog.id)}
                        className={`bg-white/5 border rounded-lg p-4 hover:bg-white/10 transition-colors text-left ${
                          selectedCatalog === catalog.id ? 'border-purple-500' : 'border-white/20'
                        }`}
                      >
                        <h4 className="text-white font-semibold">{catalog.name || 'Untitled Catalog'}</h4>
                        <p className="text-purple-200 text-sm">{catalog.id}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Albums List */}
              {albums.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-3">Albums</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {albums.map((album) => (
                      <button
                        key={album.id}
                        onClick={() => fetchAlbumPhotos(selectedCatalog, album.id)}
                        className="bg-white/5 border border-white/20 rounded-lg p-4 hover:bg-white/10 transition-colors text-left"
                      >
                        <h4 className="text-white font-semibold mb-1">{album.payload?.name || 'Untitled Album'}</h4>
                        <p className="text-purple-200 text-sm">Click to view photos</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos Grid */}
              {photos.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-3">Photos ({photos.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map((photo) => {
                      // Get thumbnail URL from asset.links and proxy it through our backend
                      const thumbnailHref = photo.asset?.links?.['/rels/rendition_type/thumbnail2x']?.href;
                      const baseUrl = localStorage.getItem('lr_base_url') || 'https://lr.adobe.io/v2/';
                      // The href is relative to the catalog base, so we need to use the catalog base URL
                      const lrUrl = thumbnailHref ? `${baseUrl}${thumbnailHref}` : null;
                      const thumbnailUrl = lrUrl ? getApiUrl(`/api/adobe/image-proxy?url=${encodeURIComponent(lrUrl)}&token=${accessToken}`) : null;
                      
                      const captureDate = photo.asset?.payload?.captureDate;
                      const fileName = photo.asset?.payload?.importSource?.fileName || 'Photo';
                      
                      // Debug logging for first photo
                      if (photos.indexOf(photo) === 0) {
                        console.log('First photo debug:', {
                          thumbnailHref,
                          baseUrl,
                          lrUrl,
                          thumbnailUrl,
                          photoLinks: photo.asset?.links
                        });
                      }
                      
                      return (
                        <div key={photo.id} className="bg-white/5 border border-white/20 rounded-lg overflow-hidden hover:border-purple-500 transition-colors">
                          {thumbnailUrl ? (
                            <img
                              src={thumbnailUrl}
                              alt={fileName}
                              className="w-full h-48 object-cover"
                              onError={(e) => {
                                console.error('Image load error:', thumbnailUrl);
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-48 bg-purple-900/20 flex items-center justify-center">
                              <ImageIcon className="w-12 h-12 text-purple-400/50" />
                            </div>
                          )}
                          <div className="p-2">
                            <p className="text-white text-xs truncate font-semibold">{fileName}</p>
                            <p className="text-purple-200 text-xs">
                              {captureDate ? new Date(captureDate).toLocaleDateString() : 'No date'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="text-center py-12">
                  <Loader className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                  <p className="text-white">Loading...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
