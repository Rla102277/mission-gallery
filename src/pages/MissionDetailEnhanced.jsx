import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, Eye, EyeOff, Trash2, Sparkles, Calendar, MapPin, Camera, ChevronDown, ChevronUp, Plus, Image as ImageIcon, Link as LinkIcon, Share2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import PhotoLinker from '../components/PhotoLinker';
import MissionLightroomLinker from '../components/MissionLightroomLinker';

export default function MissionDetailEnhanced() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mission, setMission] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showGearForm, setShowGearForm] = useState(false);
  const [gearLoading, setGearLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [showPhotoLinker, setShowPhotoLinker] = useState(false);
  const [selectedIdeaId, setSelectedIdeaId] = useState(null);
  const [showLrLinker, setShowLrLinker] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [gearInputs, setGearInputs] = useState({
    duration: '',
    userGearInventory: `GFX 100S II ("The Portfolio"): 100MP, IBIS hero camera
Lenses: GF 32-64mm f/4, Mitakon 135mm f/2.5
X-E5 ("The Specialist"): Ultra-Wide dedicated
Lens: XF 10-24mm f/4
Konica Hexar RF ("The Artist"): Low-light, film-look
Lens: 28mm f/2.8
Insta360 ("The Experience"): 360° POV camera
iPhone: Diary, quick clips, timelapses`,
    weatherConditions: '',
    photoStyle: '',
  });

  useEffect(() => {
    fetchMissionData();
  }, [id]);

  const fetchMissionData = async () => {
    try {
      const [missionRes, imagesRes] = await Promise.all([
        axios.get(`/api/missions/${id}`, { withCredentials: true }),
        axios.get(`/api/images/mission/${id}`, { withCredentials: true }),
      ]);
      setMission(missionRes.data);
      setImages(imagesRes.data);
    } catch (error) {
      console.error('Error fetching mission:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = async (acceptedFiles) => {
    setUploading(true);
    const formData = new FormData();
    acceptedFiles.forEach((file) => {
      formData.append('images', file);
    });

    try {
      const response = await axios.post(`/api/images/upload/${id}`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImages([...images, ...response.data]);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    multiple: true,
  });

  const toggleImageVisibility = async (imageId, currentStatus) => {
    try {
      const response = await axios.put(
        `/api/images/${imageId}`,
        { isPublic: !currentStatus },
        { withCredentials: true }
      );
      setImages(images.map((img) => (img._id === imageId ? response.data : img)));
    } catch (error) {
      console.error('Error updating image:', error);
    }
  };

  const deleteImage = async (imageId) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      await axios.delete(`/api/images/${imageId}`, { withCredentials: true });
      setImages(images.filter((img) => img._id !== imageId));
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    }
  };

  const generateGearList = async () => {
    setGearLoading(true);
    try {
      const response = await axios.post(
        `/api/missions/${id}/gear`,
        { 
          duration: gearInputs.duration,
          userInputs: gearInputs 
        },
        { withCredentials: true }
      );
      setMission({ ...mission, gearList: response.data.gearList });
      setShowGearForm(false);
    } catch (error) {
      console.error('Error generating gear list:', error);
      alert('Failed to generate gear list');
    } finally {
      setGearLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const openPhotoLinker = (ideaId) => {
    setSelectedIdeaId(ideaId);
    setShowPhotoLinker(true);
  };

  const publishGallery = async () => {
    if (!confirm('Publish this mission as a gallery?')) return;
    
    setPublishing(true);
    try {
      const response = await axios.post(
        `/api/missions/${id}/publish-gallery`,
        {},
        { withCredentials: true }
      );
      
      alert('Gallery published successfully!');
      navigate(`/galleries/${response.data.gallery._id}`);
    } catch (error) {
      console.error('Error publishing gallery:', error);
      alert(error.response?.data?.error || 'Failed to publish gallery');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading mission...</p>
        </div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-600">Mission not found</p>
          <button onClick={() => navigate('/dashboard')} className="mt-4 btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Mission Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl border border-white/20 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">{mission.title}</h1>
              <div className="flex items-center gap-4 text-purple-200">
                {mission.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {mission.location}
                  </span>
                )}
                {mission.startDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(mission.startDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {mission.aiGenerated && (
                <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  AI Generated
                </span>
              )}
              {!mission.lightroomAlbum && (
                <button
                  onClick={() => setShowLrLinker(true)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all font-semibold flex items-center gap-2 shadow-lg"
                >
                  <Camera className="w-5 h-5" />
                  Link Lightroom
                </button>
              )}
              {mission.lightroomAlbum && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm flex items-center gap-1">
                  <Camera className="w-4 h-4" />
                  {mission.lightroomAlbum.name}
                </span>
              )}
              <button
                onClick={publishGallery}
                disabled={publishing || mission.publishedGalleryId}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                <Share2 className="w-5 h-5" />
                {mission.publishedGalleryId ? 'Published' : publishing ? 'Publishing...' : 'Publish Gallery'}
              </button>
              {mission.publishedGalleryId && (
                <button
                  onClick={() => navigate(`/galleries/${mission.publishedGalleryId}`)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold flex items-center gap-2 shadow-lg"
                >
                  <ImageIcon className="w-5 h-5" />
                  View Gallery
                </button>
              )}
            </div>
          </div>
          <p className="text-purple-100">{mission.description}</p>
        </div>

        {/* Structured Mission Plan */}
        {mission.structuredPlan && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl border border-white/20 mb-6">
            <h2 className="text-2xl font-bold text-white mb-6">Mission Plan</h2>
            
            {/* Locations */}
            {mission.structuredPlan.locations && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-purple-300 mb-2">Locations</h3>
                <div className="flex flex-wrap gap-2">
                  {mission.structuredPlan.locations.map((location, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-600/30 text-purple-200 rounded-lg text-sm">
                      {location}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Core Missions */}
            {mission.structuredPlan.coreMissions && mission.structuredPlan.coreMissions.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => toggleSection('coreMissions')}
                  className="w-full flex items-center justify-between text-left mb-4"
                >
                  <h3 className="text-lg font-semibold text-purple-300">
                    Core Missions ({mission.structuredPlan.coreMissions.length})
                  </h3>
                  {expandedSections.coreMissions ? (
                    <ChevronUp className="w-5 h-5 text-purple-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-purple-400" />
                  )}
                </button>
                
                {expandedSections.coreMissions && (
                  <div className="space-y-4">
                    {mission.structuredPlan.coreMissions.map((coreMission, idx) => (
                      <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {coreMission.id}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white text-lg mb-1">{coreMission.title}</h4>
                            <p className="text-sm text-purple-200 mb-3">{coreMission.location}</p>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="px-2 py-1 bg-purple-600/30 text-purple-200 rounded text-xs flex items-center gap-1">
                                <Camera className="w-3 h-3" />
                                {coreMission.gear}
                              </span>
                              {coreMission.settings && (
                                <>
                                  <span className="px-2 py-1 bg-pink-600/30 text-pink-200 rounded text-xs">
                                    {coreMission.settings.mode}
                                  </span>
                                  <span className="px-2 py-1 bg-pink-600/30 text-pink-200 rounded text-xs">
                                    {coreMission.settings.aperture}
                                  </span>
                                  <span className="px-2 py-1 bg-pink-600/30 text-pink-200 rounded text-xs">
                                    ISO {coreMission.settings.iso}
                                  </span>
                                  <span className="px-2 py-1 bg-pink-600/30 text-pink-200 rounded text-xs">
                                    {coreMission.settings.shutterSpeed}
                                  </span>
                                </>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-300 italic mb-2">{coreMission.idea}</p>
                            
                            {coreMission.specialNotes && (
                              <p className="text-xs text-yellow-300 bg-yellow-900/20 px-2 py-1 rounded">
                                ⚠️ {coreMission.specialNotes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Series Missions */}
            {mission.structuredPlan.seriesMissions && mission.structuredPlan.seriesMissions.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('seriesMissions')}
                  className="w-full flex items-center justify-between text-left mb-4"
                >
                  <h3 className="text-lg font-semibold text-purple-300">
                    Series Missions ({mission.structuredPlan.seriesMissions.length})
                  </h3>
                  {expandedSections.seriesMissions ? (
                    <ChevronUp className="w-5 h-5 text-purple-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-purple-400" />
                  )}
                </button>
                
                {expandedSections.seriesMissions && (
                  <div className="space-y-3">
                    {mission.structuredPlan.seriesMissions.map((series, idx) => (
                      <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded text-xs font-bold">
                            {series.id}
                          </span>
                          <span className="text-white font-semibold">{series.title}</span>
                          <span className="text-xs text-purple-300">({series.type})</span>
                        </div>
                        <div className="space-y-2">
                          {series.frames.map((frame, frameIdx) => (
                            <div key={frameIdx} className="text-sm text-gray-300 pl-4 border-l-2 border-purple-600/30">
                              <span className="text-purple-400 font-semibold">{frame.label}:</span> {frame.description}
                              {frame.missionRef && (
                                <span className="text-purple-300 ml-2">→ {frame.missionRef}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Image Upload & Gallery */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl border border-white/20 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">Images</h2>
          
          {/* Upload Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-6 ${
              isDragActive
                ? 'border-purple-400 bg-purple-900/20'
                : 'border-white/20 hover:border-purple-400 hover:bg-white/5'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <p className="text-white mb-2">
              {uploading ? 'Uploading...' : isDragActive ? 'Drop images here' : 'Drag & drop images or click to browse'}
            </p>
            <p className="text-sm text-purple-200">Supports: JPG, PNG, GIF, WebP</p>
          </div>

          {/* Image Grid */}
          {images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div key={image._id} className="relative group">
                  <img
                    src={image.thumbnailPath || image.path}
                    alt={image.caption || 'Mission image'}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => toggleImageVisibility(image._id, image.isPublic)}
                      className="opacity-0 group-hover:opacity-100 bg-white p-2 rounded-full hover:bg-gray-100 transition-opacity"
                      title={image.isPublic ? 'Hide from public' : 'Show in public gallery'}
                    >
                      {image.isPublic ? (
                        <Eye className="h-5 w-5 text-green-600" />
                      ) : (
                        <EyeOff className="h-5 w-5 text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteImage(image._id)}
                      className="opacity-0 group-hover:opacity-100 bg-white p-2 rounded-full hover:bg-red-50 transition-opacity"
                      title="Delete image"
                    >
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </button>
                  </div>
                  {!image.isPublic && (
                    <div className="absolute bottom-2 left-2">
                      <span className="px-2 py-1 bg-gray-900/80 text-white text-xs rounded">
                        Private
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-purple-200">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No images uploaded yet</p>
            </div>
          )}
        </div>

        {/* Gear List */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl border border-white/20">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Gear List</h2>
            <button
              onClick={() => setShowGearForm(!showGearForm)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Generate with AI
            </button>
          </div>

          {showGearForm && (
            <div className="mb-6 p-6 bg-white/5 rounded-lg border border-white/10 space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Your Gear Inventory
                </label>
                <textarea
                  placeholder="List your available gear..."
                  value={gearInputs.userGearInventory}
                  onChange={(e) => setGearInputs({ ...gearInputs, userGearInventory: e.target.value })}
                  rows="6"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                />
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Trip duration (e.g., 7 days)"
                  value={gearInputs.duration}
                  onChange={(e) => setGearInputs({ ...gearInputs, duration: e.target.value })}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  placeholder="Weather conditions"
                  value={gearInputs.weatherConditions}
                  onChange={(e) => setGearInputs({ ...gearInputs, weatherConditions: e.target.value })}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  placeholder="Photography style"
                  value={gearInputs.photoStyle}
                  onChange={(e) => setGearInputs({ ...gearInputs, photoStyle: e.target.value })}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <button
                onClick={generateGearList}
                disabled={gearLoading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 font-semibold"
              >
                {gearLoading ? 'Generating...' : 'Generate Gear List'}
              </button>
            </div>
          )}

          {mission.gearList && mission.gearList.length > 0 ? (
            <div className="space-y-4">
              {mission.gearList.map((item, index) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg text-white">{item.name}</h3>
                      <p className="text-sm text-purple-400">{item.category}</p>
                    </div>
                    {item.aiGenerated && (
                      <span className="px-2 py-1 bg-purple-600/30 text-purple-200 rounded text-xs flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{item.description}</p>
                  
                  {item.recommendation && (
                    <p className="text-sm text-purple-200 italic mb-2">
                      💡 {item.recommendation}
                    </p>
                  )}
                  
                  {item.usageScenarios && item.usageScenarios.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-purple-300 mb-1">Usage Scenarios:</p>
                      <ul className="text-xs text-gray-300 space-y-1">
                        {item.usageScenarios.map((scenario, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-purple-400">•</span>
                            <span>{scenario}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {item.specifications && Object.keys(item.specifications).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(item.specifications).map(([key, value]) => (
                        <span key={key} className="px-2 py-1 bg-white/5 text-gray-300 rounded text-xs">
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-purple-200">
              <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No gear list yet. Click "Generate with AI" to create one!</p>
            </div>
          )}
        </div>

        {/* Mission Ideas with Photo Linking */}
        {mission.missionIdeas && mission.missionIdeas.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl border border-white/20 mb-6">
            <h2 className="text-2xl font-bold text-white mb-6">Mission Ideas</h2>
            <div className="space-y-4">
              {mission.missionIdeas.map((idea, index) => (
                <div key={idea.id || index} className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {idea.id}
                        </div>
                        <h3 className="text-xl font-semibold text-white">{idea.title}</h3>
                      </div>
                      <p className="text-purple-200 text-sm mb-2">{idea.location}</p>
                      <p className="text-gray-300 mb-3">{idea.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-3 py-1 bg-purple-600/30 text-purple-200 rounded text-sm flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          {idea.gear}
                        </span>
                        {idea.settings && (
                          <span className="px-3 py-1 bg-pink-600/30 text-pink-200 rounded text-sm">
                            {idea.settings.mode} • {idea.settings.aperture} • ISO {idea.settings.iso}
                          </span>
                        )}
                      </div>
                      
                      {idea.specialNotes && (
                        <p className="text-sm text-yellow-300 italic">⚠️ {idea.specialNotes}</p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => openPhotoLinker(idea.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Link Photos
                    </button>
                  </div>
                  
                  {/* Linked Photos Display */}
                  {(idea.linkedPhotos?.length > 0 || idea.lightroomPhotoIds?.length > 0) && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-sm text-purple-300 mb-2">
                        Linked Photos: {(idea.linkedPhotos?.length || 0) + (idea.lightroomPhotoIds?.length || 0)}
                      </p>
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                        {idea.linkedPhotos?.slice(0, 6).map((photo, idx) => (
                          <div key={idx} className="aspect-square bg-white/5 rounded border border-white/10 flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-purple-400" />
                          </div>
                        ))}
                        {idea.lightroomPhotoIds?.slice(0, 6 - (idea.linkedPhotos?.length || 0)).map((photoId, idx) => (
                          <div key={idx} className="aspect-square bg-amber-500/10 rounded border border-amber-500/30 flex items-center justify-center">
                            <Camera className="w-6 h-6 text-amber-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Photo Linker Modal */}
      {showPhotoLinker && selectedIdeaId && (
        <PhotoLinker
          missionId={id}
          ideaId={selectedIdeaId}
          linkedPhotos={mission.missionIdeas.find(i => i.id === selectedIdeaId)?.linkedPhotos || []}
          lightroomPhotoIds={mission.missionIdeas.find(i => i.id === selectedIdeaId)?.lightroomPhotoIds || []}
          onClose={() => setShowPhotoLinker(false)}
          onUpdate={fetchMissionData}
        />
      )}

      {/* Lightroom Linker Modal */}
      {showLrLinker && (
        <MissionLightroomLinker
          missionId={id}
          onClose={() => setShowLrLinker(false)}
          onLinked={fetchMissionData}
        />
      )}
    </div>
  );
}
