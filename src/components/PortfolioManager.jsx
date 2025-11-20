import { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2, Globe, Edit3, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';

const defaultForm = {
  title: '',
  slug: '',
  heroImage: '',
  aboutContent: '',
  gearSummary: '',
  galleryIds: [],
};

export default function PortfolioManager({ galleries = [] }) {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [publishingId, setPublishingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/portfolios');
      setPortfolios(response.data);
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      alert('Failed to load portfolios');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleGallerySelection = (galleryId) => {
    setFormData((prev) => {
      const exists = prev.galleryIds.includes(galleryId);
      return {
        ...prev,
        galleryIds: exists
          ? prev.galleryIds.filter((id) => id !== galleryId)
          : [...prev.galleryIds, galleryId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/api/portfolios/${editingId}`, formData);
      } else {
        await api.post('/api/portfolios', formData);
      }
      resetForm();
      fetchPortfolios();
    } catch (error) {
      console.error('Error saving portfolio:', error);
      alert(error.response?.data?.error || 'Failed to save portfolio');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (portfolio) => {
    setEditingId(portfolio._id);
    setFormData({
      title: portfolio.title || '',
      slug: portfolio.slug || '',
      heroImage: portfolio.heroImage?.url || '',
      aboutContent: portfolio.aboutContent || '',
      gearSummary: portfolio.gearSummary || '',
      galleryIds: portfolio.galleryIds?.map((g) => (typeof g === 'string' ? g : g._id)) || [],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (portfolioId) => {
    if (!window.confirm('Delete this portfolio? This cannot be undone.')) return;
    setDeletingId(portfolioId);
    try {
      await api.delete(`/api/portfolios/${portfolioId}`);
      fetchPortfolios();
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      alert('Failed to delete portfolio');
    } finally {
      setDeletingId(null);
    }
  };

  const publishPortfolio = async (portfolio) => {
    setPublishingId(portfolio._id);
    try {
      await api.post(`/api/portfolios/${portfolio._id}/publish`, {
        slug: portfolio.slug || portfolio.title,
      });
      fetchPortfolios();
    } catch (error) {
      console.error('Error publishing portfolio:', error);
      alert(error.response?.data?.error || 'Failed to publish portfolio');
    } finally {
      setPublishingId(null);
    }
  };

  const unpublishPortfolio = async (portfolioId) => {
    setPublishingId(portfolioId);
    try {
      await api.post(`/api/portfolios/${portfolioId}/unpublish`);
      fetchPortfolios();
    } catch (error) {
      console.error('Error unpublishing portfolio:', error);
      alert('Failed to unpublish portfolio');
    } finally {
      setPublishingId(null);
    }
  };

  const selectedGalleries = useMemo(
    () =>
      galleries.filter((gallery) => formData.galleryIds.includes(gallery._id)),
    [galleries, formData.galleryIds]
  );

  return (
    <div className="space-y-8">
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{editingId ? 'Edit Portfolio' : 'Create Portfolio'}</h2>
            <p className="text-sm text-purple-200">Curate a public-facing portfolio site.</p>
          </div>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-sm text-purple-200 hover:text-white"
            >
              Cancel edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-purple-200 mb-1">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
                placeholder="e.g., Dragon Coast Portfolio"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-purple-200 mb-1">Slug (optional)</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
                placeholder="dragon-coast"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-purple-200 mb-1">Hero Image URL</label>
            <input
              type="url"
              name="heroImage"
              value={formData.heroImage}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
              placeholder="https://..."
            />
            {formData.heroImage && (
              <img src={formData.heroImage} alt="Hero preview" className="mt-2 rounded-lg max-h-48 object-cover" />
            )}
          </div>
          <div>
            <label className="block text-sm text-purple-200 mb-1">About Section</label>
            <textarea
              name="aboutContent"
              value={formData.aboutContent}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-4 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
              placeholder="Tell visitors about this body of work..."
            />
          </div>
          <div>
            <label className="block text-sm text-purple-200 mb-1">Gear Summary</label>
            <textarea
              name="gearSummary"
              value={formData.gearSummary}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-4 py-2 rounded-lg bg-black/30 border border-white/10 text-white"
              placeholder="Highlight the gear featured in this portfolio"
            />
          </div>
          <div>
            <label className="block text-sm text-purple-200 mb-2">Include Galleries</label>
            <div className="grid md:grid-cols-2 gap-3">
              {galleries.length === 0 ? (
                <p className="text-sm text-purple-300">No galleries available yet.</p>
              ) : (
                galleries.map((gallery) => (
                  <label
                    key={gallery._id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      formData.galleryIds.includes(gallery._id)
                        ? 'border-emerald-400 bg-emerald-500/10'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.galleryIds.includes(gallery._id)}
                      onChange={() => toggleGallerySelection(gallery._id)}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-white font-medium">{gallery.title}</p>
                      <p className="text-xs text-purple-200">{gallery.description || '—'}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
            {selectedGalleries.length > 0 && (
              <p className="text-xs text-purple-300 mt-2">
                {selectedGalleries.length} gallery{selectedGalleries.length === 1 ? '' : 'ies'} selected
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'Update Portfolio' : 'Create Portfolio'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Existing Portfolios</h2>
            <p className="text-sm text-purple-200">
              {portfolios.length === 0 ? 'No portfolios yet' : `${portfolios.length} total`}
            </p>
          </div>
          <button className="flex items-center gap-2 text-sm text-purple-300" onClick={fetchPortfolios}>
            <Plus className="w-4 h-4" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-purple-200">Loading portfolios...</div>
        ) : portfolios.length === 0 ? (
          <div className="bg-white/5 border border-dashed border-white/10 rounded-lg p-8 text-center text-purple-200">
            No portfolios yet. Use the form above to create one.
          </div>
        ) : (
          portfolios.map((portfolio) => (
            <div key={portfolio._id} className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-semibold text-white">{portfolio.title}</h3>
                    {portfolio.status === 'published' ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Published
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-200 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Draft
                      </span>
                    )}
                  </div>
                  {portfolio.slug && portfolio.status === 'published' && (
                    <a
                      href={`/portfolio/${portfolio.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      /portfolio/{portfolio.slug}
                      <Globe className="w-3 h-3" />
                    </a>
                  )}
                  <p className="text-sm text-purple-200 mt-2 line-clamp-2">{portfolio.aboutContent || 'No about content yet.'}</p>
                  <p className="text-xs text-purple-400 mt-1">
                    {portfolio.galleryIds?.length || 0} galleries linked · Updated {new Date(portfolio.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {portfolio.status === 'published' ? (
                    <button
                      onClick={() => unpublishPortfolio(portfolio._id)}
                      disabled={publishingId === portfolio._id}
                      className="px-4 py-2 text-sm border border-white/20 text-white rounded-lg hover:bg-white/10 disabled:opacity-50"
                    >
                      {publishingId === portfolio._id ? 'Unpublishing...' : 'Unpublish'}
                    </button>
                  ) : (
                    <button
                      onClick={() => publishPortfolio(portfolio)}
                      disabled={publishingId === portfolio._id}
                      className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                    >
                      {publishingId === portfolio._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Globe className="w-4 h-4" />
                      )}
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(portfolio)}
                    className="p-2 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg"
                    title="Edit"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(portfolio._id)}
                    disabled={deletingId === portfolio._id}
                    className="p-2 text-red-300 hover:text-white hover:bg-red-600/20 rounded-lg disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === portfolio._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
