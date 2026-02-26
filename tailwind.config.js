/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
  // Safelist TIA classes used dynamically so Tailwind doesn't purge them
  safelist: [
    'fade-up', 'fade-in',
    'd1', 'd2', 'd3', 'd4',
    'tia-spinner', 'tia-lb', 'tia-lb-img',
    'photo-grid', 'photo-cell', 'photo-overlay',
    'wordmark', 'wm-bar-top', 'wm-bar-sub', 'wm-the', 'wm-infinite', 'wm-arch', 'wm-bar-bottom',
    'tia-nav', 'nav-solid', 'nav-links', 'nav-btn',
    'btn-tia', 'btn-gold', 'btn-solid',
    'tia-footer', 'footer-quote',
    'label-xs', 'label-gold', 'rule-dark', 'rule-gold',
    'f-display', 'f-body',
    'page-top', 'pg-hd', 'pg-bd',
    'lb-close', 'lb-arrow', 'lb-meta',
    'tia-input', 'tia-textarea', 'tia-select', 'tia-label',
    'mob-ham',
  ],
}
