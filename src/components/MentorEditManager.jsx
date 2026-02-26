import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Crop,
  MessageSquare,
  Sliders,
  Download,
  Eye,
  EyeOff,
  Save,
  Folder,
  Share2,
  Link as LinkIcon,
  RefreshCcw,
  Plus,
} from 'lucide-react';
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
  const [edits, setEdits] = useState(() => ({ ...defaultEdits }));
  const [editedPreviewUrl, setEditedPreviewUrl] = useState('');
  const [showAfter, setShowAfter] = useState(false);
  const [loading, setLoading] = useState({ crop: false, critique: false, quickedit: false });
  const [showLightroomModal, setShowLightroomModal] = useState(false);
  const [sessionList, setSessionList] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionSaving, setSessionSaving] = useState(false);
  const [autoStatus, setAutoStatus] = useState('idle'); // idle | saving | saved
  const [sessionTitle, setSessionTitle] = useState('MentorEdit Session');
  const [sessionDescription, setSessionDescription] = useState('');
  const [session, setSession] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const cropSignature = useMemo(() => JSON.stringify(crops), [crops]);
  const editsSignature = useMemo(() => JSON.stringify(edits), [edits]);

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await api.get('/api/mentor/sessions');
      setSessionList(res.data || []);
    } catch (error) {
      console.error('Failed to load sessions', error);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const resetSessionState = useCallback(() => {
    setSession(null);
    setSessionTitle('MentorEdit Session');
    setSessionDescription('');
    setImage(null);
    setPreviewUrl('');
    setCrops({});
    setCritique('');
    setEdits({ ...defaultEdits });
    setEditedPreviewUrl('');
    setShowAfter(false);
    setShareCopied(false);
    setAutoStatus('idle');
  }, []);

  const applySessionData = useCallback((data) => {
    if (!data) return;
    setSession(data);
    setSessionTitle(data.title || 'MentorEdit Session');
    setSessionDescription(data.description || '');
    if (data.image?.url) {
      setImage(data.image);
      setPreviewUrl(data.image.url);
    } else {
      setImage(null);
      setPreviewUrl('');
    }

    if (Array.isArray(data.crops)) {
      const map = {};
      data.crops.forEach((crop) => {
        if (crop?.name && crop?.url) map[crop.name] = crop.url;
      });
      setCrops(map);
    } else {
      setCrops({});
    }

    setEdits(data.edits ? { ...defaultEdits, ...data.edits } : { ...defaultEdits });
    const critiqueText = typeof data.critique === 'string' ? data.critique : data.critique?.text || '';
    setCritique(critiqueText);
    setEditedPreviewUrl('');
    setShowAfter(false);
    setShareCopied(false);
  }, []);

  const handleLoadSession = useCallback(
    async (sessionId) => {
      if (!sessionId) return;
      setSessionsLoading(true);
      try {
        const res = await api.get(`/api/mentor/sessions/${sessionId}`);
        applySessionData(res.data);
      } catch (error) {
        console.error('Failed to load session', error);
        alert('Failed to load session.');
      } finally {
        setSessionsLoading(false);
      }
    },
    [applySessionData]
  );

  const buildCropArray = () =>
    Object.entries(crops).map(([name, url]) => ({
      name,
      url,
    }));

  const saveSession = useCallback(
    async ({ silent = false, auto = false, forceRefresh } = {}) => {
      if (!image?.url) {
        if (!silent) {
          alert('Upload or import an image before saving the session.');
        }
        return null;
      }

      if (auto) {
        setAutoStatus('saving');
      } else {
        setSessionSaving(true);
      }

      try {
        const payload = {
          sessionId: session?._id,
          title: sessionTitle,
          description: sessionDescription,
          image,
          crops: buildCropArray(),
          edits,
          critique: critique ? { text: critique } : null,
          isPublic: session?.isPublic || false,
        };

        const res = await api.post('/api/mentor/sessions', payload);
        applySessionData(res.data);

        const shouldRefreshList =
          typeof forceRefresh === 'boolean'
            ? forceRefresh
            : !silent || !session?._id;

        if (shouldRefreshList) {
          fetchSessions();
        }

        if (auto) {
          setAutoStatus('saved');
          setTimeout(() => setAutoStatus('idle'), 2000);
        }

        return res.data;
      } catch (error) {
        console.error('Failed to save session', error);
        if (!silent) {
          alert('Failed to save session. Check console.');
        }
      } finally {
        if (!auto) {
          setSessionSaving(false);
        }
      }
      return null;
    },
    [applySessionData, critique, edits, fetchSessions, image, session, sessionDescription, sessionTitle]
  );

  const handleSaveSession = useCallback(() => {
    saveSession({ silent: false });
  }, [saveSession]);

  useEffect(() => {
    if (!image?.url) return;
    const timeout = setTimeout(() => {
      saveSession({ silent: true, auto: true, forceRefresh: !session?._id });
    }, 2000);
    return () => clearTimeout(timeout);
  }, [image, cropSignature, editsSignature, critique, sessionTitle, sessionDescription, saveSession, session?._id]);

  const handleToggleShare = useCallback(async () => {
    if (!session?._id) return;
    setShareLoading(true);
    try {
      const res = await api.post(`/api/mentor/sessions/${session._id}/share`, {
        isPublic: !session.isPublic,
      });
      applySessionData(res.data);
      fetchSessions();
    } catch (error) {
      console.error('Failed to update sharing', error);
      alert('Unable to update sharing state. Check console.');
    } finally {
      setShareLoading(false);
    }
  }, [applySessionData, fetchSessions, session]);

  const handleCopyShareLink = useCallback(() => {
    if (!session?.isPublic || !session?.shareId) return;
    const shareUrl = `${window.location.origin}/mentor/share/${session.shareId}`;
    navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }, [session]);

  const handleFileUpload = useCallback(
    async (file) => {
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
        setCrops({});
        setCritique('');
        setEditedPreviewUrl('');
        setShowAfter(false);
      } catch (err) {
        console.error('Upload failed', err);
        alert('Upload failed. Check console.');
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const handleLightroomImport = useCallback(async () => {
    setLightroomImporting(true);
    try {
      const token = await getValidLightroomAccessToken();
      if (!token) {
        window.location.href = `${window.location.origin}/test/lightroom`;
        return;
      }
      setShowLightroomModal(true);
    } catch (err) {
      console.error('Lightroom import failed', err);
      alert('Lightroom import failed. Check console.');
    } finally {
      setLightroomImporting(false);
    }
  }, []);

  const handleLightroomAlbumSelect = useCallback(async (album) => {
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
      setImage(res.data);
      setPreviewUrl(res.data.url);
      setCrops({});
      setCritique('');
      setEditedPreviewUrl('');
      setShowAfter(false);
    } catch (err) {
      console.error('Failed to import Lightroom photo', err);
      alert('Failed to import photo from Lightroom. Check console.');
    }
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((f) => f.type.startsWith('image/'));
      if (imageFile) handleFileUpload(imageFile);
    },
    [handleFileUpload]
  );

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

  const currentShareUrl = session?.isPublic && session?.shareId ? `${window.location.origin}/mentor/share/${session.shareId}` : '';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-amber-500 mb-2">MentorEdit</h2>
        <p className="text-stone-400">Upload a photo for critique, auto crops, quick edits, and XMP preset export.</p>
      </div>

      <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1 space-y-3">
            <div>
              <label className="block text-sm text-stone-400 mb-1">Session Title</label>
              <input
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="MentorEdit Session"
              />
            </div>
            <div>
              <label className="block text-sm text-stone-400 mb-1">Notes / Description</label>
              <textarea
                value={sessionDescription}
                onChange={(e) => setSessionDescription(e.target.value)}
                rows={2}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="What are we focusing on in this edit?"
              />
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={handleSaveSession}
                disabled={sessionSaving || !image?.url}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 transition"
              >
                <Save className="w-4 h-4" />
                {sessionSaving ? 'Saving...' : session ? 'Save Changes' : 'Save Session'}
              </button>
              <button
                onClick={resetSessionState}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-100 transition"
              >
                <Plus className="w-4 h-4" />
                New Session
              </button>
              {session?._id && (
                <button
                  onClick={handleToggleShare}
                  disabled={shareLoading}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    session.isPublic ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-stone-800 hover:bg-stone-700'
                  } text-white disabled:opacity-50`}
                >
                  <Share2 className="w-4 h-4" />
                  {shareLoading ? 'Updating...' : session.isPublic ? 'Disable Sharing' : 'Share Session'}
                </button>
              )}
              <span className="text-xs text-stone-500">
                {autoStatus === 'saving' && 'Auto-saving...'}
                {autoStatus === 'saved' && 'All changes saved'}
              </span>
            </div>
            {session?.isPublic && currentShareUrl && (
              <div className="flex items-center gap-3 bg-stone-800/70 border border-stone-700 rounded-lg px-3 py-2">
                <LinkIcon className="w-4 h-4 text-amber-400" />
                <div className="flex-1 text-sm text-stone-300 truncate">{currentShareUrl}</div>
                <button onClick={handleCopyShareLink} className="text-sm text-amber-400 hover:text-amber-300 underline">
                  {shareCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>
          <div className="lg:w-72 bg-stone-900 border border-stone-800 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-200 font-medium">
                <Folder className="w-4 h-4 text-amber-500" />
                Saved Sessions
              </div>
              <button onClick={fetchSessions} className="p-1 rounded text-stone-400 hover:text-amber-400 hover:bg-stone-800">
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sessionsLoading ? (
                <p className="text-sm text-stone-400">Loading sessions...</p>
              ) : sessionList.length === 0 ? (
                <p className="text-sm text-stone-500">No saved sessions yet.</p>
              ) : (
                sessionList.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => handleLoadSession(item._id)}
                    className={`w-full text-left px-3 py-2 rounded-lg border ${
                      session?._id === item._id
                        ? 'border-amber-500 bg-amber-500/10 text-amber-100'
                        : 'border-stone-800 bg-stone-900 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    <p className="text-sm font-medium truncate">{item.title || 'Untitled Session'}</p>
                    <p className="text-xs text-stone-500">
                      {new Date(item.updatedAt).toLocaleDateString()} · {item.isPublic ? 'Shared' : 'Private'}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

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

          <MentorEditSliders edits={edits} onChange={setEdits} />

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

          {critique && (
            <div className="space-y-2">
              <h4 className="text-amber-400 font-medium">Critique</h4>
              <pre className="whitespace-pre-wrap text-stone-300 text-sm bg-stone-800/50 border border-stone-700 rounded p-4">{critique}</pre>
            </div>
          )}
        </div>
      )}

      {showLightroomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-stone-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <LightroomAlbumSelector onSelect={handleLightroomAlbumSelect} onCancel={() => setShowLightroomModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default MentorEditManager;
