import { useState } from 'react';

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

const sliderConfig = [
  { key: 'exposure', label: 'Exposure', min: -2, max: 2, step: 0.01 },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100, step: 1 },
  { key: 'highlights', label: 'Highlights', min: -100, max: 100, step: 1 },
  { key: 'shadows', label: 'Shadows', min: -100, max: 100, step: 1 },
  { key: 'whites', label: 'Whites', min: -100, max: 100, step: 1 },
  { key: 'blacks', label: 'Blacks', min: -100, max: 100, step: 1 },
  { key: 'texture', label: 'Texture', min: -100, max: 100, step: 1 },
  { key: 'clarity', label: 'Clarity', min: -100, max: 100, step: 1 },
  { key: 'dehaze', label: 'Dehaze', min: -100, max: 100, step: 1 },
  { key: 'orangeHue', label: 'Orange Hue', min: -180, max: 180, step: 1 },
  { key: 'orangeSaturation', label: 'Orange Saturation', min: -100, max: 100, step: 1 },
  { key: 'orangeLuminance', label: 'Orange Luminance', min: -100, max: 100, step: 1 },
  { key: 'redSaturation', label: 'Red Saturation', min: -100, max: 100, step: 1 },
  { key: 'yellowSaturation', label: 'Yellow Saturation', min: -100, max: 100, step: 1 },
  { key: 'yellowLuminance', label: 'Yellow Luminance', min: -100, max: 100, step: 1 },
  { key: 'greenHue', label: 'Green Hue', min: -180, max: 180, step: 1 },
  { key: 'greenSaturation', label: 'Green Saturation', min: -100, max: 100, step: 1 },
  { key: 'greenLuminance', label: 'Green Luminance', min: -100, max: 100, step: 1 },
  { key: 'vignette', label: 'Post-crop Vignette', min: -100, max: 100, step: 1 },
];

function MentorEditSliders({ edits, onChange }) {
  const handleChange = (key, value) => {
    onChange({ ...edits, [key]: parseFloat(value) });
  };

  const resetToDefaults = () => {
    onChange(defaultEdits);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-amber-400 font-medium">Quick Edit Settings</h4>
        <button
          onClick={resetToDefaults}
          className="text-stone-400 hover:text-stone-200 text-sm underline"
        >
          Reset to Defaults
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sliderConfig.map(({ key, label, min, max, step }) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-stone-300 text-sm">{label}</label>
              <span className="text-stone-500 text-xs font-mono">{edits[key]}</span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={edits[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${((edits[key] - min) / (max - min)) * 100}%, #374151 ${((edits[key] - min) / (max - min)) * 100}%, #374151 100%)`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default MentorEditSliders;
