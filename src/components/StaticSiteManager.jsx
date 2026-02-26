import { useEffect } from 'react';
import { ExternalLink, Images, LayoutTemplate, Info } from 'lucide-react';
import { getApiUrl } from '../lib/api';

const staticPageMappings = [
  {
    page: '/pages/gallery.html',
    source: 'Series and photos from TIA config',
    imageSlots: 'Series covers: s1-s8 + photos per series',
  },
  {
    page: '/pages/portfolio.html',
    source: 'Portfolio slots from TIA config',
    imageSlots: 'pf-s1, pf-s3, pf-s2, pf-s5, pf-s7 (fallback: series cover)',
  },
  {
    page: '/pages/about.html',
    source: 'Admin About model',
    imageSlots: 'Text from published About; images remain static design elements',
  },
];

export default function StaticSiteManager() {
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      localStorage.setItem('tia_auth_token', authToken);
    }

    const apiBase = getApiUrl();
    if (apiBase) {
      localStorage.setItem('tia_api_base', apiBase);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-stone-800/50 border border-stone-700 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-stone-100 mb-2 flex items-center gap-2">
          <LayoutTemplate className="w-6 h-6 text-amber-500" />
          Static Site Manager
        </h2>
        <p className="text-stone-400 text-sm">
          Use this panel to edit legacy static pages from the main admin. Your login token and API base are synced automatically.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/legacy-admin/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
          >
            Open Legacy Static Editor
            <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href="/pages/gallery.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-stone-600 hover:border-stone-500 text-stone-200 rounded-lg"
          >
            Preview Gallery Page
            <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href="/pages/portfolio.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-stone-600 hover:border-stone-500 text-stone-200 rounded-lg"
          >
            Preview Portfolio Page
            <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href="/pages/about.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-stone-600 hover:border-stone-500 text-stone-200 rounded-lg"
          >
            Preview About Page
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="bg-stone-800/50 border border-stone-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-stone-100 mb-4 flex items-center gap-2">
          <Images className="w-5 h-5 text-amber-500" />
          Static Image Mapping
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-stone-400 border-b border-stone-700">
                <th className="py-2 pr-4">Static Page</th>
                <th className="py-2 pr-4">Data Source</th>
                <th className="py-2">Image Slots</th>
              </tr>
            </thead>
            <tbody>
              {staticPageMappings.map((item) => (
                <tr key={item.page} className="border-b border-stone-800 last:border-0">
                  <td className="py-3 pr-4 text-stone-200">{item.page}</td>
                  <td className="py-3 pr-4 text-stone-300">{item.source}</td>
                  <td className="py-3 text-stone-300">{item.imageSlots}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-stone-900/70 border border-stone-700 text-xs text-stone-400 flex gap-2">
          <Info className="w-4 h-4 mt-0.5 text-amber-500" />
          Assign static page images in Legacy Static Editor → Lightroom tab (import assets), then map series covers and portfolio slots before Save & Publish.
        </div>
      </div>

      <div className="bg-stone-800/50 border border-stone-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-700">
          <h3 className="text-lg font-semibold text-stone-100">Embedded Legacy Editor</h3>
          <p className="text-xs text-stone-400 mt-1">If this panel appears blank, open it in a new tab using the button above.</p>
        </div>
        <iframe
          title="Legacy Static Editor"
          src="/legacy-admin/"
          className="w-full h-[78vh] bg-stone-900"
        />
      </div>
    </div>
  );
}
