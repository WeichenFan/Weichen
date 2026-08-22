/* THE TRANSCRIPT — Weichen Fan · js/site.js · ES2020, no dependencies, defer.
   boot · plainView · refile · facultyFocus · plates · loupe · clipboard.
   Every number printed here is counted from the DOM at the moment it prints.
   Whole-page listener budget: one click, one keydown, one change, two pointer
   listeners per plate, one rAF loop (the loupe). No scroll/timer/observer. */
(function () {
'use strict';

var de   = document.documentElement;
var main = document.getElementById('main');
var list = document.getElementById('entries');
var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
function $(s, r)  { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
/* A trailing hair space is toggled so an identical message is announced
   again — AT ignore a live-region write whose text has not changed. The
   toggle is PER ELEMENT: one shared flag would let two regions alternate
   each other back to a byte-identical string and go silent again. */
function say(el, text) {
  if (!el) return;
  el.textContent = text + (el.textContent.slice(-1) === '\u200a' ? '' : '\u200a');
}
function make(tag, props) { return Object.assign(document.createElement(tag), props); }
function words(slug) { var s = String(slug || '').replace(/-/g, ' ').trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function onMedia(mq, fn) { if (mq.addEventListener) mq.addEventListener('change', fn); else if (mq.addListener) mq.addListener(fn); }

/* ═══ BOOT ═══════════════════════════════════════════════════════════════ */
if (de.classList.contains('no-js')) de.classList.replace('no-js', 'js');

/* Deterministic ±0.5deg tilt hashed from the mark's own alt text: written once,
   identical on every load — static, so reduced motion does not apply to it. */
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

var address = '';                                     /* never in the source; assembled from two halves */
(function mail() {
  var a = document.getElementById('email-link');
  if (!a || !a.dataset.user || !a.dataset.host) return;
  address = [a.dataset.user, a.dataset.host].join('@');
  a.setAttribute('href', 'mailto:' + address);
})();

/* FACULTY FOCUS has no status region in the markup; mint one rather than borrow
   another module's. Injected, so PLAIN VIEW and print never see it. */
var focusStatus = document.getElementById('focus-status');
if (!focusStatus && main) {
  focusStatus = make('p', { id: 'focus-status', className: 'sr-only' });
  focusStatus.setAttribute('role', 'status');
  main.appendChild(focusStatus);
}

/* Talked-over dim is CSS :has(); older engines get the class instead — gated,
   so on a modern engine not one listener is attached. */
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
  /* PLAIN VIEW hides whatever was focused if it was a voice control, which
     would drop focus to <body> and restart the tab sequence. The toggle is
     always visible in both states, so park focus there. */
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

/* Group keys, counts and group order all read off the chronological listing, so
   paper twelve files itself and no count in this file is ever typed by hand. */
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

/* Real DOM nodes move. CSS `order` is forbidden: it desynchronises tab order
   from visual order and turns the control into a trap. */
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
/* Same visibility test, and for the same reason, as objections() below: the
   count in the status line is the ONLY output faculty focus has for a screen
   reader — the sighted signal is the dimming — so counting the ledger that is
   display:none states a total nobody can see. 25 in the DOM, 12 on the page
   in the day theme, 13 under the lamp. */
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
   The counter-voice, promoted from four collapsed toggles below the fold to
   one gesture in the masthead. It is the exact opposite of PLAIN VIEW —
   that removes every voice, this turns the harshest one up — and because
   only some entries carry an objection, opening them all is itself the
   answer to "which of these come with a caveat?". Reading state, not a
   preference: never persisted, never the default. */
var crossBtn    = document.getElementById('crossexam');
var crossStatus = document.getElementById('crossexam-status');
/* Only the objections that are ON THE PAGE. Both ledgers carry them — WORK
   has four, GAMES has one — and exactly one ledger is ever displayed, so an
   unfiltered list would open invisible <details> in the hidden half and then
   report a count nobody can see. getClientRects() is empty for anything in a
   display:none subtree, which is precisely the question being asked. */
function objections() {
  return $$('.objection').filter(onPage);
}
/* Derive the control's label and pressed state from whatever is CURRENTLY on
   the page. Extracted because three callers need it and one of them is the
   theme toggle: swapping ledgers changes the visible set underneath the
   button without firing a single `toggle` event, since hiding an ancestor
   does not change details.open. Guards on length — [].every() is true, which
   would label a ledger with no objections at all "Stand down". */
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
  /* WORK always had four, so the hardcoded plural was never wrong until
     GAMES arrived with a ledger that can hold exactly one. */
  say(crossStatus, objs.length + (objs.length === 1 ? ' objection open. ' : ' objections open. ') +
      Object.keys(counts).map(function (k) {
        var name = (VENUE_LABEL[k] || words(k)).toLowerCase();
        return counts[k] + ' ' + name + (counts[k] === 1 ? '' : 's');
      }).join(', ') + '.');
}
/* Opening or closing one objection by hand puts the control back in step.
   Bound over ALL of them, not the visible ones: at boot the hidden ledger's
   objections have no boxes yet, and they must already be wired for the
   moment the lamp changes which half is on screen. */
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

/* ═══ LOUPE ══════════════════════════════════════════════════════════════ */
(function loupe() {
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)');
  var figs = $$('.plate');
  if (!fine.matches || calm.matches || !figs.length) return;   /* read at init: no listener is attached */
  var el = make('div', { className: 'loupe' });
  el.setAttribute('aria-hidden', 'true');
  var R = 74, host = null, frame = 0, tx = 0, ty = 0, cx = 0, cy = 0;

  /* The magnification has to be PLATE-relative, and a background-size
     percentage on the disc resolves against the disc — so the drawn image
     rect is measured here and handed to CSS. object-fit:contain letterboxes
     inside the img's content box, so the padding, the border and the bars all
     have to come off before the origin is right. Measured once per enter:
     the plate cannot resize while the pointer is inside it. */
  function geometry(fig, img) {
    var fr = fig.getBoundingClientRect(), ir = img.getBoundingClientRect();
    var cs = window.getComputedStyle(img);
    function n(p) { return parseFloat(cs.getPropertyValue(p)) || 0; }
    var insetL = n('border-left-width') + n('padding-left');
    var insetT = n('border-top-width') + n('padding-top');
    var cw = ir.width  - insetL - n('border-right-width')  - n('padding-right');
    var ch = ir.height - insetT - n('border-bottom-width') - n('padding-bottom');
    var nw = img.naturalWidth || cw, nh = img.naturalHeight || ch;
    var s  = Math.min(cw / nw, ch / nh);
    if (!isFinite(s) || s <= 0) s = 1;
    var dw = nw * s, dh = nh * s;
    var st = el.style;
    st.setProperty('--img-x', ((ir.left - fr.left) + insetL + (cw - dw) / 2).toFixed(1) + 'px');
    st.setProperty('--img-y', ((ir.top  - fr.top)  + insetT + (ch - dh) / 2).toFixed(1) + 'px');
    st.setProperty('--img-w', dw.toFixed(1) + 'px');
  }

  function write() {
    var s = el.style;
    s.setProperty('--lx', cx.toFixed(1) + 'px'); s.setProperty('--tx', (cx - R).toFixed(1) + 'px');
    s.setProperty('--ly', cy.toFixed(1) + 'px'); s.setProperty('--ty', (cy - R).toFixed(1) + 'px');
  }
  function step() {                                   /* the only rAF loop on the page */
    frame = 0;
    cx += (tx - cx) * 0.28;
    cy += (ty - cy) * 0.28;
    write();
    if (Math.abs(tx - cx) > 0.2 || Math.abs(ty - cy) > 0.2) frame = requestAnimationFrame(step);
  }
  function detach() {
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
    if (!host) return;
    host.removeEventListener('pointermove', track);
    if (el.parentNode) el.parentNode.removeChild(el);
    host = null;
  }
  function track(ev) {
    if (!host || !host.classList.contains('is-examined')) { detach(); return; }
    var r = host.getBoundingClientRect();
    tx = ev.clientX - r.left;
    ty = ev.clientY - r.top;
    if (!frame) frame = requestAnimationFrame(step);
  }
  figs.forEach(function (fig) {
    fig.addEventListener('pointerenter', function (ev) {
      var img = $('.plate__img', fig);
      if (!img || !fig.classList.contains('is-examined')) return;
      detach();
      host = fig;
      el.style.setProperty('--plate-src', 'url("' + (img.currentSrc || img.src) + '")');  /* cache hit */
      geometry(fig, img);
      var r = fig.getBoundingClientRect();
      cx = tx = ev.clientX - r.left;
      cy = ty = ev.clientY - r.top;
      write();
      fig.appendChild(el);
      fig.addEventListener('pointermove', track);
    });
    fig.addEventListener('pointerleave', detach);
  });
  onMedia(calm, function () { if (calm.matches) detach(); });
})();

/* ═══ CLIPBOARD ══════════════════════════════════════════════════════════ */
var copyStatus = document.getElementById('copy-status');

/* Built from the same data attributes the visible row is built from, so the
   citation can never drift from what is printed beside it. */
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
function handOver(btn, text) {                        /* never a dead end: put the text on the page */
  var row = btn.closest('.linkrow') || btn.closest('dd') || btn.parentNode;
  if (row && row.parentNode) {
    /* Inside a <dd> the <pre> has to stay INSIDE it — a <pre> as a direct
       child of <dl> is invalid and lands in the label column of the grid. */
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
   Two bars per row and one sentence for the section, all of it read off the
   rows themselves. The bars are aria-hidden decoration whose every quantity
   is printed in words beside them; the sentence is the only thing here that
   informs, and it is recounted rather than trusted — the markup ships the
   same sentence so the line survives with JS off, and this overwrites it in
   place. If the two ever disagree, the page is the one that is wrong. */
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

  /* TIME is scaled to the longest row, so the bars compare with each other;
     COMPLETION is scaled to each row's own total, because 130 of 303 and 48
     of 48 are not two lengths of the same thing. Different question,
     different denominator, which is why they are drawn at different weights. */
  var peak = games.reduce(function (m, g) { return Math.max(m, num(g, 'hours')); }, 0);
  games.forEach(function (g) {
    var hours = $('.meter__fill--hours', g), got = $('.meter__fill--got', g);
    var of = num(g, 'of');
    if (hours && peak > 0) hours.style.setProperty('--w', (num(g, 'hours') / peak * 100).toFixed(2) + '%');
    if (got && of > 0)     got.style.setProperty('--w', (num(g, 'got') / of * 100).toFixed(2) + '%');
  });

  /* Not every row carries achievement figures, and folding a 0/0 into the
     totals would quietly understate the denominator. They are therefore summed
     over the ROWS THAT HAVE THEM, and the sentence says how many that was.
     It reports the page's own coverage — "counted across 7 of the 8" — and
     never that the eighth game lacks achievements, which is not true of it. */
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
   The <iframe> is not in the markup. Pressing play builds it; pressing close
   REMOVES it. That ordering is not tidiness — a hidden iframe goes on
   playing, so removal is the only thing that actually stops the sound, and
   it is also why opening one deck closes the other two. The side effect is
   the privacy story: a visitor who never presses play reaches no third party
   at all, and the page holds no external frame, script or cookie until asked.

   WHY YOUTUBE AND NOT SPOTIFY. The deck shipped with a Spotify embed and it
   did not work in the wild. Nothing was blocking it — the frame loads, and
   Spotify sends no X-Frame-Options or frame-ancestors — but a Spotify embed
   gives a logged-out visitor a 30-second preview at best, and under
   third-party storage blocking (Safari's default, and increasingly Chrome's)
   it commonly refuses to play at all. A player whose behaviour depends on
   whether the reader happens to hold an account is not a player. The
   youtube-nocookie host plays the whole track for everybody, signed in or
   not, and sets nothing until playback starts. The Spotify link stays in the
   row for anyone who would rather listen there.

   Nothing here claims the track is SOUNDING. Playback lives inside a
   cross-origin frame and cannot be observed from this side, so the caption
   says the player is loaded, which is the only thing this page knows. */
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
    /* autoplay is in the list because the frame is BUILT BY THE CLICK — the
       user gesture that opens the deck is the same gesture that authorises
       playback, so one press plays instead of two. encrypted-media and
       fullscreen are what the embed itself needs. */
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
  /* Handed to the page's ONE delegated click listener at the foot of this file
     rather than binding a second one here. The budget in the header is not
     decorative: every control on this page is dispatched from that single
     listener, and a module that quietly adds its own breaks the one place you
     can read to find out what a click does. */
  toggleDeck = function (btn) {
    if (btn.getAttribute('aria-expanded') === 'true') shut(btn, false); else start(btn);
  };
  /* Turning the lamp back up hides MUSIC — display:none, which does not stop
     a frame that is already sounding. Nothing would be on screen to stop it
     with, so the theme has to. */
  shutDecks = function () { btns.forEach(function (b) { if (b.getAttribute('aria-expanded') === 'true') shut(b, true); }); };
})();

/* ═══ THE INK TRAIL ══════════════════════════════════════════════════════
   The pointer leaves a nib stroke on the paper: thinner where it moved fast,
   drawn twice — a wide faint bleed and a crisp core — so it reads as ink
   soaking into a sheet rather than a glow. Points drift a little as they
   fade, which is what wet ink does. The canvas sits UNDER the fibre layer,
   so the grain falls on the stroke exactly as it falls on every other mark.
   Never mounted without a fine pointer, never under reduced motion; the loop
   stops itself the moment the last point has dried. */
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
  /* Measure the canvas ITSELF, not innerWidth: innerWidth includes the
     classic scrollbar, so the bitmap would be wider than the box it is
     painted into and every stroke would land a few pixels left of the
     pointer. Pointer coordinates are viewport-relative and the canvas is
     fixed at inset:0, so its own rect is the right coordinate space. */
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
   A perfect maze from a SEEDED generator, so every visitor gets the same
   puzzle and it is always solvable. Walked by the same 6px ink square the
   publication bullets use. Finding the exit turns the lamp down. */
var LAMP_KEY = 'wf-lamp', THEME_KEY = 'wf-theme';
var lampBtn = document.getElementById('lamplight');

function setTheme(on, persist) {
  if (on) de.setAttribute('data-theme', 'disco'); else de.removeAttribute('data-theme');
  if (lampBtn) lampBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  if (persist) { try { localStorage.setItem(THEME_KEY, on ? 'disco' : 'day'); } catch (e) {} }
  if (window.__trailInk) window.__trailInk();
  /* Raising the lamp takes MUSIC off the page with display:none, which does
     not silence a player that is already sounding — and once the section is
     gone there is no control left to silence it with. */
  if (!on && shutDecks) shutDecks();

  /* The lamp does not tint the page, it EXCHANGES it, and three pieces of
     reading state describe the half that just left.
       · A raised faculty may not exist in the arriving ledger at all —
         Interfacing has no control under the lamp — leaving every voice
         greyed with nothing on screen that could lower it again.
       · CROSS-EXAMINE keeps the label and aria-pressed it earned over the
         departing objections, so a button reading "Stand down" would arrive
         above two closed ones and OPEN them on the next press.
     Both are re-derived here rather than carried across. */
  release();
  syncCross();
}
function unlockLamp(persist) {
  de.setAttribute('data-lamp', '1');
  if (lampBtn) lampBtn.hidden = false;
  if (persist) { try { localStorage.setItem(LAMP_KEY, '1'); } catch (e) {} }
}
/* Both unlock paths — solving and the screen-reader bypass — end here, so the
   bypass is confirmed out loud instead of repainting the page in silence. */
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

  /* mulberry32 — a fixed seed means one maze, forever, in every browser. */
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

  /* Drag to walk — one gesture that works with a mouse and with a thumb. */
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
/* Escape only. The bare `v` shortcut was removed: a single-character key
   shortcut with no modifier, no remap and no off switch fails WCAG 2.1.4,
   and PLAIN VIEW already has a permanent button in the masthead. */
document.addEventListener('keydown', function (ev) {
  if (ev.defaultPrevented || ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if (ev.key === 'Escape') release();
});

})();
