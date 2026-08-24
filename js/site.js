/* THE TRANSCRIPT — Weichen Fan · js/site.js · ES2020, no dependencies, defer.
   boot · plainView · refile · facultyFocus · plates · clipboard.
   Every printed count is read off the DOM at print time, never hardcoded.
   Whole-page listener budget: one click, one keydown, one change, and the
   trail's pointermove. No per-plate listeners, no scroll/timer/observer. */
(function () {
'use strict';

var de   = document.documentElement;
var main = document.getElementById('main');
var list = document.getElementById('entries');
var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
function $(s, r)  { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
/* Toggling a trailing hair space re-announces identical text: screen readers
   skip an unchanged live-region write. PER ELEMENT — a shared flag lets two
   regions alternate back to identical text. */
function say(el, text) {
  if (!el) return;
  el.textContent = text + (el.textContent.slice(-1) === '\u200a' ? '' : '\u200a');
}
function make(tag, props) { return Object.assign(document.createElement(tag), props); }
function words(slug) { var s = String(slug || '').replace(/-/g, ' ').trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function onMedia(mq, fn) { if (mq.addEventListener) mq.addEventListener('change', fn); else if (mq.addListener) mq.addListener(fn); }

/* ═══ BOOT ═══════════════════════════════════════════════════════════════ */
if (de.classList.contains('no-js')) de.classList.replace('no-js', 'js');

/* Deterministic ±0.5deg tilt hashed from the mark's alt text: same every load,
   and static, so reduced motion does not apply. */
function hash(str) {
  var h = 2166136261;
  for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
(function affix() {
  var seen = Object.create(null);
  $$('.stamp').concat($$('.portrait')).forEach(function (el, i) {
    var img  = el.tagName === 'IMG' ? el : $('img', el);
    var seed = (img && (img.getAttribute('alt') || img.getAttribute('src'))) || String(i);
    if (seen[seed]) seed += '#' + i;                  /* two SenseTime marks, one alt */
    seen[seed] = 1;
    el.style.setProperty('--tilt', ((hash(seed) % 1001) / 1000 - 0.5).toFixed(2) + 'deg');
  });
})();

var address = '';                                     /* assembled at runtime; never a literal in the HTML */
(function mail() {
  var a = document.getElementById('email-link');
  if (!a || !a.dataset.user || !a.dataset.host) return;
  address = [a.dataset.user, a.dataset.host].join('@');
  a.setAttribute('href', 'mailto:' + address);
})();

/* No status region in the markup, so mint one. Injected, so PLAIN VIEW and
   print never see it. */
var focusStatus = document.getElementById('focus-status');
if (!focusStatus && main) {
  focusStatus = make('p', { id: 'focus-status', className: 'sr-only' });
  focusStatus.setAttribute('role', 'status');
  main.appendChild(focusStatus);
}

/* Talked-over dim is CSS :has(); older engines get the class fallback. Gated,
   so modern engines attach no listener. */
if (!(window.CSS && CSS.supports && CSS.supports('selector(:has(*))'))) {
  $$('.objection').forEach(function (d) {
    d.addEventListener('toggle', function () {
      var e = d.closest('.entry');
      if (e) e.classList.toggle('is-talked-over', d.open);
    });
  });
}

/* ═══ PLAIN VIEW ═════════════════════════════════════════════════════════ */
var plainBtn = document.getElementById('plainview');
function setVoice(state, persist) {
  de.setAttribute('data-voice', state);
  if (plainBtn) plainBtn.setAttribute('aria-pressed', state === 'off' ? 'true' : 'false');
  if (persist) { try { localStorage.setItem('wf-voice', state); } catch (e) {} }
}
function toggleVoice() {
  setVoice(de.getAttribute('data-voice') === 'off' ? 'on' : 'off', true);
  /* If PLAIN VIEW hides the focused element, focus drops to <body> and the
     tab sequence restarts. Park it on the toggle, visible in both states. */
  var a = document.activeElement;
  if (plainBtn && a && a !== plainBtn && a.offsetParent === null) plainBtn.focus();
}
setVoice(de.getAttribute('data-voice') === 'off' ? 'off' : 'on', false);  /* agree with the inline head script */

/* ═══ REFILE ═════════════════════════════════════════════════════════════ */
var refileStatus = document.getElementById('refile-status');
var VENUE_LABEL  = { refereed: 'Peer-reviewed', preprint: 'Preprint', report: 'Technical report' };
var AUTHOR_LABEL = { primary: 'First or co-first', contributor: 'Contributor' };
var GROUP_ORDER  = { venue: ['refereed', 'preprint', 'report'], first: ['primary', 'contributor'] };
function rows() { return list ? Array.prototype.filter.call(list.children, function (li) { return !li.classList.contains('divider'); }) : []; }
function entryOf(li) { return li.querySelector('.entry'); }
function rankOf(li) { var e = entryOf(li); return e ? (+e.dataset.rank || 0) : 0; }
function labelOf(k, mode) { return (mode === 'venue' ? VENUE_LABEL[k] : mode === 'first' ? AUTHOR_LABEL[k] : null) || words(k); }
function divider(label, n) { return make('li', { className: 'divider', textContent: label + ' · ' + n }); }
function keyOf(li, mode) {
  var e = entryOf(li);
  if (!e) return 'other';
  if (mode === 'area')  return e.dataset.area || 'other';
  if (mode === 'venue') return e.dataset.venueClass || 'other';
  if (mode === 'first') return /^(?:first|co-first)$/.test(e.dataset.authorship || '') ? 'primary' : 'contributor';
  return '';
}

/* Keys, counts and order all derive from the chronological listing, so a new
   entry files itself and no count here is hand-typed. */
function groups(mode) {
  var chron = rows().sort(function (a, b) { return rankOf(b) - rankOf(a); });
  var count = Object.create(null), index = Object.create(null), appear = [];
  chron.forEach(function (li) {
    var k = keyOf(li, mode);
    if (!(k in count)) { count[k] = 0; appear.push(k); }
    count[k]++;
  });
  var pref = GROUP_ORDER[mode] || [];
  function at(k) { var i = pref.indexOf(k); return i >= 0 ? i : pref.length + appear.indexOf(k); }
  var keys = appear.slice().sort(function (a, b) { return at(a) - at(b); });
  keys.forEach(function (k, i) { index[k] = i; });
  return { keys: keys, index: index, count: count, total: chron.length };
}
function sentence(mode) {
  var g = groups(mode), reviewed = g.count.refereed || 0;
  if (mode === 'area') return 'Refiled by area. ' + g.keys.length + ' areas: ' +
    g.keys.map(function (k) { return labelOf(k, 'area').toLowerCase() + ' ' + g.count[k]; }).join(', ') + '.';
  if (mode === 'venue') return 'Refiled by venue. ' + reviewed + ' peer-reviewed, ' + (g.total - reviewed) + ' preprints and technical reports.';
  if (mode === 'first') return 'Refiled by authorship. ' + (g.count.primary || 0) + ' first or co-first, ' + (g.count.contributor || 0) + ' contributor.';
  return 'Refiled chronologically. ' + g.total + ' publications, newest first.';
}

/* Move real DOM nodes. CSS `order` is forbidden here: it desynchronises tab
   order from visual order. */
function refile(mode, quiet) {
  if (!list) return;
  var items = rows();
  if (!items.length) return;
  var play  = !quiet && !calm.matches;
  var first = play ? items.map(function (li) { return li.getBoundingClientRect().top; }) : null;
  var g     = mode === 'chron' ? null : groups(mode);
  var open  = null;
  $$('.divider', list).forEach(function (d) { list.removeChild(d); });
  items.slice().sort(function (a, b) {
    var d = g ? g.index[keyOf(a, mode)] - g.index[keyOf(b, mode)] : 0;
    return d || rankOf(b) - rankOf(a);
  }).forEach(function (li) {
    var k = g && keyOf(li, mode);
    if (g && k !== open) { open = k; list.appendChild(divider(labelOf(k, mode), g.count[k])); }
    list.appendChild(li);
  });
  if (play) {                                         /* FLIP: one read pass, then one write pass */
    var last = items.map(function (li) { return li.getBoundingClientRect().top; });
    items.forEach(function (li, i) {
      var dy = first[i] - last[i];
      if (Math.abs(dy) < 1 || !li.animate) return;
      li.style.willChange = 'transform';
      var clear = function () { li.style.willChange = ''; };
      var a = li.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }],
                         { duration: 320, easing: 'cubic-bezier(.2,0,0,1)' });
      if (a.finished && a.finished.then) a.finished.then(clear, clear); else a.onfinish = clear;
    });
  }
  if (!quiet) say(refileStatus, sentence(mode));
}
var strip = document.getElementById('refile');
if (strip && list) {
  strip.addEventListener('change', function (ev) { if (ev.target && ev.target.name === 'order') refile(ev.target.value, false); });
  var checked = $('input[name="order"]:checked', strip);   /* Firefox restores form state across reloads */
  if (checked && checked.value !== 'chron') refile(checked.value, true);
}

/* ═══ FACULTY FOCUS ══════════════════════════════════════════════════════ */
var facultyBtns = $$('[data-faculty]');
/* Same visibility test as objections(): the status count is the only screen-
   reader output here, so hidden ledgers must not be counted. 25 in the DOM,
   12 visible in the day theme, 13 under the lamp. */
function onPage(el) { return el.getClientRects().length > 0; }
function annotations() {
  return $$('.voice', main || document).filter(function (v) {
    return !v.closest('.objection') && onPage(v);
  });
}
function syncFaculty(f) { facultyBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.faculty === f ? 'true' : 'false'); }); }
function facultyName(f) {
  var b = facultyBtns.filter(function (x) { return x.dataset.faculty === f; })[0];
  return b ? b.textContent.trim() : words(f);
}
function release() {
  if (!main || !main.hasAttribute('data-focus')) return;
  var was = main.getAttribute('data-focus');
  main.removeAttribute('data-focus');
  syncFaculty(null);
  say(focusStatus, facultyName(was) + ' lowered. All annotations at full colour.');
}
function raise(f) {
  if (!main || !f) return;
  if (main.getAttribute('data-focus') === f) { release(); return; }
  main.setAttribute('data-focus', f);                 /* one attribute; every visual is CSS */
  syncFaculty(f);
  var all = annotations();
  var mine = all.filter(function (v) { return v.getAttribute('data-speaker') === f; }).length;
  say(focusStatus, facultyName(f) + ' raised. ' + mine + ' of ' + all.length + ' annotations.');
}

/* ═══ CROSS-EXAMINE ══════════════════════════════════════════════════════
   Opens every objection at once. Reading state, not a preference: never
   persisted, never the default. */
var crossBtn    = document.getElementById('crossexam');
var crossStatus = document.getElementById('crossexam-status');
/* Visible objections only. Both ledgers carry them (WORK four, GAMES one) and
   only one is displayed, so an unfiltered list opens hidden <details> and
   reports an invisible count. getClientRects() is empty under display:none. */
function objections() {
  return $$('.objection').filter(onPage);
}
/* Re-derive from what is visible: the theme toggle swaps ledgers without
   firing `toggle` — hiding an ancestor does not change details.open. Length
   guard: [].every() is true, labelling an empty ledger "Stand down". */
function syncCross() {
  if (!crossBtn) return;
  var objs = objections();
  var all = objs.length > 0 && objs.every(function (d) { return d.open; });
  crossBtn.setAttribute('aria-pressed', all ? 'true' : 'false');
  crossBtn.textContent = all ? 'Stand down' : 'Cross-examine';
}
function crossExamine(force) {
  var objs = objections();
  if (!objs.length) return;
  var open = (typeof force === 'boolean') ? force
           : !objs.every(function (d) { return d.open; });
  objs.forEach(function (d) { d.open = open; });
  syncCross();
  if (!open) { say(crossStatus, 'Objections closed.'); return; }
  var counts = Object.create(null);
  objs.forEach(function (d) {                          /* counted, never typed */
    var e = d.closest('.entry'), k = e && e.dataset.venueClass;
    if (k) counts[k] = (counts[k] || 0) + 1;
  });
  /* Plural stays computed: the GAMES ledger can hold exactly one objection. */
  say(crossStatus, objs.length + (objs.length === 1 ? ' objection open. ' : ' objections open. ') +
      Object.keys(counts).map(function (k) {
        var name = (VENUE_LABEL[k] || words(k)).toLowerCase();
        return counts[k] + ' ' + name + (counts[k] === 1 ? '' : 's');
      }).join(', ') + '.');
}
/* Bound over ALL objections, not just visible ones: the hidden ledger's must
   already be wired for when the lamp swaps halves. */
$$('.objection').forEach(function (d) {
  d.addEventListener('toggle', syncCross);
});

/* ═══ PLATES ═════════════════════════════════════════════════════════════ */
var coarse = window.matchMedia('(hover:none)');
function examineBtns() { return $$('[data-examine]'); }
function plateOf(btn) { var id = btn.getAttribute('aria-controls'); return id ? document.getElementById(id) : null; }
function setPlate(btn, open) {
  var fig = plateOf(btn);
  if (coarse.matches) open = true;                    /* CSS paints every plate open on touch; */
  if (fig) fig.classList.toggle('is-examined', open); /* never report a close that cannot happen */
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  btn.textContent = open ? '[ close ]' : '[ examine ]';
}
function markAll(open) {
  var btn = document.getElementById('examine-all');
  if (!btn) return;
  btn.setAttribute('aria-pressed', open ? 'true' : 'false');
  btn.textContent = open ? '[ close all ]' : '[ examine all ]';
}
function togglePlate(btn) {                           /* opening one never closes another */
  var fig = plateOf(btn), bs = examineBtns();
  setPlate(btn, !(fig && fig.classList.contains('is-examined')));
  markAll(bs.length > 0 && bs.every(function (b) { return b.getAttribute('aria-expanded') === 'true'; }));
}
function examineAll(btn) {
  var open = coarse.matches || btn.getAttribute('aria-pressed') !== 'true';
  examineBtns().forEach(function (b) { setPlate(b, open); });
  markAll(open);
}
function coarseSync() {                               /* agree with the CSS at first paint too */
  if (!coarse.matches) return;
  examineBtns().forEach(function (b) { setPlate(b, true); });
  markAll(true);
}
coarseSync();
onMedia(coarse, coarseSync);

/* ═══ CLIPBOARD ══════════════════════════════════════════════════════════ */
var copyStatus = document.getElementById('copy-status');

/* Same data attributes as the visible row, so the citation cannot drift. */
function bibtex(entry) {
  var d = entry.dataset, type = d.btype || 'misc';
  var fields = [['title', d.btitle], ['author', d.bauthors],
                [type === 'inproceedings' ? 'booktitle' : 'journal', d.bvenue],
                ['year', d.year], ['note', d.bnote], ['url', d.burl]].filter(function (f) { return f[1]; });
  if (!fields.length) return '';
  var pad = fields.reduce(function (m, f) { return Math.max(m, f[0].length); }, 0);
  return '@' + type + '{' + (d.bkey || 'entry') + ',\n' + fields.map(function (f) {
    return '  ' + f[0] + new Array(pad - f[0].length + 1).join(' ') + ' = {' + f[1] + '},';
  }).join('\n').replace(/,$/, '') + '\n}';
}
function legacyCopy(text) {                           /* non-secure contexts */
  var ok = false, ta = make('textarea', { value: text, readOnly: true });
  ta.style.cssText = 'position:fixed;top:0;left:-9999px';   /* offscreen, never dimmed */
  document.body.appendChild(ta);
  ta.select();
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  document.body.removeChild(ta);
  return ok;
}
function copy(text) {
  var attempt = (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText)
    ? navigator.clipboard.writeText(text) : Promise.reject(new Error('no clipboard api'));
  return attempt.catch(function () { return legacyCopy(text) ? undefined : Promise.reject(new Error('copy refused')); });
}
function handOver(btn, text) {                        /* copy failed: show the text for manual selection */
  var row = btn.closest('.linkrow') || btn.closest('dd') || btn.parentNode;
  if (row && row.parentNode) {
    /* Keep the <pre> INSIDE the <dd>: a <pre> as a direct child of <dl> is
       invalid and lands in the label column of the grid. */
    var inDD = row.tagName === 'DD';
    var pre  = inDD ? $('.cite-out', row) : row.nextElementSibling;
    if (!pre || !pre.classList.contains('cite-out')) {
      pre = make('pre', { className: 'cite-out', tabIndex: 0 });
      if (inDD) row.appendChild(pre);
      else row.parentNode.insertBefore(pre, row.nextSibling);
    }
    pre.textContent = text;
    pre.focus();
  }
  say(copyStatus, 'Clipboard blocked. Select it by hand.');
}
function cite(btn) {
  var entry = btn.closest('.entry'), text = entry && bibtex(entry);
  if (!text) return;
  copy(text).then(function () { say(copyStatus, 'BibTeX copied.'); }, function () { handOver(btn, text); });
}
function copyEmail(btn) {
  if (!address) return;
  copy(address).then(function () { say(copyStatus, 'Email address copied.'); }, function () { handOver(btn, address); });
}

/* ═══ THE ARCADE · meters and the tally ══════════════════════════════════
   Bars and tally counted off the rows. Bars are aria-hidden; every quantity
   also appears in words. Markup ships the tally for the JS-off case; this
   recounts and overwrites it. */
function group(n) {                                   /* 3014.1 → 3,014.1 */
  var p = String(n).split('.');
  p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return p.join('.');
}
(function arcade() {
  var games = $$('.game');
  if (!games.length) return;
  function num(el, k) { return parseFloat(el.getAttribute('data-' + k)) || 0; }
  function sum(k) { return games.reduce(function (t, g) { return t + num(g, k); }, 0); }

  /* Two denominators: TIME scales to the longest row so bars compare across
     rows; COMPLETION to each row's own total, since 130 of 303 and 48 of 48
     are not the same measure. Hence the different weights. */
  var peak = games.reduce(function (m, g) { return Math.max(m, num(g, 'hours')); }, 0);
  games.forEach(function (g) {
    var hours = $('.meter__fill--hours', g), got = $('.meter__fill--got', g);
    var of = num(g, 'of');
    if (hours && peak > 0) hours.style.setProperty('--w', (num(g, 'hours') / peak * 100).toFixed(2) + '%');
    if (got && of > 0)     got.style.setProperty('--w', (num(g, 'got') / of * 100).toFixed(2) + '%');
  });

  /* Summed only over rows that HAVE achievements: a 0/0 understates the
     denominator. The sentence reports coverage ("counted across 7 of the 8"),
     not that the eighth game lacks them. */
  var scored = games.filter(function (g) { return num(g, 'of') > 0; });
  function sumOf(rows, k) { return rows.reduce(function (t, g) { return t + num(g, k); }, 0); }
  var tally = document.getElementById('arcade-tally');
  if (tally) {
    tally.textContent = group(sum('hours').toFixed(1)) + ' hours across ' + games.length + ' titles. ' +
      group(sumOf(scored, 'got')) + ' of ' + group(sumOf(scored, 'of')) + ' achievements' +
      (scored.length === games.length ? '.'
        : ', counted across ' + scored.length + ' of the ' + games.length + '.');
  }
})();

/* ═══ THE DECK · one player, built on the click ══════════════════════════
   Play builds the <iframe>, close REMOVES it: a hidden iframe keeps playing,
   so removal is what stops the sound, and why one deck closes the others.
   Nothing third-party loads until play is pressed. Not Spotify: its embed
   gives logged-out visitors a 30-second preview at best, and often nothing
   under third-party storage blocking (Safari default). The caption says
   "loaded", never "playing" — playback is cross-origin. */
var shutDecks = null, toggleDeck = null;
(function decks() {
  var btns = $$('[data-play]');
  if (!btns.length) return;
  var status = document.getElementById('deck-status');
  function deckOf(btn) { var id = btn.getAttribute('aria-controls'); return id ? document.getElementById(id) : null; }

  function shut(btn, quiet) {
    var d = deckOf(btn), e = btn.closest('.entry');
    if (d) { while (d.firstChild) d.removeChild(d.firstChild); d.hidden = true; }
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = '[ play ]';
    if (e) e.classList.remove('is-playing');
    if (!quiet) say(status, 'Closed. The player for ' + (btn.dataset.track || 'the track') + ' has been removed from the page.');
  }
  function start(btn) {
    var d = deckOf(btn), src = btn.dataset.embed, name = btn.dataset.track || 'this track';
    if (!d || !src) return;
    btns.forEach(function (b) { if (b !== btn && b.getAttribute('aria-expanded') === 'true') shut(b, true); });

    var head = make('div', { className: 'deck__head' });
    var lamp = make('span', { className: 'deck__lamp' });
    lamp.setAttribute('aria-hidden', 'true');
    head.appendChild(lamp);
    head.appendChild(document.createTextNode('Loaded — ' + name));

    var frame = make('iframe', { src: src, title: 'Player: ' + name, loading: 'lazy' });
    /* autoplay is honoured because the frame is BUILT BY THE CLICK, so that
       gesture authorises playback: one press plays instead of two. */
    frame.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture');
    frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');

    d.appendChild(head);
    d.appendChild(frame);
    d.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    btn.textContent = '[ close ]';
    var e = btn.closest('.entry');
    if (e) e.classList.add('is-playing');
    say(status, name + ' is loaded in a Spotify player below the row. Press play inside it to start.');
  }
  /* Dispatched from the one delegated click listener at the foot of this file,
     never a second binding here. See the listener budget in the header. */
  toggleDeck = function (btn) {
    if (btn.getAttribute('aria-expanded') === 'true') shut(btn, false); else start(btn);
  };
  /* display:none on MUSIC does not stop a sounding frame, so the theme must. */
  shutDecks = function () { btns.forEach(function (b) { if (b.getAttribute('aria-expanded') === 'true') shut(b, true); }); };
})();

/* ═══ THE INK TRAIL ══════════════════════════════════════════════════════
   Each segment stroked twice: faint wide bleed under a crisp core, thinner
   where the pointer moved fast. Canvas sits UNDER the fibre layer. Fine
   pointers only, never under reduced motion; the rAF loop self-terminates. */
(function trail() {
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)');
  if (!fine.matches || calm.matches) return;

  var LIFE = 780, MAXPTS = 110;
  var cv = make('canvas', { className: 'trail' });
  cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  var ctx = cv.getContext('2d');
  var pts = [], frame = 0, dpr = 1, ink = '18,18,14', W = 0, H = 0;

  function readInk() {                                /* cached: never per frame */
    var v = getComputedStyle(de).getPropertyValue('--trail-rgb').trim();
    ink = v || '18,18,14';
  }
  /* Measure the canvas, not innerWidth: innerWidth includes the classic
     scrollbar, so the bitmap comes out wider than its box and every stroke
     lands a few px left of the pointer. */
  function size() {
    var r = cv.getBoundingClientRect();
    W = r.width || document.documentElement.clientWidth;
    H = r.height || document.documentElement.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width  = Math.max(1, Math.floor(W * dpr));
    cv.height = Math.max(1, Math.floor(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function draw(now) {
    frame = 0;
    ctx.clearRect(0, 0, W, H);
    while (pts.length && now - pts[0].t > LIFE) pts.shift();

    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      var age = (now - b.t) / LIFE;                   /* 0 fresh … 1 dry */
      if (age >= 1) continue;
      var fade = (1 - age) * (1 - age);               /* ease-out alpha */
      var drift = age * 2.2;                          /* the bleed wanders */
      var ax = a.x + a.jx * drift, ay = a.y + a.jy * drift;
      var bx = b.x + b.jx * drift, by = b.y + b.jy * drift;
      var w  = b.w * (1 - age * 0.35);

      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
      ctx.strokeStyle = 'rgba(' + ink + ',' + (fade * 0.085).toFixed(3) + ')';
      ctx.lineWidth = w * 3.4;                        /* the bleed */
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
      ctx.strokeStyle = 'rgba(' + ink + ',' + (fade * 0.42).toFixed(3) + ')';
      ctx.lineWidth = w;                              /* the core */
      ctx.stroke();
    }
    if (pts.length) frame = requestAnimationFrame(draw);
  }
  function push(ev) {
    var now = performance.now(), last = pts[pts.length - 1];
    var d = last ? Math.hypot(ev.clientX - last.x, ev.clientY - last.y) : 0;
    if (last && d < 2) return;                        /* ignore jitter */
    var w = last ? Math.max(0.6, 2.9 - d * 0.055) : 2.0;   /* fast = thin */
    pts.push({ x: ev.clientX, y: ev.clientY, t: now, w: w,
               jx: Math.random() - 0.5, jy: Math.random() - 0.5 });
    if (pts.length > MAXPTS) pts.shift();
    if (!frame) frame = requestAnimationFrame(draw);
  }
  function stop() { if (frame) { cancelAnimationFrame(frame); frame = 0; } pts.length = 0; ctx.clearRect(0, 0, W, H); }

  size(); readInk();
  window.addEventListener('resize', size, { passive: true });
  window.addEventListener('pointermove', function (ev) { if (ev.pointerType === 'mouse') push(ev); }, { passive: true });
  document.addEventListener('pointerleave', stop);
  onMedia(calm, function () { if (calm.matches) { stop(); cv.remove(); } });
  window.__trailInk = readInk;                        /* the theme toggle re-reads it */
})();

/* ═══ THE WAY THROUGH ════════════════════════════════════════════════════
   Perfect maze from a SEEDED generator: same puzzle every visitor, always
   solvable. Token is the publication bullets' 6px ink square. Reaching the
   exit unlocks the lamp. */
var LAMP_KEY = 'wf-lamp';
var lampBtn = document.getElementById('lamplight');

/* THEME IS SESSION-ONLY: the missing localStorage write is deliberate. The
   unlock persists, the lamp does not. `persist` is kept so restoring
   persistence is one line. */
function setTheme(on, persist) {
  if (on) de.setAttribute('data-theme', 'disco'); else de.removeAttribute('data-theme');
  if (lampBtn) lampBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  if (window.__trailInk) window.__trailInk();
  /* Hiding MUSIC does not silence a sounding player; see shutDecks. */
  if (!on && shutDecks) shutDecks();

  /* The lamp EXCHANGES the ledger, so state must be re-derived: a raised
     faculty may have no control in the arriving half (Interfacing has none
     under the lamp), and a stale "Stand down" would OPEN closed objections. */
  release();
  syncCross();
}
function unlockLamp(persist) {
  de.setAttribute('data-lamp', '1');
  if (lampBtn) lampBtn.hidden = false;
  if (persist) { try { localStorage.setItem(LAMP_KEY, '1'); } catch (e) {} }
}
/* Both unlock paths end here, so the screen-reader bypass is announced rather
   than repainting the page in silence. */
function announceUnlock() {
  var w = document.getElementById('lock-won');
  if (w) w.hidden = false;
  say(document.getElementById('lock-status'),
      'Lamplight unlocked. The alternate colour scheme is now available from the Lamplight button in the masthead.');
}
if (de.getAttribute('data-lamp') === '1') unlockLamp(false);
setTheme(de.getAttribute('data-theme') === 'disco', false);

(function maze() {
  var host = document.getElementById('maze');
  if (!host) return;
  var W = 15, H = 9, C = 10, R = 2.6;                 /* cells, unit cell, token radius */
  var status = document.getElementById('lock-status');
  var won = document.getElementById('lock-won');

  /* mulberry32; the fixed seed gives the same maze in every browser. */
  var s = 0x9E3779B9 >>> 0;
  function rnd() {
    s = (s + 0x6D2B79F5) >>> 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  var cells = [], i;
  for (i = 0; i < W * H; i++) cells.push({ n: 1, e: 1, s: 1, w: 1, seen: 0 });
  var at = function (x, y) { return cells[y * W + x]; };
  var DIRS = [['n', 0, -1, 's'], ['e', 1, 0, 'w'], ['s', 0, 1, 'n'], ['w', -1, 0, 'e']];
  (function carve() {                                  /* recursive backtracker, iterative */
    var stack = [[0, 0]];
    at(0, 0).seen = 1;
    while (stack.length) {
      var top = stack[stack.length - 1], x = top[0], y = top[1], open = [];
      for (var d = 0; d < 4; d++) {
        var nx = x + DIRS[d][1], ny = y + DIRS[d][2];
        if (nx >= 0 && ny >= 0 && nx < W && ny < H && !at(nx, ny).seen) open.push(d);
      }
      if (!open.length) { stack.pop(); continue; }
      var pick = DIRS[open[Math.floor(rnd() * open.length)]];
      var tx = x + pick[1], ty = y + pick[2];
      at(x, y)[pick[0]] = 0; at(tx, ty)[pick[3]] = 0; at(tx, ty).seen = 1;
      stack.push([tx, ty]);
    }
  })();

  var NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  var svg = el('svg', { viewBox: '0 0 ' + (W * C) + ' ' + (H * C), 'aria-hidden': 'true', focusable: 'false' });
  var walls = el('g', { class: 'wall', fill: 'none' });
  for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
    var c = at(x, y), px = x * C, py = y * C;
    if (c.n) walls.appendChild(el('line', { x1: px, y1: py, x2: px + C, y2: py }));
    if (c.w) walls.appendChild(el('line', { x1: px, y1: py, x2: px, y2: py + C }));
    if (x === W - 1 && c.e) walls.appendChild(el('line', { x1: px + C, y1: py, x2: px + C, y2: py + C }));
    if (y === H - 1 && c.s) walls.appendChild(el('line', { x1: px, y1: py + C, x2: px + C, y2: py + C }));
  }
  svg.appendChild(walls);
  svg.appendChild(el('rect', { class: 'goal', x: (W - 1) * C + 2.5, y: (H - 1) * C + 2.5, width: C - 5, height: C - 5 }));
  var crumbs = el('g', { class: 'breadcrumb' });
  svg.appendChild(crumbs);
  var token = el('rect', { class: 'token', x: -R, y: -R, width: R * 2, height: R * 2 });
  svg.appendChild(token);
  host.appendChild(svg);

  var cx = 0, cy = 0, solved = false;
  function place() { token.setAttribute('transform', 'translate(' + (cx * C + C / 2) + ',' + (cy * C + C / 2) + ')'); }
  place();

  function step(dir) {
    if (solved) return false;
    var c = at(cx, cy);
    var map = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] };
    if (c[dir]) return false;                          /* a wall */
    crumbs.appendChild(el('rect', { x: cx * C + C / 2 - 0.7, y: cy * C + C / 2 - 0.7, width: 1.4, height: 1.4 }));
    cx += map[dir][0]; cy += map[dir][1];
    place();
    if (cx === W - 1 && cy === H - 1) solve();
    return true;
  }
  function solve() {
    solved = true;
    host.classList.add('is-solved');
    unlockLamp(true);
    setTheme(true, true);
    announceUnlock();
  }

  var KEYS = { ArrowUp: 'n', ArrowRight: 'e', ArrowDown: 's', ArrowLeft: 'w',
               w: 'n', d: 'e', s: 's', a: 'w', W: 'n', D: 'e', S: 's', A: 'w' };
  host.addEventListener('keydown', function (ev) {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    var dir = KEYS[ev.key];
    if (!dir) return;
    ev.preventDefault();                               /* arrows must not scroll the page */
    step(dir);
  });

  /* Drag to walk; works with mouse and touch. */
  var dragging = false;
  function cellAt(ev) {
    var r = svg.getBoundingClientRect();
    return [Math.floor((ev.clientX - r.left) / r.width  * W),
            Math.floor((ev.clientY - r.top)  / r.height * H)];
  }
  function toward(ev) {
    var p = cellAt(ev), dx = p[0] - cx, dy = p[1] - cy;
    if (dx === 0 && dy === 0) return;
    if (Math.abs(dx) >= Math.abs(dy)) step(dx > 0 ? 'e' : 'w');
    else step(dy > 0 ? 's' : 'n');
  }
  host.addEventListener('pointerdown', function (ev) {
    dragging = true;
    if (host.setPointerCapture) { try { host.setPointerCapture(ev.pointerId); } catch (e) {} }
    host.focus({ preventScroll: true });
    toward(ev);
  });
  host.addEventListener('pointermove', function (ev) { if (dragging) toward(ev); });
  host.addEventListener('pointerup',     function () { dragging = false; });
  host.addEventListener('pointercancel', function () { dragging = false; });
})();

/* ═══ DELEGATION · one click listener, one keydown listener ══════════════ */
document.addEventListener('click', function (ev) {
  var t = ev.target, b;
  if (!t || !t.closest) return;
  if ((b = t.closest('[data-faculty]'))) { raise(b.dataset.faculty); return; }
  if ((b = t.closest('[data-examine]'))) { togglePlate(b); return; }
  if ((b = t.closest('#examine-all')))   { examineAll(b);  return; }
  if ((b = t.closest('[data-cite]')))    { cite(b);        return; }
  if ((b = t.closest('[data-play]')))    { if (toggleDeck) toggleDeck(b); return; }
  if ((b = t.closest('#copy-email')))    { copyEmail(b);   return; }
  if (t.closest('#crossexam'))           { crossExamine();  return; }
  if (t.closest('#lamplight'))           { setTheme(de.getAttribute('data-theme') !== 'disco', true); return; }
  if (t.closest('#lock-bypass'))         { unlockLamp(true); setTheme(true, true); announceUnlock(); return; }
  if (t.closest('#plainview'))           { toggleVoice(); }
});
/* Escape only. No bare single-character shortcut: with no modifier, no remap
   and no off switch it fails WCAG 2.1.4, and PLAIN VIEW has a masthead button. */
document.addEventListener('keydown', function (ev) {
  if (ev.defaultPrevented || ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if (ev.key === 'Escape') release();
});

})();
