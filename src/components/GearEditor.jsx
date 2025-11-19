import { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, Loader, Sparkles, Save, Eye } from 'lucide-react';

export default function GearEditor() {
  const [loading, setLoading] = useState(true);
  const [gear, setGear] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [rawGearList, setRawGearList] = useState('');
  const [refinedContent, setRefinedContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    fetchGear();
  }, []);

  const fetchGear = async () => {
    try {
      const response = await axios.get('/api/gear', { withCredentials: true });
      if (response.data) {
        setGear(response.data);
        setRawGearList(response.data.rawGearList || '');
        setRefinedContent(response.data.refinedContent || '');
      }
    } catch (error) {
      console.error('Error fetching gear:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async () => {
    if (!rawGearList.trim()) {
      alert('Please enter your gear list first');
      return;
    }

    setGenerating(true);
    try {
      const response = await axios.post('/api/gear/generate', {
        gearList: rawGearList
      }, { withCredentials: true });

      setRefinedContent(response.data.refinedContent);
    } catch (error) {
      console.error('Error generating content:', error);
      
      // Show detailed error message
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      const errorDetails = error.response?.data?.details;
      
      alert(`Failed to generate content: ${errorMessage}\n\n${errorDetails ? 'Check console for details.' : 'Please try again.'}`);
      
      if (errorDetails) {
        console.error('Error details:', errorDetails);
      }
    } finally {
      setGenerating(false);
    }
  };

  const saveGear = async () => {
    setSaveStatus('saving');
    try {
      await axios.post('/api/gear', {
        rawGearList,
        refinedContent,
        isPublished: true
      }, { withCredentials: true });

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 3000);
      fetchGear();
    } catch (error) {
      console.error('Error saving gear:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-100 mb-2">My Gear Editor</h2>
          <p className="text-stone-400">Create engaging content about your photography gear with AI</p>
        </div>
        <a
          href="/gear"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-stone-700 hover:bg-stone-600 text-stone-100 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
          Preview Public Page
        </a>
      </div>

      {/* Raw Gear List Input */}
      <div className="bg-stone-800/50 backdrop-blur-sm border border-stone-700 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-stone-100 mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-amber-500" />
          Your Gear List
        </h3>
        <textarea
          value={rawGearList}
          onChange={(e) => setRawGearList(e.target.value)}
          placeholder="Enter your gear list (cameras, lenses, accessories, etc.)&#10;&#10;Example:&#10;- Fujifilm X-T5&#10;- XF 16-55mm f/2.8 R LM WR&#10;- XF 50-140mm f/2.8 R LM OIS WR&#10;- Peak Design Everyday Backpack 30L&#10;- Really Right Stuff TFC-14 Tripod"
          className="w-full h-64 px-4 py-3 bg-stone-900/50 border border-stone-600 rounded-lg text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm resize-none"
        />
        <button
          onClick={generateContent}
          disabled={generating || !rawGearList.trim()}
          className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-stone-700 disabled:to-stone-700 disabled:text-stone-500 text-white rounded-lg transition-all font-semibold flex items-center gap-2"
        >
          {generating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Generating with AI...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Content with AI
            </>
          )}
        </button>
      </div>

      {/* Refined Content */}
      {refinedContent && (
        <div className="bg-stone-800/50 backdrop-blur-sm border border-stone-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-stone-100 mb-4">AI-Generated Content</h3>
          <p className="text-stone-400 text-sm mb-4">
            Review and edit the generated content. This will be displayed on your public My Gear page.
          </p>
          <textarea
            value={refinedContent}
            onChange={(e) => setRefinedContent(e.target.value)}
            className="w-full h-96 px-4 py-3 bg-stone-900/50 border border-stone-600 rounded-lg text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          />
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={saveGear}
              disabled={saveStatus === 'saving'}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-stone-700 disabled:text-stone-500 text-white rounded-lg transition-colors font-semibold flex items-center gap-2"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save & Publish
                </>
              )}
            </button>
            {saveStatus === 'saved' && (
              <span className="text-green-400 font-medium">✓ Saved successfully!</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-400 font-medium">✗ Failed to save</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
