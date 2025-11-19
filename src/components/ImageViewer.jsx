import { X, ChevronLeft, ChevronRight, Download, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import PhotoExifDisplay from './PhotoExifDisplay';

export default function ImageViewer({ 
  isOpen, 
  onClose, 
  images, 
  currentIndex, 
  onNavigate 
}) {
  const [showExif, setShowExif] = useState(false);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onNavigate(currentIndex + 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose, onNavigate]);

  if (!isOpen || !images[currentIndex]) return null;

  const currentImage = images[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Image Counter */}
      <div className="absolute top-4 left-4 px-4 py-2 bg-black/50 rounded-lg text-white text-sm z-10">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Navigation Buttons */}
      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex - 1);
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex + 1);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Main Image */}
      <div 
        className="max-w-7xl max-h-[90vh] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage.url}
          alt={currentImage.title || 'Image'}
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
        />
        
        {/* Image Info */}
        {(currentImage.title || currentImage.date) && (
          <div className="mt-4 p-4 bg-black/50 rounded-lg text-white">
            {currentImage.title && (
              <h3 className="text-lg font-semibold mb-1">{currentImage.title}</h3>
            )}
            {currentImage.date && (
              <p className="text-sm text-white/70">{currentImage.date}</p>
            )}
          </div>
        )}
      </div>

      {/* Info Button - Toggle EXIF */}
      {(currentImage?.exif || currentImage?.aiDescription) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowExif(!showExif);
          }}
          className={`absolute bottom-4 left-4 p-3 rounded-full text-white transition-all z-10 ${
            showExif 
              ? 'bg-amber-500 hover:bg-amber-600' 
              : 'bg-white/10 hover:bg-white/20'
          }`}
          title={showExif ? "Hide technical details" : "Show technical details"}
        >
          <Info className="w-6 h-6" />
        </button>
      )}

      {/* Download Button (optional) */}
      {currentImage.downloadUrl && (
        <a
          href={currentImage.downloadUrl}
          download
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
          title="Download"
        >
          <Download className="w-6 h-6" />
        </a>
      )}

      {/* EXIF Data Panel */}
      {showExif && (currentImage.exif || currentImage.aiDescription) && (
        <div 
          className="absolute right-4 top-20 bottom-20 w-96 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <PhotoExifDisplay 
            exif={currentImage.exif}
            aiDescription={currentImage.aiDescription}
          />
        </div>
      )}
    </div>
  );
}
