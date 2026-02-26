import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import {
  Camera,
  Palette,
  Sparkles,
  Layers,
  Save,
  Loader2,
  FolderOpen,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Image as ImageIcon,
  Plus,
} from 'lucide-react';

const designPresets = [
  {
    value: 'immersive',
    title: 'Immersive Showcase',
    description: 'Full-bleed hero with cinematic storytelling sections',
    layout: 'slideshow',
  },
  {
    value: 'masonry',
    title: 'Modern Masonry',
    description: 'Waterfall of cards inspired by SmugMug balance',
    layout: 'masonry',
  },
  {
    value: 'storyboard',
    title: 'Storyboard',
    description: 'Editorial grid with bold captions and copy',
    layout: 'grid',
  },
];

const themeOptions = [
  { value: 'dark', label: 'Nightfall', preview: 'from-stone-900 via-stone-800 to-black' },
  { value: 'light', label: 'Soft Light', preview: 'from-white via-stone-100 to-stone-200' },
  { value: 'earth', label: 'Earth Tones', preview: 'from-amber-900/80 via-amber-800/60 to-stone-900' },
];

const defaultPrintPricing = {
  '8x10': 25,
  '11x14': 35,
  '16x20': 65,
  '20x30': 95,
  '24x36': 145,
};

const createStoryBlock = () => ({
  id: `story-${Date.now()}-${Math.round(Math.random() * 1000)}`,
  title: 'Untitled Chapter',
  body: '',
  accent: '',
  assetId: null,
});

const buildThumbnailUrl = (url, size = 800) => {
  if (!url || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/c_fill,w_${size},h_${size},q_auto,f_auto/`);
};

const sanitizeAsset = (asset) => ({
  publicId: asset.public_id || asset.publicId,
  url: asset.url,
  secureUrl: asset.secure_url || asset.secureUrl,
  thumbnailUrl: asset.thumbnailUrl || buildThumbnailUrl(asset.secure_url || asset.url),
  width: asset.width,
  height: asset.height,
  format: asset.format,
  resourceType: asset.resource_type || asset.resourceType,
  tags: asset.tags || [],
  bytes: asset.bytes,
  folder: asset.folder,
  createdAt: asset.created_at || asset.createdAt,
});

function CreateGallery() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [foldersLoading, setFoldersLoading] = useState(true);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [cloudinaryFolders, setCloudinaryFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState('mission-gallery');
  const [cloudinaryAssets, setCloudinaryAssets] = useState([]);
  const [assetCursor, setAssetCursor] = useState(null);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [heroAssetId, setHeroAssetId] = useState('');
  const [printsOpen, setPrintsOpen] = useState(false);
  const [sections, setSections] = useState({
    heroTagline: 'Signature Collection',
    heroDescription: '',
    storyBlocks: [createStoryBlock()],
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: true,
    enablePrints: false,
    designPreset: 'immersive',
    theme: 'dark',
    printPricing: { ...defaultPrintPricing },
  });

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    if (!activeFolder) return;
    loadAssets(activeFolder);
  }, [activeFolder]);

  const loadFolders = async () => {
    setFoldersLoading(true);
    try {
      const res = await api.get('/api/cloudinary/folders', {
        params: { parent: 'mission-gallery' },
      });
      setCloudinaryFolders(res.data.folders || []);
    } catch (error) {
      console.error('Error loading Cloudinary folders:', error);
      alert('Failed to load Cloudinary folders.');
    } finally {
      setFoldersLoading(false);
    }
  };

  const loadAssets = async (prefix, nextCursor = null, append = false) => {
    setResourcesLoading(true);
    try {
      const res = await api.get('/api/cloudinary/resources', {
        params: {
          prefix,
          nextCursor,
          maxResults: 60,
        },
      });
      setCloudinaryAssets((prev) => (append ? [...prev, ...(res.data.resources || [])] : res.data.resources || []));
      setAssetCursor(res.data.nextCursor || null);
    } catch (error) {
      console.error('Error loading Cloudinary assets:', error);
      alert('Unable to fetch Cloudinary assets.');
    } finally {
      setResourcesLoading(false);
    }
  };

  const toggleAssetSelection = (asset) => {
    const normalized = sanitizeAsset(asset);
    setSelectedAssets((prev) => {
      const exists = prev.find((a) => a.publicId === normalized.publicId);
      if (exists) {
        const filtered = prev.filter((a) => a.publicId !== normalized.publicId);
        if (heroAssetId === normalized.publicId) {
          setHeroAssetId(filtered[0]?.publicId || '');
        }
        return filtered;
      }
      if (!heroAssetId) {
        setHeroAssetId(normalized.publicId);
      }
      return [...prev, normalized];
    });
  };

  const moveSelectedAsset = (publicId, direction) => {
    setSelectedAssets((prev) => {
      const index = prev.findIndex((asset) => asset.publicId === publicId);
      if (index === -1) return prev;
      const newOrder = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= newOrder.length) return prev;
      [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
      return newOrder;
    });
  };

  const removeSelectedAsset = (publicId) => {
    setSelectedAssets((prev) => {
      const filtered = prev.filter((asset) => asset.publicId !== publicId);
      if (heroAssetId === publicId) {
        setHeroAssetId(filtered[0]?.publicId || '');
      }
      return filtered;
    });
  };

  const updateForm = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePricingChange = (size, value) => {
    setFormData((prev) => ({
      ...prev,
      printPricing: {
        ...prev.printPricing,
        [size]: parseFloat(value) || 0,
      },
    }));
  };

  const updateSections = (key, value) => {
    setSections((prev) => ({ ...prev, [key]: value }));
  };

  const updateStoryBlock = (id, field, value) => {
    setSections((prev) => ({
      ...prev,
      storyBlocks: prev.storyBlocks.map((block) =>
        block.id === id ? { ...block, [field]: value } : block
      ),
    }));
  };

  const addStoryBlock = () => {
    setSections((prev) => ({
      ...prev,
      storyBlocks: [...prev.storyBlocks, createStoryBlock()],
    }));
  };

  const removeStoryBlock = (id) => {
    setSections((prev) => {
      if (prev.storyBlocks.length === 1) return prev;
      return {
        ...prev,
        storyBlocks: prev.storyBlocks.filter((block) => block.id !== id),
      };
    });
  };

  const heroAsset = useMemo(
    () => selectedAssets.find((asset) => asset.publicId === heroAssetId) || selectedAssets[0],
    [selectedAssets, heroAssetId]
  );

  const mappedAssetsForPayload = selectedAssets.map((asset) => ({
    publicId: asset.publicId,
    url: asset.url,
    secureUrl: asset.secureUrl,
    thumbnailUrl: asset.thumbnailUrl,
    width: asset.width,
    height: asset.height,
    format: asset.format,
    resourceType: asset.resourceType,
    tags: asset.tags,
    bytes: asset.bytes,
    folder: asset.folder,
    createdAt: asset.createdAt,
  }));

  const presetLayout = useMemo(() => {
    const preset = designPresets.find((item) => item.value === formData.designPreset);
    return preset?.layout || 'grid';
  }, [formData.designPreset]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please provide a gallery title');
      return;
    }
    if (selectedAssets.length === 0) {
      alert('Select at least one Cloudinary image to build your gallery.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description,
        isPublic: formData.isPublic,
        enablePrints: formData.enablePrints,
        printPricing: formData.enablePrints ? formData.printPricing : undefined,
        designPreset: formData.designPreset,
        theme: formData.theme,
        layout: presetLayout,
        cloudinaryFolder: activeFolder,
        cloudinaryAssets: mappedAssetsForPayload,
        heroImage: heroAsset
          ? {
              publicId: heroAsset.publicId,
              url: heroAsset.url,
              secureUrl: heroAsset.secureUrl,
              thumbnailUrl: heroAsset.thumbnailUrl,
              width: heroAsset.width,
              height: heroAsset.height,
              format: heroAsset.format,
            }
          : null,
        sections,
        images: [],
      };

      const response = await api.post('/api/galleries', payload, {
        withCredentials: true,
      });
      navigate(`/galleries/${response.data._id}`);
    } catch (error) {
      console.error('Error creating gallery:', error);
      alert(error.response?.data?.error || 'Failed to create gallery.');
    } finally {
      setLoading(false);
    }
  };

  const detailStepComplete = formData.title.trim().length > 0;
  const selectionStepComplete = selectedAssets.length > 0;
  const storyStepComplete = sections.heroDescription.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-black text-stone-100 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-200 text-sm tracking-widest uppercase">
            <Sparkles className="w-4 h-4" />
            Cloudinary-First Flow
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Craft a SmugMug-style gallery</h1>
          <p className="text-stone-400 text-lg max-w-2xl mx-auto">
            Curate, theme, and publish a cinematic collection backed entirely by Cloudinary assets.
          </p>
          <div className="flex justify-center gap-4 text-sm text-stone-400">
            <span className={detailStepComplete ? 'text-amber-300' : ''}>1. Details</span>
            <span>•</span>
            <span className={selectionStepComplete ? 'text-amber-300' : ''}>2. Cloudinary Selection</span>
            <span>•</span>
            <span className={storyStepComplete ? 'text-amber-300' : ''}>3. Storytelling</span>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Gallery Details */}
          <section className="bg-stone-900/60 border border-stone-800 rounded-2xl p-8 shadow-xl shadow-black/40">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-stone-500 mb-2">Step 01</p>
                <h2 className="text-3xl font-semibold flex items-center gap-3">
                  <ImageIcon className="w-6 h-6 text-amber-400" />
                  Gallery Identity
                </h2>
                <p className="text-stone-400 max-w-xl mt-2">
                  Give your collection a name, vibe, and commerce options. This fuels the hero, metadata, and layout presets.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-stone-800/60 border border-stone-700 rounded-full px-5 py-2 text-sm text-stone-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Inspired by SmugMug storytelling
              </div>
            </div>

            <div className="grid gap-6 mt-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm uppercase tracking-widest text-stone-500 mb-2">
                    Gallery Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={updateForm}
                    placeholder="Arctic Air — The 2024 Expedition"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm uppercase tracking-widest text-stone-500 mb-2">
                    Hero Tagline
                  </label>
                  <input
                    type="text"
                    value={sections.heroTagline}
                    onChange={(e) => updateSections('heroTagline', e.target.value)}
                    placeholder="Fjord light, endless night."
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm uppercase tracking-widest text-stone-500 mb-2">
                  Gallery Narrative
                </label>
                <textarea
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={updateForm}
                  placeholder="Set the stage for viewers. Mention the location, purpose, or project behind the work."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm uppercase tracking-widest text-stone-500">
                    Design Preset
                  </label>
                  <div className="space-y-3">
                    {designPresets.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, designPreset: preset.value }))
                        }
                        className={`w-full text-left px-4 py-3 rounded-xl border transition ${
                          formData.designPreset === preset.value
                            ? 'border-amber-400 bg-amber-400/10 text-amber-100'
                            : 'border-stone-800 hover:border-stone-600 text-stone-300'
                        }`}
                      >
                        <p className="font-semibold">{preset.title}</p>
                        <p className="text-sm text-stone-400">{preset.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm uppercase tracking-widest text-stone-500">
                    Theme
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {themeOptions.map((theme) => (
                      <button
                        key={theme.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, theme: theme.value }))
                        }
                        className={`w-full px-4 py-3 rounded-xl border flex items-center gap-3 transition ${
                          formData.theme === theme.value
                            ? 'border-amber-400 bg-amber-400/10 text-amber-100'
                            : 'border-stone-800 hover:border-stone-600 text-stone-300'
                        }`}
                      >
                        <span
                          className={`w-12 h-12 rounded-lg bg-gradient-to-br ${theme.preview}`}
                        />
                        <div>
                          <p className="font-semibold">{theme.label}</p>
                          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
                            Palette
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 border border-stone-800 rounded-2xl p-4 bg-stone-950/40">
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={updateForm}
                    className="w-5 h-5 accent-amber-500"
                  />
                  <span>Make gallery public on publish</span>
                </label>
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    name="enablePrints"
                    checked={formData.enablePrints}
                    onChange={updateForm}
                    className="w-5 h-5 accent-amber-500"
                  />
                  <span>Enable print price sheet</span>
                </label>
              </div>

              {formData.enablePrints && (
                <div className="bg-stone-950/40 border border-stone-800 rounded-2xl p-5 space-y-4">
                  <button
                    type="button"
                    onClick={() => setPrintsOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <div>
                      <p className="text-sm uppercase tracking-widest text-stone-500">Print Pricing</p>
                      <p className="text-lg font-semibold">Set price tiers</p>
                    </div>
                    {printsOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  </button>
                  {printsOpen && (
                    <div className="grid sm:grid-cols-3 gap-4">
                      {Object.entries(formData.printPricing).map(([size, price]) => (
                        <div key={size} className="space-y-2">
                          <p className="text-sm text-stone-400">{size}"</p>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-stone-600">$</span>
                            <input
                              type="number"
                              min="0"
                              value={price}
                              onChange={(e) => handlePricingChange(size, e.target.value)}
                              className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-7 pr-3 py-2 text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Cloudinary Explorer */}
          <section className="bg-stone-900/60 border border-stone-800 rounded-2xl p-8 shadow-xl shadow-black/40">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-stone-500 mb-2">Step 02</p>
                <h2 className="text-3xl font-semibold flex items-center gap-3">
                  <FolderOpen className="w-6 h-6 text-amber-400" />
                  Cloudinary Explorer
                </h2>
                <p className="text-stone-400 max-w-xl mt-2">
                  Browse any folder inside your <span className="text-amber-300">mission-gallery</span> space and tap shots to add them to the collection.
                </p>
              </div>
              <div className="text-sm text-stone-400">
                {selectedAssets.length} assets selected
              </div>
            </div>

            <div className="mt-8 grid lg:grid-cols-4 gap-6">
              {/* Folder Rail */}
              <div className="lg:col-span-1 space-y-3 max-h-[32rem] overflow-y-auto pr-2 border-r border-stone-800">
                {foldersLoading ? (
                  <div className="flex items-center gap-2 text-stone-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading folders...
                  </div>
                ) : cloudinaryFolders.length === 0 ? (
                  <p className="text-sm text-stone-500">No Cloudinary folders detected.</p>
                ) : (
                  cloudinaryFolders.map((folder) => (
                    <button
                      key={folder.path}
                      type="button"
                      onClick={() => setActiveFolder(folder.path)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition ${
                        activeFolder === folder.path
                          ? 'border-amber-400 bg-amber-400/10 text-amber-100'
                          : 'border-stone-800 hover:border-stone-700 text-stone-300'
                      }`}
                    >
                      <p className="font-semibold">{folder.name}</p>
                      <p className="text-xs uppercase tracking-[0.3em] text-stone-500">/{folder.path}</p>
                    </button>
                  ))
                )}
              </div>

              {/* Asset Grid */}
              <div className="lg:col-span-3">
                {resourcesLoading ? (
                  <div className="flex items-center justify-center h-64 text-stone-500">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Loading assets...
                  </div>
                ) : cloudinaryAssets.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-stone-500 border border-dashed border-stone-700 rounded-2xl">
                    <Camera className="w-10 h-10 mb-3" />
                    <p>No images found in this folder.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {cloudinaryAssets.map((asset) => {
                        const isSelected = selectedAssets.some((a) => a.publicId === asset.public_id);
                        return (
                          <button
                            key={asset.asset_id}
                            type="button"
                            onClick={() => toggleAssetSelection(asset)}
                            className={`group relative rounded-2xl overflow-hidden border transition ${
                              isSelected
                                ? 'border-amber-400 ring-2 ring-amber-500/40'
                                : 'border-stone-800 hover:border-stone-700'
                            }`}
                          >
                            <img
                              src={buildThumbnailUrl(asset.secure_url)}
                              alt={asset.public_id}
                              className="w-full h-48 object-cover transition duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 text-left text-xs">
                              <p className="text-white font-semibold truncate">{asset.public_id.split('/').pop()}</p>
                              <p className="text-stone-300">{asset.width} × {asset.height}</p>
                            </div>
                            {isSelected && (
                              <div className="absolute top-3 right-3 bg-amber-500 text-black text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                                Added
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {assetCursor && (
                      <div className="mt-6 flex justify-center">
                        <button
                          type="button"
                          onClick={() => loadAssets(activeFolder, assetCursor, true)}
                          className="inline-flex items-center gap-2 px-6 py-3 border border-stone-700 rounded-full hover:border-amber-400 hover:text-amber-200 transition"
                        >
                          Load more
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Selected Strip */}
            {selectedAssets.length > 0 && (
              <div className="mt-8 bg-stone-950/60 border border-stone-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-400" />
                    Curated Sequence
                  </h3>
                  <p className="text-sm text-stone-500">Drag-like controls with hero picker</p>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {selectedAssets.map((asset, index) => (
                    <div key={asset.publicId} className="relative min-w-[180px]">
                      <img
                        src={asset.thumbnailUrl}
                        alt={asset.publicId}
                        className={`h-40 w-full object-cover rounded-xl border ${
                          heroAsset?.publicId === asset.publicId
                            ? 'border-amber-400'
                            : 'border-stone-800'
                        }`}
                      />
                      <div className="absolute inset-x-2 -bottom-3 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveSelectedAsset(asset.publicId, -1)}
                          className="p-1 rounded-full bg-stone-900/90 border border-stone-700 text-xs disabled:opacity-40"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeroAssetId(asset.publicId)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            heroAsset?.publicId === asset.publicId
                              ? 'bg-amber-400 text-black border-amber-400'
                              : 'bg-stone-900/80 text-stone-200 border-stone-700'
                          }`}
                        >
                          {heroAsset?.publicId === asset.publicId ? 'Hero' : 'Set Hero'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSelectedAsset(asset.publicId)}
                          className="p-1 rounded-full bg-stone-900/90 border border-stone-700 text-xs"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Storytelling */}
          <section className="bg-stone-900/60 border border-stone-800 rounded-2xl p-8 shadow-xl shadow-black/40">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-stone-500 mb-2">Step 03</p>
                <h2 className="text-3xl font-semibold flex items-center gap-3">
                  <Palette className="w-6 h-6 text-amber-400" />
                  Storytelling Blocks
                </h2>
                <p className="text-stone-400 max-w-xl mt-2">
                  Shape the narrative hero copy and up to three supporting chapters that call out specific photos.
                </p>
              </div>
              <button
                type="button"
                onClick={addStoryBlock}
                className="inline-flex items-center gap-2 px-4 py-2 border border-stone-700 rounded-full text-sm hover:border-amber-400 hover:text-amber-200"
              >
                <Plus className="w-4 h-4" />
                Add chapter
              </button>
            </div>

            <div className="grid gap-6 mt-8">
              <div>
                <label className="block text-sm uppercase tracking-widest text-stone-500 mb-2">
                  Hero Description
                </label>
                <textarea
                  rows={3}
                  value={sections.heroDescription}
                  onChange={(e) => updateSections('heroDescription', e.target.value)}
                  placeholder="Describe the overall story the viewer is stepping into..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              {sections.storyBlocks.map((block, idx) => (
                <div key={block.id} className="bg-stone-950/50 border border-stone-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-stone-500">
                        Chapter {idx + 1}
                      </p>
                      <h3 className="text-xl font-semibold">{block.title || 'Untitled'}</h3>
                    </div>
                    {sections.storyBlocks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStoryBlock(block.id)}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-3">
                      <input
                        type="text"
                        value={block.title}
                        onChange={(e) => updateStoryBlock(block.id, 'title', e.target.value)}
                        placeholder="Aurora Chase"
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                      <textarea
                        rows={3}
                        value={block.body}
                        onChange={(e) => updateStoryBlock(block.id, 'body', e.target.value)}
                        placeholder="Talk through the intent, location, or gear notes for this set."
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-widest text-stone-500">Featured Photo</p>
                      <select
                        value={block.assetId || ''}
                        onChange={(e) => updateStoryBlock(block.id, 'assetId', e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      >
                        <option value="">Select from chosen assets</option>
                        {selectedAssets.map((asset) => (
                          <option key={asset.publicId} value={asset.publicId}>
                            {asset.publicId.split('/').pop()}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={block.accent}
                        onChange={(e) => updateStoryBlock(block.id, 'accent', e.target.value)}
                        placeholder="Moonlit ridge • 4,500m"
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-stone-700 rounded-full text-stone-300 hover:text-white hover:border-amber-400 transition"
            >
              Cancel and go back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-base font-semibold bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-lg shadow-amber-500/30 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Publish Cloudinary Gallery
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChevronUpIcon() {
  return <ChevronUp className="w-5 h-5 text-stone-400" />;
}

function ChevronDownIcon() {
  return <ChevronDown className="w-5 h-5 text-stone-400" />;
}

import { ChevronDown, ChevronUp } from 'lucide-react';

export default CreateGallery;
