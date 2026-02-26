import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Sparkles, Loader, Eye, EyeOff, Save } from 'lucide-react';

export default function AboutMeEditor() {
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
      const response = await api.get('/api/about', {
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
      const response = await api.post(
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
      await api.post('/api/about', about, {
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
      const response = await api.patch('/api/about/publish', {}, {
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
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Raw Text Editor */}
        <div className="bg-stone-800/50 backdrop-blur-lg rounded-xl p-6 shadow-2xl border border-stone-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-stone-100">Your Draft</h2>
            <select
              name="style"
              value={about.style}
              onChange={handleChange}
              className="px-3 py-2 bg-stone-900/50 border border-stone-700 rounded-lg text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
            className="w-full px-4 py-3 bg-stone-900/50 border border-stone-700 rounded-lg text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
          />

          <button
            onClick={refineWithAI}
            disabled={refining || !about.rawText.trim()}
            className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg flex items-center justify-center gap-2"
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
        <div className="bg-stone-800/50 backdrop-blur-lg rounded-xl p-6 shadow-2xl border border-stone-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-stone-100">AI Refined Version</h2>
            {about.refinedText && (
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                {showComparison ? 'Hide' : 'Show'} Comparison
              </button>
            )}
          </div>

          {about.refinedText ? (
            <div className="space-y-4">
              <div className="px-4 py-3 bg-stone-900/50 border border-stone-700 rounded-lg text-stone-100 whitespace-pre-wrap min-h-[300px]">
                {about.refinedText}
              </div>

              {suggestions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-amber-400">AI Suggestions:</h3>
                  <ul className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-stone-300 flex items-start gap-2">
                        <span className="text-amber-500">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {showComparison && (
                <div className="mt-4 p-4 bg-stone-900/50 rounded-lg border border-stone-700">
                  <h3 className="text-sm font-semibold text-amber-400 mb-2">Original:</h3>
                  <p className="text-sm text-stone-400 whitespace-pre-wrap">{about.rawText}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-stone-500">
              <div className="text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Write your draft and click "Refine with AI"</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
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
        <div className="text-center">
          <p className="text-sm text-green-400">
            ✓ Your about page is live and visible to visitors
          </p>
        </div>
      )}
    </div>
  );
}
