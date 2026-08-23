/* WHAT KIND OF PhD ARE YOU — js/quiz.js · ES2020, no dependencies, defer.
   24 outcomes: 6 skills under each of 4 attributes, in en / zh-Hans / zh-Hant.

   COPY IS SEPARATED FROM SCORING. Strings live in js/quiz-copy.js per
   language; the shared tables below (answer -> skill, skill -> attribute) hold
   no translated text, so translating cannot change a result.

   SCORING. Per answer: primary skill +3, secondary +1 in a DIFFERENT
   attribute, so no one answer carries a column. An attribute is the sum of its
   own six skills, so the named skill always sits inside the winning attribute.

   BALANCE IS MEASURED. Over all 4^10 = 1,048,576 paths every outcome is
   reachable, commonest (Ablation 9.3%) 9x rarest (Poker Face 1.0%); the first
   draft read fine and ran 959:1. Two rules hold it, both audited below:
   1. One answer per attribute per question -> ten primaries each. Vary which
      option is which attribute, or the quiz is playable unread.
   2. Secondaries budgeted against primary count: ten primaries over six skills
      leaves four skills at two and two at one, so singles get three
      secondaries and doubles one — 3x2+1 = 7 vs 3x1+3 = 6. */
(function () {
'use strict';

var de = document.documentElement;
if (de.classList.contains('no-js')) de.classList.replace('no-js', 'js');

function $(s, r) { return (r || document).querySelector(s); }
function make(tag, props) { return Object.assign(document.createElement(tag), props); }
function say(el, text) {
  if (!el) return;
  el.textContent = text + (el.textContent.slice(-1) === '\u200a' ? '' : '\u200a');
}

/* ═══ LANGUAGE ════════════════════════════════════════════════════════════
   `html` sets the document lang attribute: the CJK font stack in css/quiz.css
   hangs off it, and screen readers follow it. */
var LANGS = [
  { code: 'en',      label: 'English', html: 'en'      },
  { code: 'zh-Hans', label: '简',      html: 'zh-Hans' },
  { code: 'zh-Hant', label: '繁',      html: 'zh-Hant' }
];
var LANG_KEY = 'wf-lang';
var COPY = window.QUIZ_COPY || {};
var lang = 'en';

function pick(stored) {
  if (stored && COPY[stored]) return stored;
  /* navigator.languages is ORDERED by preference: scanning it for "zh" serves
     Chinese to en-US, en-CN, zh-Hans-CN. First mapped entry wins.
     zh-TW/HK/MO and zh-Hant-* traditional, bare zh and zh-CN simplified. */
  var list = navigator.languages || [navigator.language || 'en'];
  for (var i = 0; i < list.length; i++) {
    var tag = String(list[i]).toLowerCase();
    if (/^zh\b/.test(tag)) {
      return /hant|\b(tw|hk|mo)\b/.test(tag) ? 'zh-Hant' : 'zh-Hans';
    }
    if (/^en\b/.test(tag)) return 'en';
  }
  return 'en';
}
try { lang = pick(localStorage.getItem(LANG_KEY)); } catch (e) { lang = pick(null); }

function T() { return COPY[lang] || COPY.en; }

/* ═══ THE TABLES THAT NEVER TRANSLATE ═════════════════════════════════════ */
var DIM_ORDER = ['intellect', 'psyche', 'physique', 'motorics'];
/* Reuses the site's Lamplight voice tokens (steel, violet, dried blood,
   brass); the portrait sheet runs blue/purple/red/gold in the same order. */
var DIM_TOKEN = {
  intellect: '--voice-hlf', psyche: '--voice-inl',
  physique:  '--voice-rhe', motorics: '--voice-int'
};

var SKILL_DIM = {
  /* INTELLECT */ 'ablation':'intellect', 'related-work':'intellect', 'rebuttal':'intellect', 'framing':'intellect', 'hypothesis':'intellect', 'error-analysis':'intellect',
  /* PSYCHE */ 'scope-control':'psyche', 'three-am-idea':'psyche', 'co-authorship':'psyche', 'corresponding-author':'psyche', 'lab-morale':'psyche', 'positioning':'psyche',
  /* PHYSIQUE */ 'deadline-stamina':'physique', 'rejection-tolerance':'physique', 'cluster-wrangling':'physique', 'caffeine':'physique', 'field-sense':'physique', 'defense-instinct':'physique',
  /* MOTORICS */ 'figure-craft':'motorics', 'log-reading':'motorics', 'hotfix':'motorics', 'conference-charm':'motorics', 'toolchain':'motorics', 'poker-face':'motorics',
};

var SCORING = [
  /* Q1  */ [{p:'log-reading',s:'error-analysis'}, {p:'framing',s:'co-authorship'}, {p:'cluster-wrangling',s:'toolchain'}, {p:'scope-control',s:'deadline-stamina'}],
  /* Q2  */ [{p:'rebuttal',s:'corresponding-author'}, {p:'rejection-tolerance',s:'poker-face'}, {p:'hotfix',s:'rebuttal'}, {p:'corresponding-author',s:'rejection-tolerance'}],
  /* Q3  */ [{p:'lab-morale',s:'defense-instinct'}, {p:'related-work',s:'lab-morale'}, {p:'field-sense',s:'log-reading'}, {p:'figure-craft',s:'related-work'}],
  /* Q4  */ [{p:'toolchain',s:'error-analysis'}, {p:'ablation',s:'three-am-idea'}, {p:'caffeine',s:'log-reading'}, {p:'three-am-idea',s:'field-sense'}],
  /* Q5  */ [{p:'hypothesis',s:'positioning'}, {p:'rejection-tolerance',s:'poker-face'}, {p:'positioning',s:'defense-instinct'}, {p:'conference-charm',s:'rebuttal'}],
  /* Q6  */ [{p:'figure-craft',s:'framing'}, {p:'framing',s:'co-authorship'}, {p:'co-authorship',s:'field-sense'}, {p:'deadline-stamina',s:'figure-craft'}],
  /* Q7  */ [{p:'conference-charm',s:'rebuttal'}, {p:'hypothesis',s:'lab-morale'}, {p:'positioning',s:'defense-instinct'}, {p:'defense-instinct',s:'conference-charm'}],
  /* Q8  */ [{p:'three-am-idea',s:'field-sense'}, {p:'caffeine',s:'log-reading'}, {p:'toolchain',s:'error-analysis'}, {p:'error-analysis',s:'co-authorship'}],
  /* Q9  */ [{p:'cluster-wrangling',s:'hotfix'}, {p:'hotfix',s:'ablation'}, {p:'corresponding-author',s:'cluster-wrangling'}, {p:'related-work',s:'lab-morale'}],
  /* Q10 */ [{p:'scope-control',s:'caffeine'}, {p:'ablation',s:'scope-control'}, {p:'poker-face',s:'hypothesis'}, {p:'deadline-stamina',s:'poker-face'}],
];

/* ═══ SELF-CHECK ══════════════════════════════════════════════════════════
   Warns on four silent failures: unknown slug; a skill that is nobody's
   primary (unreachable outcome); two answers in one attribute (unbalanced
   quiz); missing copy key (renders `undefined` on the card). */
(function audit() {
  var problems = [], primaries = Object.create(null);
  SCORING.forEach(function (q, i) {
    var seen = Object.create(null);
    q.forEach(function (o, j) {
      var where = 'Q' + (i + 1) + String.fromCharCode(97 + j);
      if (!SKILL_DIM[o.p]) problems.push(where + ': unknown primary "' + o.p + '"');
      else { primaries[o.p] = (primaries[o.p] || 0) + 1; seen[SKILL_DIM[o.p]] = (seen[SKILL_DIM[o.p]] || 0) + 1; }
      if (!SKILL_DIM[o.s]) problems.push(where + ': unknown secondary "' + o.s + '"');
      else if (SKILL_DIM[o.s] === SKILL_DIM[o.p]) problems.push(where + ': secondary does not cross attributes');
    });
    DIM_ORDER.forEach(function (d) {
      if (seen[d] !== 1) problems.push('Q' + (i + 1) + ': ' + (seen[d] || 0) + ' answers in ' + d + ', expected 1');
    });
  });
  Object.keys(SKILL_DIM).forEach(function (k) {
    if (!primaries[k]) problems.push('unreachable outcome: "' + k + '" is never a primary');
  });
  /* Per language: a missing string prints "undefined" on a result card. */
  Object.keys(COPY).forEach(function (L) {
    var t = COPY[L];
    DIM_ORDER.forEach(function (d) {
      if (!t.dims || !t.dims[d] || !t.dims[d].name || !t.dims[d].line) problems.push(L + ': missing dim ' + d);
    });
    Object.keys(SKILL_DIM).forEach(function (k) {
      var s = t.skills && t.skills[k];
      if (!s) return problems.push(L + ': missing skill ' + k);
      ['name', 'tag', 'body', 'best', 'worst'].forEach(function (f) {
        if (!s[f]) problems.push(L + ': ' + k + ' missing ' + f);
      });
    });
    if (!t.questions || t.questions.length !== SCORING.length) problems.push(L + ': expected ' + SCORING.length + ' questions');
    else t.questions.forEach(function (q, i) {
      if (!q.q) problems.push(L + ': Q' + (i + 1) + ' has no text');
      if (!q.a || q.a.length !== 4) problems.push(L + ': Q' + (i + 1) + ' needs 4 answers');
    });
  });
  if (problems.length && window.console) console.warn('[phd quiz]\n' + problems.join('\n'));
})();

/* ═══ THE APP ═════════════════════════════════════════════════════════════ */
var stage  = document.getElementById('stage');
var status = document.getElementById('quiz-status');
if (!stage) return;

var answers = [];                                   /* answers[i] = option index */

/* Reads SCORING, never the copy: same ten choices, same character in all
   three languages. */
function score() {
  var skill = Object.create(null), dim = Object.create(null);
  Object.keys(SKILL_DIM).forEach(function (k) { skill[k] = 0; });
  DIM_ORDER.forEach(function (k) { dim[k] = 0; });
  answers.forEach(function (choice, i) {
    var o = SCORING[i][choice];
    if (!o) return;
    skill[o.p] += 3;
    skill[o.s] += 1;
  });
  /* Attribute = sum of its OWN six skills, never a separate tally; that keeps
     the winning skill inside the winning attribute. */
  Object.keys(SKILL_DIM).forEach(function (k) { dim[SKILL_DIM[k]] += skill[k]; });
  return { skill: skill, dim: dim };
}

/* Ties break by declaration order, so results are deterministic. */
function best(obj, keys) {
  var top = keys[0];
  keys.forEach(function (k) { if (obj[k] > obj[top]) top = k; });
  return top;
}

function result() {
  var s = score();
  var winnerDim = best(s.dim, DIM_ORDER);
  var inDim = Object.keys(SKILL_DIM).filter(function (k) { return SKILL_DIM[k] === winnerDim; });
  var winnerSkill = best(s.skill, inDim);
  return { dim: winnerDim, skill: winnerSkill, scores: s };
}

function progress(n) {
  var wrap = make('p', { className: 'quiz__progress' });
  wrap.setAttribute('aria-hidden', 'true');
  for (var i = 0; i < SCORING.length; i++) {
    var pip = make('span', { className: 'pip' + (i < n ? ' is-done' : i === n ? ' is-here' : '') });
    wrap.appendChild(pip);
  }
  return wrap;
}

function renderIntro() {
  stage.textContent = '';
  var box = make('div', { className: 'quiz__card quiz__card--intro' });
  var t = T();
  box.appendChild(make('p', { className: 'quiz__kicker', textContent: t.ui.kicker }));
  box.appendChild(make('p', { className: 'quiz__lede', textContent: t.ui.lede }));

  /* Pads the intro card to about a question screen's height, so begin does
     not jolt the page. */
  var grid = make('ul', { className: 'attrs' });
  DIM_ORDER.forEach(function (k) {
    var li = make('li', { className: 'attrs__item' });
    li.style.setProperty('--hue', 'var(' + DIM_TOKEN[k] + ')');
    li.appendChild(make('b', { className: 'attrs__name', textContent: t.dims[k].name }));
    li.appendChild(make('span', { className: 'attrs__line', textContent: t.dims[k].line }));
    grid.appendChild(li);
  });
  box.appendChild(grid);

  var go = make('button', { className: 'quiz__go', type: 'button', textContent: t.ui.begin });
  go.addEventListener('click', function () { answers = []; renderQuestion(0); });
  box.appendChild(go);
  stage.appendChild(box);
}

function renderQuestion(i) {
  stage.textContent = '';
  var t = T(), q = t.questions[i];
  var box = make('div', { className: 'quiz__card' });

  box.appendChild(progress(i));
  box.appendChild(make('p', { className: 'quiz__count', textContent: counted(t, i) }));
  var h = make('h2', { className: 'quiz__q', textContent: q.q });
  h.setAttribute('tabindex', '-1');
  box.appendChild(h);

  var list = make('ol', { className: 'quiz__answers' });
  q.a.forEach(function (opt, j) {
    var li = make('li');
    var b = make('button', { className: 'answer', type: 'button' });
    b.appendChild(make('span', { className: 'answer__key', textContent: String(j + 1) }));
    b.appendChild(make('span', { className: 'answer__text', textContent: opt }));
    /* Ignore the second press of a double-click: the card swaps
       synchronously, so it would land on the next question and answer it too.
       detail is 0 for keyboard and programmatic clicks, so those still work. */
    b.addEventListener('click', function (ev) {
      if (ev.detail > 1) return;
      choose(i, j);
    });
    li.appendChild(b);
    list.appendChild(li);
  });
  box.appendChild(list);

  if (i > 0) {
    var back = make('button', { className: 'quiz__back', type: 'button', textContent: t.ui.back });
    back.addEventListener('click', function () { answers.length = i - 1; renderQuestion(i - 1); });
    box.appendChild(back);
  }

  stage.appendChild(box);
  /* Focus the question, not the first answer: a focused option looks chosen,
     and a screen reader would read it instead of the question. */
  h.focus({ preventScroll: true });
  say(status, counted(t, i) + '. ' + q.q);
}

function choose(i, j) {
  answers[i] = j;
  if (i + 1 < SCORING.length) renderQuestion(i + 1);
  else renderResult();
}

/* 1–4 pick an answer; no modifier and no letter keys, so no screen-reader
   shortcut is taken. */
document.addEventListener('keydown', function (ev) {
  if (ev.defaultPrevented || ev.metaKey || ev.ctrlKey || ev.altKey) return;
  /* Screens render synchronously, so a held key walks OS auto-repeat through
     every remaining question and finishes the quiz; results have no [ back ]. */
  if (ev.repeat) return;
  var n = parseInt(ev.key, 10);
  if (!(n >= 1 && n <= 4)) return;
  var btns = stage.querySelectorAll('.answer');
  if (!btns.length || n > btns.length) return;
  ev.preventDefault();
  btns[n - 1].click();
});

function bar(label, value, total, tokenVar, isWinner) {
  var row = make('div', { className: 'dimbar' + (isWinner ? ' is-winner' : '') });
  row.appendChild(make('span', { className: 'dimbar__name', textContent: label }));
  var track = make('span', { className: 'dimbar__track' });
  var fill = make('span', { className: 'dimbar__fill' });
  fill.style.setProperty('--w', (total ? (value / total * 100) : 0).toFixed(1) + '%');
  fill.style.setProperty('--hue', 'var(' + tokenVar + ')');
  track.appendChild(fill);
  row.appendChild(track);
  row.appendChild(make('span', { className: 'dimbar__num', textContent: String(value) }));
  return row;
}

function renderResult() {
  var r = result(), t = T();
  var sk = t.skills[r.skill], dm = t.dims[r.dim];
  stage.textContent = '';

  var box = make('div', { className: 'quiz__card quiz__card--result' });
  box.style.setProperty('--hue', 'var(' + DIM_TOKEN[r.dim] + ')');

  box.appendChild(make('p', { className: 'quiz__kicker', textContent: dm.name + ' · ' + dm.line }));

  /* div + h3, not figure + figcaption: the skill name is the result, so it has
     to be a navigable heading. Portrait is decorative (alt=""). */
  var card = make('div', { className: 'portraitcard' });
  var img = make('img', {
    className: 'portraitcard__img',
    src: 'assets/img/phd/' + r.skill + '.webp',
    width: 138, height: 184, alt: '', decoding: 'async'
  });
  card.appendChild(img);
  card.appendChild(make('h3', { className: 'portraitcard__name', textContent: sk.name }));
  box.appendChild(card);

  var body = make('div', { className: 'result__body' });
  body.appendChild(make('p', { className: 'result__tag', textContent: sk.tag }));
  body.appendChild(make('p', { className: 'result__prose', textContent: sk.body }));

  var dl = make('dl', { className: 'result__poles' });
  dl.appendChild(make('dt', { textContent: t.ui.best }));
  dl.appendChild(make('dd', { textContent: sk.best }));
  dl.appendChild(make('dt', { textContent: t.ui.worst }));
  dl.appendChild(make('dd', { textContent: sk.worst }));
  body.appendChild(dl);
  box.appendChild(body);

  /* The four totals, so the result is auditable: close, or not. */
  var bars = make('div', { className: 'dimbars' });
  bars.appendChild(make('p', { className: 'dimbars__label', textContent: t.ui.attrs }));
  var total = 0;
  DIM_ORDER.forEach(function (k) { total += r.scores.dim[k]; });
  DIM_ORDER.forEach(function (k) {
    bars.appendChild(bar(t.dims[k].name, r.scores.dim[k], total, DIM_TOKEN[k], k === r.dim));
  });
  box.appendChild(bars);

  var again = make('button', { className: 'quiz__go', type: 'button', textContent: t.ui.again });
  again.addEventListener('click', renderIntro);
  box.appendChild(again);

  stage.appendChild(box);
  box.setAttribute('tabindex', '-1');
  box.focus({ preventScroll: true });
  say(status, t.ui.resultWord + '. ' + dm.name + '. ' + sk.name + '. ' + sk.tag + ' ' + sk.body);
}

/* ═══ THE SWITCHER ════════════════════════════════════════════════════════
   Rebuilds the current screen instead of reloading; `answers` holds indices,
   which do not translate, so a mid-quiz switch keeps position and answers. */
function counted(t, i) {
  return t.ui.count.replace('%n', String(i + 1)).replace('%t', String(SCORING.length));
}

function paintStatic() {
  var t = T();
  de.setAttribute('lang', (LANGS.filter(function (l) { return l.code === lang; })[0] || LANGS[0]).html);
  var m = { 'quiz-h': t.ui.title, 'rail-title': t.ui.rail, 'quiz-note': t.ui.note,
            'back-link': t.ui.backLink, 'wordmark-gloss': t.ui.gloss };
  Object.keys(m).forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = m[id];
  });
  document.title = 'IPPM — ' + t.ui.title;
  var nav = document.getElementById('langbar');
  if (nav) nav.setAttribute('aria-label', t.ui.langLabel);
}

function rerender() {
  /* answers.length is the position: 0 = intro, all = result, between = that
     question. */
  if (!stage.querySelector('.quiz__card')) return renderIntro();
  if (stage.querySelector('.quiz__card--result')) return renderResult();
  if (stage.querySelector('.quiz__card--intro')) return renderIntro();
  renderQuestion(Math.min(answers.length, SCORING.length - 1));
}

function setLang(code, persist) {
  if (!COPY[code]) return;
  lang = code;
  if (persist) { try { localStorage.setItem(LANG_KEY, code); } catch (e) {} }
  document.querySelectorAll('[data-lang]').forEach(function (b) {
    b.setAttribute('aria-pressed', b.getAttribute('data-lang') === code ? 'true' : 'false');
  });
  paintStatic();
  rerender();
}

(function buildSwitcher() {
  var host = document.getElementById('langbar');
  if (!host) return;
  LANGS.forEach(function (l) {
    var b = make('button', { className: 'lang', type: 'button', textContent: l.label });
    b.setAttribute('data-lang', l.code);
    b.setAttribute('lang', l.html);
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () { setLang(l.code, true); });
    host.appendChild(b);
  });
})();

setLang(lang, false);

})();
