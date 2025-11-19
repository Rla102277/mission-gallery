import { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, Loader } from 'lucide-react';

export default function MyGear() {
  const [loading, setLoading] = useState(true);
  const [gear, setGear] = useState(null);

  useEffect(() => {
    fetchGear();
  }, []);

  const fetchGear = async () => {
    try {
      const response = await axios.get('/api/gear/published');
      if (response.data) {
        setGear(response.data);
      }
    } catch (error) {
      console.error('Error fetching gear:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 flex items-center justify-center">
        <Loader className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50 to-stone-100">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-stone-900 via-amber-900 to-stone-900 py-24 px-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnpNNiAzNGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Camera className="w-20 h-20 text-amber-400 mx-auto mb-6" />
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            My Gear
          </h1>
          <p className="text-2xl text-stone-300 max-w-2xl mx-auto leading-relaxed">
            The tools that help me capture the world
          </p>
        </div>
      </div>

      {/* Blog Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        {gear && gear.refinedContent ? (
          <article className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Article Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-12">
              <div className="flex items-center gap-3 text-white/90 text-sm mb-4">
                <Camera className="w-5 h-5" />
                <span>Photography Equipment</span>
                <span>•</span>
                <span>{new Date(gear.updatedAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                The Gear Behind the Shots
              </h2>
            </div>

            {/* Article Body */}
            <div className="px-8 md:px-12 py-12">
              <div className="prose prose-lg prose-stone max-w-none">
                <div className="text-stone-700 leading-relaxed space-y-6 whitespace-pre-wrap text-lg">
                  {gear.refinedContent}
                </div>
              </div>
            </div>

            {/* Article Footer */}
            <div className="border-t border-stone-200 px-8 py-6 bg-stone-50">
              <p className="text-stone-600 text-sm text-center">
                Last updated: {new Date(gear.updatedAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </article>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
            <Camera className="w-20 h-20 text-stone-300 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-stone-800 mb-4">
              Gear Information Coming Soon
            </h2>
            <p className="text-stone-600 text-lg">
              Check back later to learn about the equipment I use to capture my photographs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
