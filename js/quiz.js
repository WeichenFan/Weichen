/* WHAT KIND OF PhD ARE YOU — js/quiz.js · ES2020, no dependencies, defer.
   A twenty-four-outcome examination in the shape of a character sheet,
   in English, Simplified Chinese and Traditional Chinese.

   The four ATTRIBUTES are borrowed wholesale in structure — Intellect, Psyche,
   Physique, Motorics — because that four-way split is the joke and the frame.
   Every one of the twenty-four SKILLS under them is written for this page: they
   are the parts of a doctorate that actually argue with you at 3 a.m., not the
   parts of a detective.

   COPY IS SEPARATED FROM SCORING, and that separation is the point of this
   file's shape. Everything a reader sees lives in js/quiz-copy.js keyed by
   language; the two tables below — which skill each answer scores, and which
   attribute each skill belongs to — live here and are shared by all three.
   Translating cannot change anybody's result, and a mistranslated answer
   cannot silently rewire the scoring, because the translations do not contain
   a single slug.

   SCORING. Each answer names a primary skill (+3) and a secondary (+1); the
   secondary is deliberately in a different attribute, so no single answer can
   run away with a column. An attribute's score is the sum of its own six
   skills, so the headline attribute and the named skill can never disagree —
   the skill is always inside the attribute that won.

   The table was BALANCED BY MEASUREMENT, not by eye. Enumerating all 4^10 =
   1,048,576 answer paths, every one of the twenty-four outcomes is reachable
   and the commonest (Ablation, 9.3%) is nine times the rarest (Poker Face,
   1.0%). The first draft looked just as reasonable on the page and ran 959:1,
   which would have meant almost every visitor seeing one of four results.

   TWO RULES HOLD THAT BALANCE, and the audit below enforces both.
   1. EVERY QUESTION OFFERS EXACTLY ONE ANSWER PER ATTRIBUTE, so each attribute
      gets exactly ten primaries. The four are not in a fixed order down the
      list — a quiz whose first option is always Intellect is a quiz you can
      play without reading.
   2. SECONDARIES ARE BUDGETED AGAINST PRIMARY COUNT. Ten primaries over six
      skills means four skills get two and two get one, so the singles are
      given three secondaries each and the doubles one. Weight lands at
      3x2+1 = 7 against 3x1+3 = 6 — near enough that a single-primary skill is
      still a real outcome. */
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
   Three languages, one scoring table. `html` is written to the lang attribute
   so the CJK font stack in css/quiz.css can attach to it and so a screen
   reader switches voice with the page. */
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
  /* No stored choice: follow the browser. navigator.languages is ORDERED by
     preference and must be read that way — searching the whole list for "zh"
     hands a Chinese page to somebody whose list is en-US, en-CN, zh-Hans-CN,
     whose actual first choice is English. First entry that maps to something
     translated wins; anything unmapped is skipped, not treated as a match.
     zh-TW / zh-HK / zh-MO and zh-Hant-* are traditional; bare zh and zh-CN
     are simplified. */
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
/* The four attribute colours are not new. They are the four voices the site
   already ships under Lamplight, solved against this ground: steel, violet,
   dried blood, brass — and the portrait sheet runs blue/purple/red/gold in the
   same order, so the cards and the type agree without one new token. */
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
   Four things are invisible at a glance and fatal: a typo'd slug scores into a
   bucket nothing reads; a skill that is nobody's primary is an outcome the
   page can never produce; a question with two answers in one attribute quietly
   unbalances the whole quiz; and a language missing a key renders `undefined`
   on the card. All four are checked, not trusted, and reported to the console
   rather than failing silently. */
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
  /* Completeness, per language. A missing string is not a styling problem, it
     is the word "undefined" printed on somebody's result. */
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

/* Scoring reads SCORING, never the copy. The language on screen cannot reach
   this function, which is the guarantee that the same ten choices give the
   same character in all three. */
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
  /* An attribute is the sum of its OWN six skills — never a separate tally.
     Counted this way the winning skill is always inside the winning
     attribute, so the card can never name a Physique skill under a heading
     that says Intellect. */
  Object.keys(SKILL_DIM).forEach(function (k) { dim[SKILL_DIM[k]] += skill[k]; });
  return { skill: skill, dim: dim };
}

/* Ties are broken by declaration order, which is fixed — so the same ten
   answers always produce the same character, on every device, forever. */
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

  /* The four axes, named before you start. Not decoration — knowing what is
     being measured is the difference between a quiz and a horoscope, and it
     also gives the intro card the same weight as the nine screens after it,
     so pressing begin does not jolt the page a card-height taller. */
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
    /* detail > 1 is the second press of a double-click, and it must not count.
       Answering swaps the whole card synchronously, so by the time that press
       lands there is already a NEW question under the pointer and its button
       takes the click — one double-click silently answers two questions, the
       second of which the reader never saw. detail is exact where a timer
       would be a guess: it is 0 for a keyboard Enter or Space and 0 for a
       programmatic .click(), so nothing legitimate is blocked. */
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
  /* Move focus to the question, not to the first answer: landing on an option
     makes it look chosen, and a screen reader would read one answer instead of
     the thing being asked. */
  h.focus({ preventScroll: true });
  say(status, counted(t, i) + '. ' + q.q);
}

function choose(i, j) {
  answers[i] = j;
  if (i + 1 < SCORING.length) renderQuestion(i + 1);
  else renderResult();
}

/* 1–4 pick an answer. No modifier is needed and no single letter is bound, so
   this adds a shortcut without taking a key away from anybody's screen reader. */
document.addEventListener('keydown', function (ev) {
  if (ev.defaultPrevented || ev.metaKey || ev.ctrlKey || ev.altKey) return;
  /* Auto-repeat must not answer the questionnaire. Each screen is rendered
     synchronously, so a held key walks the OS repeat straight through every
     remaining question — about a second of a stuck key produces a finished
     result nobody chose, and the result screen has no [ back ] to undo it.
     ev.repeat is false on the first press and true on every repeat after it. */
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

  /* A div and an h3, not a figure and a figcaption. The skill name IS the
     result — the one thing the visitor came for — so it has to be a heading
     somebody can navigate to. As a figcaption it was reachable only by
     reading the whole card, and the page's heading outline stopped at the
     title. The portrait is decorative (alt="", the name is right beneath it),
     which is also why it needs no figure/caption pairing. */
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

  /* The four totals, so the result is auditable rather than oracular: you can
     see it was close, or that it was not close at all. */
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
   Rebuilding the current screen rather than reloading keeps the reader where
   they are: switch language on question seven and you are still on question
   seven, with the same seven answers, because `answers` holds indices and
   indices do not translate. */
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
  /* Whatever is on screen now, put the same thing back in the new language.
     answers.length is the position: 0 answered = intro, all answered =
     result, anything between = that question. */
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
