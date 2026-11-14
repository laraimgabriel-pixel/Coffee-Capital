/* Coffee Capital: site behaviors for all three pages (plain JavaScript, no libraries).
    1. Mobile menu
    2. Header: frosted when scrolled, reading-progress line
    3. Page transition: the logo mark grows over the page, then shrinks away on the next one
    4. Home opening: the logo mark grows into a window onto the film
    5. Hero film: two clips play in turn and loop; time-of-day light; greeting
    6. Headlines that write themselves letter by letter
    7. Statement: words light up as you scroll
    8. Story: pinned scroll through the chapters
    9. Menu board tabs and the craving picker
   10. Menu page: category filter and search
   11. "My list" to show at the counter
   12. Live "Open now" and the clock in Prosperidad (Manila time)
   13. Footer wordmark fitted to the page width
   14. Reveal on scroll
   15. Reel: drag, arrows, lightbox
   16. Ribbon, lamp light, tilt, magnetic buttons, cursor chip
   17. Smooth scrolling (mouse wheel, desktop only)
   Without this file every page still shows all its content. Reduced motion skips the effects. */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (n, a, b) { return Math.max(a, Math.min(b, n)); };
  var store = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* storage blocked: only a convenience */ } },
    del: function (k) { try { sessionStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  /* ---- 1. Mobile menu ---- */
  var toggle = $('.menu-toggle');
  var panel = document.getElementById('mobile-nav');
  function setMenu(open) {
    if (!toggle || !panel) return;
    toggle.setAttribute('aria-expanded', String(open));
    $('.menu-toggle__text', toggle).textContent = open ? 'Close' : 'Menu';
    panel.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
  }
  if (toggle && panel) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 900px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  /* ---- 2. Header ---- */
  var header = $('.site-header');
  var wide = window.matchMedia('(min-width: 900px)');

  /* ---- 3. Page transition ---- */
  var maskOk = !!(window.CSS && CSS.supports && (CSS.supports('mask-image', 'url(x)') || CSS.supports('-webkit-mask-image', 'url(x)')));
  var wipeOn = maskOk && !reduce && !!$('.wipe');
  if (root.classList.contains('wipe-hold')) {
    var finishWipe = function () {
      root.classList.remove('wipe-hold');
      root.classList.add('wipe-in');
      window.setTimeout(function () { root.classList.remove('wipe-in'); }, 900);
    };
    if (wipeOn) window.requestAnimationFrame(function () { window.requestAnimationFrame(finishWipe); });
    else root.classList.remove('wipe-hold');
  }
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) root.classList.remove('wipe-out', 'wipe-hold', 'wipe-in');
  });
  if (wipeOn) {
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      var href = a.getAttribute('href');
      if (!/^(index|menu|visit)\.html(#.*)?$/.test(href)) return;
      var here = (location.pathname.split('/').pop() || 'index.html');
      if (href.split('#')[0] === here) return; // same page: let the browser scroll
      e.preventDefault();
      store.set('ccWipe', '1');
      root.classList.add('wipe-out');
      window.setTimeout(function () { window.location.href = href; }, 720);
    });
  }

  /* ---- 6. Headlines, letter by letter ---- */
  function splitLetters(el) {
    var k = 0;
    var label = el.textContent.replace(/\s+/g, ' ').trim();
    el.setAttribute('aria-label', label);
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span');
            w.className = 'sw'; w.setAttribute('aria-hidden', 'true');
            part.split('').forEach(function (ch) {
              var s = document.createElement('span');
              s.className = 'sl'; s.style.setProperty('--k', k++);
              s.textContent = ch; w.appendChild(s);
            });
            frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
    el.classList.add('is-split');
  }
  var splits = $$('[data-split]');
  splits.forEach(splitLetters);
  var pageHead = $('.page-head [data-split]');
  if (pageHead) window.setTimeout(function () { pageHead.classList.add('is-in'); }, root.classList.contains('wipe-hold') || root.classList.contains('wipe-in') ? 700 : 150);

  /* ---- 4. Home opening ---- */
  var hero = $('.hero');
  var heroMedia = $('.hero__media');
  var clips = $$('.hero__video');
  var video = clips[0];

  function revealHeroText() {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        hero.classList.add('is-in');
        var h = $('#hero-title');
        if (h) h.classList.add('is-in');
      });
    });
  }
  function finishIntro() {
    root.classList.remove('intro', 'intro-open');
    document.body.classList.remove('intro-lock');
    store.set('ccIntro', '1');
  }
  if (hero && heroMedia) {
    if (root.classList.contains('intro')) {
      document.body.classList.add('intro-lock');
      var t0 = Date.now();
      var opened = false;
      var open = function () {
        if (opened) return;
        opened = true;
        root.classList.add('intro-open');
        window.setTimeout(revealHeroText, 1150);
        var done = false;
        var end = function () { if (done) return; done = true; finishIntro(); };
        heroMedia.addEventListener('animationend', end);
        window.setTimeout(end, 3400); // safety: never leave the page locked
      };
      var ready = function () { window.setTimeout(open, Math.max(0, 650 - (Date.now() - t0))); };
      if (video && video.readyState >= 2) ready();
      else {
        if (video) video.addEventListener('loadeddata', ready, { once: true });
        window.setTimeout(ready, 1800);
      }
    } else {
      revealHeroText();
    }
  }

  /* ---- 5. Hero film: clips play in turn, then back to the first, forever ---- */
  var ticks = $$('.hero__ticks li');
  var current = 0;
  var switching = false;
  var heroVisible = true;
  function playClip(v) { var p = v.play(); if (p && p.catch) p.catch(function () { /* autoplay refused: the still stays */ }); }
  function setTick(i) {
    ticks.forEach(function (t, k) { if (k === i) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current'); });
  }
  function goTo(next) {
    if (switching || next === current) return;
    switching = true;
    var prev = clips[current], nxt = clips[next];
    try { nxt.currentTime = 0; } catch (e) { /* not seekable yet */ }
    clips.forEach(function (c) { c.classList.remove('is-prev', 'is-top'); });
    prev.classList.add('is-prev');
    nxt.classList.add('is-top');
    if (heroVisible) playClip(nxt);
    current = next;
    setTick(next);
    window.setTimeout(function () { prev.classList.remove('is-prev'); prev.pause(); switching = false; }, 1400);
  }
  if (clips.length) {
    setTick(0);
    clips.forEach(function (v, i) {
      v.loop = false;
      v.addEventListener('timeupdate', function () {
        if (i !== current) return;
        var d = v.duration;
        if (d && ticks[i]) ticks[i].style.setProperty('--p', clamp(v.currentTime / d, 0, 1).toFixed(3));
        if (d && d - v.currentTime < 0.9 && clips.length > 1) goTo((i + 1) % clips.length);
      });
      v.addEventListener('ended', function () {
        if (i !== current) return;
        if (clips.length > 1) goTo((i + 1) % clips.length);
        else { v.currentTime = 0; if (heroVisible) playClip(v); }
      });
    });
    if (reduce) clips.forEach(function (v) { v.pause(); });
    else if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        var v = clips[current];
        if (heroVisible) playClip(v); else v.pause();
      }, { threshold: 0.05 }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () {
      if (reduce) return;
      if (document.hidden) clips[current].pause(); else if (heroVisible) playClip(clips[current]);
    });
  }

  // Light that follows the real time in Prosperidad, and a greeting
  function manila() {
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      var get = function (t) { return parts.filter(function (p) { return p.type === t; })[0].value; };
      var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      var h = parseInt(get('hour'), 10), m = parseInt(get('minute'), 10);
      return { d: days.indexOf(get('weekday')), h: h, m: m, mins: h * 60 + m };
    } catch (e) { return null; }
  }
  function clockText(t) {
    var h12 = t.h % 12 === 0 ? 12 : t.h % 12;
    return h12 + ':' + ('0' + t.m).slice(-2) + ' ' + (t.h < 12 ? 'AM' : 'PM');
  }
  function updateLight() {
    var t = manila();
    if (!t) return;
    var tod, greet;
    if (t.h >= 5 && t.h < 8) { tod = 'linear-gradient(180deg, rgba(255,190,150,.18), rgba(157,184,255,.10))'; greet = 'Good morning'; }
    else if (t.h >= 8 && t.h < 12) { tod = 'linear-gradient(180deg, rgba(190,210,255,.12), rgba(190,210,255,.04))'; greet = 'Good morning'; }
    else if (t.h >= 12 && t.h < 16) { tod = 'linear-gradient(180deg, rgba(200,218,255,.12), rgba(200,218,255,.03))'; greet = 'Good afternoon'; }
    else if (t.h >= 16 && t.h < 19) { tod = 'linear-gradient(180deg, rgba(255,150,90,.16), rgba(22,71,200,.24))'; greet = t.h < 18 ? 'Good afternoon' : 'Good evening'; }
    else { tod = 'linear-gradient(180deg, rgba(6,12,36,.30), rgba(6,12,36,.34))'; greet = 'Good evening'; }
    var layer = $('.hero__tod');
    if (layer) layer.style.setProperty('--tod', tod);
    var g = $('[data-greet]');
    if (g) g.textContent = greet + ' from Prosperidad · ' + clockText(t);
  }
  updateLight();

  /* ---- 7. Statement words ---- */
  var statements = $$('[data-words]');
  var wordSets = [];
  if (!reduce) {
    statements.forEach(function (st) {
      var plain = st.textContent.trim().split(/\s+/);
      st.innerHTML = plain.map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
      st.classList.add('is-split');
      wordSets.push({ el: st, words: $$('.w', st) });
    });
  }
  function updateWords() {
    var vh = window.innerHeight;
    wordSets.forEach(function (s) {
      var r = s.el.getBoundingClientRect();
      var p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
      var n = Math.round(p * s.words.length);
      s.words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
    });
  }

  /* ---- 8. Pinned story ---- */
  var story = $('[data-story]');
  var chapters = [];
  var count = $('[data-story-count]');
  var dots = [];
  var lastActive = -2;
  if (story && !reduce) {
    story.classList.add('is-pinned');
    chapters = $$('.chapter', story);
    dots = $$('.story__dots button', story);
    dots.forEach(function (d, i) { d.addEventListener('click', function () { scrollToChapter(i); }); });
  }
  function storyMetrics() {
    var r = story.getBoundingClientRect();
    var headerH = header ? header.offsetHeight : 0;
    return { r: r, headerH: headerH, distance: story.offsetHeight - (window.innerHeight - headerH) };
  }
  function updateStory() {
    if (!chapters.length) return;
    var m = storyMetrics();
    var y = (m.headerH - m.r.top) / m.distance;
    var n = chapters.length;
    var a = m.r.top < window.innerHeight * 0.55 ? Math.max(0, Math.min(n - 1, Math.floor(y * n))) : -1;
    if (a === lastActive) return;
    lastActive = a;
    chapters.forEach(function (c, i) {
      c.classList.toggle('is-active', i === a);
      c.classList.toggle('is-revealed', i <= a);
    });
    dots.forEach(function (d, i) { if (i === a) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
    if (count && a >= 0) count.textContent = ('0' + (a + 1)).slice(-2);
  }
  function scrollToChapter(i) {
    var m = storyMetrics();
    var y = (i + 0.5) / chapters.length;
    window.scrollTo({ top: window.pageYOffset + (m.r.top - m.headerH) + y * m.distance, behavior: 'smooth' });
  }

  /* ---- 9. Menu board tabs + craving picker ---- */
  var board = $('[data-board]');
  if (board) {
    var tabs = $$('.board__tab', board);
    var panels = $$('.board__panel', board);
    var ids = tabs.map(function (t) { return t.getAttribute('data-tab'); });
    var show = function (id) {
      tabs.forEach(function (t) { if (t.getAttribute('data-tab') === id) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current'); });
      panels.forEach(function (p) {
        var on = p.getAttribute('data-panel') === id;
        if (on && p.hidden) { p.hidden = false; p.classList.remove('is-entering'); void p.offsetWidth; p.classList.add('is-entering'); }
        else if (!on) p.hidden = true;
      });
    };
    board.classList.add('is-ready');
    var fromHash = window.location.hash.replace('#b-', '');
    show(ids.indexOf(fromHash) >= 0 ? fromHash : ids[0]);
    tabs.forEach(function (t) { t.addEventListener('click', function (e) { e.preventDefault(); show(t.getAttribute('data-tab')); }); });
  }
  var pickRoot = $('[data-pick-root]');
  if (pickRoot) {
    var chips = $$('[data-pick]', pickRoot);
    var lists = $$('[data-pick-panel]', pickRoot);
    var imgs = $$('[data-pick-img]', pickRoot);
    var choose = function (id) {
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-pick') === id)); });
      imgs.forEach(function (im) { im.classList.toggle('is-on', im.getAttribute('data-pick-img') === id); });
      lists.forEach(function (l) {
        var on = l.getAttribute('data-pick-panel') === id;
        l.hidden = !on;
        if (on) {
          l.classList.remove('is-entering'); void l.offsetWidth; l.classList.add('is-entering');
          $$('.pick__item', l).forEach(function (it, k) { it.style.setProperty('--k', k); });
        }
      });
    };
    choose(chips[0].getAttribute('data-pick'));
    chips.forEach(function (c) { c.addEventListener('click', function () { choose(c.getAttribute('data-pick')); }); });
  }

  /* ---- 10. Menu page: filter + search ---- */
  var menuCard = $('[data-menucard]');
  if (menuCard) {
    var groups = $$('.mg', menuCard);
    var chipLinks = $$('[data-filter]');
    var input = $('[data-search]');
    var status = $('#filter-status');
    var state = { cat: 'all', q: '' };
    var apply = function () {
      var q = state.q.trim().toLowerCase();
      var total = 0;
      groups.forEach(function (g) {
        var inCat = state.cat === 'all' || g.getAttribute('data-cat') === state.cat;
        var rows = $$('.item', g);
        var any = 0;
        rows.forEach(function (r) {
          var hit = !q || r.getAttribute('data-name').toLowerCase().indexOf(q) >= 0;
          r.hidden = !hit;
          if (hit) any++;
        });
        $$('.mg__sub', g).forEach(function (h) {
          var ul = h.nextElementSibling;
          h.hidden = !!(q && ul && !$$('.item:not([hidden])', ul).length);
        });
        var show = inCat && (rows.length === 0 ? !q : any > 0);
        g.hidden = !show;
        if (show) total += rows.length ? any : 0;
      });
      var empty = $('[data-empty]');
      if (empty) empty.hidden = !(total === 0 && q);
      if (status) status.textContent = q ? (total + (total === 1 ? ' item matches' : ' items match') + ' “' + state.q.trim() + '”') : '';
    };
    var setCat = function (id, scroll) {
      state.cat = id;
      chipLinks.forEach(function (c) { if (c.getAttribute('data-filter') === id) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current'); });
      apply();
      if (scroll) {
        var bar = $('.menubar');
        var top = menuCard.getBoundingClientRect().top + window.pageYOffset - (bar ? bar.offsetHeight : 0) - (header ? header.offsetHeight : 0) + 2;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
      try { history.replaceState(null, '', id === 'all' ? location.pathname : '#' + id); } catch (e) { /* file:// may refuse */ }
    };
    chipLinks.forEach(function (c) {
      c.addEventListener('click', function (e) { e.preventDefault(); setCat(c.getAttribute('data-filter'), true); });
    });
    if (input) input.addEventListener('input', function () { state.q = input.value; apply(); });
    var h0 = window.location.hash.replace('#', '');
    if (h0 && groups.some(function (g) { return g.getAttribute('data-cat') === h0; })) setCat(h0, false);
  }

  /* ---- 11. "My list" ---- */
  var orderDlg = $('#order');
  var pill = $('.order-pill');
  var orderItems = [];
  try { orderItems = JSON.parse(store.get('ccOrder') || '[]') || []; } catch (e) { orderItems = []; }
  var peso = function (n) { return '₱' + n.toLocaleString('en-US'); };
  function saveOrder() { store.set('ccOrder', JSON.stringify(orderItems)); }
  function renderOrder() {
    var n = 0, total = 0;
    orderItems.forEach(function (it) { n += it.qty; total += it.qty * it.price; });
    if (pill) {
      pill.classList.toggle('has-items', n > 0);
      $('[data-order-count]', pill).textContent = n;
      $('[data-order-total]', pill).textContent = peso(total);
    }
    $$('.item__add').forEach(function (b) {
      var inList = orderItems.some(function (it) { return it.id === b.getAttribute('data-id'); });
      b.classList.toggle('is-added', inList);
      b.textContent = inList ? '✓' : '+';
    });
    if (!orderDlg) return;
    var list = $('[data-order-list]', orderDlg);
    list.innerHTML = '';
    if (!orderItems.length) {
      list.innerHTML = '<p class="order__empty">Nothing here yet. Tap the + beside any item on the menu.</p>';
    } else {
      orderItems.forEach(function (it, i) {
        var row = document.createElement('div');
        row.className = 'order__row';
        row.innerHTML = '<span class="order__name"></span><span class="order__cat"></span>' +
          '<div class="order__line"><div class="order__qty"><button type="button" data-dec aria-label="One less"></button><span aria-live="polite"></span><button type="button" data-inc aria-label="One more"></button></div><span class="order__sum"></span></div>';
        $('.order__name', row).textContent = it.name;
        $('.order__cat', row).textContent = it.cat + ' · ' + peso(it.price);
        $('[data-dec]', row).textContent = '−';
        $('[data-inc]', row).textContent = '+';
        $('.order__qty span', row).textContent = it.qty;
        $('.order__sum', row).textContent = peso(it.qty * it.price);
        $('[data-dec]', row).addEventListener('click', function () { it.qty--; if (it.qty <= 0) orderItems.splice(i, 1); saveOrder(); renderOrder(); });
        $('[data-inc]', row).addEventListener('click', function () { it.qty++; saveOrder(); renderOrder(); });
        list.appendChild(row);
      });
    }
    $('[data-order-sum]', orderDlg).textContent = peso(total);
  }
  $$('.item__add').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-id');
      var found = orderItems.filter(function (it) { return it.id === id; })[0];
      if (found) found.qty++;
      else orderItems.push({ id: id, name: b.getAttribute('data-name'), cat: b.getAttribute('data-cat'), price: parseInt(b.getAttribute('data-price'), 10), qty: 1 });
      saveOrder(); renderOrder();
    });
  });
  if (orderDlg && pill) {
    var openOrder = function () { if (orderDlg.showModal) orderDlg.showModal(); else orderDlg.setAttribute('open', ''); };
    var closeOrder = function () { if (orderDlg.close) orderDlg.close(); else orderDlg.removeAttribute('open'); };
    pill.addEventListener('click', openOrder);
    $('[data-order-close]', orderDlg).addEventListener('click', closeOrder);
    orderDlg.addEventListener('click', function (e) { if (e.target === orderDlg) closeOrder(); });
    $('[data-order-clear]', orderDlg).addEventListener('click', function () { orderItems = []; saveOrder(); renderOrder(); });
    $('[data-order-copy]', orderDlg).addEventListener('click', function (e) {
      var total = 0;
      var lines = orderItems.map(function (it) { total += it.qty * it.price; return it.qty + ' x ' + it.name + ' (' + it.cat + ')  ' + peso(it.qty * it.price); });
      var text = 'Coffee Capital: my list\n' + lines.join('\n') + '\nTotal ' + peso(total);
      var btn = e.currentTarget, old = btn.textContent;
      var done = function () { btn.textContent = 'Copied'; window.setTimeout(function () { btn.textContent = old; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { /* clipboard refused */ });
    });
  }
  renderOrder();

  /* ---- 12. Open now + clock (hours as posted: Mon-Fri 9 AM-10 PM, Sat-Sun 12 PM-10 PM; Manila time) ---- */
  var openEls = $$('[data-open]');
  var clockEls = $$('[data-clock]');
  function label(h) { return h === 12 ? '12 PM' : (h > 12 ? (h - 12) + ' PM' : h + ' AM'); }
  function updateOpen() {
    var t = manila();
    if (!t) return;
    clockEls.forEach(function (c) { c.textContent = clockText(t); });
    var opensAt = function (day) { return (day === 0 || day === 6) ? 12 : 9; };
    var close = 22, text, state;
    if (t.mins >= opensAt(t.d) * 60 && t.mins < close * 60) { state = 'open'; text = 'Open now <small>until 10 PM</small>'; }
    else if (t.mins < opensAt(t.d) * 60) { state = 'closed'; text = 'Closed <small>opens at ' + label(opensAt(t.d)) + ' today</small>'; }
    else { state = 'closed'; text = 'Closed <small>opens at ' + label(opensAt((t.d + 1) % 7)) + ' tomorrow</small>'; }
    openEls.forEach(function (el) { el.setAttribute('data-state', state); $('[data-open-text]', el).innerHTML = text; });
  }
  updateOpen();
  window.setInterval(function () { updateOpen(); updateLight(); }, 30000);

  /* ---- 13. Footer wordmark ---- */
  var mark = $('.wordmark');
  function fitMark() {
    if (!mark) return;
    var holder = mark.parentNode;
    var cs = window.getComputedStyle(holder);
    var avail = holder.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    mark.style.fontSize = '100px';
    var w = mark.getBoundingClientRect().width;
    if (w > 0) mark.style.fontSize = (100 * avail / w).toFixed(2) + 'px';
  }
  fitMark();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitMark);
  window.addEventListener('resize', fitMark);

  /* ---- 14. Reveal on scroll ---- */
  var items = $$('.reveal, .reveal-media');
  if (!('IntersectionObserver' in window) || reduce) {
    items.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---- 15. Reel + lightbox ---- */
  var dragged = false;
  $$('[data-reel]').forEach(function (reel) {
    var track = $('.reel__track', reel);
    var step = function (dir) { track.scrollBy({ left: dir * Math.min(420, track.clientWidth * 0.8), behavior: 'smooth' }); };
    var prev = $('[data-reel-prev]', reel), next = $('[data-reel-next]', reel);
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    if (fine) {
      var down = false, sx = 0, sl = 0;
      track.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        down = true; dragged = false; sx = e.clientX; sl = track.scrollLeft;
      });
      window.addEventListener('pointermove', function (e) {
        if (!down) return;
        var dx = e.clientX - sx;
        if (Math.abs(dx) > 5) { dragged = true; track.classList.add('is-drag'); }
        if (dragged) track.scrollLeft = sl - dx;
      });
      window.addEventListener('pointerup', function () {
        if (!down) return;
        down = false; track.classList.remove('is-drag');
        window.setTimeout(function () { dragged = false; }, 0);
      });
    }
  });

  var lbLinks = $$('[data-lightbox]');
  var dlg = null, lbImg, lbCap, lbSet = [], lbIndex = 0, lbOpener = null;
  function buildLb() {
    dlg = document.createElement('dialog');
    dlg.className = 'lb';
    dlg.setAttribute('aria-label', 'Photo viewer');
    dlg.innerHTML = '<div class="lb__stage"><img class="lb__img" alt=""><p class="lb__cap"></p></div>' +
      '<button class="lb__btn lb__close" type="button" aria-label="Close">×</button>' +
      '<button class="lb__btn lb__prev" type="button" aria-label="Previous photo">‹</button>' +
      '<button class="lb__btn lb__next" type="button" aria-label="Next photo">›</button>';
    document.body.appendChild(dlg);
    lbImg = $('.lb__img', dlg); lbCap = $('.lb__cap', dlg);
    $('.lb__close', dlg).addEventListener('click', function () { dlg.close(); });
    $('.lb__prev', dlg).addEventListener('click', function () { lbShow(lbIndex - 1); });
    $('.lb__next', dlg).addEventListener('click', function () { lbShow(lbIndex + 1); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') lbShow(lbIndex - 1);
      if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { if (lbOpener) lbOpener.focus(); });
    var sx = 0;
    dlg.addEventListener('touchstart', function (e) { sx = e.changedTouches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) lbShow(lbIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }
  function lbShow(i) {
    lbIndex = (i + lbSet.length) % lbSet.length;
    var a = lbSet[lbIndex];
    lbImg.src = a.getAttribute('href');
    lbImg.alt = a.getAttribute('data-alt') || '';
    lbCap.textContent = a.getAttribute('data-caption') || '';
  }
  lbLinks.forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (dragged) { e.preventDefault(); return; }
      if (!window.HTMLDialogElement) return; // plain link opens the photo
      e.preventDefault();
      if (!dlg) buildLb();
      var scope = a.closest('[data-reel]') || document;
      lbSet = $$('[data-lightbox]', scope);
      lbOpener = a;
      lbShow(lbSet.indexOf(a));
      dlg.showModal();
    });
  });

  /* ---- 16. Ribbon, lamp, tilt, magnet, cursor ---- */
  var ribbons = $$('[data-ribbon]');
  function updateRibbons() {
    var vh = window.innerHeight;
    ribbons.forEach(function (rb) {
      var r = rb.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      var p = (vh - r.top) / (vh + r.height);
      $('.ribbon__track', rb).style.setProperty('--rx', (-p * 900 - 40).toFixed(1) + 'px');
    });
  }
  if (fine && !reduce) {
    $$('[data-lamp]').forEach(function (sec) {
      sec.addEventListener('pointermove', function (e) {
        var r = sec.getBoundingClientRect();
        sec.style.setProperty('--lx', (e.clientX - r.left) + 'px');
        sec.style.setProperty('--ly', (e.clientY - r.top) + 'px');
        sec.classList.add('has-lamp');
      });
      sec.addEventListener('pointerleave', function () { sec.classList.remove('has-lamp'); });
    });
    $$('[data-tilt]').forEach(function (box) {
      var m = $('.media', box);
      if (!m) return;
      box.addEventListener('pointermove', function (e) {
        var r = box.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        m.style.transform = 'perspective(900px) rotateX(' + (-y * 5).toFixed(2) + 'deg) rotateY(' + (x * 6).toFixed(2) + 'deg)';
      });
      box.addEventListener('pointerleave', function () { m.style.transform = ''; });
    });
    $$('[data-magnet]').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
    var chip = $('.cursor');
    if (chip) {
      var cx = -100, cy = -100, tx = -100, ty = -100, label2 = '';
      document.addEventListener('pointermove', function (e) {
        tx = e.clientX; ty = e.clientY;
        var t = e.target.closest ? e.target.closest('[data-cursor]') : null;
        var l = t ? t.getAttribute('data-cursor') : '';
        if (l !== label2) { label2 = l; chip.textContent = l; chip.classList.toggle('is-on', !!l); }
      });
      var loop = function () {
        cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
        chip.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0) scale(' + (label2 ? 1 : 0.4) + ')';
        window.requestAnimationFrame(loop);
      };
      loop();
    }
  }

  /* ---- 17. Smooth scrolling (mouse wheel only, desktop only) ---- */
  if (fine && !reduce) {
    var target = window.pageYOffset, cur = target, running = false, own = false;
    var maxY = function () { return document.documentElement.scrollHeight - window.innerHeight; };
    var tick = function () {
      cur += (target - cur) * 0.12;
      if (Math.abs(target - cur) < 0.4) { cur = target; running = false; }
      own = true;
      window.scrollTo({ top: cur, behavior: 'instant' });
      if (running) window.requestAnimationFrame(tick);
    };
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.defaultPrevented || e.deltaX !== 0 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (document.body.classList.contains('nav-open') || document.body.classList.contains('intro-lock')) return;
      if (e.target.closest && e.target.closest('dialog, .reel__track, .order__list, .chips, textarea, input')) return;
      e.preventDefault();
      var dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
      if (!running) { target = window.pageYOffset; cur = target; }
      target = clamp(target + dy, 0, maxY());
      if (!running) { running = true; window.requestAnimationFrame(tick); }
    }, { passive: false });
    window.addEventListener('scroll', function () {
      if (own) { own = false; return; }
      if (!running) { target = window.pageYOffset; cur = target; } // keys, scrollbar, anchors
    }, { passive: true });
  }

  /* ---- one scroll handler for the scroll-linked parts ---- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      var y = window.pageYOffset;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (header) {
        header.classList.toggle('is-scrolled', y > 24);
        header.style.setProperty('--sp', max > 0 ? clamp(y / max, 0, 1).toFixed(4) : 0);
      }
      if (hero && !reduce) {
        var p = clamp(y / (window.innerHeight * 0.85), 0, 1);
        hero.style.setProperty('--hp', p.toFixed(3));
        hero.classList.toggle('is-away', p > 0.6);
      }
      updateWords();
      updateStory();
      updateRibbons();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
  wide.addEventListener('change', function () { lastActive = -2; onScroll(); });
})();
