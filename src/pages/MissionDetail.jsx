import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Upload, Eye, EyeOff, Trash2, Sparkles, Plus, Info } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

export default function MissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mission, setMission] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showGearForm, setShowGearForm] = useState(false);
  const [gearLoading, setGearLoading] = useState(false);
  const [selectedGear, setSelectedGear] = useState(null);
  const [gearInputs, setGearInputs] = useState({
    duration: '',
    weatherConditions: '',
    photoStyle: '',
    budget: '',
  });

  useEffect(() => {
    fetchMissionData();
  }, [id]);

  const fetchMissionData = async () => {
    try {
      const [missionRes, imagesRes] = await Promise.all([
        api.get(`/api/missions/${id}`),
        api.get(`/api/images/mission/${id}`),
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
      const response = await api.post(`/api/images/upload/${id}`, formData, {
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
      const response = await api.put(
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
      await api.delete(`/api/images/${imageId}`);
      setImages(images.filter((img) => img._id !== imageId));
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const generateGearList = async () => {
    setGearLoading(true);
    try {
      const response = await api.post(
        `/api/missions/${id}/gear`,
        { userInputs: gearInputs },
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

  const createGallery = async () => {
    try {
      const response = await api.post(
        '/api/galleries',
        {
          missionId: id,
          title: `${mission.title} Gallery`,
          description: mission.description,
          isPublic: false,
          imageIds: images.map((img) => img._id),
        },
        { withCredentials: true }
      );
      navigate(`/galleries/${response.data._id}`);
    } catch (error) {
      console.error('Error creating gallery:', error);
      alert('Failed to create gallery');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!mission) {
    return <div className="flex items-center justify-center min-h-screen">Mission not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Mission Header */}
      <div className="card mb-8">
        <h1 className="text-3xl font-bold mb-4">{mission.title}</h1>
        {mission.location && <p className="text-gray-600 mb-2">📍 {mission.location}</p>}
        {mission.description && <p className="text-gray-700 mb-4">{mission.description}</p>}
        {mission.startDate && (
          <p className="text-sm text-gray-600">
            📅 {new Date(mission.startDate).toLocaleDateString()}
            {mission.endDate && ` - ${new Date(mission.endDate).toLocaleDateString()}`}
          </p>
        )}
        <div className="mt-4 flex space-x-4">
          <button onClick={createGallery} className="btn-primary">
            Create Gallery
          </button>
        </div>
      </div>

      {/* Image Upload */}
      <div className="card mb-8">
        <h2 className="text-2xl font-semibold mb-4">Images</h2>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          {uploading ? (
            <p className="text-gray-600">Uploading...</p>
          ) : isDragActive ? (
            <p className="text-gray-600">Drop images here...</p>
          ) : (
            <p className="text-gray-600">Drag & drop images here, or click to select</p>
          )}
        </div>

        {/* Image Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {images.map((image) => (
              <div key={image._id} className="relative group">
                <img
                  src={image.thumbnailUrl || image.url}
                  alt={image.caption || 'Mission image'}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                  <button
                    onClick={() => toggleImageVisibility(image._id, image.isPublic)}
                    className="opacity-0 group-hover:opacity-100 bg-white p-2 rounded-full hover:bg-gray-100"
                    title={image.isPublic ? 'Make private' : 'Make public'}
                  >
                    {image.isPublic ? (
                      <Eye className="h-5 w-5 text-green-600" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-600" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteImage(image._id)}
                    className="opacity-0 group-hover:opacity-100 bg-white p-2 rounded-full hover:bg-red-50"
                    title="Delete image"
                  >
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gear List */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Gear List</h2>
          <button
            onClick={() => setShowGearForm(!showGearForm)}
            className="btn-primary flex items-center space-x-2"
          >
            <Sparkles className="h-5 w-5" />
            <span>Generate with AI</span>
          </button>
        </div>

        {showGearForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Trip duration (e.g., 5 days)"
                value={gearInputs.duration}
                onChange={(e) => setGearInputs({ ...gearInputs, duration: e.target.value })}
                className="input"
              />
              <input
                type="text"
                placeholder="Weather conditions"
                value={gearInputs.weatherConditions}
                onChange={(e) => setGearInputs({ ...gearInputs, weatherConditions: e.target.value })}
                className="input"
              />
              <input
                type="text"
                placeholder="Photography style"
                value={gearInputs.photoStyle}
                onChange={(e) => setGearInputs({ ...gearInputs, photoStyle: e.target.value })}
                className="input"
              />
              <input
                type="text"
                placeholder="Budget range"
                value={gearInputs.budget}
                onChange={(e) => setGearInputs({ ...gearInputs, budget: e.target.value })}
                className="input"
              />
            </div>
            <button
              onClick={generateGearList}
              disabled={gearLoading}
              className="btn-primary w-full"
            >
              {gearLoading ? 'Generating...' : 'Generate Gear List'}
            </button>
          </div>
        )}

        {mission.gearList && mission.gearList.length > 0 ? (
          <div className="space-y-4">
            {mission.gearList.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-sm text-primary-600 mb-2">{item.category}</p>
                    <p className="text-gray-700 text-sm mb-2">{item.description}</p>
                    {item.recommendation && (
                      <p className="text-sm text-gray-600 italic">💡 {item.recommendation}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedGear(item)}
                    className="ml-4 p-2 hover:bg-gray-100 rounded"
                    title="View details"
                  >
                    <Info className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No gear list yet. Generate one with AI!</p>
        )}
      </div>

      {/* Gear Details Modal */}
      {selectedGear && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold">{selectedGear.name}</h3>
              <button
                onClick={() => setSelectedGear(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <p className="text-primary-600 mb-4">{selectedGear.category}</p>
            <p className="text-gray-700 mb-4">{selectedGear.description}</p>
            {selectedGear.specifications && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Specifications:</h4>
                <div className="bg-gray-50 p-4 rounded">
                  {Object.entries(selectedGear.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-1">
                      <span className="font-medium">{key}:</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedGear.recommendation && (
              <div className="bg-primary-50 p-4 rounded">
                <p className="text-sm">💡 {selectedGear.recommendation}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
