import { useState, useMemo } from 'react';
import { Heart, Mountain, MapPin, Sparkles, Zap, Camera, ChevronDown, ChevronUp, Copy, Download, X, Check } from 'lucide-react';

// Film Recipe Data
const filmRecipes = {
  'VSCO 01': [
    {
      name: 'Fuji 400H',
      iso: '400',
      usedFor: 'Versatile daylight film with muted colors and fine grain',
      characteristics: 'Soft, pastel tones with excellent skin tone reproduction. Low contrast with smooth gradations.',
      category: ['Portrait', 'Landscape', 'Travel'],
      tags: ['Soft', 'Pastel', 'Natural', 'Fine Grain'],
      settings: {
        filmSimulation: 'PRO Neg. Std',
        dynamicRange: 200,
        whiteBalance: 5500,
        tintShift: -1,
        colorChrome: 'Off',
        colorChromeBlue: 'Off',
        highlights: -2,
        shadows: -2,
        noiseReduction: -4,
        sharpness: -2,
        colorSaturation: -2
      }
    },
    {
      name: 'Kodak Portra 400',
      iso: '400',
      usedFor: 'Professional portrait film with warm, natural skin tones',
      characteristics: 'Warm color palette with fine grain. Excellent for people photography with smooth skin rendering.',
      category: ['Portrait', 'Travel'],
      tags: ['Warm', 'Natural', 'Professional', 'Skin Tones'],
      settings: {
        filmSimulation: 'PRO Neg. Std',
        dynamicRange: 200,
        whiteBalance: 5300,
        tintShift: 1,
        colorChrome: 'Off',
        colorChromeBlue: 'Off',
        highlights: -1,
        shadows: -1,
        noiseReduction: -4,
        sharpness: -1,
        colorSaturation: 0
      }
    },
    {
      name: 'Kodak Portra 800',
      iso: '800',
      usedFor: 'Low-light portrait film with warm tones and visible grain',
      characteristics: 'Warmer than Portra 400 with more pronounced grain. Great for indoor and low-light situations.',
      category: ['Portrait', 'Low-Light'],
      tags: ['Warm', 'Grain', 'Indoor', 'Moody'],
      settings: {
        filmSimulation: 'PRO Neg. Std',
        dynamicRange: 200,
        whiteBalance: 5000,
        tintShift: 2,
        colorChrome: 'Off',
        colorChromeBlue: 'Off',
        highlights: 0,
        shadows: 0,
        noiseReduction: -3,
        sharpness: -1,
        colorSaturation: 1
      }
    },
    {
      name: 'Ilford HP5',
      iso: '400',
      usedFor: 'Classic black and white film with strong contrast',
      characteristics: 'High contrast B&W with deep blacks and bright highlights. Timeless documentary look.',
      category: ['B&W', 'Portrait', 'Street'],
      tags: ['Contrast', 'Classic', 'Documentary', 'Timeless'],
      settings: {
        filmSimulation: 'ACROS',
        dynamicRange: 200,
        whiteBalance: 5500,
        tintShift: 0,
        colorChrome: 'Off',
        colorChromeBlue: 'Off',
        highlights: 1,
        shadows: -2,
        noiseReduction: -4,
        sharpness: 2,
        colorSaturation: 0
      }
    }
  ],
  'VSCO 02': [
    {
      name: 'Kodak Gold 200',
      iso: '200',
      usedFor: 'Consumer film with warm, nostalgic colors',
      characteristics: 'Warm golden tones with moderate contrast. Perfect for sunny days and vintage vibes.',
      category: ['Travel', 'Landscape'],
      tags: ['Warm', 'Nostalgic', 'Sunny', 'Vintage'],
      settings: {
        filmSimulation: 'Classic Chrome',
        dynamicRange: 200,
        whiteBalance: 5800,
        tintShift: 3,
        colorChrome: 'Weak',
        colorChromeBlue: 'Off',
        highlights: 0,
        shadows: 1,
        noiseReduction: -2,
        sharpness: 0,
        colorSaturation: 2
      }
    },
    {
      name: 'Fuji Superia 400',
      iso: '400',
      usedFor: 'Everyday consumer film with vibrant colors',
      characteristics: 'Punchy colors with good contrast. Great all-around film for various conditions.',
      category: ['Travel', 'Street'],
      tags: ['Vibrant', 'Versatile', 'Everyday', 'Punchy'],
      settings: {
        filmSimulation: 'Classic Chrome',
        dynamicRange: 200,
        whiteBalance: 5500,
        tintShift: 0,
        colorChrome: 'Weak',
        colorChromeBlue: 'Off',
        highlights: 1,
        shadows: 0,
        noiseReduction: -3,
        sharpness: 1,
        colorSaturation: 3
      }
    }
  ],
  'VSCO 07': [
    {
      name: 'Kodak Tri-X 400',
      iso: '400',
      usedFor: 'Legendary B&W film with rich tonality',
      characteristics: 'Classic grain structure with excellent shadow detail. The gold standard for B&W photography.',
      category: ['B&W', 'Street', 'Professional'],
      tags: ['Classic', 'Grain', 'Professional', 'Legendary'],
      settings: {
        filmSimulation: 'ACROS+Ye',
        dynamicRange: 200,
        whiteBalance: 5500,
        tintShift: 0,
        colorChrome: 'Off',
        colorChromeBlue: 'Off',
        highlights: 0,
        shadows: -1,
        noiseReduction: -4,
        sharpness: 1,
        colorSaturation: 0
      }
    }
  ],
  'Osan Bilgi': [
    {
      name: 'Classic Cuban Negative',
      iso: 'Auto',
      usedFor: 'Vintage Cuban street photography aesthetic',
      characteristics: 'Faded colors with high contrast. Captures the timeless feel of 1950s Havana.',
      category: ['Street', 'Travel'],
      tags: ['Vintage', 'Faded', 'Street', 'Retro'],
      settings: {
        filmSimulation: 'Classic Neg.',
        dynamicRange: 100,
        whiteBalance: 5000,
        tintShift: -3,
        colorChrome: 'Strong',
        colorChromeBlue: 'Weak',
        highlights: -1,
        shadows: 2,
        noiseReduction: -4,
        sharpness: -2,
        colorSaturation: -3
      }
    },
    {
      name: 'CubanAce',
      iso: 'Auto',
      usedFor: 'Vibrant street photography with punchy colors',
      characteristics: 'High saturation with strong color chrome. Modern take on classic street photography.',
      category: ['Street', 'Travel'],
      tags: ['Vibrant', 'Punchy', 'Modern', 'Bold'],
      settings: {
        filmSimulation: 'Velvia',
        dynamicRange: 100,
        whiteBalance: 5500,
        tintShift: 0,
        colorChrome: 'Strong',
        colorChromeBlue: 'Strong',
        highlights: 0,
        shadows: 1,
        noiseReduction: -4,
        sharpness: 2,
        colorSaturation: 4
      }
    },
    {
      name: 'Summer Chrome',
      iso: 'Auto',
      usedFor: 'Bright, airy summer landscapes',
      characteristics: 'Lifted shadows with bright highlights. Perfect for beach and outdoor scenes.',
      category: ['Landscape', 'Travel'],
      tags: ['Bright', 'Airy', 'Summer', 'Outdoor'],
      settings: {
        filmSimulation: 'Classic Chrome',
        dynamicRange: 200,
        whiteBalance: 6000,
        tintShift: -1,
        colorChrome: 'Weak',
        colorChromeBlue: 'Weak',
        highlights: 2,
        shadows: 2,
        noiseReduction: -4,
        sharpness: 0,
        colorSaturation: 1
      }
    },
    {
      name: 'Alpine Negative',
      iso: 'Auto',
      usedFor: 'Moody mountain and landscape photography',
      characteristics: 'Cool tones with deep shadows. Captures the dramatic feel of alpine environments.',
      category: ['Landscape', 'Professional'],
      tags: ['Moody', 'Cool', 'Dramatic', 'Mountain'],
      settings: {
        filmSimulation: 'Classic Neg.',
        dynamicRange: 400,
        whiteBalance: 6500,
        tintShift: -2,
        colorChrome: 'Medium',
        colorChromeBlue: 'Strong',
        highlights: -2,
        shadows: -2,
        noiseReduction: -4,
        sharpness: 1,
        colorSaturation: -1
      }
    }
  ],
  'MGA Collection': [
    {
      name: 'Kodachrome Classic',
      iso: 'Auto',
      usedFor: 'Legendary slide film with rich, saturated colors',
      characteristics: 'Deep reds and blues with excellent color separation. The most iconic color film ever made.',
      category: ['Landscape', 'Travel', 'Professional'],
      tags: ['Legendary', 'Saturated', 'Rich', 'Iconic'],
      settings: {
        filmSimulation: 'Velvia',
        dynamicRange: 200,
        whiteBalance: 5500,
        tintShift: 1,
        colorChrome: 'Strong',
        colorChromeBlue: 'Medium',
        highlights: -1,
        shadows: -1,
        noiseReduction: -4,
        sharpness: 2,
        colorSaturation: 3
      }
    },
    {
      name: 'Portra 400',
      iso: '400',
      usedFor: 'Professional portrait film with neutral tones',
      characteristics: 'Accurate skin tones with fine grain. The industry standard for portrait photography.',
      category: ['Portrait', 'Professional'],
      tags: ['Professional', 'Neutral', 'Accurate', 'Standard'],
      settings: {
        filmSimulation: 'PRO Neg. Std',
        dynamicRange: 200,
        whiteBalance: 5500,
        tintShift: 0,
        colorChrome: 'Off',
        colorChromeBlue: 'Off',
        highlights: -1,
        shadows: -1,
        noiseReduction: -4,
        sharpness: -1,
        colorSaturation: 0
      }
    },
    {
      name: 'Leica M10',
      iso: 'Auto',
      usedFor: 'Digital recreation of Leica color science',
      characteristics: 'Subtle colors with excellent dynamic range. Mimics the look of Leica digital files.',
      category: ['Street', 'Professional'],
      tags: ['Subtle', 'Digital', 'Professional', 'Leica'],
      settings: {
        filmSimulation: 'PRO Neg. Hi',
        dynamicRange: 400,
        whiteBalance: 5500,
        tintShift: 0,
        colorChrome: 'Weak',
        colorChromeBlue: 'Weak',
        highlights: 0,
        shadows: 0,
        noiseReduction: -2,
        sharpness: 0,
        colorSaturation: -1
      }
    },
    {
      name: 'Summer Glow',
      iso: 'Auto',
      usedFor: 'Warm, glowing summer portraits',
      characteristics: 'Golden hour warmth with lifted shadows. Perfect for backlit and golden hour shots.',
      category: ['Portrait', 'Travel'],
      tags: ['Warm', 'Golden', 'Backlit', 'Summer'],
      settings: {
        filmSimulation: 'PRO Neg. Std',
        dynamicRange: 200,
        whiteBalance: 5000,
        tintShift: 3,
        colorChrome: 'Weak',
        colorChromeBlue: 'Off',
        highlights: 1,
        shadows: 2,
        noiseReduction: -4,
        sharpness: -1,
        colorSaturation: 2
      }
    }
  ]
};

const categories = [
  { name: 'All', icon: Camera },
  { name: 'Portrait', icon: Heart },
  { name: 'Landscape', icon: Mountain },
  { name: 'Travel', icon: MapPin },
  { name: 'B&W', icon: Sparkles },
  { name: 'Low-Light', icon: Zap },
  { name: 'Street', icon: Camera },
  { name: 'Professional', icon: Camera }
];

export default function FujifilmRecipeGuide() {
  const [filterCategory, setFilterCategory] = useState('All');
  const [expandedPack, setExpandedPack] = useState('VSCO 01');
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [copiedRecipe, setCopiedRecipe] = useState(null);

  // Filter packs based on selected category
  const filteredPacks = useMemo(() => {
    if (filterCategory === 'All') return filmRecipes;

    const filtered = {};
    Object.entries(filmRecipes).forEach(([packName, recipes]) => {
      const matchingRecipes = recipes.filter(recipe =>
        recipe.category.includes(filterCategory)
      );
      if (matchingRecipes.length > 0) {
        filtered[packName] = matchingRecipes;
      }
    });
    return filtered;
  }, [filterCategory]);

  const copyRecipe = (recipe) => {
    const recipeText = `
${recipe.name} (ISO ${recipe.iso})
${recipe.usedFor}

Settings:
Film Simulation: ${recipe.settings.filmSimulation}
Dynamic Range: ${recipe.settings.dynamicRange}
White Balance: ${recipe.settings.whiteBalance}K
WB Tint Shift: ${recipe.settings.tintShift}
Color Chrome: ${recipe.settings.colorChrome}
Color Chrome Blue: ${recipe.settings.colorChromeBlue}
Highlights: ${recipe.settings.highlights}
Shadows: ${recipe.settings.shadows}
Noise Reduction: ${recipe.settings.noiseReduction}
Sharpness: ${recipe.settings.sharpness}
Color Saturation: ${recipe.settings.colorSaturation}
    `.trim();

    navigator.clipboard.writeText(recipeText);
    setCopiedRecipe(recipe.name);
    setTimeout(() => setCopiedRecipe(null), 2000);
  };

  const downloadRecipes = () => {
    let allRecipes = '';
    Object.entries(filmRecipes).forEach(([packName, recipes]) => {
      allRecipes += `\n=== ${packName} ===\n\n`;
      recipes.forEach(recipe => {
        allRecipes += `${recipe.name} (ISO ${recipe.iso})\n`;
        allRecipes += `${recipe.usedFor}\n\n`;
        allRecipes += `Settings:\n`;
        allRecipes += `Film Simulation: ${recipe.settings.filmSimulation}\n`;
        allRecipes += `Dynamic Range: ${recipe.settings.dynamicRange}\n`;
        allRecipes += `White Balance: ${recipe.settings.whiteBalance}K\n`;
        allRecipes += `WB Tint Shift: ${recipe.settings.tintShift}\n`;
        allRecipes += `Color Chrome: ${recipe.settings.colorChrome}\n`;
        allRecipes += `Color Chrome Blue: ${recipe.settings.colorChromeBlue}\n`;
        allRecipes += `Highlights: ${recipe.settings.highlights}\n`;
        allRecipes += `Shadows: ${recipe.settings.shadows}\n`;
        allRecipes += `Noise Reduction: ${recipe.settings.noiseReduction}\n`;
        allRecipes += `Sharpness: ${recipe.settings.sharpness}\n`;
        allRecipes += `Color Saturation: ${recipe.settings.colorSaturation}\n`;
        allRecipes += `\n---\n\n`;
      });
    });

    const blob = new Blob([allRecipes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fujifilm-recipes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-100 mb-2">Fujifilm Film Recipe Guide</h2>
          <p className="text-stone-400">Professional film simulation recipes for your Fujifilm camera</p>
        </div>
        <button
          onClick={downloadRecipes}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download All
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(({ name, icon: Icon }) => (
          <button
            key={name}
            onClick={() => setFilterCategory(name)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              filterCategory === name
                ? 'bg-amber-600 text-white'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {name}
          </button>
        ))}
      </div>

      {/* Film Packs */}
      <div className="space-y-4">
        {Object.entries(filteredPacks).map(([packName, recipes]) => (
          <div key={packName} className="bg-stone-800/50 border border-stone-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedPack(expandedPack === packName ? null : packName)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Camera className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-semibold text-stone-100">{packName}</h3>
                <span className="text-sm text-stone-400">({recipes.length} recipes)</span>
              </div>
              {expandedPack === packName ? (
                <ChevronUp className="w-5 h-5 text-stone-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-stone-400" />
              )}
            </button>

            {expandedPack === packName && (
              <div className="p-6 border-t border-stone-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recipes.map((recipe) => (
                    <button
                      key={recipe.name}
                      onClick={() => setSelectedFilm(recipe)}
                      className="bg-stone-900/50 border border-stone-700 rounded-lg p-4 hover:border-amber-500 transition-colors text-left"
                    >
                      <h4 className="text-lg font-semibold text-stone-100 mb-2">{recipe.name}</h4>
                      <p className="text-sm text-stone-400 mb-3">ISO {recipe.iso}</p>
                      <p className="text-sm text-stone-300 mb-3 line-clamp-2">{recipe.usedFor}</p>
                      <div className="flex flex-wrap gap-1">
                        {recipe.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="px-2 py-1 bg-amber-600/20 text-amber-400 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detail Panel */}
      {selectedFilm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedFilm(null)}>
          <div className="bg-stone-900 border border-stone-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-stone-900 border-b border-stone-700 p-6 flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-stone-100 mb-1">{selectedFilm.name}</h3>
                <p className="text-amber-500">ISO {selectedFilm.iso}</p>
              </div>
              <button
                onClick={() => setSelectedFilm(null)}
                className="text-stone-400 hover:text-stone-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <h4 className="text-sm font-semibold text-amber-500 mb-2">WHAT IT'S USED FOR</h4>
                <p className="text-stone-300">{selectedFilm.usedFor}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-amber-500 mb-2">CHARACTERISTICS</h4>
                <p className="text-stone-300">{selectedFilm.characteristics}</p>
              </div>

              {/* Tags */}
              <div>
                <h4 className="text-sm font-semibold text-amber-500 mb-2">BEST FOR</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedFilm.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-amber-600/20 text-amber-400 text-sm rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div>
                <h4 className="text-sm font-semibold text-amber-500 mb-3">CAMERA SETTINGS</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-stone-800/50 p-3 rounded">
                    <p className="text-xs text-stone-500 mb-1">Film Simulation</p>
                    <p className="text-stone-100 font-medium">{selectedFilm.settings.filmSimulation}</p>
                  </div>
                  <div className="bg-stone-800/50 p-3 rounded">
                    <p className="text-xs text-stone-500 mb-1">Dynamic Range</p>
                    <p className="text-stone-100 font-medium">{selectedFilm.settings.dynamicRange}</p>
                  </div>
                  <div className="bg-stone-800/50 p-3 rounded">
                    <p className="text-xs text-stone-500 mb-1">White Balance</p>
                    <p className="text-stone-100 font-medium">{selectedFilm.settings.whiteBalance}K</p>
                  </div>
                  <div className="bg-stone-800/50 p-3 rounded">
                    <p className="text-xs text-stone-500 mb-1">WB Tint Shift</p>
                    <p className="text-stone-100 font-medium">{selectedFilm.settings.tintShift}</p>
                  </div>
                  <div className="bg-stone-800/50 p-3 rounded">
                    <p className="text-xs text-stone-500 mb-1">Color Chrome</p>
                    <p className="text-stone-100 font-medium">{selectedFilm.settings.colorChrome}</p>
                  </div>
                  <div className="bg-stone-800/50 p-3 rounded">
                    <p className="text-xs text-stone-500 mb-1">Color Chrome Blue</p>
                    <p className="text-stone-100 font-medium">{selectedFilm.settings.colorChromeBlue}</p>
                  </div>
                  <div className="bg-stone-800/50 p-3 rounded">
                    <p className="text-xs text-stone-500 mb-1">Highlights</p>
                    <p className="text-stone-100 font-medium">{selectedFilm.settings.highlights}</p>
                  </div>
                  <div className="bg-stone-800/50 p-3 rounded">
                    <p className="text-xs text-stone-500 mb-1">Shadows</p>
                    <p className="text-stone-100 font-medium">{selectedFilm.settings.shadows}</p>
                  </div>
                  <div className="bg-stone-800/50 p-3 rounded">
                    <p className="text-xs text-stone-500 mb-1">Noise Reduction</p>
                    <p className="text-stone-100 font-medium">{selectedFilm.settings.noiseReduction}</p>
                  </div>
                  <div className="bg-stone-800/50 p-3 rounded">
                    <p className="text-xs text-stone-500 mb-1">Sharpness</p>
                    <p className="text-stone-100 font-medium">{selectedFilm.settings.sharpness}</p>
                  </div>
                  <div className="bg-stone-800/50 p-3 rounded col-span-2">
                    <p className="text-xs text-stone-500 mb-1">Color Saturation</p>
                    <p className="text-stone-100 font-medium">{selectedFilm.settings.colorSaturation}</p>
                  </div>
                </div>
              </div>

              {/* Copy Button */}
              <button
                onClick={() => copyRecipe(selectedFilm)}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {copiedRecipe === selectedFilm.name ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy Recipe to Clipboard
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
