import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, Loader } from 'lucide-react';

export default function CreateMission() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiForm, setShowAiForm] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    includeDiptychs: false,
    includeTriptychs: false,
    layout: 'grid',
  });

  const [aiFormData, setAiFormData] = useState({
    location: '',
    summary: '',
    includeDiptychs: false,
    includeTriptychs: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleAiChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAiFormData({
      ...aiFormData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const generateMissions = async (e) => {
    e.preventDefault();
    setAiLoading(true);
    try {
      const response = await axios.post('/api/missions/generate', aiFormData, {
        withCredentials: true,
      });
      setAiSuggestions(response.data.missions);
    } catch (error) {
      console.error('Error generating missions:', error);
      alert('Failed to generate missions. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const selectAiMission = (mission) => {
    setFormData({
      ...formData,
      title: mission.title,
      description: mission.description,
      location: aiFormData.location,
      aiGenerated: true,
      includeDiptychs: aiFormData.includeDiptychs,
      includeTriptychs: aiFormData.includeTriptychs,
    });
    setShowAiForm(false);
    setAiSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('/api/missions', formData, {
        withCredentials: true,
      });
      navigate(`/missions/${response.data._id}`);
    } catch (error) {
      console.error('Error creating mission:', error);
      alert('Failed to create mission. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Mission</h1>

      {/* AI Generation Toggle */}
      <div className="card mb-6">
        <button
          onClick={() => setShowAiForm(!showAiForm)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary-600" />
            <span className="font-semibold">Generate Missions with AI</span>
          </div>
          <span className="text-sm text-gray-600">
            {showAiForm ? 'Hide' : 'Show'}
          </span>
        </button>

        {showAiForm && (
          <form onSubmit={generateMissions} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={aiFormData.location}
                onChange={handleAiChange}
                className="input"
                placeholder="e.g., Iceland, Tokyo, Grand Canyon"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trip Summary
              </label>
              <textarea
                name="summary"
                value={aiFormData.summary}
                onChange={handleAiChange}
                className="input"
                rows="4"
                placeholder="Describe what you want to do and photograph on this trip..."
                required
              />
            </div>

            <div className="flex space-x-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="includeDiptychs"
                  checked={aiFormData.includeDiptychs}
                  onChange={handleAiChange}
                  className="rounded"
                />
                <span className="text-sm">Include Diptychs</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="includeTriptychs"
                  checked={aiFormData.includeTriptychs}
                  onChange={handleAiChange}
                  className="rounded"
                />
                <span className="text-sm">Include Triptychs</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={aiLoading}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {aiLoading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Generate Mission Ideas</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* AI Suggestions */}
        {aiSuggestions.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold">AI-Generated Mission Ideas:</h3>
            {aiSuggestions.map((mission, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-2">{mission.title}</h4>
                <p className="text-gray-600 text-sm mb-3">{mission.description}</p>
                {mission.goals && (
                  <div className="mb-2">
                    <p className="text-sm font-medium">Goals:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {mission.goals.map((goal, i) => (
                        <li key={i}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <button
                  onClick={() => selectAiMission(mission)}
                  className="btn-primary text-sm"
                >
                  Use This Mission
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Form */}
      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mission Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="input"
            rows="4"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Layout Style
          </label>
          <select name="layout" value={formData.layout} onChange={handleChange} className="input">
            <option value="grid">Grid</option>
            <option value="masonry">Masonry</option>
            <option value="slideshow">Slideshow</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div className="flex space-x-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="includeDiptychs"
              checked={formData.includeDiptychs}
              onChange={handleChange}
              className="rounded"
            />
            <span className="text-sm">Include Diptychs</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="includeTriptychs"
              checked={formData.includeTriptychs}
              onChange={handleChange}
              className="rounded"
            />
            <span className="text-sm">Include Triptychs</span>
          </label>
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? 'Creating...' : 'Create Mission'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
