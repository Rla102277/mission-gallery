/* ═══════════════════════════════════════════════
   THE INFINITE ARCH — Global JavaScript
   ═══════════════════════════════════════════════ */

(function() {
  'use strict';

  // ── NAV SCROLL BEHAVIOR ──
  const nav = document.querySelector('.tia-nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  // ── MOBILE MENU ──
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.nav-mobile');
  if (hamburger && mobileMenu) {
    const setMenu = (isOpen) => {
      mobileMenu.classList.toggle('open', isOpen);
      mobileMenu.inert = !isOpen;
      hamburger.setAttribute('aria-expanded', String(isOpen));
      hamburger.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
      document.body.style.overflow = isOpen ? 'hidden' : '';
      // Animate hamburger to X
      const spans = hamburger.querySelectorAll('span');
      if (isOpen) {
        spans[0].style.transform = 'translateY(6px) rotate(45deg)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'translateY(-6px) rotate(-45deg)';
      } else {
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      }
    };
    hamburger.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
    document.addEventListener('keydown', (e) => {
      if (!mobileMenu.classList.contains('open')) return;
      if (e.key === 'Escape') { setMenu(false); hamburger.focus(); }
      if (e.key === 'Tab') {
        const links = [...mobileMenu.querySelectorAll('a')];
        const last = links[links.length - 1] || hamburger;
        if (e.shiftKey && document.activeElement === hamburger) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); hamburger.focus(); }
      }
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        setMenu(false);
      });
    });
  }

  // ── ACTIVE NAV LINK ──
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPath.includes(href) && href !== '/') {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else if (href === '/' && (currentPath === '/' || currentPath === '/index.html')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  // Existing gallery renderers use clickable cards. Keep their navigation
  // callbacks, and make both initial and CMS-rendered cards keyboard operable.
  const galleryRoot = document.querySelector('[data-testid="page-content-portfolio"], #gallery-main');
  if (galleryRoot) {
    const upgradeCards = () => {
      galleryRoot.querySelectorAll('div[onclick], span[onclick]').forEach(el => {
        if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
        if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
        if (!el.hasAttribute('aria-label')) {
          const heading = el.querySelector('h2, h3, .tile-title, .coll-title, .gal-card-title');
          const image = el.querySelector('img[alt]');
          const label = el.classList.contains('lb-close') ? 'Close photograph' :
            el.classList.contains('lb-prev') ? 'Previous photograph' :
            el.classList.contains('lb-next') ? 'Next photograph' :
            heading ? heading.textContent.trim() :
            image ? 'View photograph: ' + image.alt : '';
          if (label) el.setAttribute('aria-label', label);
        }
      });
    };
    upgradeCards();
    new MutationObserver(upgradeCards).observe(galleryRoot, { childList: true, subtree: true });
    galleryRoot.addEventListener('keydown', e => {
      const target = e.target;
      if ((e.key === 'Enter' || e.key === ' ') && target.matches('div[onclick], span[onclick]')) {
        e.preventDefault();
        target.click();
      }
    });
    const lightbox = document.querySelector('.lightbox');
    if (lightbox) {
      let returnFocus = null;
      lightbox.setAttribute('role', 'dialog');
      lightbox.setAttribute('aria-modal', 'true');
      lightbox.setAttribute('aria-label', 'Photograph viewer');
      lightbox.setAttribute('aria-hidden', 'true');
      new MutationObserver(() => {
        const open = lightbox.classList.contains('open');
        lightbox.setAttribute('aria-hidden', String(!open));
        if (open) {
          returnFocus = document.activeElement;
          const close = lightbox.querySelector('.lb-close');
          if (close) close.focus();
        } else if (returnFocus && returnFocus.isConnected) {
          returnFocus.focus();
          returnFocus = null;
        }
      }).observe(lightbox, { attributes: true, attributeFilter: ['class'] });
      lightbox.addEventListener('keydown', e => {
        if (e.key !== 'Tab') return;
        const items = [...lightbox.querySelectorAll('a[href], button, [tabindex="0"]')]
          .filter(el => el.getClientRects().length);
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
    }
  }

  // ── SCROLL-TRIGGERED FADE INS ──
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion && 'IntersectionObserver' in window && !document.getElementById('blk-reveal-style')) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('[data-reveal]').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = `opacity 0.8s ease, transform 0.8s ease`;
      const delay = el.dataset.reveal || 0;
      el.style.transitionDelay = `${delay}s`;
      observer.observe(el);
    });

    document.head.insertAdjacentHTML('beforeend', `
      <style>
        [data-reveal].revealed {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      </style>
    `);
  }

  // ── PAGE TRANSITION OUT ──
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    // Only internal links, not anchors
    if (!reducedMotion && href && !href.startsWith('#') && !href.startsWith('http') && !href.startsWith('mailto')) {
      link.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || link.target === '_blank' || link.hasAttribute('download')) return;
        e.preventDefault();
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.3s ease';
        setTimeout(() => window.location.href = href, 300);
      });
    }
  });

  // Fade in on load
  // Content is visible immediately, even if an image or font is slow to load.
  window.addEventListener('pageshow', () => { document.body.style.opacity = '1'; });

})();
