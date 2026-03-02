var BlockRenderer = {
  render: function(blocks, state) {
    if (!blocks || !blocks.length) return '';
    return blocks.map(function(b) { return BlockRenderer.renderBlock(b, state); }).join('');
  },

  renderBlock: function(block, state) {
    var fn = BlockRenderer['render_' + block.type.replace(/-/g, '_')];
    if (!fn) return '';
    return fn(block.data || {}, state || {}, block.id || '');
  },

  esc: function(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  render_hero: function(d, state, id) {
    var v = d.variant || 'wordmark';
    if (v === 'wordmark') {
      var bgStyle = '';
      if (d.backgroundImage) {
        var url = TIA.photoUrl(d.backgroundImage, 'hero');
        if (url) bgStyle = ' style="background:linear-gradient(to bottom,rgba(13,13,13,0.6) 0%,rgba(13,13,13,0.35) 40%,rgba(13,13,13,0.7) 100%),url(\'' + url + '\') center/cover no-repeat"';
      }
      return '<section class="blk-hero blk-hero--wordmark" data-testid="blk-hero-' + id + '"' + bgStyle + '>' +
        '<div class="hero-wordmark fade-up">' +
          '<div class="hw-rule-top"></div><div class="hw-rule-thin"></div>' +
          '<span class="hw-the">the</span>' +
          '<span class="hw-infinite">Infinite</span>' +
          '<span class="hw-arch">ARCH</span>' +
          '<div class="hw-rule-thin-b"></div>' +
          '<span class="hw-tagline">' + (d.tagline || 'Beyond the Daydream') + '</span>' +
          '<div class="hw-rule-bot"></div>' +
        '</div>' +
        '<p class="hero-sub fade-up delay-3">' + (d.eyebrow || 'Fine Art Landscape Photography') + '</p>' +
        '<div class="hero-scroll"><div class="scroll-line"></div><span>' + (d.scrollText || 'Enter') + '</span></div>' +
      '</section>';
    }
    if (v === 'standard') {
      var bgStyle2 = '';
      if (d.backgroundImage) {
        var url2 = TIA.photoUrl(d.backgroundImage, 'hero');
        if (url2) bgStyle2 = ' style="background:linear-gradient(to bottom,rgba(13,13,13,0.6) 0%,rgba(13,13,13,0.35) 40%,rgba(13,13,13,0.7) 100%),url(\'' + url2 + '\') center/cover no-repeat"';
      }
      return '<section class="blk-hero blk-hero--standard" data-testid="blk-hero-' + id + '"' + bgStyle2 + '>' +
        (d.eyebrow ? '<p class="hero-eyebrow">' + d.eyebrow + '</p>' : '') +
        '<h1 class="hero-title">' + (d.title || '') + '</h1>' +
        (d.subtitle ? '<p class="hero-subtitle">' + d.subtitle + '</p>' : '') +
        '<div class="hero-scroll"><div class="scroll-line"></div><span>' + (d.scrollText || 'Explore') + '</span></div>' +
      '</section>';
    }
    if (v === 'centered') {
      return '<section class="blk-hero blk-hero--centered" data-testid="blk-hero-' + id + '">' +
        (d.eyebrow ? '<span class="cs-eyebrow">' + d.eyebrow + '</span>' : '') +
        '<h1 class="cs-title">' + (d.title || '') + '</h1>' +
        (d.titleSub ? '<div class="cs-title-sub">' + d.titleSub + '</div>' : '') +
        '<div class="cs-rule"></div>' +
        (d.location ? '<p class="cs-location">' + d.location + '</p>' : '') +
        (d.subtitle ? '<p class="cs-sub">' + d.subtitle + '</p>' : '') +
        (d.body ? '<p class="cs-body">' + d.body + '</p>' : '') +
      '</section>';
    }
    if (v === 'masthead') {
      return '<div class="blk-masthead-page" data-testid="blk-hero-' + id + '">' +
        '<div class="about-corner tl"></div><div class="about-corner tr"></div>' +
        '<div class="about-corner bl"></div><div class="about-corner br"></div>' +
        '<div class="masthead">' +
          '<div class="mh-rule-heavy"></div><div class="mh-rule-thin"></div>' +
          '<span class="mh-the">the</span>' +
          '<span class="mh-infinite">Infinite</span>' +
          '<span class="mh-arch">ARCH</span>' +
          '<div class="mh-rule-thin-b"></div>' +
          '<span class="mh-tagline">' + (d.tagline || 'Beyond the Daydream') + '</span>' +
          '<div class="mh-rule-heavy-b"></div>' +
        '</div>' +
        (d.label ? '<p class="mh-section-label">' + d.label + '</p>' : '') +
      '</div>';
    }
    return '';
  },

  render_text: function(d, state, id) {
    var v = d.variant || 'default';
    if (v === 'default') {
      return '<div class="blk-text" data-reveal="0" data-testid="blk-text-' + id + '">' +
        (d.eyebrow ? '<span class="eyebrow">' + d.eyebrow + '</span>' : '') +
        (d.heading ? '<p class="blk-text__heading">' + d.heading + '</p>' : '') +
        (d.body ? d.body.split('\n\n').map(function(p) { return '<p class="blk-text__body">' + p + '</p>'; }).join('') : '') +
        (d.ctaText ? '<a href="' + (d.ctaUrl || '#') + '" class="cta-link" data-testid="link-cta-' + id + '"><div class="cta-line"></div>' + d.ctaText + '</a>' : '') +
      '</div>';
    }
    if (v === 'pull-quote') {
      return '<div class="blk-pull-quote" data-reveal="0" data-testid="blk-text-' + id + '">' +
        (d.line1 ? '<p class="pq-line-1">' + d.line1 + '</p>' : '') +
        (d.line2 ? '<p class="pq-line-2">' + d.line2 + '</p>' : '') +
      '</div>';
    }
    if (v === 'article') {
      return '<div class="blk-article" data-reveal="0" data-testid="blk-text-' + id + '">' +
        '<div class="article-body">' + (d.body || '') + '</div>' +
        (d.closing ? '<p class="article-closing">' + d.closing + '</p>' : '') +
      '</div>';
    }
    return '';
  },

  render_divider: function(d, state, id) {
    return '<div class="blk-divider" data-reveal="0" data-testid="blk-divider-' + id + '">' +
      '<div class="divider-rule"></div>' +
      '<span class="divider-mark">&#x2736;</span>' +
      '<div class="divider-rule"></div>' +
    '</div>';
  },

  render_collections_grid: function(d, state, id) {
    var works = (state.portfolioWorks || []);
    var tiles = works.length ? works : (typeof TIA !== 'undefined' && TIA.DEFAULT_PORTFOLIO_WORKS ? TIA.DEFAULT_PORTFOLIO_WORKS : []);
    var tileClasses = ['ct-1','ct-2','ct-3','ct-4'];
    var tilesHtml = tiles.map(function(w, i) {
      var cls = tileClasses[i % tileClasses.length];
      var coverUrl = w.coverAssetId ? TIA.photoUrl(w.coverAssetId, 'hero') : '';
      var bgStyle = coverUrl ? "background-image:url('" + coverUrl + "');background-size:cover;background-position:center;" : '';
      return '<a href="/pages/portfolio.html' + (w.id ? '?work=' + encodeURIComponent(w.id) : '') + '" class="coll-tile ' + cls + '" data-testid="coll-tile-' + (i+1) + '">' +
        '<div class="tile-bg" style="' + bgStyle + '"></div><div class="tile-vignette"></div>' +
        '<div class="tile-content"><span class="tile-tag">' + (w.type || 'Series') + '</span><div class="tile-rule-s"></div>' +
        '<h3 class="tile-h">' + (w.title || 'Untitled') + '</h3>' +
        (w.subtitle ? '<p class="tile-sub">' + w.subtitle + '</p>' : '') +
        '</div></a>';
    }).join('');

    return '<section class="blk-collections" data-reveal="0" data-testid="blk-collections-' + id + '">' +
      '<div class="collections-header">' +
        '<h2>' + (d.heading || 'Four bodies of work.<br>One way of seeing.') + '</h2>' +
        (d.ctaText ? '<a href="' + (d.ctaUrl || '/pages/portfolio.html') + '" data-testid="link-collections-viewall"><div class="cta-line"></div>' + d.ctaText + '</a>' : '') +
      '</div>' +
      '<div class="coll-grid" id="collGrid" data-testid="collections-grid">' + tilesHtml + '</div>' +
    '</section>';
  },

  render_featured_list: function(d, state, id) {
    var works = (state.portfolioWorks || []);
    var defaultItems = [
      { tag:'Expedition &middot; Iceland 2026', title:'Beyond the Daydream: Iceland', description:'429 photographs. 8 thematic series. January light in a country that barely sees the sun. From glacial silences at J&ouml;kuls&aacute;rl&oacute;n to aurora-lit skies above Sn&aelig;fellsnes &mdash; this is the project that defines what The Infinite Arch is built to do.' },
      { tag:'Adventure Wellness &middot; May 2026', title:'The Hope Hike &mdash; Guadalupe Peak', description:'Ten people. One summit. Three days on the highest point in Texas with resilience speaker Tia Banks. This isn&rsquo;t adventure tourism &mdash; it&rsquo;s what happens when landscape becomes the therapist. Photography documents every step.' },
      { tag:'Ongoing &middot; North Texas', title:'The Near Distance', description:'The land you drive past every day without stopping. Palo Duro Canyon at blue hour. The Llano Estacado in winter light. Texas landscape is undershot and overlooked &mdash; that&rsquo;s exactly why it belongs in the work.' }
    ];
    var items = d.items || (works.length ? works.map(function(w) {
      return { tag: (w.type || 'Series') + (w.location ? ' &middot; ' + w.location : ''), title: w.title || 'Untitled', description: w.description || '' };
    }) : defaultItems);

    var itemsHtml = items.map(function(item, i) {
      var num = String(i + 1).padStart(2, '0');
      return '<div class="featured-item" data-testid="featured-item-' + (i+1) + '">' +
        '<div class="featured-num">' + num + '</div><div>' +
        '<span class="featured-tag">' + (item.tag || '') + '</span>' +
        '<h3 class="featured-title">' + (item.title || '') + '</h3>' +
        (item.description ? '<p class="featured-desc">' + item.description + '</p>' : '') +
        '</div></div>';
    }).join('');

    return '<section class="blk-featured" data-reveal="0" data-testid="blk-featured-' + id + '">' +
      '<div class="featured-header">' +
        (d.eyebrow ? '<span class="eyebrow">' + d.eyebrow + '</span>' : '') +
        '<h2>' + (d.heading || '') + '</h2>' +
      '</div>' +
      '<div class="featured-list" id="featuredList" data-testid="featured-list">' + itemsHtml + '</div>' +
    '</section>';
  },

  render_process_grid: function(d, state, id) {
    var items = d.items || [];
    var itemsHtml = items.map(function(item, i) {
      var num = String(i + 1).padStart(2, '0');
      return '<div class="process-card"><div class="pc-num">' + num + '</div>' +
        '<h3 class="pc-title">' + (item.title || '') + '</h3>' +
        '<p class="pc-body">' + (item.body || '') + '</p></div>';
    }).join('');

    return '<section class="blk-process" data-reveal="0" data-testid="blk-process-' + id + '" style="padding-top:100px;">' +
      '<div class="process-header">' +
        (d.eyebrow ? '<span class="eyebrow">' + d.eyebrow + '</span>' : '') +
        '<h2>' + (d.heading || '') + '</h2>' +
      '</div>' +
      '<div class="process-grid">' + itemsHtml + '</div>' +
    '</section>';
  },

  render_callout: function(d, state, id) {
    return '<div class="blk-callout" data-reveal="0" data-testid="blk-callout-' + id + '">' +
      '<div>' +
        (d.eyebrow ? '<span class="hhc-eyebrow">' + d.eyebrow + '</span>' : '') +
        '<h2 class="hhc-title">' + (d.title || '') + '</h2>' +
        (d.subtitle ? '<p class="hhc-sub">' + d.subtitle + '</p>' : '') +
        (d.body ? '<p class="hhc-body">' + d.body + '</p>' : '') +
      '</div>' +
      (d.ctaText ? '<a href="' + (d.ctaUrl || '#') + '" class="hhc-cta" data-testid="link-callout-' + id + '"><div class="cta-line" style="background:var(--gold);"></div>' + d.ctaText + '</a>' : '') +
    '</div>';
  },

  render_services_grid: function(d, state, id) {
    var items = d.items || [];
    var itemsHtml = items.map(function(item) {
      return '<div class="service-card">' +
        '<h3 class="sc-title">' + (item.title || '') + '</h3>' +
        '<p class="sc-body">' + (item.body || '') + '</p>' +
        (item.price ? '<span class="sc-price">' + item.price + '</span>' : '') +
      '</div>';
    }).join('');

    return '<section class="blk-services" data-reveal="0" data-testid="blk-services-' + id + '">' +
      '<div class="services-header">' +
        (d.eyebrow ? '<span class="eyebrow">' + d.eyebrow + '</span>' : '') +
        '<h2>' + (d.heading || '') + '</h2>' +
      '</div>' +
      '<div class="services-grid">' + itemsHtml + '</div>' +
    '</section>';
  },

  render_newsletter: function(d, state, id) {
    return '<div class="blk-newsletter" data-reveal="0" data-testid="blk-newsletter-' + id + '">' +
      (d.eyebrow ? '<span class="eyebrow">' + d.eyebrow + '</span>' : '') +
      '<h2>' + (d.heading || '') + '</h2>' +
      (d.body ? '<p>' + d.body + '</p>' : '') +
      '<div class="nl-form" data-testid="form-newsletter">' +
        '<input class="nl-input" type="email" placeholder="' + (d.placeholder || 'your@email.com') + '" data-testid="input-newsletter-email" />' +
        '<button class="nl-btn" data-testid="btn-newsletter-submit">' + (d.buttonText || 'Subscribe') + '</button>' +
      '</div>' +
    '</div>';
  },

  render_quote: function(d, state, id) {
    return '<div class="blk-quote" data-reveal="0" data-testid="blk-quote-' + id + '">' +
      '<div class="qs-rule"></div>' +
      '<div><p class="qs-text">&ldquo;' + (d.text || '') + '&rdquo;</p>' +
      (d.attribution ? '<span class="qs-attr">&mdash; ' + d.attribution + '</span>' : '') +
      '</div>' +
      '<div class="qs-rule"></div>' +
    '</div>';
  },

  render_stats_bar: function(d, state, id) {
    var items = d.items || [];
    var itemsHtml = items.map(function(item, i) {
      return '<div class="cs-stat">' +
        '<span class="cs-stat-val" data-testid="text-stat-' + i + '">' + (item.value || '') + '</span>' +
        '<span class="cs-stat-lbl">' + (item.label || '') + '</span>' +
      '</div>';
    }).join('');
    return '<div class="blk-stats" data-testid="blk-stats-' + id + '">' + itemsHtml + '</div>';
  },

  render_image_text: function(d, state, id) {
    var imgUrl = d.imageId ? TIA.photoUrl(d.imageId, 'cover') : '';
    var pos = d.imagePosition || 'left';
    return '<div class="blk-image-text blk-image-text--' + pos + '" data-reveal="0" data-testid="blk-image-text-' + id + '">' +
      '<div class="blk-it-image">' +
        (imgUrl ? '<img src="' + imgUrl + '" alt="" loading="lazy" />' : '<div class="blk-it-placeholder"></div>') +
      '</div>' +
      '<div class="blk-it-content">' +
        (d.heading ? '<h3 class="blk-it-heading">' + d.heading + '</h3>' : '') +
        (d.body ? '<p class="blk-it-body">' + d.body + '</p>' : '') +
      '</div>' +
    '</div>';
  },

  render_photo_grid: function(d, state, id) {
    var photos = d.photos || [];
    var cols = d.columns || 3;
    var photosHtml = photos.map(function(pid, i) {
      var url = TIA.photoUrl(pid, 'cover');
      return url ? '<div class="blk-pg-item"><img src="' + url + '" alt="" loading="lazy" data-testid="photo-' + i + '" /></div>' : '';
    }).join('');
    return '<div class="blk-photo-grid blk-pg-cols-' + cols + '" data-reveal="0" data-testid="blk-photo-grid-' + id + '">' + photosHtml + '</div>';
  },

  render_purpose_quote: function(d, state, id) {
    return '<div class="blk-purpose-quote" data-testid="blk-purpose-' + id + '">' +
      (d.text || '') +
    '</div>';
  },

  render_back_link: function(d, state, id) {
    return '<a href="' + (d.url || '/') + '" class="blk-back-link" data-testid="link-back-' + id + '">' +
      '<div class="cs-back-line"></div>' + (d.text || 'Return Home') +
    '</a>';
  },

  render_details_list: function(d, state, id) {
    var items = d.items || [];
    var itemsHtml = items.map(function(item, i) {
      return '<span class="cs-detail" data-testid="text-detail-' + i + '">' + item + '</span>' +
        (i < items.length - 1 ? '<div class="cs-detail-rule"></div>' : '');
    }).join('');
    return '<div class="blk-details-list" data-testid="blk-details-' + id + '">' + itemsHtml + '</div>';
  },

  render_badge: function(d, state, id) {
    return '<div class="blk-badge" data-testid="blk-badge-' + id + '">' + (d.text || '') + '</div>';
  },

  render_email_link: function(d, state, id) {
    return '<a href="mailto:' + (d.email || '') + '" class="blk-email-link" data-testid="link-email-' + id + '">' + (d.email || '') + '</a>';
  },
};

BlockRenderer.initReveals = function() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('[data-reveal]').forEach(function(el) {
    if (el.classList.contains('revealed')) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    el.style.transitionDelay = (el.dataset.reveal || 0) + 's';
    observer.observe(el);
  });
  if (!document.getElementById('blk-reveal-style')) {
    var s = document.createElement('style');
    s.id = 'blk-reveal-style';
    s.textContent = '[data-reveal].revealed { opacity: 1 !important; transform: translateY(0) !important; }';
    document.head.appendChild(s);
  }
};

BlockRenderer.defaultBlocks = function(pageSlug) {
  var defaults = BlockRenderer.PAGE_DEFAULTS[pageSlug];
  return defaults ? JSON.parse(JSON.stringify(defaults)) : [];
};

BlockRenderer.PAGE_DEFAULTS = {
  home: [
    { id:'h1', type:'hero', data:{ variant:'wordmark', tagline:'Beyond the Daydream', eyebrow:'Fine Art Landscape Photography', scrollText:'Enter' } },
    { id:'h2', type:'text', data:{ variant:'default', eyebrow:'The Vision', heading:'The arch frames what lies beyond.<br>Every image is a gateway.', body:'Most of us spend our lives just outside the frame &mdash; scrolling past the image, saving it for later, never quite arriving. I started chasing the places that couldn&rsquo;t be scrolled past.\n\nPhotography is where light becomes language and landscape becomes mirror. The most honest photographs aren&rsquo;t taken &mdash; they&rsquo;re waited for. Cold mornings, uncertain skies, the moment you raise the camera toward impossible light and believe something is there before you can see it.', ctaText:'Read the Full Statement', ctaUrl:'/pages/about.html' } },
    { id:'h3', type:'divider', data:{} },
    { id:'h4', type:'collections-grid', data:{ heading:'Four bodies of work.<br>One way of seeing.', ctaText:'View All', ctaUrl:'/pages/portfolio.html' } },
    { id:'h5', type:'featured-list', data:{ eyebrow:'Signature Projects', heading:'Work that required commitment to earn.' } },
    { id:'h6', type:'divider', data:{} },
    { id:'h7', type:'process-grid', data:{ eyebrow:'The Approach', heading:'How the photographs get made.', items:[
      { title:'Research &amp; Arrival', body:'Locations are studied before they&rsquo;re visited. Weather patterns, golden hour windows, seasonal light &mdash; the expedition plan is built around the image, not the schedule. Arriving prepared means arriving open.' },
      { title:'Medium Format Patience', body:'The GFX system doesn&rsquo;t reward spray-and-pray. 102 megapixels asks you to slow down, choose your moment, and mean it. Technical mastery is what frees you to respond to what you couldn&rsquo;t plan for.' },
      { title:'The Wait', body:'The honest photograph isn&rsquo;t taken &mdash; it&rsquo;s waited for. Sometimes that means three hours in the cold. Sometimes it means coming back on the fifth day. The image that earns its place always knew you were willing to wait.' }
    ] } },
    { id:'h8', type:'callout', data:{ eyebrow:'May 29&ndash;31, 2026 &middot; Guadalupe Mountains, Texas', title:'The Hope Hike', subtitle:'Adventure Wellness at the Top of Texas', body:'Ten participants. Three days. One summit. Guided by resilience speaker Tia Banks and documented through the lens of The Infinite Arch. Applications open through the WE CLIMB initiative.', ctaText:'Learn More', ctaUrl:'/pages/hope-hike.html' } },
    { id:'h9', type:'services-grid', data:{ eyebrow:'Services', heading:'Ways to work together.', items:[
      { title:'Fine Art Prints', body:'Museum-quality archival prints from the expedition collections. Limited editions with certificates of authenticity. Sizes from 16&times;20 to 40&times;60 on premium papers.', price:'From $450 &middot; Worldwide shipping' },
      { title:'Commission Work', body:'Custom landscape and architectural photography for commercial clients, publications, and private collectors. Each project begins with a conversation about what you&rsquo;re actually trying to say.', price:'From $2,500 &middot; Custom quotes' },
      { title:'Adventure Workshops', body:'Small-group expeditions combining landscape photography instruction with wilderness immersion. Not a photo tour &mdash; a genuine creative expedition into terrain that asks something of you.', price:'From $850 &middot; Limited availability' }
    ] } },
    { id:'h10', type:'newsletter', data:{ eyebrow:'Stay Connected', heading:'New work. Expedition updates.<br>Nothing you didn&rsquo;t ask for.', body:'Monthly dispatches from the field &mdash; new collections, Hope Hike news, and early access to limited edition print releases.', placeholder:'your@email.com' } },
    { id:'h11', type:'quote', data:{ text:'Beautiful things don&rsquo;t ask for attention.', attribution:'Sean O&rsquo;Connell' } }
  ],

  about: [
    { id:'a1', type:'hero', data:{ variant:'masthead', tagline:'Beyond the Daydream', label:'Artist Statement &nbsp;&middot;&nbsp; Fine Art Landscape Photography' } },
    { id:'a2', type:'text', data:{ variant:'pull-quote', line1:'Most of us spend our lives just outside the frame.', line2:'We scroll past the image, save it for later, and move on. The daydream is the beautiful moment we never quite inhabit.' } },
    { id:'a3', type:'divider', data:{} },
    { id:'a4', type:'text', data:{ variant:'article', body:'<p>I started chasing the places that couldn\u2019t be scrolled past.</p><p>The Infinite Arch is built on a belief that the most honest photographs aren\u2019t taken \u2014 they\u2019re <em>waited for</em>. They come to the photographer who arrives early, stays late, and returns when the light changes. Who understands that the arch in the rock and the arch of a life are describing the same passage: a threshold between what was and what\u2019s possible.</p><p>I shoot with Fujifilm\u2019s GFX medium format system because the format demands presence. You can\u2019t spray and pray at 102 megapixels. You choose your moment, and you mean it. My kit is the GFX 100RF, the GFX 50R, the X-E5, and a Konica Hexar \u2014 each one chosen for what it sees, not what it proves.</p><p>This is photography as contemplation. Landscape as mirror. Light as metaphor.</p><p>Sean O\u2019Connell didn\u2019t say <em>number 25 is technically perfect</em> or <em>compositionally superior</em>. He said it was the quintessence of life. The difference matters to me. He was talking about the photograph that captured something true \u2014 not flawless, but undeniably alive. That\u2019s the standard I\u2019m chasing. Not the image that impresses, but the one that\u2019s irreplaceable. The one I had to be cold for, had to wait for, had to raise the camera toward the impossible light and believe something was there before I could see it. This is what I came for. This is the quintessence of life.</p>', closing:'Welcome to the other side of the daydream.' } },
    { id:'a5', type:'quote', data:{ text:'Beautiful things don\u2019t ask for attention.', attribution:'Sean O\u2019Connell' } }
  ],

  prints: [
    { id:'p1', type:'hero', data:{ variant:'centered', eyebrow:'The Infinite Arch', title:'Prints', subtitle:'Coming Soon', body:'Museum-quality archival prints, hand-finished and signed. Each edition is produced in limited runs with meticulous attention to tonal accuracy.' } },
    { id:'p2', type:'details-list', data:{ items:['Archival Pigment on Cotton Rag', 'Limited Editions &middot; Signed &amp; Numbered', 'Custom Framing Available'] } },
    { id:'p3', type:'badge', data:{ text:'Launching 2026' } },
    { id:'p4', type:'back-link', data:{ url:'/', text:'Return Home' } }
  ],

  'hope-hike': [
    { id:'hh1', type:'hero', data:{ variant:'centered', eyebrow:'The Infinite Arch Presents', title:'Hope', titleSub:'Hike', location:'Guadalupe Peak &middot; Texas', subtitle:'May 29 &ndash; 31, 2026', body:'A three-day expedition to the highest point in Texas, combining fine art landscape photography with a fundraising mission. Every step carries purpose &mdash; every frame tells the story of why we climb.' } },
    { id:'hh2', type:'stats-bar', data:{ items:[{ value:'8,751\'', label:'Summit Elevation' }, { value:'3', label:'Days' }, { value:'&infin;', label:'Purpose' }] } },
    { id:'hh3', type:'purpose-quote', data:{ text:'\u201CThe summit is not the destination. It\u2019s the proof that you kept going.\u201D' } },
    { id:'hh4', type:'back-link', data:{ url:'/', text:'Return Home' } }
  ],

  contact: [
    { id:'c1', type:'hero', data:{ variant:'centered', eyebrow:'The Infinite Arch', title:'Contact', subtitle:'Let\u2019s talk about light', body:'For print inquiries, collaboration proposals, licensing, or simply to say hello \u2014 reach out below.' } },
    { id:'c2', type:'email-link', data:{ email:'hello@theinfinitearch.com' } },
    { id:'c3', type:'back-link', data:{ url:'/', text:'Return Home' } }
  ]
};
