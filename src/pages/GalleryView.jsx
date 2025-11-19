import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, Layout, Grid, Columns, Save, Share2, RefreshCw, Camera, Check, X, Sparkles, Edit3, GripVertical, MessageSquare, Link as LinkIcon } from 'lucide-react';
import ImageViewer from '../components/ImageViewer';

export default function GalleryView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [layoutType, setLayoutType] = useState('grid');
  const [lightroomPhotos, setLightroomPhotos] = useState([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [enhancing, setEnhancing] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState('');
  const [missions, setMissions] = useState([]);
  const [showMissionSelector, setShowMissionSelector] = useState(false);
  const [showLightroomSelector, setShowLightroomSelector] = useState(false);
  const [lightroomAlbums, setLightroomAlbums] = useState([]);

  useEffect(() => {
    fetchGallery();
  }, [id]);

  const fetchGallery = async () => {
    try {
      const response = await axios.get(`/api/galleries/${id}`, { withCredentials: true });
      setGallery(response.data);
      setLayoutType(response.data.layout || 'grid');
      
      // Debug: Check if enhanced data exists
      console.log('Gallery metadata:', response.data.metadata);
      console.log('Enhanced photos:', response.data.metadata?.enhancedLightroomPhotos);
      console.log('Gallery lightroomAlbum:', response.data.lightroomAlbum);
      
      // If gallery has Lightroom album, fetch photos
      if (response.data.lightroomAlbum) {
        fetchLightroomPhotos(response.data.lightroomAlbum);
      }
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLightroomPhotos = async (lightroomAlbum) => {
    try {
      const token = localStorage.getItem('adobe_lightroom_token');
      if (!token) {
        console.error('No Lightroom token found');
        return;
      }

      const response = await fetch(
        `https://lr.adobe.io/v2/catalogs/${lightroomAlbum.catalogId}/albums/${lightroomAlbum.id}/assets?embed=asset`,
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

      const data = JSON.parse(responseText);
      setLightroomPhotos(data.resources || []);
    } catch (error) {
      console.error('Error fetching Lightroom photos:', error);
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
    const link = `${window.location.origin}/gallery/${gallery.slug}`;
    navigator.clipboard.writeText(link);
    alert('Public link copied to clipboard!');
  };

  const togglePhotoVisibility = async (photoId) => {
    try {
      const response = await axios.post(`/api/galleries/${id}/toggle-photo`, {
        photoId
      }, { withCredentials: true });
      
      setGallery(response.data);
    } catch (error) {
      console.error('Error toggling photo visibility:', error);
      alert('Failed to update photo visibility');
    }
  };

  const isPhotoVisible = (photoId) => {
    return gallery?.visibleLightroomPhotos?.includes(photoId) || false;
  };

  const enhanceGallery = async () => {
    if (!gallery.missionId && !gallery.lightroomAlbum) {
      alert('No images to enhance');
      return;
    }

    const message = gallery.lightroomAlbum 
      ? `This will generate AI descriptions for ${gallery.visibleLightroomPhotos?.length || 0} visible photos (green eye icons). Continue?`
      : 'This will extract EXIF data and generate AI descriptions for all images. Continue?';
    
    if (!confirm(message)) {
      return;
    }

    setEnhancing(true);
    try {
      if (gallery.lightroomAlbum) {
        // Enhance Lightroom gallery
        await enhanceLightroomGallery();
      } else {
        // Enhance regular gallery
        const response = await axios.post(
          `/api/images/mission/${gallery.missionId}/enhance-all`,
          {},
          { withCredentials: true }
        );

        alert(`Enhancement complete!\nSuccess: ${response.data.success}\nFailed: ${response.data.failed}\nSkipped: ${response.data.skipped}`);
      }
      
      // Refresh gallery to show updated data
      fetchGallery();
    } catch (error) {
      console.error('Error enhancing gallery:', error);
      alert('Failed to enhance gallery. Check console for details.');
    } finally {
      setEnhancing(false);
    }
  };

  const enhanceLightroomGallery = async () => {
    // Only enhance visible photos (green ones)
    const visiblePhotos = lightroomPhotos.filter(photo => isPhotoVisible(photo.id));
    
    if (visiblePhotos.length === 0) {
      alert('No visible photos to enhance. Mark some photos as visible (green eye icon) first.');
      return;
    }

    // Extract EXIF from visible Lightroom photos
    const photosWithExif = visiblePhotos.map(photo => {
      const asset = photo.asset?.payload;
      const captureSettings = asset?.captureSettings;
      
      return {
        id: photo.id,
        caption: asset?.importSource?.fileName || '',
        exif: {
          camera: asset?.camera?.model || null,
          lens: captureSettings?.lens?.name || null,
          focalLength: captureSettings?.focalLength ? `${Math.round(captureSettings.focalLength)}mm` : null,
          aperture: captureSettings?.aperture ? `f/${captureSettings.aperture}` : null,
          shutterSpeed: captureSettings?.shutterSpeed ? formatShutterSpeed(captureSettings.shutterSpeed) : null,
          iso: captureSettings?.iso || null,
          location: asset?.location?.name || null,
        }
      };
    });

    console.log('Sending photos for enhancement:', photosWithExif);
    
    const response = await axios.post(
      `/api/galleries/${id}/enhance-lightroom`,
      { photos: photosWithExif },
      { withCredentials: true }
    );

    console.log('Enhancement response:', response.data);
    alert(`Lightroom enhancement complete!\nEnhanced: ${response.data.success} photos`);
  };

  const formatShutterSpeed = (speed) => {
    if (speed < 1) {
      return `1/${Math.round(1 / speed)}s`;
    }
    return `${speed}s`;
  };

  const enhanceDescription = async () => {
    try {
      const response = await axios.post(
        `/api/galleries/${id}/enhance-description`,
        {},
        { withCredentials: true }
      );
      
      setGallery({ ...gallery, description: response.data.description });
      setTempDescription(response.data.description);
      alert('Description enhanced with AI!');
    } catch (error) {
      console.error('Error enhancing description:', error);
      alert('Failed to enhance description');
    }
  };

  const saveDescription = async () => {
    try {
      await axios.put(
        `/api/galleries/${id}`,
        { description: tempDescription },
        { withCredentials: true }
      );
      
      setGallery({ ...gallery, description: tempDescription });
      setEditingDescription(false);
      alert('Description saved!');
    } catch (error) {
      console.error('Error saving description:', error);
      alert('Failed to save description');
    }
  };

  const fetchMissions = async () => {
    try {
      const response = await axios.get('/api/missions', { withCredentials: true });
      setMissions(response.data);
    } catch (error) {
      console.error('Error fetching missions:', error);
    }
  };

  const linkMission = async (missionId) => {
    try {
      await axios.put(
        `/api/galleries/${id}`,
        { missionId },
        { withCredentials: true }
      );
      
      fetchGallery();
      setShowMissionSelector(false);
      alert('Mission linked successfully!');
    } catch (error) {
      console.error('Error linking mission:', error);
      alert('Failed to link mission');
    }
  };

  const fetchLightroomAlbums = async () => {
    try {
      const catalogId = localStorage.getItem('lr_catalog_id');
      const token = localStorage.getItem('adobe_lightroom_token');
      const baseUrl = localStorage.getItem('lr_base_url');

      if (!catalogId || !token || !baseUrl) {
        alert('Please connect to Lightroom first (Admin → Lightroom tab)');
        return;
      }

      const response = await axios.get(
        `/api/adobe/image-proxy?url=${encodeURIComponent(`${baseUrl}/albums`)}&token=${token}`,
        { withCredentials: true }
      );

      // Parse the response if it's a buffer
      const albums = response.data.resources || [];
      setLightroomAlbums(albums);
      setShowLightroomSelector(true);
    } catch (error) {
      console.error('Error fetching Lightroom albums:', error);
      alert('Failed to fetch Lightroom albums. Please re-authenticate.');
    }
  };

  const linkLightroomAlbum = async (album) => {
    try {
      const catalogId = localStorage.getItem('lr_catalog_id');
      
      await axios.put(
        `/api/galleries/${id}`,
        { 
          lightroomAlbum: {
            id: album.id,
            name: album.payload?.name || 'Untitled Album',
            catalogId: catalogId
          }
        },
        { withCredentials: true }
      );

      alert('Lightroom album linked successfully!');
      setShowLightroomSelector(false);
      fetchGallery();
    } catch (error) {
      console.error('Error linking Lightroom album:', error);
      alert('Failed to link Lightroom album');
    }
  };

  const createLightroomAlbum = async () => {
    try {
      // Check if gallery already has a Lightroom album
      if (gallery.lightroomAlbum) {
        alert('This gallery already has a Lightroom album: ' + gallery.lightroomAlbum.name);
        return;
      }

      const catalogId = localStorage.getItem('lr_catalog_id');
      const token = localStorage.getItem('adobe_lightroom_token');

      if (!catalogId || !token) {
        alert('Please connect to Lightroom first. Go to Lightroom Test page to authenticate.');
        return;
      }

      const albumName = gallery.title || gallery.missionId?.title;
      
      if (!confirm(`Create Lightroom album "${albumName}"?`)) {
        return;
      }

      console.log('Creating Lightroom album with:', { catalogId, albumName });

      const response = await axios.post(
        `/api/galleries/${id}/create-lightroom-album`,
        { 
          catalogId,
          albumName 
        },
        { 
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Lightroom album created:', response.data);
      alert('Lightroom album created successfully!');
      fetchGallery();
    } catch (error) {
      console.error('Error creating Lightroom album:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to create Lightroom album';
      
      if (error.response?.status === 403) {
        errorMessage = 'Authentication failed. Your Lightroom token may have expired.\n\n' +
                      'Please go to the Lightroom Test page and re-authenticate, then try again.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      alert(errorMessage);
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
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{gallery.title}</h1>
              <button
                onClick={() => setEditMode(!editMode)}
                className={`p-2 rounded-lg transition-colors ${
                  editMode 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title={editMode ? 'Exit edit mode' : 'Edit gallery'}
              >
                <Edit3 className="h-5 w-5" />
              </button>
            </div>
            
            {/* Description Editor */}
            {editMode ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <textarea
                    value={editingDescription ? tempDescription : gallery.description || ''}
                    onChange={(e) => {
                      setTempDescription(e.target.value);
                      setEditingDescription(true);
                    }}
                    placeholder="Add a gallery description..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    rows="2"
                  />
                  <button
                    onClick={enhanceDescription}
                    className="px-3 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-lg hover:from-purple-200 hover:to-pink-200 flex items-center gap-2"
                    title="Enhance with AI"
                  >
                    <Sparkles className="h-4 w-4" />
                    AI
                  </button>
                  {editingDescription && (
                    <button
                      onClick={saveDescription}
                      className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </button>
                  )}
                </div>
                
                {/* Mission Linker */}
                <div className="flex items-center gap-2 flex-wrap">
                  {gallery.missionId ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <LinkIcon className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-700">
                        Linked to: <strong>{gallery.missionId.title}</strong>
                      </span>
                      <button
                        onClick={() => linkMission(null)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        fetchMissions();
                        setShowMissionSelector(!showMissionSelector);
                      }}
                      className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center gap-2"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Link to Mission
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/missions/create')}
                    className="px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Create New Mission
                  </button>
                  
                  {/* Lightroom Album Creator/Linker */}
                  {!gallery.lightroomAlbum && gallery.missionId && (
                    <>
                      <button
                        onClick={createLightroomAlbum}
                        className="px-3 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 flex items-center gap-2"
                        title="Create new Lightroom album"
                      >
                        <Camera className="h-4 w-4" />
                        Create Lightroom Album
                      </button>
                      <button
                        onClick={fetchLightroomAlbums}
                        className="px-3 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 flex items-center gap-2"
                        title="Link to existing Lightroom album"
                      >
                        <LinkIcon className="h-4 w-4" />
                        Link Existing Album
                      </button>
                    </>
                  )}
                  
                  {gallery.lightroomAlbum && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <Camera className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-700">
                        Lightroom: <strong>{gallery.lightroomAlbum.name}</strong>
                      </span>
                      <button
                        onClick={async () => {
                          if (confirm('Unlink this Lightroom album?')) {
                            await axios.put(`/api/galleries/${id}`, { lightroomAlbum: null }, { withCredentials: true });
                            fetchGallery();
                          }
                        }}
                        className="text-amber-600 hover:text-amber-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Lightroom Album Selector Dropdown */}
                {showLightroomSelector && lightroomAlbums.length > 0 && (
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-700">Select a Lightroom album:</p>
                      <button
                        onClick={() => setShowLightroomSelector(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {lightroomAlbums.map(album => (
                      <button
                        key={album.id}
                        onClick={() => linkLightroomAlbum(album)}
                        className="w-full text-left px-3 py-2 hover:bg-white rounded-lg transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          {album.payload?.name || 'Untitled Album'}
                        </div>
                        {album.payload?.created && (
                          <div className="text-sm text-gray-500">
                            Created: {new Date(album.payload.created).toLocaleDateString()}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Mission Selector Dropdown */}
                {showMissionSelector && missions.length > 0 && (
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Select a mission:</p>
                    {missions.map(mission => (
                      <button
                        key={mission._id}
                        onClick={() => linkMission(mission._id)}
                        className="w-full text-left px-3 py-2 hover:bg-white rounded-lg transition-colors"
                      >
                        <div className="font-medium text-gray-900">{mission.title}</div>
                        {mission.location && (
                          <div className="text-sm text-gray-500">{mission.location}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              gallery.description && <p className="text-gray-600">{gallery.description}</p>
            )}
          </div>
          <div className="flex space-x-2">
            {gallery.lightroomAlbum && (
              <button
                onClick={() => fetchLightroomPhotos(gallery.lightroomAlbum)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200"
                title="Refresh photos from Lightroom"
              >
                <RefreshCw className="h-5 w-5" />
                <span>Refresh</span>
              </button>
            )}
            {(gallery.missionId || gallery.lightroomAlbum) && (
              <button
                onClick={enhanceGallery}
                disabled={enhancing}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 hover:from-purple-200 hover:to-pink-200 disabled:opacity-50"
                title="Extract EXIF data and generate AI descriptions"
              >
                <Sparkles className="h-5 w-5" />
                <span>{enhancing ? 'Enhancing...' : 'AI Enhance'}</span>
              </button>
            )}
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
      {lightroomPhotos.length > 0 ? (
        <div>
          <div className="mb-4 bg-amber-100 border border-amber-300 rounded-lg p-3">
            <p className="text-amber-800 text-sm">
              📸 Lightroom album: <strong>{gallery.lightroomAlbum?.name}</strong>
              <br />
              <span className="text-xs">
                {gallery.visibleLightroomPhotos?.length || 0} of {lightroomPhotos.length} photos visible in public gallery
              </span>
            </p>
          </div>
          <div className={getGridClass()}>
            {lightroomPhotos.map((photo) => {
              const thumbnailHref = photo.asset?.links?.['/rels/rendition_type/thumbnail2x']?.href;
              const baseUrl = localStorage.getItem('lr_base_url') || `https://lr.adobe.io/v2/catalogs/${gallery.lightroomAlbum.catalogId}/`;
              const lrUrl = thumbnailHref ? `${baseUrl}${thumbnailHref}` : null;
              const thumbnailUrl = lrUrl ? `/api/adobe/image-proxy?url=${encodeURIComponent(lrUrl)}&token=${localStorage.getItem('adobe_lightroom_token')}` : null;
              const fileName = photo.asset?.payload?.importSource?.fileName || 'Photo';
              const captureDate = photo.asset?.payload?.captureDate;

              const visible = isPhotoVisible(photo.id);
              const isEnhanced = gallery?.metadata?.enhancedLightroomPhotos?.some(p => p.id === photo.id);
              
              return (
                <div 
                  key={photo.id} 
                  className={`relative group cursor-pointer ${!visible ? 'opacity-50' : ''}`}
                  onClick={() => {
                    setCurrentImageIndex(lightroomPhotos.indexOf(photo));
                    setViewerOpen(true);
                  }}
                >
                  <img
                    src={thumbnailUrl}
                    alt={fileName}
                    className={`w-full ${
                      layoutType === 'masonry' ? 'mb-4' : 'h-64 object-cover'
                    } rounded-lg`}
                  />
                  
                  {/* AI Enhanced Badge */}
                  {isEnhanced && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI
                    </div>
                  )}
                  
                  {/* Visibility Toggle Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePhotoVisibility(photo.id);
                    }}
                    className={`absolute top-2 right-2 p-2 rounded-lg transition-all ${
                      visible 
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                    title={visible ? 'Hide from public gallery' : 'Show in public gallery'}
                  >
                    {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-semibold truncate">{fileName}</p>
                    {captureDate && (
                      <p className="text-white/80 text-xs">{new Date(captureDate).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : gallery.images && gallery.images.length > 0 ? (
        <div className={getGridClass()}>
          {gallery.images.map((item) => {
            const image = item.imageId;
            if (!image) return null;

            return (
              <div 
                key={image._id} 
                className="relative group cursor-pointer"
                onClick={() => {
                  setCurrentImageIndex(gallery.images.indexOf(item));
                  setViewerOpen(true);
                }}
              >
                <img
                  src={`/${image.path}`}
                  alt={image.caption || 'Gallery image'}
                  className={`w-full ${
                    layoutType === 'masonry' ? 'mb-4' : 'h-64 object-cover'
                  } rounded-lg`}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(image._id);
                    }}
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

      {/* Image Viewer Modal */}
      <ImageViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        images={lightroomPhotos.length > 0 ? lightroomPhotos.map((photo) => {
          // Use larger 2048px rendition for viewer
          const largeHref = photo.asset?.links?.['/rels/rendition_type/2048']?.href;
          const baseUrl = localStorage.getItem('lr_base_url') || `https://lr.adobe.io/v2/catalogs/${gallery?.lightroomAlbum?.catalogId}/`;
          const lrUrl = largeHref ? `${baseUrl}${largeHref}` : null;
          const largeUrl = lrUrl ? `/api/adobe/image-proxy?url=${encodeURIComponent(lrUrl)}&token=${localStorage.getItem('adobe_lightroom_token')}` : null;
          
          // Get enhanced data if available
          const enhancedData = gallery?.metadata?.enhancedLightroomPhotos?.find(p => p.id === photo.id);
          
          return {
            url: largeUrl,
            title: photo.asset?.payload?.importSource?.fileName || 'Photo',
            date: photo.asset?.payload?.captureDate ? new Date(photo.asset.payload.captureDate).toLocaleDateString() : null,
            exif: enhancedData?.exif,
            aiDescription: enhancedData?.aiDescription
          };
        }) : gallery.images?.map((item) => {
          const image = item.imageId;
          return {
            url: `/${image.path}`,
            title: image.caption || image.filename || 'Photo',
            date: image.uploadDate ? new Date(image.uploadDate).toLocaleDateString() : null,
            exif: image.exif,
            aiDescription: image.aiDescription
          };
        }) || []}
        currentIndex={currentImageIndex}
        onNavigate={setCurrentImageIndex}
      />
    </div>
  );
}
