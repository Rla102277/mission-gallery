/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dream-inspired color palette for Infinite Arch
        dream: {
          // Dreamy sky tones
          sky: {
            50: '#faf8f5',
            100: '#f5f1ea',
            200: '#e8dfd0',
            300: '#d9cab0',
            400: '#c9b490',
            500: '#b89e70',
            600: '#9a7f4f',
            700: '#7a6340',
            800: '#5a4930',
            900: '#3a2f20',
          },
          // Forest greens
          forest: {
            50: '#f3f6f4',
            100: '#e1ebe5',
            200: '#c3d7cb',
            300: '#9bb8a5',
            400: '#6d9680',
            500: '#4a7c5e',
            600: '#3d6850',
            700: '#2f5240',
            800: '#233d31',
            900: '#172821',
          },
          // Rich earth tones
          earth: {
            50: '#f9f7f4',
            100: '#f0ebe3',
            200: '#ddd0bd',
            300: '#c5ae8e',
            400: '#a88b5f',
            500: '#8b6f3f',
            600: '#725a33',
            700: '#5a4628',
            800: '#42331d',
            900: '#2a2013',
          },
          // Misty haze
          mist: {
            50: '#fdfcfb',
            100: '#f9f7f4',
            200: '#f0ebe3',
            300: '#e3dace',
            400: '#d1c4b0',
            500: '#baa88c',
            600: '#9d8a6e',
            700: '#7d6e58',
            800: '#5d5242',
            900: '#3d362c',
          },
          // Dream gold
          gold: {
            50: '#fdf8f3',
            100: '#faeee0',
            200: '#f3d9b8',
            300: '#e8bd85',
            400: '#d99d52',
            500: '#c67d2f',
            600: '#a66325',
            700: '#854e1e',
            800: '#643b17',
            900: '#432810',
          },
        },
        // Updated primary with deep purple-blue tones for the Infinite Arch theme
        primary: {
          50: '#f3f4fa',
          100: '#e9eaf5',
          200: '#d3d5eb',
          300: '#b6b8db',
          400: '#9294c6',
          500: '#7577b5',
          600: '#5c5e96',
          700: '#4b4d79',
          800: '#3a3b5c',
          900: '#292a3f',
        },
      },
      fontFamily: {
        serif: ['Merriweather', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'canvas-texture': "url('data:image/svg+xml,%3Csvg width=\"100\" height=\"100\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"4\" /%3E%3C/filter%3E%3Crect width=\"100\" height=\"100\" filter=\"url(%23noise)\" opacity=\"0.05\" /%3E%3C/svg%3E')",
      },
    },
  },
  safelist: [
    'd1','d2','d3','d4','d5',
    'fade-up','fade-in',
    'tia-loading','tia-spinner','tia-card','tia-nav',
    'btn-tia','btn-tia-gold','btn-tia-solid',
    'photo-grid','photo-cell','photo-cell-overlay',
    'tia-footer','footer-quote',
    'label-sm','label-gold',
    'wordmark','wm-arch','wm-infinite','wm-the','wm-r-heavy','wm-r-thin','wm-r-bot',
    'nav-links','page-wrap','section',
  ],
  plugins: [],
}
