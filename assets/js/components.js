(function() {

  var state = null;
  try {
    var raw = localStorage.getItem('tia_admin');
    if (raw) state = JSON.parse(raw);
  } catch(e) {}

  var nav = state && state.navigation ? state.navigation.filter(function(n){ return n.visible !== false; }) : null;
  var ss = state && state.siteSettings ? state.siteSettings : null;

  var navLinks = '';
  var mobileLinks = '';
  if (nav && nav.length) {
    nav.forEach(function(item) {
      navLinks += '<li><a href="' + (item.href || '/') + '">' + (item.label || '') + '</a></li>';
      mobileLinks += '<a href="' + (item.href || '/') + '">' + (item.label || '') + '</a>';
    });
  } else {
    navLinks = '<li><a href="/">Home</a></li><li><a href="/pages/portfolio.html">Portfolio</a></li><li><a href="/pages/galleries.html">Galleries</a></li><li><a href="/pages/about.html">About</a></li><li><a href="/pages/prints.html">Prints</a></li><li><a href="/pages/hope-hike.html">Hope Hike</a></li><li><a href="/pages/contact.html">Contact</a></li>';
    mobileLinks = '<a href="/">Home</a><a href="/pages/portfolio.html">Portfolio</a><a href="/pages/galleries.html">Galleries</a><a href="/pages/about.html">About</a><a href="/pages/prints.html">Prints</a><a href="/pages/hope-hike.html">Hope Hike</a><a href="/pages/contact.html">Contact</a>';
  }

  var navHTML = '<a class="skip-link" href="#main-content">Skip to content</a><nav class="tia-nav" aria-label="Main navigation">' +
    '<a href="/" class="nav-logo" aria-label="The Infinite Arch: Home">' +
      '<span class="nav-symbol" aria-hidden="true"></span>' +
      '<span class="nav-brand">The <em>Infinite</em> Arch<small>Fine Art Landscape Photography</small></span>' +
    '</a>' +
    '<ul class="nav-links">' + navLinks + '</ul>' +
    '<button type="button" class="nav-hamburger" aria-label="Open navigation" aria-expanded="false" aria-controls="mobile-navigation"><span></span><span></span><span></span></button>' +
  '</nav>' +
  '<div class="nav-mobile" id="mobile-navigation" aria-label="Mobile navigation" inert>' + mobileLinks + '</div>';

  var footerQuote = ss && ss.footerQuote ? ss.footerQuote : 'Beautiful things don\u2019t ask for attention.';
  var footerAttr = ss && ss.footerAttr ? ss.footerAttr : 'Sean O\u2019Connell';

  var footerRight = '';
  if (nav && nav.length) {
    nav.forEach(function(item) {
      if (item.href !== '/') footerRight += '<div><a href="' + (item.href || '/') + '">' + (item.label || '') + '</a></div>';
    });
  } else {
    footerRight = '<div><a href="/pages/portfolio.html">Portfolio</a></div><div><a href="/pages/galleries.html">Galleries</a></div><div><a href="/pages/about.html">About</a></div><div><a href="/pages/prints.html">Prints</a></div><div><a href="/pages/hope-hike.html">Hope Hike</a></div><div><a href="/pages/contact.html">Contact</a></div>';
  }

  var footerHTML = '<footer class="tia-footer">' +
    '<div class="footer-left">' +
      '<a href="/" class="footer-wordmark">The <em>Infinite</em> Arch</a>' +
      '<div>Fine Art Landscape Photography</div>' +
      '<div>North Texas &nbsp;&middot;&nbsp; The World</div>' +
      '<div class="footer-copyright">&copy; ' + new Date().getFullYear() + ' The Infinite Arch</div>' +
    '</div>' +
    '<div class="footer-center">' +
      '<p class="footer-quote">&ldquo;' + footerQuote + '&rdquo;</p>' +
      '<span class="footer-attr">' + footerAttr + '</span>' +
      '<div class="footer-sister">' +
        '<p class="footer-path-quote">Every arch opens onto another path.</p>' +
        '<a class="footer-sister-link" href="https://intelligent-crushing-unit.replit.app" target="_blank" rel="noopener noreferrer">The Next Path, a sister project for men whose path changed</a>' +
      '</div>' +
    '</div>' +
    '<div class="footer-right">' + footerRight + '</div>' +
  '</footer>';

  document.body.insertAdjacentHTML('afterbegin', navHTML);
  document.body.insertAdjacentHTML('beforeend', footerHTML);
  var main = document.querySelector('main, .page-content, .story-page');
  if (main) {
    main.id = main.id || 'main-content';
    if (main.tagName !== 'MAIN') main.setAttribute('role', 'main');
    main.setAttribute('tabindex', '-1');
    document.querySelector('.skip-link').href = '#' + main.id;
  }

})();
