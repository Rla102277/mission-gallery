import { useEffect } from 'react';

// images = [{ url, title }], currentIndex, onNavigate(index), onClose()
export default function Lightbox({ images, currentIndex, onNavigate, onClose }) {
  const img = images?.[currentIndex];

  useEffect(() => {
    const handle = (e) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowLeft'  && currentIndex > 0)                onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onNavigate(currentIndex + 1);
    };
    window.addEventListener('keydown', handle);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', handle); document.body.style.overflow = ''; };
  }, [currentIndex, images?.length]);

  if (!img) return null;

  return (
    <div className="tia-lb" onClick={onClose}>
      <button className="lb-close" onClick={onClose}>✕</button>

      {currentIndex > 0 && (
        <button className="lb-arrow" style={{ left: 12 }} onClick={e => { e.stopPropagation(); onNavigate(currentIndex - 1); }}>‹</button>
      )}

      <img
        className="tia-lb-img"
        src={img.url}
        alt={img.title || ''}
        onClick={e => e.stopPropagation()}
        style={{ cursor: 'default' }}
      />

      {currentIndex < images.length - 1 && (
        <button className="lb-arrow" style={{ right: 12 }} onClick={e => { e.stopPropagation(); onNavigate(currentIndex + 1); }}>›</button>
      )}

      <div className="lb-meta">
        {img.title && <p className="label-xs" style={{ color:'var(--cream)', opacity:0.45 }}>{img.title}</p>}
        <p style={{ fontSize:10, letterSpacing:2, opacity:0.18, color:'var(--cream)', marginTop:5 }}>
          {currentIndex + 1} / {images.length}
        </p>
      </div>
    </div>
  );
}
