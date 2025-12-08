import { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, ExternalLink, Crop, MessageSquare, Sliders, Download, Eye, EyeOff } from 'lucide-react';
import api from '../lib/api';
import { getValidLightroomAccessToken } from '../lib/lightroomAuth';
import MentorEditSliders from './MentorEditSliders';
import LightroomAlbumSelector from './LightroomAlbumSelector';

const defaultEdits = {
  exposure: 0.35,
  contrast: 10,
  highlights: -45,
  shadows: 20,
  whites: 12,
  blacks: -12,
  texture: 15,
  clarity: 5,
  dehaze: 12,
  orangeHue: -5,
  orangeSaturation: 10,
  orangeLuminance: 5,
  redSaturation: 8,
  yellowSaturation: -10,
  yellowLuminance: 10,
  greenHue: 12,
  greenSaturation: -20,
  greenLuminance: -5,
  vignette: -8,
};

function MentorEditManager() {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [lightroomImporting, setLightroomImporting] = useState(false);
  const [crops, setCrops] = useState({});
  const [critique, setCritique] = useState('');
  const [edits, setEdits] = useState(defaultEdits);
  const [editedPreviewUrl, setEditedPreviewUrl] = useState('');
  const [showAfter, setShowAfter] = useState(false);
  const [loading, setLoading] = useState({ crop: false, critique: false, quickedit: false });
  const [showLightroomModal, setShowLightroomModal] = useState(false);
  const [selectedLightroomAlbum, setSelectedLightroomAlbum] = useState(null);

  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/api/mentor/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreviewUrl(res.data.url);
      setImage(res.data);
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed. Check console.');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleLightroomImport = useCallback(async () => {
    setLightroomImporting(true);
    try {
      const token = await getValidLightroomAccessToken();
      if (!token) {
        // Redirect to Lightroom OAuth flow (reuse existing LightroomTest flow)
        window.location.href = `${window.location.origin}/test/lightroom`;
        return;
      }
      // Open album selector modal
      setShowLightroomModal(true);
    } catch (err) {
      console.error('Lightroom import failed', err);
      alert('Lightroom import failed. Check console.');
    } finally {
      setLightroomImporting(false);
    }
  }, []);

  const handleLightroomAlbumSelect = useCallback(async (album) => {
    setSelectedLightroomAlbum(album);
    setShowLightroomModal(false);
    try {
      const token = await getValidLightroomAccessToken();
      if (!token) {
        alert('Lightroom token missing. Please re-authenticate.');
        return;
      }
      const res = await api.post('/api/mentor/import-lightroom', {
        albumId: album.id,
        catalogId: album.catalog_id || 'default',
        adobeToken: token,
      });
      // Set the imported image as the MentorEdit image
      setImage(res.data);
      setPreviewUrl(res.data.url);
      // Reset previous results
      setCrops({});
      setCritique('');
      setEditedPreviewUrl('');
      setShowAfter(false);
    } catch (err) {
      console.error('Failed to import Lightroom photo', err);
      alert('Failed to import photo from Lightroom. Check console.');
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((f) => f.type.startsWith('image/'));
    if (imageFile) handleFileUpload(imageFile);
  }, [handleFileUpload]);

  const onDragOver = (e) => e.preventDefault();

  const handleGenerateCrops = useCallback(async () => {
    if (!image?.path) return;
    setLoading((prev) => ({ ...prev, crop: true }));
    try {
      const res = await api.post('/api/mentor/crop', { imagePath: image.path });
      setCrops(res.data);
    } catch (err) {
      console.error('Crop generation failed', err);
      alert('Crop generation failed. Check console.');
    } finally {
      setLoading((prev) => ({ ...prev, crop: false }));
    }
  }, [image]);

  const handleGenerateCritique = useCallback(async () => {
    if (!image?.path) return;
    setLoading((prev) => ({ ...prev, critique: true }));
    try {
      const res = await api.post('/api/mentor/critique', { imagePath: image.path });
      setCritique(res.data.critique);
    } catch (err) {
      console.error('Critique generation failed', err);
      alert('Critique generation failed. Check console.');
    } finally {
      setLoading((prev) => ({ ...prev, critique: false }));
    }
  }, [image]);

  const handleQuickEdit = useCallback(async () => {
    if (!image?.path) return;
    setLoading((prev) => ({ ...prev, quickedit: true }));
    try {
      const res = await api.post('/api/mentor/quickedit', { imagePath: image.path, edits });
      setEditedPreviewUrl(res.data.previewUrl);
      setShowAfter(true);
    } catch (err) {
      console.error('Quick edit failed', err);
      alert('Quick edit failed. Check console.');
    } finally {
      setLoading((prev) => ({ ...prev, quickedit: false }));
    }
  }, [image, edits]);

  const handleDownloadPreset = useCallback(() => {
    window.location.href = '/api/mentor/preset';
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-amber-500 mb-2">MentorEdit</h2>
        <p className="text-stone-400">Upload a photo for critique, auto crops, quick edits, and XMP preset export.</p>
      </div>

      {/* Upload / Import */}
      {!previewUrl ? (
        <div
          className="border-2 border-dashed border-stone-600 rounded-lg p-12 text-center hover:border-stone-500 transition-colors"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <Upload className="w-12 h-12 text-stone-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-300 mb-2">Drop your image here</h3>
          <p className="text-stone-500 mb-4">or click to browse</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
            id="mentor-upload-input"
          />
          <label
            htmlFor="mentor-upload-input"
            className="inline-block px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer transition-colors"
          >
            {uploading ? 'Uploading...' : 'Choose File'}
          </label>
          <div className="mt-6">
            <button
              onClick={handleLightroomImport}
              disabled={lightroomImporting}
              className="text-stone-400 hover:text-stone-200 underline text-sm disabled:opacity-50"
            >
              {lightroomImporting ? 'Connecting...' : 'Import from Lightroom'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-stone-800/50 border border-stone-700 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-8 h-8 text-stone-400" />
              <div>
                <p className="text-stone-200 font-medium">Uploaded</p>
                <p className="text-stone-500 text-sm">{image.filename || 'Image'}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setImage(null);
                setPreviewUrl('');
              }}
              className="text-stone-400 hover:text-red-400 text-sm"
            >
              Remove
            </button>
          </div>
          <img src={previewUrl} alt="Uploaded" className="rounded-lg max-w-full h-auto" />
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleGenerateCrops}
              disabled={loading.crop}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Crop className="w-4 h-4" />
              {loading.crop ? 'Generating...' : 'Generate Crops'}
            </button>
            <button
              onClick={handleGenerateCritique}
              disabled={loading.critique}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              {loading.critique ? 'Analyzing...' : 'Critique'}
            </button>
            <button
              onClick={handleQuickEdit}
              disabled={loading.quickedit}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Sliders className="w-4 h-4" />
              {loading.quickedit ? 'Editing...' : 'Quick Edit'}
            </button>
            <button
              onClick={handleDownloadPreset}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export .xmp Preset
            </button>
            {editedPreviewUrl && (
              <button
                onClick={() => setShowAfter(!showAfter)}
                className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {showAfter ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showAfter ? 'Show Before' : 'Show After'}
              </button>
            )}
          </div>

          {/* Before/After Preview */}
          {editedPreviewUrl && (
            <div className="space-y-2">
              <h4 className="text-amber-400 font-medium">Preview</h4>
              <img
                src={showAfter ? editedPreviewUrl : previewUrl}
                alt={showAfter ? 'Edited' : 'Original'}
                className="rounded-lg max-w-full h-auto border border-stone-700"
              />
            </div>
          )}

          {/* Quick Edit Sliders */}
          <MentorEditSliders edits={edits} onChange={setEdits} />

          {/* Crops */}
          {crops.portrait && (
            <div className="space-y-2">
              <h4 className="text-amber-400 font-medium">Auto Crops</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-stone-400 text-sm mb-1">4:5 Portrait</p>
                  <img src={crops.portrait} alt="Portrait crop" className="rounded border border-stone-700" />
                </div>
                <div>
                  <p className="text-stone-400 text-sm mb-1">2:1 Panorama</p>
                  <img src={crops.pano} alt="Pano crop" className="rounded border border-stone-700" />
                </div>
                <div>
                  <p className="text-stone-400 text-sm mb-1">3:2 Tight Landscape</p>
                  <img src={crops.tight} alt="Tight crop" className="rounded border border-stone-700" />
                </div>
              </div>
            </div>
          )}

          {/* Critique */}
          {critique && (
            <div className="space-y-2">
              <h4 className="text-amber-400 font-medium">Critique</h4>
              <pre className="whitespace-pre-wrap text-stone-300 text-sm bg-stone-800/50 border border-stone-700 rounded p-4">{critique}</pre>
            </div>
          )}
        </div>
      )}

      {/* Lightroom Album Selector Modal */}
      {showLightroomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-stone-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <LightroomAlbumSelector
              onSelect={handleLightroomAlbumSelect}
              onCancel={() => setShowLightroomModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MentorEditManager;
