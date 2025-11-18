import { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, Loader, Eye, EyeOff, Save } from 'lucide-react';

export default function AboutMe() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refining, setRefining] = useState(false);
  const [about, setAbout] = useState({
    rawText: '',
    refinedText: '',
    style: 'professional',
    isPublished: false,
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    fetchAbout();
  }, []);

  const fetchAbout = async () => {
    try {
      const response = await axios.get('/api/about', {
        withCredentials: true,
      });
      if (response.data) {
        setAbout(response.data);
      }
    } catch (error) {
      console.error('Error fetching about:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAbout({
      ...about,
      [name]: value,
    });
  };

  const refineWithAI = async () => {
    if (!about.rawText.trim()) {
      alert('Please write some text first');
      return;
    }

    setRefining(true);
    try {
      const response = await axios.post(
        '/api/about/refine',
        {
          rawText: about.rawText,
          style: about.style,
        },
        { withCredentials: true }
      );

      setAbout(response.data.about);
      setSuggestions(response.data.suggestions || []);
      setShowComparison(true);
    } catch (error) {
      console.error('Error refining text:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to refine text. Please try again.';
      alert(`AI Refinement Error: ${errorMessage}`);
    } finally {
      setRefining(false);
    }
  };

  const saveAbout = async () => {
    setSaving(true);
    try {
      await axios.post('/api/about', about, {
        withCredentials: true,
      });
      alert('About page saved successfully!');
    } catch (error) {
      console.error('Error saving about:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    try {
      const response = await axios.patch('/api/about/publish', {}, {
        withCredentials: true,
      });
      setAbout(response.data);
      alert(response.data.isPublished ? 'About page published!' : 'About page unpublished');
    } catch (error) {
      console.error('Error toggling publish:', error);
      alert('Failed to update publish status.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">About Me</h1>
          <p className="text-purple-200">Tell your story with AI assistance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Raw Text Editor */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Your Draft</h2>
              <select
                name="style"
                value={about.style}
                onChange={handleChange}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="artistic">Artistic</option>
                <option value="adventurous">Adventurous</option>
              </select>
            </div>

            <textarea
              name="rawText"
              value={about.rawText}
              onChange={handleChange}
              placeholder="Write about yourself, your photography journey, your style, what inspires you..."
              rows="15"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
            />

            <button
              onClick={refineWithAI}
              disabled={refining || !about.rawText.trim()}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg flex items-center justify-center gap-2"
            >
              {refining ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Refining with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Refine with AI
                </>
              )}
            </button>
          </div>

          {/* Refined Text Display */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">AI Refined Version</h2>
              {about.refinedText && (
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className="text-sm text-purple-300 hover:text-purple-200 flex items-center gap-1"
                >
                  {showComparison ? 'Hide' : 'Show'} Comparison
                </button>
              )}
            </div>

            {about.refinedText ? (
              <div className="space-y-4">
                <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white whitespace-pre-wrap min-h-[300px]">
                  {about.refinedText}
                </div>

                {suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-purple-300">AI Suggestions:</h3>
                    <ul className="space-y-1">
                      {suggestions.map((suggestion, index) => (
                        <li key={index} className="text-sm text-purple-200 flex items-start gap-2">
                          <span className="text-purple-400">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {showComparison && (
                  <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <h3 className="text-sm font-semibold text-purple-300 mb-2">Original:</h3>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{about.rawText}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Write your draft and click "Refine with AI"</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4 justify-center">
          <button
            onClick={saveAbout}
            disabled={saving || !about.rawText.trim()}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Draft
              </>
            )}
          </button>

          <button
            onClick={togglePublish}
            disabled={!about.refinedText}
            className={`px-6 py-3 rounded-lg font-semibold shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              about.isPublished
                ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
            } text-white`}
          >
            {about.isPublished ? (
              <>
                <EyeOff className="w-5 h-5" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="w-5 h-5" />
                Publish
              </>
            )}
          </button>
        </div>

        {about.isPublished && (
          <div className="mt-4 text-center">
            <p className="text-sm text-green-300">
              ✓ Your about page is live and visible to visitors
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
