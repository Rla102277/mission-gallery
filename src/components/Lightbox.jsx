import { useEffect } from 'react';

export default function Lightbox({ images, currentIndex, onNavigate, onClose }) {
  const img = images[currentIndex];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onNavigate(currentIndex + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentIndex, images.length, onClose, onNavigate]);

  if (!img) return null;

  return (
    <div className="tia-lightbox" onClick={onClose}>
      <button className="lb-close" onClick={onClose}>✕</button>

      {currentIndex > 0 && (
        <button className="lb-prev" onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}>
          ‹
        </button>
      )}

      <img
        src={img.url}
        alt={img.title || ''}
        onClick={(e) => e.stopPropagation()}
        style={{ cursor: 'default' }}
      />

      {currentIndex < images.length - 1 && (
        <button className="lb-next" onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}>
          ›
        </button>
      )}

      <div className="lb-meta">
        {img.title && (
          <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.4, color: 'var(--cream)' }}>
            {img.title}
          </p>
        )}
        <p style={{ fontSize: 10, letterSpacing: 2, opacity: 0.22, color: 'var(--cream)', marginTop: 4 }}>
          {currentIndex + 1} / {images.length}
        </p>
      </div>
    </div>
  );
}
