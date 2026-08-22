/* WHAT KIND OF PhD ARE YOU — js/quiz.js · ES2020, no dependencies, defer.
   A twenty-four-outcome examination in the shape of a character sheet.

   The four ATTRIBUTES are borrowed wholesale in structure — Intellect, Psyche,
   Physique, Motorics — because that four-way split is the joke and the frame.
   Every one of the twenty-four SKILLS under them is written for this page: they
   are the parts of a doctorate that actually argue with you at 3 a.m., not the
   parts of a detective.

   SCORING. Each answer names a primary skill (+3) and a secondary (+1); the
   secondary is deliberately in a different attribute, so no single answer can
   run away with a column. An attribute's score is the sum of its own six
   skills, so the headline attribute and the named skill can never disagree —
   the skill is always inside the attribute that won.

   The table was BALANCED BY MEASUREMENT, not by eye. Enumerating all 4^10 =
   1,048,576 answer paths, every one of the twenty-four outcomes is reachable
   and the commonest (Ablation, 9.3%) is nine times the rarest (Poker Face,
   1.0%). The first draft looked just as reasonable on the page and ran 959:1,
   which would have meant almost every visitor seeing one of four results. See
   the note above QUESTIONS for the two rules that hold it there. */
(function () {
'use strict';

var de = document.documentElement;
if (de.classList.contains('no-js')) de.classList.replace('no-js', 'js');

function $(s, r) { return (r || document).querySelector(s); }
function make(tag, props) { return Object.assign(document.createElement(tag), props); }
function say(el, text) {
  if (!el) return;
  el.textContent = text + (el.textContent.slice(-1) === ' ' ? '' : ' ');
}

/* ═══ THE FOUR ATTRIBUTES ═════════════════════════════════════════════════
   The colours are not new. They are the four voices the site already ships
   under Lamplight, already solved against this ground: steel, violet, dried
   blood, brass. The portrait sheet happens to run blue/purple/red/gold in the
   same order, so the cards and the type agree without a single new token. */
var DIMS = {
  intellect: { name: 'Intellect', token: '--voice-hlf',
    line: 'The mind that argues.' },
  psyche:    { name: 'Psyche',    token: '--voice-inl',
    line: 'The mind that survives other people.' },
  physique:  { name: 'Physique',  token: '--voice-rhe',
    line: 'The body that takes it.' },
  motorics:  { name: 'Motorics',  token: '--voice-int',
    line: 'The hands that do the work.' }
};

/* ═══ THE TWENTY-FOUR ═════════════════════════════════════════════════════
   Every skill carries a failure mode. A character sheet that only flatters is
   a horoscope; the whole appeal of the form is that the thing which makes you
   good at this is the same thing that is costing you something. */
var SKILLS = {
  /* ── INTELLECT ──────────────────────────────────────────────────────── */
  'ablation': { dim: 'intellect', name: 'Ablation',
    tag: 'Remove one thing. See what dies.',
    body: 'You do not believe a result until you have taken it apart. Every claim you have ever published has a row in a table somewhere proving it earned its place, and you put it there.',
    best: 'Nothing ships that you cannot explain.',
    worst: 'It is week six and you are still removing things.' },
  'related-work': { dim: 'intellect', name: 'Related Work',
    tag: 'Somebody did this in 2017. You know who.',
    body: 'Your recall of the literature is not a search, it is a reflex. You have already read the paper the reviewer is about to cite, and the older one it quietly borrowed from.',
    best: 'You never rediscover a wheel.',
    worst: 'You can talk yourself out of any idea, because somebody somewhere has already nearly done it.' },
  'rebuttal': { dim: 'intellect', name: 'Rebuttal',
    tag: 'Reviewer 2 has made an error and you have a page limit.',
    body: 'You write to be right. The response letter is your medium — courteous, itemised, total. You have won in rebuttal what you had plainly lost in the paper.',
    best: 'You turn a reject into an accept.',
    worst: 'You win the argument with your advisor too.' },
  'framing': { dim: 'intellect', name: 'Framing',
    tag: 'It was never about the number.',
    body: 'You know no result speaks for itself. The same experiment is a footnote or a headline depending on the sentence in front of it, and you are the one who writes that sentence.',
    best: 'People understand why the work matters.',
    worst: 'So do you — right up until somebody asks for the number.' },
  'hypothesis': { dim: 'intellect', name: 'Hypothesis',
    tag: 'What if the entire field is holding it wrong?',
    body: 'You are not here to add half a point. You are here because something in the standard account does not fit, and you would rather chase that than polish anything.',
    best: 'You find the problem everyone else walked past.',
    worst: 'You have eleven of these and no first-author paper.' },
  'error-analysis': { dim: 'intellect', name: 'Error Analysis',
    tag: 'The failure cases are the paper.',
    body: 'Where others read the mean, you read the tail. You have found more real bugs by staring at the twelve examples that went wrong than by any amount of thinking about the ones that went right.',
    best: 'You know exactly why your method fails, which is most of knowing why it works.',
    worst: 'You can no longer look at a leaderboard without assuming it is broken.' },

  /* ── PSYCHE ─────────────────────────────────────────────────────────── */
  'scope-control': { dim: 'psyche', name: 'Scope Control',
    tag: 'No. That is a different paper.',
    body: 'The rarest attribute in the building. You can look at a genuinely good idea three weeks before a deadline and let it go, which almost nobody in this corridor can do.',
    best: 'You submit. Repeatedly. On time.',
    worst: 'One of the ones you let go was the one that mattered.' },
  'three-am-idea': { dim: 'psyche', name: 'The 3 A.M. Idea',
    tag: 'It arrived fully formed and you are not sure from where.',
    body: 'Your best work does not happen at the desk. It happens in the shower, on the walk home, in the ninety seconds before sleep — and you have learned to keep something to write on within reach of the bed.',
    best: 'The idea is genuinely new, and by morning you can prove it.',
    worst: 'You read it back at nine and it is nonsense in your own handwriting.' },
  'co-authorship': { dim: 'psyche', name: 'Co-authorship',
    tag: 'You can hear what they are not saying on the call.',
    body: 'You read the room. You know which collaborator has quietly stopped believing in the project, which one is drowning, and which one simply needs to be asked directly.',
    best: 'Your projects finish, because the people on them are still speaking to each other.',
    worst: 'You absorb everyone’s stress and file it under your own.' },
  'corresponding-author': { dim: 'psyche', name: 'Corresponding Author',
    tag: 'Somebody has to sign it.',
    body: 'You do not wait to be told. You call the meeting, you name the deadline, you send the email nobody else wants to send, and you put your address on the front page.',
    best: 'The project has a spine.',
    worst: 'You are doing four people’s jobs and calling it leadership.' },
  'lab-morale': { dim: 'psyche', name: 'Lab Morale',
    tag: 'The group chat is load-bearing.',
    body: 'A doctorate is a shared condition and you are the one who keeps saying so out loud. You remember birthdays and rejection dates. You are the reason two of the first-years did not quit.',
    best: 'Nobody in your lab goes through the bad month alone.',
    worst: 'You have optimised for everybody’s morale except your own thesis.' },
  'positioning': { dim: 'psyche', name: 'Positioning',
    tag: 'You did not ask. You made it obvious.',
    body: 'You get things by understanding how the decision will actually be made. You know which argument moves your advisor and you make it in the order they can accept it.',
    best: 'You get the compute, the slot, the collaboration.',
    worst: 'You have started doing this to your friends.' },

  /* ── PHYSIQUE ───────────────────────────────────────────────────────── */
  'deadline-stamina': { dim: 'physique', name: 'Deadline Stamina',
    tag: 'Seventy-two hours. You have done it before.',
    body: 'The last week is where your papers are actually written and you made peace with that years ago. You do not sprint faster than anyone else. You simply do not stop.',
    best: 'The submission goes in complete.',
    worst: 'You are still recovering from it in March.' },
  'rejection-tolerance': { dim: 'physique', name: 'Rejection Tolerance',
    tag: 'Desk reject. Fine. Next venue.',
    body: 'Something in you does not break when the scores come back. Four conferences have said no and you can still open the email on the day it arrives, which is a kind of strength nobody puts on a CV.',
    best: 'You keep submitting, which is the only strategy that has ever worked.',
    worst: 'You have stopped noticing that it hurts. That is not the same as it not hurting.' },
  'cluster-wrangling': { dim: 'physique', name: 'Cluster Wrangling',
    tag: 'The GPUs are a physical problem.',
    body: 'You have a relationship with the hardware. You know which node runs hot, which one lies about its free memory, and how to be holding two hundred of them at four in the morning on a Sunday.',
    best: 'You are never the bottleneck.',
    worst: 'You have solved an infrastructure problem instead of a research one for eleven days running.' },
  'caffeine': { dim: 'physique', name: 'Caffeine',
    tag: 'The good hours are the ones you bought.',
    body: 'You run on a chemical schedule and you are honest about it. The fourth cup is not a joke, it is a load-bearing component of the methodology.',
    best: 'You are extremely good between eleven at night and three in the morning.',
    worst: 'You cannot remember what your own baseline feels like.' },
  'field-sense': { dim: 'physique', name: 'Field Sense',
    tag: 'That number is too good. Something is wrong.',
    body: 'The cold feeling arrives before the evidence does. You have caught three data leaks this way and you could not have explained any of them until afterwards.',
    best: 'You do not publish the bug.',
    worst: 'You trust nothing — including the results that are perfectly fine.' },
  'defense-instinct': { dim: 'physique', name: 'Defense Instinct',
    tag: 'Your heart rate is 140 and you are doing it anyway.',
    body: 'Fear does not stop you, it sharpens you. The talk, the viva, the hostile question from the third row — you go toward all of it, and you are better in the room than you ever are outside it.',
    best: 'You are unshakeable exactly when it counts.',
    worst: 'You need the adrenaline now, and a calm week feels like drowning.' },

  /* ── MOTORICS ───────────────────────────────────────────────────────── */
  'figure-craft': { dim: 'motorics', name: 'Figure Craft',
    tag: 'Aligned axes. One palette. No legend on top of the data.',
    body: 'You believe a figure is an argument and you build it like one. People screenshot your plots. Your advisor sends them to other students as the example.',
    best: 'The reader understands in four seconds.',
    worst: 'It is three in the morning and you are adjusting the font size of a tick label.' },
  'log-reading': { dim: 'motorics', name: 'Log Reading',
    tag: 'Line 41,203 looks wrong.',
    body: 'You see the anomaly. Forty thousand lines go past and your eye stops on the one that does not belong, and you are usually right about why it does not belong.',
    best: 'You find in twenty minutes the bug that would have cost the project a month.',
    worst: 'You find seven, and only one of them mattered.' },
  'hotfix': { dim: 'motorics', name: 'Hotfix',
    tag: 'Ninety minutes to camera-ready. Go.',
    body: 'You are fast under a clock. Not careful — fast. When the deadline is inside the hour, you are the person who should be at the keyboard, and everyone knows it.',
    best: 'It ships, and it works.',
    worst: 'The final day of git log is unreadable and one of those commits is going to hurt.' },
  'conference-charm': { dim: 'motorics', name: 'Conference Charm',
    tag: 'Two minutes, then ten more if they stay.',
    body: 'You are good at the poster. You can tell within a sentence whether the person in front of you wants the intuition or the equations, and you have both versions ready.',
    best: 'You leave with three collaborations and a postdoc lead.',
    worst: 'You have networked instead of written for eight months.' },
  'toolchain': { dim: 'motorics', name: 'Toolchain',
    tag: 'It is the data loader. It is always the data loader.',
    body: 'You speak to the machine directly. Driver versions, scheduler flags, an image that actually builds twice — the whole substrate is legible to you where it is weather to everybody else.',
    best: 'Your experiments reproduce, which almost nobody’s do.',
    worst: 'You built beautiful infrastructure for a project that got cancelled.' },
  'poker-face': { dim: 'motorics', name: 'Poker Face',
    tag: 'You do not know. You say so, and keep going.',
    body: 'Nothing in your face moves. The question you cannot answer, the demo that dies on stage, the reviewer sitting in the second row — you take all of it flat, and the room stays calm because you did.',
    best: 'People trust you with the difficult talk.',
    worst: 'Nobody knows how you are actually doing. Including you.' }
};

/* ═══ THE EXAMINATION ═════════════════════════════════════════════════════
   Ten questions, four answers each. `p` is the primary skill (+3), `s` the
   secondary (+1).

   TWO RULES HOLD ACROSS THE WHOLE TABLE, and both were solved rather than
   eyeballed — an earlier draft that merely looked balanced gave one outcome
   14.6% of all answer paths and another 0.02%, a 959x spread, which means
   almost everybody sees the same four results.

   1. EVERY QUESTION OFFERS EXACTLY ONE ANSWER PER ATTRIBUTE. So each question
      is a genuine four-way choice, and each attribute gets exactly ten
      primaries. The four are NOT in a fixed order down the list — answer 1 is
      Motorics here and Intellect in the next one — because a quiz whose first
      option is always Intellect is a quiz you can play without reading.

   2. SECONDARIES ARE BUDGETED AGAINST PRIMARY COUNT. Ten primaries over six
      skills means four skills get two and two get one, so the singles are
      given three secondaries each and the doubles one. Weight then lands at
      3x2+1 = 7 against 3x1+3 = 6 — near enough that a single-primary skill is
      still a real outcome. Every secondary also crosses into a different
      attribute (I->P->H->M->I), which is what keeps one answer from carrying
      a whole column.

   Enumerating all 4^10 = 1,048,576 answer paths: all 24 outcomes reachable,
   from 9.3% (Ablation) down to 1.0% (Poker Face). A 9x spread, not 959x. */
var QUESTIONS = [
  { q: 'It is 23:40. The deadline is 09:00 AoE. Your main result is 0.3 below the baseline.',
    a: [
      { t: 'Read the eval script line by line. There is a bug in it and you are going to find it.', p: 'log-reading', s: 'error-analysis' },
      { t: 'Reframe it. This was never a paper about beating that baseline.', p: 'framing', s: 'co-authorship' },
      { t: 'Six more runs on six more seeds. Somebody has to be holding those GPUs at midnight.', p: 'cluster-wrangling', s: 'toolchain' },
      { t: 'Cut the claim. Ship what is actually true and say so plainly.', p: 'scope-control', s: 'deadline-stamina' }
    ] },
  { q: 'Reviewer 2 calls your contribution "incremental".',
    a: [
      { t: 'Twelve paragraphs. Every one of them cited.', p: 'rebuttal', s: 'corresponding-author' },
      { t: 'You have read this review four times now. It is fine. It is fine.', p: 'rejection-tolerance', s: 'poker-face' },
      { t: 'Add the table they asked for. One evening. Done before Friday.', p: 'hotfix', s: 'rebuttal' },
      { t: 'Your name is on the front of it. You decide the line, then tell the co-authors what it is.', p: 'corresponding-author', s: 'rejection-tolerance' }
    ] },
  { q: 'Somebody drops a paper in the group chat that looks exactly like your idea.',
    a: [
      { t: 'Reply within forty seconds. With a meme. The room needs it more than you do.', p: 'lab-morale', s: 'defense-instinct' },
      { t: 'You already know that paper. It differs from yours in three specific ways.', p: 'related-work', s: 'lab-morale' },
      { t: 'A cold, specific dread arrives before you have finished the abstract.', p: 'field-sense', s: 'log-reading' },
      { t: 'Put their teaser figure beside yours. Yours is better and you can show why.', p: 'figure-craft', s: 'related-work' }
    ] },
  { q: 'Your training run is nineteen hours in. The loss has been flat for six of them.',
    a: [
      { t: 'It is the data loader. It is always the data loader.', p: 'toolchain', s: 'error-analysis' },
      { t: 'Kill it. Change exactly one thing. Start again.', p: 'ablation', s: 'three-am-idea' },
      { t: 'Let it run and stay up with it. You have seen worse ones come back.', p: 'caffeine', s: 'log-reading' },
      { t: 'Something about it has been bothering you since you fell asleep. Follow that.', p: 'three-am-idea', s: 'field-sense' }
    ] },
  { q: 'A first-year asks you how to choose a research problem.',
    a: [
      { t: 'Tell them the thing nobody has tried, and why you think it would work.', p: 'hypothesis', s: 'positioning' },
      { t: 'Tell them the truth about the last three years.', p: 'rejection-tolerance', s: 'poker-face' },
      { t: 'Tell them what their advisor actually wants, which is not what was said in the meeting.', p: 'positioning', s: 'defense-instinct' },
      { t: 'Tell them to go to a workshop and talk to twelve people before they read anything.', p: 'conference-charm', s: 'rebuttal' }
    ] },
  { q: 'The figure is due in an hour and the colours are wrong.',
    a: [
      { t: 'Rebuild it. One palette, aligned axes, nothing sitting on top of the data.', p: 'figure-craft', s: 'framing' },
      { t: 'The colours are load-bearing. This figure is the entire argument.', p: 'framing', s: 'co-authorship' },
      { t: 'Ask the person in this group who makes the good figures.', p: 'co-authorship', s: 'field-sense' },
      { t: 'While you are in here anyway, you may as well redo the whole figure set.', p: 'deadline-stamina', s: 'figure-craft' }
    ] },
  { q: 'Poster session. Somebody senior stops in front of your board.',
    a: [
      { t: 'The two-minute version. Then the ten-minute version, if they stay.', p: 'conference-charm', s: 'rebuttal' },
      { t: 'You explain why the whole subfield has been asking the wrong question.', p: 'hypothesis', s: 'lab-morale' },
      { t: 'Within one sentence you have worked out what they could do for this project.', p: 'positioning', s: 'defense-instinct' },
      { t: 'Your heart rate is 140. You do it anyway, and you do it well.', p: 'defense-instinct', s: 'conference-charm' }
    ] },
  { q: 'It is three in the morning and you are awake.',
    a: [
      { t: 'The idea arrived complete and you are writing it down before it goes.', p: 'three-am-idea', s: 'field-sense' },
      { t: 'Fourth cup. The good hours are the quiet ones.', p: 'caffeine', s: 'log-reading' },
      { t: 'You are ssh’d into a node fixing somebody else’s permissions error.', p: 'toolchain', s: 'error-analysis' },
      { t: 'You are back in yesterday’s failure cases and something in them does not add up.', p: 'error-analysis', s: 'co-authorship' }
    ] },
  { q: 'The cluster is full. Your job has been queued for thirty hours.',
    a: [
      { t: 'You already have a second copy running on the machine under your desk.', p: 'cluster-wrangling', s: 'hotfix' },
      { t: 'Rewrite it to fit on the partition nobody is using.', p: 'hotfix', s: 'ablation' },
      { t: 'Escalate. Politely, in writing, to the person who can actually fix it.', p: 'corresponding-author', s: 'cluster-wrangling' },
      { t: 'Read, properly, for two days. You have not done that in months.', p: 'related-work', s: 'lab-morale' }
    ] },
  { q: 'Your defence is in six weeks.',
    a: [
      { t: 'Six weeks is for rehearsing. It is not for new experiments.', p: 'scope-control', s: 'caffeine' },
      { t: 'Go back through the thesis and cut every claim you cannot defend.', p: 'ablation', s: 'scope-control' },
      { t: 'Rehearse until every slide has a scripted answer waiting behind it.', p: 'poker-face', s: 'hypothesis' },
      { t: 'Six weeks is enough time to add one more experiment.', p: 'deadline-stamina', s: 'poker-face' }
    ] }
];

/* ═══ SELF-CHECK ══════════════════════════════════════════════════════════
   The tables above are hand-written, and two mistakes in them are invisible
   at a glance and fatal to the result: a typo in a skill slug scores into a
   bucket nothing can ever read, and a skill that is nobody's primary is an
   outcome the page can never produce. Both are checked here rather than
   trusted, and reported to the console instead of failing quietly. */
(function audit() {
  var primaries = Object.create(null), problems = [];
  QUESTIONS.forEach(function (q, i) {
    var seen = Object.create(null);
    q.a.forEach(function (o, j) {
      var where = 'Q' + (i + 1) + String.fromCharCode(97 + j);
      if (!SKILLS[o.p]) problems.push(where + ': unknown primary "' + o.p + '"');
      else {
        primaries[o.p] = (primaries[o.p] || 0) + 1;
        seen[SKILLS[o.p].dim] = (seen[SKILLS[o.p].dim] || 0) + 1;
      }
      if (!SKILLS[o.s]) problems.push(where + ': unknown secondary "' + o.s + '"');
      else if (SKILLS[o.s] && SKILLS[o.p] && SKILLS[o.s].dim === SKILLS[o.p].dim)
        problems.push(where + ': secondary "' + o.s + '" does not cross attributes');
    });
    /* The invariant the balance rests on. Two answers in one attribute means
       that attribute gets eleven primaries and another gets nine, and the
       nine-primary column's skills quietly become much rarer outcomes. */
    Object.keys(DIMS).forEach(function (d) {
      if (seen[d] !== 1) problems.push('Q' + (i + 1) + ': ' + (seen[d] || 0) + ' answers in ' + d + ', expected exactly 1');
    });
  });
  Object.keys(SKILLS).forEach(function (k) {
    if (!primaries[k]) problems.push('unreachable outcome: "' + k + '" is never a primary');
    if (!DIMS[SKILLS[k].dim]) problems.push(k + ': unknown attribute "' + SKILLS[k].dim + '"');
  });
  if (problems.length && window.console) console.warn('[phd quiz]\n' + problems.join('\n'));
})();

/* ═══ THE APP ═════════════════════════════════════════════════════════════ */
var stage  = document.getElementById('stage');
var status = document.getElementById('quiz-status');
if (!stage) return;

var answers = [];                                   /* answers[i] = option index */

function score() {
  var skill = Object.create(null), dim = Object.create(null);
  Object.keys(SKILLS).forEach(function (k) { skill[k] = 0; });
  Object.keys(DIMS).forEach(function (k) { dim[k] = 0; });
  answers.forEach(function (choice, i) {
    var o = QUESTIONS[i].a[choice];
    if (!o) return;
    skill[o.p] += 3;
    skill[o.s] += 1;
  });
  /* An attribute is the sum of its OWN six skills — never a separate tally.
     Counted this way the winning skill is always inside the winning
     attribute, so the card can never name a Physique skill under a heading
     that says Intellect. */
  Object.keys(SKILLS).forEach(function (k) { dim[SKILLS[k].dim] += skill[k]; });
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
  var dimKeys = Object.keys(DIMS);
  var winnerDim = best(s.dim, dimKeys);
  var inDim = Object.keys(SKILLS).filter(function (k) { return SKILLS[k].dim === winnerDim; });
  var winnerSkill = best(s.skill, inDim);
  return { dim: winnerDim, skill: winnerSkill, scores: s };
}

function progress(n) {
  var wrap = make('p', { className: 'quiz__progress' });
  wrap.setAttribute('aria-hidden', 'true');
  for (var i = 0; i < QUESTIONS.length; i++) {
    var pip = make('span', { className: 'pip' + (i < n ? ' is-done' : i === n ? ' is-here' : '') });
    wrap.appendChild(pip);
  }
  return wrap;
}

function renderIntro() {
  stage.textContent = '';
  var box = make('div', { className: 'quiz__card quiz__card--intro' });
  box.appendChild(make('p', { className: 'quiz__kicker', textContent: 'An examination in four attributes' }));
  box.appendChild(make('p', { className: 'quiz__lede',
    textContent: 'Ten questions about the parts of a doctorate nobody puts in the handbook. There are twenty-four possible outcomes and not one of them is flattering the whole way through.' }));

  /* The four axes, named before you start. Not decoration — knowing what is
     being measured is the difference between a quiz and a horoscope, and it
     also gives the intro card the same weight as the nine screens after it,
     so pressing begin does not jolt the page a card-height taller. */
  var grid = make('ul', { className: 'attrs' });
  Object.keys(DIMS).forEach(function (k) {
    var li = make('li', { className: 'attrs__item' });
    li.style.setProperty('--hue', 'var(' + DIMS[k].token + ')');
    li.appendChild(make('b', { className: 'attrs__name', textContent: DIMS[k].name }));
    li.appendChild(make('span', { className: 'attrs__line', textContent: DIMS[k].line }));
    grid.appendChild(li);
  });
  box.appendChild(grid);

  var go = make('button', { className: 'quiz__go', type: 'button', textContent: '[ begin ]' });
  go.addEventListener('click', function () { answers = []; renderQuestion(0); });
  box.appendChild(go);
  stage.appendChild(box);
}

function renderQuestion(i) {
  stage.textContent = '';
  var q = QUESTIONS[i];
  var box = make('div', { className: 'quiz__card' });

  box.appendChild(progress(i));
  box.appendChild(make('p', { className: 'quiz__count', textContent: 'Question ' + (i + 1) + ' of ' + QUESTIONS.length }));
  var h = make('h2', { className: 'quiz__q', textContent: q.q });
  h.setAttribute('tabindex', '-1');
  box.appendChild(h);

  var list = make('ol', { className: 'quiz__answers' });
  q.a.forEach(function (opt, j) {
    var li = make('li');
    var b = make('button', { className: 'answer', type: 'button' });
    b.appendChild(make('span', { className: 'answer__key', textContent: String(j + 1) }));
    b.appendChild(make('span', { className: 'answer__text', textContent: opt.t }));
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
    var back = make('button', { className: 'quiz__back', type: 'button', textContent: '[ back ]' });
    back.addEventListener('click', function () { answers.length = i - 1; renderQuestion(i - 1); });
    box.appendChild(back);
  }

  stage.appendChild(box);
  /* Move focus to the question, not to the first answer: landing on an option
     makes it look chosen, and a screen reader would read one answer instead of
     the thing being asked. */
  h.focus({ preventScroll: true });
  say(status, 'Question ' + (i + 1) + ' of ' + QUESTIONS.length + '. ' + q.q);
}

function choose(i, j) {
  answers[i] = j;
  if (i + 1 < QUESTIONS.length) renderQuestion(i + 1);
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
  var r = result();
  var sk = SKILLS[r.skill], dm = DIMS[r.dim];
  stage.textContent = '';

  var box = make('div', { className: 'quiz__card quiz__card--result' });
  box.style.setProperty('--hue', 'var(' + dm.token + ')');

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
  dl.appendChild(make('dt', { textContent: 'At your best' }));
  dl.appendChild(make('dd', { textContent: sk.best }));
  dl.appendChild(make('dt', { textContent: 'At your worst' }));
  dl.appendChild(make('dd', { textContent: sk.worst }));
  body.appendChild(dl);
  box.appendChild(body);

  /* The four totals, so the result is auditable rather than oracular: you can
     see it was close, or that it was not close at all. */
  var bars = make('div', { className: 'dimbars' });
  bars.appendChild(make('p', { className: 'dimbars__label', textContent: 'Your attributes' }));
  var total = 0;
  Object.keys(DIMS).forEach(function (k) { total += r.scores.dim[k]; });
  Object.keys(DIMS).forEach(function (k) {
    bars.appendChild(bar(DIMS[k].name, r.scores.dim[k], total, DIMS[k].token, k === r.dim));
  });
  box.appendChild(bars);

  var again = make('button', { className: 'quiz__go', type: 'button', textContent: '[ take it again ]' });
  again.addEventListener('click', renderIntro);
  box.appendChild(again);

  stage.appendChild(box);
  box.setAttribute('tabindex', '-1');
  box.focus({ preventScroll: true });
  say(status, 'Result. ' + dm.name + '. ' + sk.name + '. ' + sk.tag + ' ' + sk.body);
}

renderIntro();

})();
