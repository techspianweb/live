/* ============================================================
   APP — Perk-inspired interactions
   ============================================================ */
(function(){
  'use strict';

  /* ---------- Hero video: force mobile autoplay + iOS fallback ---------- */
  document.querySelectorAll('video.hero-video').forEach(v => {
    try {
      v.muted = true;
      v.setAttribute('muted', '');
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.removeAttribute('controls');
      const tryPlay = () => {
        const p = v.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      };
      tryPlay();
      // Aggressive retry strategy: any user interaction anywhere
      const retry = () => { tryPlay(); };
      ['touchstart','touchend','click','scroll','pointerdown'].forEach(evt => {
        window.addEventListener(evt, retry, { once: true, passive: true });
      });
      v.addEventListener('loadedmetadata', tryPlay, { once: true });
      v.addEventListener('canplay', tryPlay, { once: true });
    } catch (e) {}
  });

  /* ---------- Header: transparent → white on scroll ---------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    if (!header) return;
    if (window.scrollY > 40) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile nav toggle (Perk-style fullscreen drawer) ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');
  const headerEl = document.querySelector('.site-header');
  if (toggle && links) {
    // Inject CTA into the drawer (mobile only) once
    if (!links.querySelector('.nav-drawer-cta')) {
      const cta = document.createElement('a');
      cta.href = 'contact.html';
      cta.className = 'nav-drawer-cta';
      cta.textContent = 'Book a strategy call';
      links.appendChild(cta);
    }
    const closeNav = () => {
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
      headerEl && headerEl.classList.remove('nav-is-open');
    };
    const openNav = () => {
      links.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('nav-open');
      headerEl && headerEl.classList.add('nav-is-open');
    };
    toggle.addEventListener('click', () => {
      if (links.classList.contains('is-open')) closeNav(); else openNav();
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && links.classList.contains('is-open')) closeNav();
    });
  }

  /* ---------- Active nav link ---------- */
  const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (href && (href === here || (here === '' && href === 'index.html'))) {
      a.classList.add('is-active');
    }
  });

  /* ---------- Scroll reveal (fade-up) ---------- */
  const reveals = document.querySelectorAll('.reveal, .reveal-stagger');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          // stagger children
          if (entry.target.classList.contains('reveal-stagger')) {
            Array.from(entry.target.children).forEach((child, i) => {
              child.style.setProperty('--d', `${i * 40}ms`);
            });
          }
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-in'));
  }

  /* ---------- Marquees: step-and-hold (Apple-keynote rotator) ----------
     Each phrase slides in, dwells, then advances. The track is tripled so
     there's always a copy ahead AND behind: we step through the middle
     copy, then silently snap to the equivalent position in the previous
     copy when we cross. Snap happens offscreen-equivalent (during the
     dwell) so the user never sees a jump. */
  const marquees = document.querySelectorAll('.marquee-track');
  marquees.forEach(track => {
    const origPhrases = Array.from(track.children).filter(c =>
      c.tagName === 'SPAN' && !c.classList.contains('dot')
    );
    if (!origPhrases.length) return;

    // Triple the content. Indices 0..N-1 = copy A, N..2N-1 = copy B (active),
    // 2N..3N-1 = copy C. We step within copy B; when we reach copy C, we
    // silently snap back to copy B's equivalent position during the dwell.
    const baseHTML = track.innerHTML;
    track.innerHTML = baseHTML + baseHTML + baseHTML;
    const N = origPhrases.length;
    const spans = Array.from(track.children).filter(c =>
      c.tagName === 'SPAN' && !c.classList.contains('dot')
    );

    const parent = track.parentElement;
    let idx = N; // start in middle copy
    let timer = null;
    let currentX = 0;

    const targetFor = (i) => {
      const span = spans[i];
      if (!span || !parent) return 0;
      const sR = span.getBoundingClientRect();
      const pR = parent.getBoundingClientRect();
      const delta = (pR.left + pR.width / 2) - (sR.left + sR.width / 2);
      return currentX + delta;
    };

    const HOLD_MS = 2300;
    const TRANSITION_MS = 1700;

    const animateTo = (i) => {
      currentX = targetFor(i);
      track.style.transform = 'translate3d(' + currentX + 'px,0,0)';
    };

    const snapTo = (i) => {
      // Disable transition, set new position, re-enable next frame.
      track.classList.add('is-jumping');
      currentX = targetFor(i);
      track.style.transform = 'translate3d(' + currentX + 'px,0,0)';
      // Force reflow then re-enable transitions.
      void track.offsetWidth;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        track.classList.remove('is-jumping');
      }));
    };

    const step = () => {
      idx++;
      animateTo(idx);
      // After the slide completes and during the dwell, if we're now in
      // the last copy (idx >= 2N), silently snap back by one copy length.
      // The user sees the same phrase under their eye — no visible jump.
      if (idx >= 2 * N) {
        setTimeout(() => {
          // Snap idx back N positions; visually identical phrase.
          snapTo(idx - N);
          idx = idx - N;
        }, TRANSITION_MS + 200); // well after transition done, well before next step
      }
      timer = setTimeout(step, HOLD_MS + TRANSITION_MS);
    };

    const start = () => {
      if (timer) { clearTimeout(timer); timer = null; }
      idx = N;
      snapTo(idx);
      timer = setTimeout(step, HOLD_MS);
    };

    // Pause when fully offscreen.
    let visible = true;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && !visible) { visible = true; start(); }
        else if (!e.isIntersecting && visible) {
          visible = false;
          if (timer) { clearTimeout(timer); timer = null; }
        }
      });
    }, { threshold: 0 });
    io.observe(parent);

    start();

    // Resize / font load = recompute centering.
    let rRaf = 0;
    const recompute = () => {
      if (rRaf) return;
      rRaf = requestAnimationFrame(() => { rRaf = 0; if (visible) start(); });
    };
    window.addEventListener('resize', recompute);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(recompute);
    }
  });

  /* ---------- WWD rail: Perk-style center-active card detection ----------
     Perk pattern: the card closest to the rail viewport center is .is-active
     (scale 1). All others sit at scale .88. easeOutQuart 600ms swap.
     On initial load we mark the MIDDLE card active so the row feels balanced
     even before the user interacts. */
  document.querySelectorAll('.wwd-rail').forEach(rail => {
    const cards = Array.from(rail.querySelectorAll('.wwd-card'));
    if (!cards.length) return;

    // Default: middle card active so first-paint already has the Perk look.
    const midIdx = Math.floor(cards.length / 2);
    cards.forEach((card, i) => card.classList.toggle('is-active', i === midIdx));

    // Revolut-style scroll-driven fan.
    // Per-card --wwd-tx: how far (in px) the card sits FROM its resting fan position
    // at progress=0 (clustered start). Left card starts +180px (right of rest, near center),
    // right card starts -180px (left of rest, near center), middle stays.
    // Per-card stagger: introduce a phase offset so middle leads, sides follow.
    const isDesktop = window.matchMedia('(min-width: 761px)').matches;
    const FAN_DIST = isDesktop ? 200 : 0;
    cards.forEach((card, i) => {
      const dir = (i < midIdx) ? 1 : (i > midIdx) ? -1 : 0;
      card.style.setProperty('--wwd-tx', (dir * FAN_DIST) + 'px');
      // Stagger: on desktop middle leads (center-out fan); on mobile linear (top-to-bottom feel).
      const phase = isDesktop ? Math.abs(i - midIdx) * 0.18 : i * 0.22;
      card.dataset.phase = String(phase);
    });

    // Drive --wwd-prog from scroll position. easeOutCubic on the raw [0..1] linear progress.
    const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
    let progRaf = 0;
    function updateProg(){
      progRaf = 0;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const r = rail.getBoundingClientRect();
      // Smooth window: progress climbs over a fixed travel distance so we don't snap.
      // Travel ≈ 60% of viewport height — on a short mobile viewport this is enough
      // to make the entrance visible and gradual.
      const travel = vh * 0.6;
      // Start when rail top is at (vh - 20px) i.e. just entering; finish after `travel` of scroll.
      const startTop = vh - 20;
      const raw = (startTop - r.top) / travel;
      const clamped = Math.max(0, Math.min(1, raw));
      cards.forEach((card) => {
        const phase = parseFloat(card.dataset.phase || '0');
        // Apply stagger by remapping the clamped progress per-card.
        const local = Math.max(0, Math.min(1, (clamped - phase) / (1 - phase)));
        card.style.setProperty('--wwd-prog', easeOutCubic(local).toFixed(4));
      });
      // Once fully landed, mark settled so subsequent scale changes use the snap transition.
      if (clamped >= 0.999) rail.classList.add('is-settled');
      else rail.classList.remove('is-settled');
    }
    const scheduleProg = () => {
      if (progRaf) return;
      progRaf = requestAnimationFrame(updateProg);
    };
    window.addEventListener('scroll', scheduleProg, { passive: true });
    window.addEventListener('resize', scheduleProg);
    updateProg();

    // ---- Mobile pagination dots (only rendered on small screens via CSS) ----
    let dotsEl = null;
    let dotsBtns = [];
    const wrap = rail.closest('.wwd-rail-wrap') || rail.parentElement;
    if (wrap && !wrap.querySelector('.wwd-dots')) {
      dotsEl = document.createElement('div');
      dotsEl.className = 'wwd-dots';
      const hint = document.createElement('span');
      hint.className = 'wwd-dots__hint';
      hint.textContent = 'Swipe →';
      dotsEl.appendChild(hint);
      cards.forEach((card, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'wwd-dot';
        b.setAttribute('aria-label', `Show card ${i + 1}`);
        if (i === midIdx) b.classList.add('is-active');
        b.addEventListener('click', () => {
          card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
        dotsEl.appendChild(b);
        dotsBtns.push(b);
      });
      wrap.appendChild(dotsEl);
    }

    const setActiveFromScroll = () => {
      const railRect = rail.getBoundingClientRect();
      const railCenter = railRect.left + railRect.width / 2;
      let bestIdx = 0;
      let bestDist = Infinity;
      cards.forEach((card, i) => {
        const r = card.getBoundingClientRect();
        const c = r.left + r.width / 2;
        const d = Math.abs(c - railCenter);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      });
      cards.forEach((card, i) => card.classList.toggle('is-active', i === bestIdx));
      dotsBtns.forEach((b, i) => b.classList.toggle('is-active', i === bestIdx));
    };

    // Only run center-detection once the user actually moves the rail.
    let userInteracted = false;
    let raf = 0;
    const onScroll = () => {
      userInteracted = true;
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; setActiveFromScroll(); });
    };
    rail.addEventListener('scroll', onScroll, { passive: true });
    rail.addEventListener('touchstart', () => { userInteracted = true; }, { passive: true });

    // On resize, if user already scrolled, keep tracking center.
    // If not, keep the middle card default but re-run once so any wrapping settles.
    window.addEventListener('resize', () => {
      if (userInteracted) onScroll();
    });
  });

  /* ---------- Smooth-scroll for in-page anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id && id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  /* ---------- Decode obfuscated email if present ---------- */
  document.querySelectorAll('.__cf_email__').forEach(el => {
    try {
      const enc = el.getAttribute('data-cfemail');
      if (!enc) return;
      const r = parseInt(enc.substr(0,2),16);
      let out = '';
      for (let i = 2; i < enc.length; i += 2) {
        out += String.fromCharCode(parseInt(enc.substr(i,2),16) ^ r);
      }
      el.textContent = out;
      const parent = el.closest('a');
      if (parent && parent.getAttribute('href')) {
        parent.setAttribute('href', 'mailto:' + out);
      }
    } catch(_) {}
  });
})();

/* ============================================================
   EDITORIAL CAROUSEL — scroll-pinned cinematic verticals
   Light Perk-style theme; uses [data-carousel="editorial"]
   ============================================================ */
(function(){
  var grids = document.querySelectorAll('[data-carousel="editorial"]');
  if(!grids.length) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ADVANCE_MS = 4200; // time each slide is held before auto-advance

  grids.forEach(function(grid){
    var tiles = Array.prototype.slice.call(grid.querySelectorAll('.tile'));
    if(tiles.length < 2) return;

    var data = tiles.map(function(t){
      var num = t.querySelector('.tile-num');
      var title = t.querySelector('h3');
      var text = t.querySelector('p');
      return {
        num: num ? num.textContent.trim() : '',
        title: title ? title.textContent.trim() : '',
        text: text ? text.textContent.trim() : '',
        img: t.getAttribute('data-img') || '',
        stat: t.getAttribute('data-stat') || '',
        statLabel: t.getAttribute('data-stat-label') || ''
      };
    });
    var total = data.length;
    var edLabel = grid.getAttribute('data-ed-label') || 'Travel Verticals';
    var edToneMode = grid.getAttribute('data-ed-tone') || 'light'; // 'light' | 'ink'

    var stage = document.createElement('div'); stage.className = 'ed-stage';
    var host = document.createElement('div'); host.className = 'ed-host';
    if(edToneMode === 'ink') host.classList.add('ed-host--ink');
    stage.appendChild(host);
    var inner = document.createElement('div'); inner.className = 'ed-inner';
    host.appendChild(inner);

    var textCol = document.createElement('div'); textCol.className = 'ed-text';
    inner.appendChild(textCol);

    var topbar = document.createElement('div'); topbar.className = 'ed-topbar';
    var tbL = document.createElement('span'); tbL.className = 'ed-tag'; tbL.textContent = edLabel;
    topbar.appendChild(tbL);
    textCol.appendChild(topbar);

    var h = document.createElement('h2'); h.className = 'ed-title ed-item';
    var copy = document.createElement('p'); copy.className = 'ed-copy ed-item';
    textCol.appendChild(h); textCol.appendChild(copy);

    var hasStat = data.some(function(d){ return d.stat; });
    var statWrap, statNum, statLbl;
    if(hasStat){
      statWrap = document.createElement('div'); statWrap.className = 'ed-stat ed-item';
      statNum = document.createElement('span'); statNum.className = 'ed-stat-num';
      statLbl = document.createElement('span'); statLbl.className = 'ed-stat-label';
      statWrap.appendChild(statNum); statWrap.appendChild(statLbl);
      textCol.appendChild(statWrap);
    }

    var prog = document.createElement('div'); prog.className = 'ed-progress';
    var lbl = document.createElement('span'); lbl.className = 'ed-progress__label';
    var curEl = document.createElement('span'); curEl.className='ed-progress__current'; curEl.textContent='01';
    var sepEl = document.createElement('span'); sepEl.className='ed-progress__sep'; sepEl.textContent='/';
    var totEl = document.createElement('span'); totEl.className='ed-progress__total'; totEl.textContent = ('0'+total).slice(-2);
    lbl.appendChild(curEl); lbl.appendChild(sepEl); lbl.appendChild(totEl);
    prog.appendChild(lbl);
    // Dot navigation for manual jumps (auto-play advances on its own)
    var dotsWrap = document.createElement('div'); dotsWrap.className = 'ed-dots';
    var dots = [];
    for(var di=0; di<total; di++){
      (function(idx){
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'ed-dot';
        b.setAttribute('aria-label', 'Show slide '+(idx+1));
        b.addEventListener('click', function(){
          paint(idx);
          if(playing) startTimer();
        });
        dots.push(b);
        dotsWrap.appendChild(b);
      })(di);
    }
    prog.appendChild(dotsWrap);
    textCol.appendChild(prog);

    var hasImg = data.some(function(d){ return d.img; });
    var media, imgA, imgB, imgFront = true;
    if(hasImg){
      media = document.createElement('div'); media.className = 'ed-media';
      imgA = document.createElement('img'); imgA.className = 'ed-photo is-on'; imgA.alt = ''; imgA.loading = 'lazy';
      imgB = document.createElement('img'); imgB.className = 'ed-photo'; imgB.alt = ''; imgB.loading = 'lazy';
      media.appendChild(imgA); media.appendChild(imgB);
      inner.appendChild(media);
      host.classList.add('has-media');
    }

    // Alternate tones across slides
    // Light mode: greys only (with lime accent details inside the card, never a full-lime panel)
    var tones = (edToneMode === 'ink')
      ? ['ink','graphite','ink','graphite','ink','graphite']
      : ['stone','stone-2','stone','stone-2','stone','stone-2'];
    var cur = -1;
    function paint(idx){
      if(idx === cur) return;
      cur = idx;
      var d = data[idx];
      host.setAttribute('data-tone', tones[idx % tones.length]);
      h.classList.add('is-out'); copy.classList.add('is-out');
      if(statWrap) statWrap.classList.add('is-out');
      window.setTimeout(function(){
        h.innerHTML = '<span class="ed-num">'+(d.num||('0'+(idx+1)))+'</span>'+d.title;
        copy.textContent = d.text;
        if(statWrap){
          statNum.textContent = d.stat || '';
          statLbl.textContent = d.statLabel || '';
          statWrap.style.display = d.stat ? '' : 'none';
          statWrap.classList.remove('is-out');
        }
        h.classList.remove('is-out'); copy.classList.remove('is-out');
      }, reduce ? 0 : 240);
      if(hasImg && d.img){
        var back = imgFront ? imgB : imgA;
        var front = imgFront ? imgA : imgB;
        back.src = d.img;
        back.classList.add('is-on');
        front.classList.remove('is-on');
        imgFront = !imgFront;
      }
      curEl.textContent = ('0'+(idx+1)).slice(-2);
      for(var k=0;k<dots.length;k++){ dots[k].classList.toggle('is-on', k===idx); }
      // Restart the timing-bar animation for the new slide
      prog.classList.remove('is-counting');
      // eslint-disable-next-line no-unused-expressions
      void prog.offsetWidth;
      if(playing && !reduce) prog.classList.add('is-counting');
      stage.classList.add('is-engaged');
    }

    grid.parentNode.replaceChild(stage, grid);

    // Tell CSS how long each slide is held so the timing bar matches
    prog.style.setProperty('--ed-advance-ms', ADVANCE_MS + 'ms');

    if(reduce){ stage.classList.add('is-static'); paint(0); return; }

    // ----- Auto-play machinery (page scrolls freely; no pinning) -----
    var timerId = null;
    var playing = false;
    function startTimer(){
      if(timerId){ window.clearInterval(timerId); }
      timerId = window.setInterval(function(){
        paint((cur + 1) % total);
      }, ADVANCE_MS);
    }
    function stopTimer(){
      if(timerId){ window.clearInterval(timerId); timerId = null; }
    }
    function play(){
      if(playing) return;
      playing = true;
      prog.classList.add('is-counting');
      startTimer();
    }
    function pause(){
      if(!playing) return;
      playing = false;
      stopTimer();
      prog.classList.remove('is-counting');
    }

    // Play only while the section is in view; pause when off-screen/tab hidden
    if('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(e.isIntersecting && e.intersectionRatio > 0.3){ play(); }
          else { pause(); }
        });
      }, { threshold: [0, 0.3, 0.6] });
      io.observe(stage);
    } else {
      play();
    }

    // Pause while a user is reading/interacting
    host.addEventListener('mouseenter', pause);
    host.addEventListener('mouseleave', function(){ play(); });
    dotsWrap.addEventListener('focusin', pause);
    dotsWrap.addEventListener('focusout', function(){ play(); });
    document.addEventListener('visibilitychange', function(){
      if(document.hidden){ pause(); }
      else {
        var r = stage.getBoundingClientRect();
        if(r.top < window.innerHeight && r.bottom > 0){ play(); }
      }
    });

    paint(0);
  });
})();

/* ====== MEGA MENU (click + outside close) ====== */
(function(){
  var triggers = document.querySelectorAll('.has-mega .mega-trigger');
  triggers.forEach(function(btn){
    var item = btn.closest('.has-mega');
    btn.addEventListener('click', function(e){
      e.preventDefault();
      var isOpen = item.classList.contains('is-open');
      document.querySelectorAll('.has-mega.is-open').forEach(function(o){
        if(o !== item) o.classList.remove('is-open');
      });
      item.classList.toggle('is-open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });
  document.addEventListener('click', function(e){
    if(!e.target.closest('.has-mega')){
      document.querySelectorAll('.has-mega.is-open').forEach(function(o){
        o.classList.remove('is-open');
        var b = o.querySelector('.mega-trigger');
        if(b) b.setAttribute('aria-expanded','false');
      });
    }
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      document.querySelectorAll('.has-mega.is-open').forEach(function(o){
        o.classList.remove('is-open');
      });
    }
  });
})();
