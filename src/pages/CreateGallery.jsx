import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Camera, Plus, X, Image as ImageIcon, Save, Trash2 } from 'lucide-react';
import LightroomAlbumSelector from '../components/LightroomAlbumSelector';

function CreateGallery() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [missions, setMissions] = useState([]);
  const [availableImages, setAvailableImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: false,
    layout: 'grid',
    missionId: '',
    enablePrints: false,
    lightroomAlbum: null,
    printPricing: {
      '8x10': 25,
      '11x14': 35,
      '16x20': 65,
      '20x30': 95,
      '24x36': 145
    }
  });

  useEffect(() => {
    fetchMissions();
  }, []);

  useEffect(() => {
    if (formData.missionId) {
      fetchMissionImages(formData.missionId);
    }
  }, [formData.missionId]);

  const fetchMissions = async () => {
    try {
      const response = await api.get('/api/missions');
      setMissions(response.data);
    } catch (error) {
      console.error('Error fetching missions:', error);
    }
  };

  const fetchMissionImages = async (missionId) => {
    try {
      const response = await api.get(`/api/images/mission/${missionId}`);
      setAvailableImages(response.data);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handlePricingChange = (size, value) => {
    setFormData({
      ...formData,
      printPricing: {
        ...formData.printPricing,
        [size]: parseFloat(value) || 0
      }
    });
  };

  const toggleImageSelection = (image) => {
    if (selectedImages.find(img => img._id === image._id)) {
      setSelectedImages(selectedImages.filter(img => img._id !== image._id));
    } else {
      setSelectedImages([...selectedImages, image]);
    }
  };

  const handleLightroomSelect = (album) => {
    setFormData({
      ...formData,
      lightroomAlbum: {
        id: album.id,
        name: album.payload?.name || 'Untitled Album',
        catalogId: localStorage.getItem('lr_catalog_id')
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedImages.length === 0 && !formData.lightroomAlbum) {
      alert('Please select at least one image or link a Lightroom album');
      return;
    }

    setLoading(true);
    try {
      const galleryData = {
        ...formData,
        images: selectedImages.map(img => img._id)
      };

      const response = await api.post('/api/galleries', galleryData, {
        withCredentials: true
      });

      navigate(`/galleries/${response.data._id}`);
    } catch (error) {
      console.error('Error creating gallery:', error);
      alert('Failed to create gallery. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Camera className="w-12 h-12 text-amber-500" />
          </div>
          <h1 className="text-4xl font-bold text-stone-100 mb-2">Create Gallery</h1>
          <p className="text-stone-300">Curate your finest work</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-stone-800/50 backdrop-blur-sm border border-stone-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-stone-100 mb-6 flex items-center">
              <ImageIcon className="w-6 h-6 mr-2 text-amber-500" />
              Gallery Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-200 mb-2">
                  Gallery Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-stone-900/50 border border-stone-600 rounded-lg text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g., Iceland Winter Collection"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-200 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-3 bg-stone-900/50 border border-stone-600 rounded-lg text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Describe your gallery..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-200 mb-2">
                    Source Mission
                  </label>
                  <select
                    name="missionId"
                    value={formData.missionId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-stone-900/50 border border-stone-600 rounded-lg text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select a mission...</option>
                    {missions.map(mission => (
                      <option key={mission._id} value={mission._id}>
                        {mission.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-200 mb-2">
                    Layout Style
                  </label>
                  <select
                    name="layout"
                    value={formData.layout}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-stone-900/50 border border-stone-600 rounded-lg text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="grid">Classic Grid</option>
                    <option value="masonry">Masonry</option>
                    <option value="slideshow">Slideshow</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleChange}
                    className="w-5 h-5 text-amber-500 bg-stone-900 border-stone-600 rounded focus:ring-amber-500"
                  />
                  <span className="ml-2 text-stone-200">Make gallery public</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="enablePrints"
                    checked={formData.enablePrints}
                    onChange={handleChange}
                    className="w-5 h-5 text-amber-500 bg-stone-900 border-stone-600 rounded focus:ring-amber-500"
                  />
                  <span className="ml-2 text-stone-200">Enable print sales</span>
                </label>
              </div>
            </div>
          </div>

          {/* Print Pricing (if enabled) */}
          {formData.enablePrints && (
            <div className="bg-stone-800/50 backdrop-blur-sm border border-stone-700 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-stone-100 mb-6">
                Print Pricing
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(formData.printPricing).map(([size, price]) => (
                  <div key={size}>
                    <label className="block text-sm font-medium text-stone-200 mb-2">
                      {size}"
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-stone-400">$</span>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => handlePricingChange(size, e.target.value)}
                        className="w-full pl-8 pr-4 py-2 bg-stone-900/50 border border-stone-600 rounded-lg text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Selection */}
          {formData.missionId && (
            <div className="bg-stone-800/50 backdrop-blur-sm border border-stone-700 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-stone-100 mb-6">
                Select Images ({selectedImages.length} selected)
              </h2>
              
              {availableImages.length === 0 ? (
                <p className="text-stone-400 text-center py-8">
                  No images available in this mission
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {availableImages.map(image => (
                    <div
                      key={image._id}
                      onClick={() => toggleImageSelection(image)}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImages.find(img => img._id === image._id)
                          ? 'border-amber-500 ring-2 ring-amber-500/50'
                          : 'border-stone-600 hover:border-stone-500'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={image.title}
                        className="w-full h-48 object-cover"
                      />
                      {selectedImages.find(img => img._id === image._id) && (
                        <div className="absolute top-2 right-2 bg-amber-500 text-stone-900 rounded-full p-1">
                          <Plus className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Lightroom Album Integration */}
          <div className="bg-stone-800/50 backdrop-blur-sm border border-stone-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-stone-100 mb-4">
              Or Link Lightroom Album
            </h2>
            <p className="text-stone-400 text-sm mb-4">
              Connect your Adobe Lightroom album to automatically sync photos
            </p>
            <LightroomAlbumSelector 
              onSelect={handleLightroomSelect}
              selectedAlbumId={formData.lightroomAlbum?.id}
              allowCreate={true}
              missionTitle={formData.title}
            />
            {formData.lightroomAlbum && (
              <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-200 text-sm">
                  ✓ Linked to: <span className="font-semibold">{formData.lightroomAlbum.name}</span>
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-stone-700 hover:bg-stone-600 text-stone-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedImages.length === 0}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading ? 'Creating...' : 'Create Gallery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGallery;
