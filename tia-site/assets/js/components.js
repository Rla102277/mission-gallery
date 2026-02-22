/* ═══════════════════════════════════════════════
   THE INFINITE ARCH — Shared Components
   Nav + Footer injected on every page
   ═══════════════════════════════════════════════ */

(function() {

  // ── NAV HTML ──
  const navHTML = `
<nav class="tia-nav">
  <a href="/" class="nav-logo" aria-label="The Infinite Arch — Home">
    <div class="r-heavy"></div>
    <div class="r-thin"></div>
    <span class="l-the">the</span>
    <span class="l-infinite">Infinite</span>
    <span class="l-arch">ARCH</span>
    <div class="r-bot"></div>
  </a>
  <ul class="nav-links">
    <li><a href="/">Home</a></li>
    <li><a href="/pages/portfolio.html">Portfolio</a></li>
    <li><a href="/pages/about.html">About</a></li>
    <li><a href="/pages/prints.html">Prints</a></li>
    <li><a href="/pages/hope-hike.html">Hope Hike</a></li>
    <li><a href="/pages/contact.html">Contact</a></li>
  </ul>
  <div class="nav-hamburger" aria-label="Menu" role="button" tabindex="0">
    <span></span>
    <span></span>
    <span></span>
  </div>
</nav>
<div class="nav-mobile">
  <a href="/">Home</a>
  <a href="/pages/portfolio.html">Portfolio</a>
  <a href="/pages/about.html">About</a>
  <a href="/pages/prints.html">Prints</a>
  <a href="/pages/hope-hike.html">Hope Hike</a>
  <a href="/pages/contact.html">Contact</a>
</div>
  `;

  // ── FOOTER HTML ──
  const footerHTML = `
<footer class="tia-footer">
  <div class="footer-left">
    <div>Fine Art Landscape Photography</div>
    <div>North Texas &nbsp;·&nbsp; The World</div>
    <div style="margin-top:12px; opacity:0.6;">
      &copy; ${new Date().getFullYear()} The Infinite Arch
    </div>
  </div>
  <div class="footer-center">
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;margin-bottom:16px;">
      <div style="width:80px;height:2px;background:rgba(245,240,232,0.15);"></div>
      <div style="width:80px;height:1px;background:rgba(245,240,232,0.08);margin-bottom:10px;"></div>
      <span style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:9px;letter-spacing:7px;opacity:0.22;">the</span>
      <span style="font-family:'Playfair Display',serif;font-style:italic;font-size:14px;letter-spacing:3px;opacity:0.32;">Infinite</span>
      <span style="font-family:'Playfair Display',serif;font-weight:900;font-size:36px;letter-spacing:-1px;opacity:0.22;line-height:1;">ARCH</span>
      <div style="width:80px;height:1px;background:rgba(245,240,232,0.08);margin-top:10px;"></div>
      <div style="width:80px;height:2px;background:rgba(245,240,232,0.15);"></div>
    </div>
    <p class="footer-quote">
      &ldquo;Beautiful things don&rsquo;t ask for attention.&rdquo;
    </p>
    <span class="footer-attr">&mdash; Sean O&rsquo;Connell</span>
  </div>
  <div class="footer-right">
    <div><a href="/pages/portfolio.html">Portfolio</a></div>
    <div><a href="/pages/about.html">About</a></div>
    <div><a href="/pages/prints.html">Prints</a></div>
    <div><a href="/pages/hope-hike.html">Hope Hike</a></div>
    <div><a href="/pages/contact.html">Contact</a></div>
  </div>
</footer>
  `;

  // ── INJECT ──
  // Nav — prepend to body
  document.body.insertAdjacentHTML('afterbegin', navHTML);

  // Footer — append before closing body
  document.body.insertAdjacentHTML('beforeend', footerHTML);

})();
