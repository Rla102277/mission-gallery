import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, Loader, ChevronDown, ChevronUp, Camera, MapPin, Calendar } from 'lucide-react';

export default function CreateMissionEnhanced() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMissionPlan, setAiMissionPlan] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});
  const [saveAllMode, setSaveAllMode] = useState(true);

  const [aiFormData, setAiFormData] = useState({
    location: '',
    summary: '',
    duration: '7 days',
    model: 'llama-3.3-70b-versatile',
    gearRoles: `GFX 100S II ("The Portfolio"): 100MP, IBIS hero camera
Lenses: GF 32-64mm f/4, Mitakon 135mm f/2.5
X-E5 ("The Specialist"): Ultra-Wide dedicated
Lens: XF 10-24mm f/4
Konica Hexar RF ("The Artist"): Low-light, film-look
Lens: 28mm f/2.8
Insta360 ("The Experience"): 360° POV camera
iPhone: Diary, quick clips, timelapses`,
    includeDiptychs: true,
    includeTriptychs: true,
  });

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
    console.log('🚀 Sending to API:', aiFormData);
    console.log('📝 Selected model:', aiFormData.model);
    try {
      const response = await axios.post('/api/missions/generate', aiFormData, {
        withCredentials: true,
      });
      setAiMissionPlan(response.data.missions);
      // Expand first day by default
      if (response.data.missions && response.data.missions.length > 0) {
        setExpandedDays({ 0: true });
      }
    } catch (error) {
      console.error('Error generating missions:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to generate missions. Please try again.';
      alert(`AI Generation Error: ${errorMessage}`);
    } finally {
      setAiLoading(false);
    }
  };

  const toggleDay = (index) => {
    setExpandedDays({
      ...expandedDays,
      [index]: !expandedDays[index],
    });
  };

  const createMissionFromDay = async (day) => {
    setLoading(true);
    try {
      const locationNames = day.locations.map(loc => typeof loc === 'string' ? loc : loc.name).join(', ');
      const missionData = {
        title: day.title,
        description: `${locationNames} - ${day.coreMissions.length} missions planned`,
        location: aiFormData.location,
        aiGenerated: true,
        includeDiptychs: aiFormData.includeDiptychs,
        includeTriptychs: aiFormData.includeTriptychs,
        structuredPlan: day, // Store the full structured plan
      };

      const response = await axios.post('/api/missions', missionData, {
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

  const createGalleryFromDay = async (day) => {
    setLoading(true);
    try {
      // First create the mission
      const locationNames = day.locations.map(loc => typeof loc === 'string' ? loc : loc.name).join(', ');
      const missionData = {
        title: day.title,
        description: `${locationNames} - ${day.coreMissions.length} missions planned`,
        location: aiFormData.location,
        aiGenerated: true,
        includeDiptychs: aiFormData.includeDiptychs,
        includeTriptychs: aiFormData.includeTriptychs,
        structuredPlan: day,
      };

      const missionResponse = await axios.post('/api/missions', missionData, {
        withCredentials: true,
      });

      // Then create a gallery from it
      const galleryData = {
        missionId: missionResponse.data._id,
        title: day.title,
        description: `AI-generated gallery for ${aiFormData.location}`,
        isPublic: false,
        layout: 'grid',
      };

      await axios.post('/api/galleries', galleryData, {
        withCredentials: true,
      });

      alert(`Gallery "${day.title}" created successfully!`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating gallery:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create gallery. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const createPortfolioFromDay = async (day) => {
    setLoading(true);
    try {
      // First create the mission
      const locationNames = day.locations.map(loc => typeof loc === 'string' ? loc : loc.name).join(', ');
      const missionData = {
        title: day.title,
        description: `${locationNames} - ${day.coreMissions.length} missions planned`,
        location: aiFormData.location,
        aiGenerated: true,
        includeDiptychs: aiFormData.includeDiptychs,
        includeTriptychs: aiFormData.includeTriptychs,
        structuredPlan: day,
        isPortfolio: true, // Mark as portfolio
      };

      const missionResponse = await axios.post('/api/missions', missionData, {
        withCredentials: true,
      });

      // Create a portfolio gallery
      const galleryData = {
        missionId: missionResponse.data._id,
        title: `Portfolio: ${day.title}`,
        description: `Portfolio-worthy shots from ${aiFormData.location}`,
        isPublic: false,
        layout: 'grid',
        isPortfolio: true,
      };

      await axios.post('/api/galleries', galleryData, {
        withCredentials: true,
      });

      alert(`Portfolio gallery "${day.title}" created! Images will be marked as portfolio-worthy.`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating portfolio:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create portfolio. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const saveAllToGallery = async () => {
    if (!aiMissionPlan || aiMissionPlan.length === 0) {
      alert('No mission plan to save!');
      return;
    }

    setLoading(true);
    try {
      // Create missions for all days
      const missionPromises = aiMissionPlan.map(day => {
        const locationNames = day.locations.map(loc => typeof loc === 'string' ? loc : loc.name).join(', ');
        return axios.post('/api/missions', {
          title: day.title,
          description: `${locationNames} - ${day.coreMissions.length} missions planned`,
          location: aiFormData.location,
          aiGenerated: true,
          includeDiptychs: aiFormData.includeDiptychs,
          includeTriptychs: aiFormData.includeTriptychs,
          structuredPlan: day,
        }, { withCredentials: true });
      });

      const missionResponses = await Promise.all(missionPromises);
      
      // Create one gallery with all missions
      const galleryData = {
        missionId: missionResponses[0].data._id, // Use first mission as primary
        title: `${aiFormData.location} - Complete Trip`,
        description: `All ${aiMissionPlan.length} days from ${aiFormData.location} trip`,
        isPublic: false,
        layout: 'grid',
      };

      await axios.post('/api/galleries', galleryData, {
        withCredentials: true,
      });

      alert(`All ${aiMissionPlan.length} days saved to one gallery!`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving all to gallery:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save all. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Create New Mission</h1>
          <p className="text-purple-200">Plan your photography adventure</p>
        </div>

        {/* AI Mission Generator Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            AI Mission Generator
          </h2>

          <form onSubmit={generateMissions} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={aiFormData.location}
                  onChange={handleAiChange}
                  placeholder="e.g., Iceland, Patagonia, Iceland"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Trip Summary
                </label>
                <textarea
                  name="summary"
                  value={aiFormData.summary}
                  onChange={handleAiChange}
                  placeholder="Describe your trip goals, style, and what you want to capture..."
                  rows="4"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={aiFormData.duration}
                    onChange={handleAiChange}
                    placeholder="e.g., 7 days, 2 weeks"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    AI Model
                  </label>
                  <select
                    name="model"
                    value={aiFormData.model}
                    onChange={handleAiChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <optgroup label="🆓 Groq (Best Free - Fastest!)" className="bg-gray-900">
                      <option value="llama-3.3-70b-versatile" className="bg-gray-900">🚀 Llama 3.3 70B (Recommended)</option>
                      <option value="llama-3.1-8b-instant" className="bg-gray-900">⚡ Llama 3.1 8B (Ultra Fast)</option>
                    </optgroup>
                    <optgroup label="💰 Google Gemini (Cheap)" className="bg-gray-900">
                      <option value="gemini-1.5-flash" className="bg-gray-900">Gemini 1.5 Flash</option>
                      <option value="gemini-2.5-flash" className="bg-gray-900">Gemini 2.5 Flash (Newer)</option>
                      <option value="gemini-2.5-pro" className="bg-gray-900">Gemini 2.5 Pro</option>
                    </optgroup>
                    <optgroup label="🆓 Together AI ($25 free credit)" className="bg-gray-900">
                      <option value="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo" className="bg-gray-900">Llama 3.1 70B Turbo</option>
                      <option value="mistralai/Mixtral-8x7B-Instruct-v0.1" className="bg-gray-900">Mixtral 8x7B</option>
                      <option value="meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo" className="bg-gray-900">Llama 3.1 8B Turbo</option>
                    </optgroup>
                    <optgroup label="🤖 Anthropic Claude" className="bg-gray-900">
                      <option value="claude-3-5-haiku-20241022" className="bg-gray-900">Claude 3.5 Haiku (Fast)</option>
                      <option value="claude-3-5-sonnet-20241022" className="bg-gray-900">Claude 3.5 Sonnet (Best)</option>
                    </optgroup>
                    <optgroup label="💳 OpenAI (Premium)" className="bg-gray-900">
                      <option value="gpt-4o-mini" className="bg-gray-900">GPT-4o Mini</option>
                      <option value="gpt-4o" className="bg-gray-900">GPT-4o</option>
                      <option value="gpt-4-turbo" className="bg-gray-900">GPT-4 Turbo</option>
                    </optgroup>
                  </select>
                  <p className="text-xs text-purple-300 mt-1">
                    💡 Groq is FREE and FAST! 30 req/min. Auto-fallback to Gemini if rate limited.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Your Gear Inventory
                </label>
                <textarea
                  name="gearRoles"
                  value={aiFormData.gearRoles}
                  onChange={handleAiChange}
                  placeholder="List your cameras, lenses, and gear..."
                  rows="8"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-purple-200 cursor-pointer">
                  <input
                    type="checkbox"
                    name="includeDiptychs"
                    checked={aiFormData.includeDiptychs}
                    onChange={handleAiChange}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500"
                  />
                  Include Diptychs
                </label>
                <label className="flex items-center gap-2 text-purple-200 cursor-pointer">
                  <input
                    type="checkbox"
                    name="includeTriptychs"
                    checked={aiFormData.includeTriptychs}
                    onChange={handleAiChange}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500"
                  />
                  Include Triptychs
                </label>
              </div>

              <button
                type="submit"
                disabled={aiLoading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg flex items-center justify-center gap-2"
              >
                {aiLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Generating Mission Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Mission Plan
                  </>
                )}
              </button>
            </form>

            {/* AI Generated Mission Plan */}
            {aiMissionPlan && aiMissionPlan.length > 0 && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Your Mission Plan</h3>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveAllMode}
                        onChange={(e) => setSaveAllMode(e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm font-medium">
                        {saveAllMode ? 'Save All Days Together' : 'Save Individual Days'}
                      </span>
                    </label>
                    {saveAllMode && (
                      <button
                        onClick={saveAllToGallery}
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50 font-semibold shadow-lg flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            Save All {aiMissionPlan.length} Days as Mission Plan
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                {aiMissionPlan.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleDay(dayIndex)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-purple-400" />
                        <div className="text-left">
                          <h4 className="text-lg font-semibold text-white">{day.title}</h4>
                          <p className="text-sm text-purple-200">
                            {day.locations.join(' • ')} • {day.coreMissions.length} missions
                          </p>
                        </div>
                      </div>
                      {expandedDays[dayIndex] ? (
                        <ChevronUp className="w-5 h-5 text-purple-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-purple-400" />
                      )}
                    </button>

                    {expandedDays[dayIndex] && (
                      <div className="px-6 py-4 border-t border-white/10 space-y-4">
                        {/* Core Missions */}
                        <div>
                          <h5 className="text-sm font-semibold text-purple-300 mb-3">Core Missions</h5>
                          <div className="space-y-3">
                            {day.coreMissions.map((mission, missionIndex) => (
                              <div
                                key={missionIndex}
                                className="bg-white/5 rounded-lg p-4 border border-white/5"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {mission.id}
                                  </div>
                                  <div className="flex-1">
                                    <h6 className="font-semibold text-white mb-1">{mission.title}</h6>
                                    <p className="text-sm text-purple-200 mb-2">{mission.location}</p>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                      <span className="px-2 py-1 bg-purple-600/30 text-purple-200 rounded text-xs flex items-center gap-1">
                                        <Camera className="w-3 h-3" />
                                        {mission.gear}
                                      </span>
                                      {mission.settings && (
                                        <span className="px-2 py-1 bg-pink-600/30 text-pink-200 rounded text-xs">
                                          {mission.settings.mode} • {mission.settings.aperture} • ISO {mission.settings.iso}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-300 italic">{mission.idea}</p>
                                    {mission.specialNotes && (
                                      <p className="text-xs text-yellow-300 mt-2">⚠️ {mission.specialNotes}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Series Missions */}
                        {day.seriesMissions && day.seriesMissions.length > 0 && (
                          <div>
                            <h5 className="text-sm font-semibold text-purple-300 mb-3">Series (Diptychs/Triptychs)</h5>
                            <div className="space-y-2">
                              {day.seriesMissions.map((series, seriesIndex) => (
                                <div
                                  key={seriesIndex}
                                  className="bg-white/5 rounded-lg p-3 border border-white/5"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded text-xs font-bold">
                                      {series.id}
                                    </span>
                                    <span className="text-sm font-semibold text-white">{series.title}</span>
                                    <span className="text-xs text-purple-300">({series.type})</span>
                                  </div>
                                  <div className="text-xs text-gray-300 space-y-1">
                                    {series.frames.map((frame, frameIndex) => (
                                      <div key={frameIndex}>
                                        <span className="text-purple-400">{frame.label}:</span> {frame.description}
                                        {frame.missionRef && (
                                          <span className="text-purple-300"> → {frame.missionRef}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {!saveAllMode && (
                          <div className="mt-4">
                            <button
                              onClick={() => createMissionFromDay(day)}
                              disabled={loading}
                              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 font-semibold shadow-lg"
                            >
                              {loading ? 'Saving...' : `Save "${day.title}" as Mission Plan`}
                            </button>
                            <p className="text-xs text-purple-200 mt-2 text-center">
                              You can link photos and create galleries later from the mission detail page
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
