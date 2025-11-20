import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { Loader2, Camera, ArrowLeft } from 'lucide-react';

export default function PortfolioView() {
  const { slug } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/portfolios/public/${slug}`);
        setPortfolio(response.data);
      } catch (err) {
        console.error('Error fetching portfolio:', err);
        setError('Portfolio not found or unpublished.');
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p>Loading portfolio...</p>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center space-y-4">
        <p className="text-lg">{error || 'Portfolio unavailable'}</p>
        <Link to="/" className="text-amber-400 hover:text-amber-300">Return home</Link>
      </div>
    );
  }

  const { heroImage, aboutContent, gearSummary, galleries = [] } = portfolio;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="relative w-full h-[55vh] overflow-hidden">
        {heroImage ? (
          <img src={heroImage.url || heroImage} alt={portfolio.title} className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center">
            <Camera className="w-16 h-16 text-slate-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 to-slate-950"></div>
        <div className="absolute inset-0 max-w-4xl mx-auto px-6 flex flex-col justify-end pb-16">
          <p className="uppercase tracking-[0.3em] text-sm text-slate-300 mb-2">Portfolio</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{portfolio.title}</h1>
          <p className="text-slate-200 max-w-2xl">{portfolio.subtitle || 'Curated photographic stories from the Mission Gallery studio.'}</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {(aboutContent || gearSummary) && (
          <section className="grid md:grid-cols-2 gap-8">
            {aboutContent && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-2xl font-semibold mb-3">About This Portfolio</h2>
                <p className="text-slate-200 whitespace-pre-line leading-relaxed">{aboutContent}</p>
              </div>
            )}
            {gearSummary && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-2xl font-semibold mb-3">Gear Highlights</h2>
                <p className="text-slate-200 whitespace-pre-line leading-relaxed">{gearSummary}</p>
              </div>
            )}
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-semibold">Featured Galleries</h2>
            <Link to="/galleries" className="text-amber-400 hover:text-amber-300 text-sm flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              View all galleries
            </Link>
          </div>

          {galleries.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-slate-300">
              No galleries linked yet.
            </div>
          ) : (
            <div className="space-y-8">
              {galleries.map((gallery) => (
                <article key={gallery._id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-white/5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <h3 className="text-2xl font-semibold">{gallery.title}</h3>
                        <p className="text-sm text-slate-300">
                          {gallery.description || 'Curated collection'} • {(gallery.images?.length || 0)} images
                        </p>
                      </div>
                      {gallery.slug && (
                        <Link
                          to={`/gallery/${gallery.slug}`}
                          className="text-sm text-amber-400 hover:text-amber-300"
                        >
                          View Gallery →
                        </Link>
                      )}
                    </div>
                  </div>
                  {gallery.images && gallery.images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                      {gallery.images.slice(0, 8).map((image) => (
                        <div key={image._id || image.imageId?._id} className="aspect-square overflow-hidden">
                          <img
                            src={image.imageId?.thumbnailPath || image.imageId?.path}
                            alt={image.imageId?.caption || 'Gallery image'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-slate-400 text-sm">No preview images available.</div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
