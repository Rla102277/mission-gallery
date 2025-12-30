import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Loader, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AboutMe() {
  const [loading, setLoading] = useState(true);
  const [about, setAbout] = useState(null);

  useEffect(() => {
    fetchAbout();
  }, []);

  const fetchAbout = async () => {
    try {
      const response = await api.get('/api/about');
      if (response.data && response.data.isPublished) {
        setAbout(response.data);
      }
    } catch (error) {
      console.error('Error fetching about:', error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-700 to-primary-900 flex items-center justify-center">
        <Loader className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-700 to-primary-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {about ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-8 h-8 text-primary-400" />
              <h1 className="text-3xl font-bold text-white">About Me</h1>
            </div>
            <div className="prose prose-invert prose-lg max-w-none">
              <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                {about.refinedText || about.rawText}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 shadow-2xl border border-white/20 text-center">
            <User className="w-16 h-16 text-primary-400/50 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Profile Yet</h2>
            <p className="text-primary-200">The photographer hasn't published their profile yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
