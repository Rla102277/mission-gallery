import { Camera, Aperture, Timer, Gauge, MapPin, Calendar, Sparkles } from 'lucide-react';

export default function PhotoExifDisplay({ exif, aiDescription, className = '' }) {
  if (!exif && !aiDescription) return null;

  return (
    <div className={`bg-gradient-to-br from-stone-900 to-stone-800 rounded-lg p-6 text-white ${className}`}>
      {/* AI Description */}
      {aiDescription && (
        <div className="mb-6 pb-6 border-b border-stone-700">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-amber-400">AI Analysis</h3>
          </div>
          <p className="text-stone-300 leading-relaxed italic">
            "{aiDescription}"
          </p>
        </div>
      )}

      {/* Technical Details */}
      {exif && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-stone-200">Technical Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Camera */}
            {exif.camera && (
              <div className="flex items-start gap-3">
                <Camera className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-stone-400 uppercase tracking-wide">Camera</div>
                  <div className="text-stone-200 font-medium">{exif.camera}</div>
                </div>
              </div>
            )}

            {/* Lens */}
            {exif.lens && (
              <div className="flex items-start gap-3">
                <Camera className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-stone-400 uppercase tracking-wide">Lens</div>
                  <div className="text-stone-200 font-medium">{exif.lens}</div>
                </div>
              </div>
            )}

            {/* Focal Length */}
            {exif.focalLength && (
              <div className="flex items-start gap-3">
                <Aperture className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-stone-400 uppercase tracking-wide">Focal Length</div>
                  <div className="text-stone-200 font-medium">{exif.focalLength}</div>
                </div>
              </div>
            )}

            {/* Aperture */}
            {exif.aperture && (
              <div className="flex items-start gap-3">
                <Aperture className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-stone-400 uppercase tracking-wide">Aperture</div>
                  <div className="text-stone-200 font-medium">{exif.aperture}</div>
                </div>
              </div>
            )}

            {/* Shutter Speed */}
            {exif.shutterSpeed && (
              <div className="flex items-start gap-3">
                <Timer className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-stone-400 uppercase tracking-wide">Shutter Speed</div>
                  <div className="text-stone-200 font-medium">{exif.shutterSpeed}</div>
                </div>
              </div>
            )}

            {/* ISO */}
            {exif.iso && (
              <div className="flex items-start gap-3">
                <Gauge className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-stone-400 uppercase tracking-wide">ISO</div>
                  <div className="text-stone-200 font-medium">{exif.iso}</div>
                </div>
              </div>
            )}

            {/* Exposure Compensation */}
            {exif.exposureCompensation && (
              <div className="flex items-start gap-3">
                <Gauge className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-stone-400 uppercase tracking-wide">Exposure Comp.</div>
                  <div className="text-stone-200 font-medium">{exif.exposureCompensation}</div>
                </div>
              </div>
            )}

            {/* Location */}
            {exif.location && (
              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-stone-400 uppercase tracking-wide">Location</div>
                  <div className="text-stone-200 font-medium">{exif.location}</div>
                </div>
              </div>
            )}

            {/* Date */}
            {exif.dateTime && (
              <div className="flex items-start gap-3 md:col-span-2">
                <Calendar className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-stone-400 uppercase tracking-wide">Captured</div>
                  <div className="text-stone-200 font-medium">
                    {new Date(exif.dateTime).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
