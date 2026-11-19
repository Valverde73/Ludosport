/**
 * Test Suite: Match Academy Tracking & Triple Ranking (Mixto / Almería / Granada)
 *
 * Verifies Requirements R1, R2, R3:
 * 1. supabase_schema.sql adds fighter_a_academy & fighter_b_academy + idempotent ALTER TABLE.
 * 2. index.html adds 3-button segmented selector (#rankingAcademySelector) in #tab-ranking.
 * 3. normalizeAcademy, resolveMatchAcademies, matchToDb, matchFromDb handle normalization and legacy fallback.
 * 4. saveCombat and finishAndSaveLiveCombat persist fighterAAcademy & fighterBAcademy locally and to Supabase.
 * 5. calculateStandings implements Option B across 'all', 'Almería', and 'Granada' (including cross-academy bouts),
 *    while validateDuelForm uses 'all'.
 * 6. renderMonthlyMedals filters fencers and matches (with this.fencers fallback for legacy matches) before LeagueBadgesService.
 * 7. Segmented control click events update rankingAcademyFilter, ARIA/active state, Podium, Table, and Monthly Medals.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// --- SUITE 1: Static Contracts (SQL & HTML) ---
console.log('--- SUITE 1: Static Contracts in supabase_schema.sql and index.html ---');

const sqlSchema = fs.readFileSync(path.join(__dirname, 'supabase_schema.sql'), 'utf-8');
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');

const matchesTableBlock = sqlSchema.split('CREATE TABLE IF NOT EXISTS public.matches')[1].split(');')[0];
assert(
  matchesTableBlock.includes("fighter_a_academy TEXT NOT NULL DEFAULT ''"),
  'public.matches CREATE TABLE must include fighter_a_academy TEXT NOT NULL DEFAULT \'\''
);
assert(
  matchesTableBlock.includes("fighter_b_academy TEXT NOT NULL DEFAULT ''"),
  'public.matches CREATE TABLE must include fighter_b_academy TEXT NOT NULL DEFAULT \'\''
);
assert(
  sqlSchema.includes("ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS fighter_a_academy TEXT NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS fighter_b_academy TEXT NOT NULL DEFAULT '';"),
  'supabase_schema.sql must include idempotent ALTER TABLE public.matches migration'
);
console.log('✓ supabase_schema.sql defines fighter_a_academy, fighter_b_academy, and idempotent ALTER TABLE');

const tabRankingBlock = indexHtml.split('id="tab-ranking"')[1].split('id="tab-duel"')[0];
const beforePodium = tabRankingBlock.split('id="podiumContainer"')[0];
assert(beforePodium.includes('id="rankingAcademySelector"'), '#tab-ranking must contain #rankingAcademySelector before #podiumContainer');
assert(beforePodium.includes('data-ranking-academy="all"'), 'Selector must include Mixto button (data-ranking-academy="all")');
assert(beforePodium.includes('data-ranking-academy="Almería"'), 'Selector must include Almería button (data-ranking-academy="Almería")');
assert(beforePodium.includes('data-ranking-academy="Granada"'), 'Selector must include Granada button (data-ranking-academy="Granada")');
console.log('✓ index.html renders 3-button segmented selector in #tab-ranking before #podiumContainer');

// --- Setup Headless DOM & Compile App + Badges ---
class ClassListMock {
  constructor() { this._set = new Set(); }
  add(...tokens) { for (const t of tokens) this._set.add(t); }
  remove(...tokens) { for (const t of tokens) this._set.delete(t); }
  toggle(token, force) {
    if (force === true) { this._set.add(token); return true; }
    if (force === false) { this._set.delete(token); return false; }
    if (this._set.has(token)) { this._set.delete(token); return false; }
    this._set.add(token); return true;
  }
  contains(token) { return this._set.has(token); }
}

class MockElement {
  constructor(id, tagName = 'div') {
    this.id = id;
    this.tagName = tagName;
    this.innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.className = '';
    this.disabled = false;
    this.attributes = {};
    this.listeners = {};
    this.classList = new ClassListMock();
  }
  setAttribute(name, val) { this.attributes[name] = String(val); }
  getAttribute(name) { return this.attributes[name] !== undefined ? this.attributes[name] : null; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  focus() {}
  addEventListener(type, fn) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  }
  removeEventListener() {}
  trigger(type, eventObj = {}) {
    (this.listeners[type] || []).forEach(fn => fn({ target: this, preventDefault: () => {}, ...eventObj }));
  }
}

const mockElements = {};
function getOrCreateMockElement(id, tagName = 'div') {
  if (!mockElements[id]) {
    mockElements[id] = new MockElement(id, tagName);
  }
  return mockElements[id];
}

// Create 3 segmented ranking academy button mocks
const btnMixto = new MockElement('rankingBtnAll', 'button');
btnMixto.setAttribute('data-ranking-academy', 'all');
btnMixto.setAttribute('aria-pressed', 'true');

const btnAlmeria = new MockElement('rankingBtnAlmeria', 'button');
btnAlmeria.setAttribute('data-ranking-academy', 'Almería');
btnAlmeria.setAttribute('aria-pressed', 'false');

const btnGranada = new MockElement('rankingBtnGranada', 'button');
btnGranada.setAttribute('data-ranking-academy', 'Granada');
btnGranada.setAttribute('aria-pressed', 'false');

const rankingAcademyButtons = [btnMixto, btnAlmeria, btnGranada];

global.window = global;
global.window.addEventListener = () => {};
global.window.matchMedia = () => ({ matches: false, addEventListener: () => {} });
global.window.lucide = { createIcons: () => {} };

const { LeagueBadgesService } = require('./badges.js');
global.window.LeagueBadgesService = LeagueBadgesService;

global.document = {
  body: new MockElement('body', 'body'),
  getElementById: (id) => getOrCreateMockElement(id),
  querySelector: () => null,
  querySelectorAll: (selector) => {
    if (selector === '[data-ranking-academy]') return rankingAcademyButtons;
    return [];
  },
  createElement: (tag) => new MockElement('dynamic', tag),
  addEventListener: () => {}
};

global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};
global.sessionStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; }
};
global.confirm = () => true;
global.alert = () => {};

let appSource = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
appSource = appSource.replace(
  /window\.addEventListener\('DOMContentLoaded'[\s\S]*$/,
  'module.exports = { LudoSportApp, DEFAULT_FENCERS };'
);

const appModule = new module.constructor();
appModule._compile(appSource, 'app.js');
const { LudoSportApp } = appModule.exports;

function createApp(options = {}) {
  const instance = Object.create(LudoSportApp.prototype);
  instance.currentMonthKey = options.monthKey || '112026';
  instance.isAdmin = true;
  instance.isTestMode = false;
  instance.rankingAcademyFilter = options.rankingAcademyFilter !== undefined ? options.rankingAcademyFilter : 'all';
  instance.fencers = options.fencers || [];
  instance.matches = options.matches || [];
  instance.availableMonths = [instance.currentMonthKey];
  instance.scoreA = 0;
  instance.scoreB = 0;
  instance.liveScoreA = 0;
  instance.liveScoreB = 0;
  instance.timerRunning = false;
  instance.timerStarted = false;
  instance.timerBaseSeconds = 90;
  instance.timerSeconds = 90;
  instance.isSoundEnabled = false;
  instance.saveLocalCache = () => {};
  instance.renderAll = () => {};
  instance.showToast = () => {};
  instance.playBeep = () => {};
  instance.pauseLiveTimer = () => {};
  instance.resetLiveTimer = () => {};
  instance.updateLiveOutcomeBanner = () => {};
  return instance;
}

// --- SUITE 2: normalizeAcademy, resolveMatchAcademies, matchToDb, matchFromDb ---
console.log('\n--- SUITE 2: normalizeAcademy, resolveMatchAcademies, matchToDb & matchFromDb ---');

const app = createApp({
  fencers: [
    { id: 'a1', name: 'Almería One', academy: 'Almería', rank: 'Inizziato', color: 'cyan' },
    { id: 'a2', name: 'Almería Legacy', academy: 'Almeria', rank: 'Inizziato', color: 'cyan' },
    { id: 'g1', name: 'Granada One', academy: 'Granada', rank: 'Inizziato', color: 'emerald' },
    { id: 'u1', name: 'No Academy Fencer', rank: 'Inizziato', color: 'cyan' }
  ]
});

// normalizeAcademy
assert.strictEqual(app.normalizeAcademy('Almería'), 'Almería');
assert.strictEqual(app.normalizeAcademy('Almeria'), 'Almería');
assert.strictEqual(app.normalizeAcademy('  almeria  '), 'Almería');
assert.strictEqual(app.normalizeAcademy('GRANADA'), 'Granada');
assert.strictEqual(app.normalizeAcademy('Granada'), 'Granada');
assert.strictEqual(app.normalizeAcademy(''), '');
assert.strictEqual(app.normalizeAcademy(null), '');
assert.strictEqual(app.normalizeAcademy(undefined), '');
assert.strictEqual(app.normalizeAcademy('', 'Almería'), 'Almería');
console.log('✓ normalizeAcademy unifies Almeria/Almería, Granada, and empty fallbacks');

// matchToDb
const dbPayload1 = app.matchToDb({
  id: 'm-1',
  date: '2026-11-17',
  fighterAId: 'a1',
  fighterAName: 'Almería One',
  fighterAAcademy: 'Almeria',
  fighterBId: 'g1',
  fighterBName: 'Granada One',
  fighterBAcademy: 'Granada',
  result: 'VICTORY_A',
  pointsA: 3,
  pointsB: 0,
  winner: 'Almería One',
  scoreA: 3,
  scoreB: 1,
  monthKey: '112026'
});
assert.strictEqual(dbPayload1.fighter_a_academy, 'Almería');
assert.strictEqual(dbPayload1.fighter_b_academy, 'Granada');

const dbPayloadEmpty = app.matchToDb({
  id: 'm-2',
  date: '2026-11-17',
  fighterAId: 'a1',
  fighterAName: 'A',
  fighterBId: 'g1',
  fighterBName: 'B',
  result: 'DRAW',
  winner: 'Empate'
});
assert.strictEqual(dbPayloadEmpty.fighter_a_academy, '', 'Undefined fighterAAcademy must serialize as empty string, not "undefined"');
assert.strictEqual(dbPayloadEmpty.fighter_b_academy, '', 'Undefined fighterBAcademy must serialize as empty string, not "undefined"');
console.log('✓ matchToDb maps fighter_a_academy and fighter_b_academy safely');

// matchFromDb
const fromDb1 = app.matchFromDb({
  id: 'm-1',
  date: '2026-11-17',
  fighter_a_id: 'a2',
  fighter_a_name: 'Almería Legacy',
  fighter_a_academy: 'Almeria',
  fighter_b_id: 'g1',
  fighter_b_name: 'Granada One',
  fighter_b_academy: 'Granada',
  result: 'VICTORY_B',
  points_a: 0,
  points_b: 3,
  winner: 'Granada One',
  score_a: 1,
  score_b: 3,
  month_key: '112026'
});
assert.strictEqual(fromDb1.fighterAAcademy, 'Almería');
assert.strictEqual(fromDb1.fighterBAcademy, 'Granada');

const fromDbLegacy = app.matchFromDb({
  id: 'm-legacy',
  date: '2026-10-01',
  fighter_a_id: 'g1',
  fighter_a_name: 'Granada One',
  fighter_a_academy: '',
  fighter_b_id: 'a1',
  fighter_b_name: 'Almería One',
  fighter_b_academy: null,
  result: 'VICTORY_A',
  winner: 'Granada One'
});
assert.strictEqual(fromDbLegacy.fighterAAcademy, '', 'Legacy empty DB academy must remain "" so resolveMatchAcademies can fall back');
assert.strictEqual(fromDbLegacy.fighterBAcademy, '', 'Legacy null DB academy must remain "" so resolveMatchAcademies can fall back');
console.log('✓ matchFromDb maps fighterAAcademy/fighterBAcademy and preserves empty legacy rows');

// resolveMatchAcademies
assert.deepStrictEqual(
  app.resolveMatchAcademies({ fighterAId: 'a1', fighterBId: 'g1', fighterAAcademy: 'Granada', fighterBAcademy: 'Almeria' }),
  { fighterAAcademy: 'Granada', fighterBAcademy: 'Almería' },
  'Explicit match academies should take precedence and normalize'
);
assert.deepStrictEqual(
  app.resolveMatchAcademies({ fighterAId: 'g1', fighterBId: 'a2', fighterAAcademy: '', fighterBAcademy: undefined }),
  { fighterAAcademy: 'Granada', fighterBAcademy: 'Almería' },
  'Empty match academies must fall back to this.fencers'
);
assert.deepStrictEqual(
  app.resolveMatchAcademies({ fighterAId: 'u1', fighterBId: 'deleted-id', fighterAAcademy: '', fighterBAcademy: '' }),
  { fighterAAcademy: 'Almería', fighterBAcademy: '' },
  'Known fencer with empty academy defaults to Almería; unknown fencer resolves cleanly to ""'
);
console.log('✓ resolveMatchAcademies resolves explicit and legacy this.fencers fallback academies');

// --- SUITE 3: saveCombat & finishAndSaveLiveCombat ---
let upserts = [];
const mockSupabase = {
  from(table) {
    return {
      upsert(payload) {
        upserts.push({ table, payload });
        return Promise.resolve({ error: null });
      }
    };
  }
};

async function testCombatRecording() {
  console.log('\n--- SUITE 3: saveCombat & finishAndSaveLiveCombat ---');
  const recApp = createApp({
    fencers: [
      { id: 'a1', name: 'Almería Fencer', academy: 'Almeria', rank: 'Inizziato', color: 'cyan' },
      { id: 'g1', name: 'Granada Fencer', academy: 'Granada', rank: 'Novizio', color: 'emerald' }
    ]
  });
  recApp.supabase = mockSupabase;

  // Test saveCombat
  upserts = [];
  getOrCreateMockElement('fighterASelect', 'select').value = 'a1';
  getOrCreateMockElement('fighterBSelect', 'select').value = 'g1';
  getOrCreateMockElement('duelDateInput', 'input').value = '2026-11-17';
  getOrCreateMockElement('duelWeaponInput', 'input').value = 'Sable';
  recApp.scoreA = 3;
  recApp.scoreB = 1;

  await recApp.saveCombat();

  assert.strictEqual(recApp.matches.length, 1);
  assert.strictEqual(recApp.matches[0].fighterAAcademy, 'Almería');
  assert.strictEqual(recApp.matches[0].fighterBAcademy, 'Granada');
  assert.strictEqual(upserts.length, 1);
  assert.strictEqual(upserts[0].table, 'matches');
  assert.strictEqual(upserts[0].payload.fighter_a_academy, 'Almería');
  assert.strictEqual(upserts[0].payload.fighter_b_academy, 'Granada');
  console.log('✓ saveCombat stores fighterAAcademy/fighterBAcademy and syncs to Supabase');

  // Test finishAndSaveLiveCombat
  recApp.matches = [];
  upserts = [];
  recApp.liveFighterAId = 'g1';
  recApp.liveFighterBId = 'a1';
  recApp.liveScoreA = 2;
  recApp.liveScoreB = 3;
  recApp.timerRunning = false;

  await recApp.finishAndSaveLiveCombat();

  assert.strictEqual(recApp.matches.length, 1);
  assert.strictEqual(recApp.matches[0].fighterAAcademy, 'Granada');
  assert.strictEqual(recApp.matches[0].fighterBAcademy, 'Almería');
  assert.strictEqual(upserts.length, 1);
  assert.strictEqual(upserts[0].table, 'matches');
  assert.strictEqual(upserts[0].payload.fighter_a_academy, 'Granada');
  assert.strictEqual(upserts[0].payload.fighter_b_academy, 'Almería');
  console.log('✓ finishAndSaveLiveCombat stores fighterAAcademy/fighterBAcademy and syncs to Supabase');
}

// --- SUITE 4: calculateStandings Option B ---
console.log('\n--- SUITE 4: calculateStandings Option B (all / Almería / Granada) ---');

const optionBFencers = [
  { id: 'a1', name: 'Almería Alpha', academy: 'Almería', rank: 'Inizziato', color: 'cyan' },
  { id: 'a2', name: 'Almería Beta', academy: 'Almeria', rank: 'Inizziato', color: 'cyan' },
  { id: 'g1', name: 'Granada Alpha', academy: 'Granada', rank: 'Inizziato', color: 'emerald' },
  { id: 'g2', name: 'Granada Beta', academy: 'Granada', rank: 'Novizio', color: 'emerald' }
];
const optionBMatches = [
  { id: 'm1', fighterAId: 'a1', fighterBId: 'a2', fighterAAcademy: 'Almería', fighterBAcademy: 'Almería', result: 'VICTORY_A', scoreA: 3, scoreB: 1 },
  { id: 'm2', fighterAId: 'g1', fighterBId: 'g2', fighterAAcademy: 'Granada', fighterBAcademy: 'Granada', result: 'VICTORY_A', scoreA: 3, scoreB: 2 },
  { id: 'm3', fighterAId: 'a1', fighterBId: 'g1', fighterAAcademy: 'Almería', fighterBAcademy: 'Granada', result: 'VICTORY_B', scoreA: 1, scoreB: 3 },
  { id: 'm4', fighterAId: 'a2', fighterBId: 'g2', fighterAAcademy: 'Almería', fighterBAcademy: 'Granada', result: 'DRAW', scoreA: 2, scoreB: 2 }
];

const standingsApp = createApp({ fencers: optionBFencers, matches: optionBMatches });

// Mixto ('all')
const allStandings = standingsApp.calculateStandings('all');
assert.strictEqual(allStandings.length, 4);
assert.strictEqual(allStandings[0].fencer.id, 'g1');
assert.strictEqual(allStandings[0].points, 6);
assert.strictEqual(allStandings[0].matchesPlayed, 2);

// Almería (Option B: only a1, a2 shown, cross-academy m3 & m4 counted)
const almeriaStandings = standingsApp.calculateStandings('Almería');
assert.deepStrictEqual(almeriaStandings.map(s => s.fencer.id), ['a1', 'a2']);
const a1Stats = almeriaStandings.find(s => s.fencer.id === 'a1');
const a2Stats = almeriaStandings.find(s => s.fencer.id === 'a2');
assert.strictEqual(a1Stats.matchesPlayed, 2);
assert.strictEqual(a1Stats.won, 1);
assert.strictEqual(a1Stats.lost, 1);
assert.strictEqual(a1Stats.points, 3);
assert.strictEqual(a1Stats.pointsFor, 4);
assert.strictEqual(a1Stats.pointsAgainst, 4);
assert.strictEqual(a1Stats.diff, 0);
assert.strictEqual(a2Stats.matchesPlayed, 2);
assert.strictEqual(a2Stats.drawn, 1);
assert.strictEqual(a2Stats.lost, 1);
assert.strictEqual(a2Stats.points, 1);
assert.strictEqual(a2Stats.diff, -2);

// Unaccented 'Almeria' filter normalizes cleanly
assert.deepStrictEqual(standingsApp.calculateStandings('Almeria').map(s => s.fencer.id), ['a1', 'a2']);

// Granada (Option B: only g1, g2 shown, cross-academy m3 & m4 counted)
const granadaStandings = standingsApp.calculateStandings('Granada');
assert.deepStrictEqual(granadaStandings.map(s => s.fencer.id), ['g1', 'g2']);
const g1Stats = granadaStandings.find(s => s.fencer.id === 'g1');
const g2Stats = granadaStandings.find(s => s.fencer.id === 'g2');
assert.strictEqual(g1Stats.matchesPlayed, 2);
assert.strictEqual(g1Stats.won, 2);
assert.strictEqual(g1Stats.points, 6);
assert.strictEqual(g1Stats.pointsFor, 6);
assert.strictEqual(g1Stats.pointsAgainst, 3);
assert.strictEqual(g1Stats.diff, 3);
assert.strictEqual(g2Stats.matchesPlayed, 2);
assert.strictEqual(g2Stats.drawn, 1);
assert.strictEqual(g2Stats.lost, 1);
assert.strictEqual(g2Stats.points, 1);
assert.strictEqual(g2Stats.diff, -1);

// Headless Object.create with undefined rankingAcademyFilter falls back to 'all'
const headlessApp = createApp({ fencers: optionBFencers, matches: optionBMatches });
headlessApp.rankingAcademyFilter = undefined;
assert.strictEqual(headlessApp.calculateStandings().length, 4);

// validateDuelForm ignores ranking filter ('Granada') and previews Almería fencers via calculateStandings('all')
standingsApp.rankingAcademyFilter = 'Granada';
getOrCreateMockElement('fighterASelect', 'select').value = 'a1';
getOrCreateMockElement('fighterBSelect', 'select').value = 'g1';
getOrCreateMockElement('saveDuelBtn', 'button');
getOrCreateMockElement('duelConflictBanner', 'div');
getOrCreateMockElement('duelConflictText', 'span');
const previewA = getOrCreateMockElement('fighterAStatsPreview', 'div');
const previewB = getOrCreateMockElement('fighterBStatsPreview', 'div');
standingsApp.validateDuelForm();
assert(previewA.textContent.includes('3 pts'), 'validateDuelForm must preview Almería fighter stats even when ranking filter is Granada');
assert(previewB.textContent.includes('6 pts'), 'validateDuelForm must preview Granada fighter stats');

console.log('✓ calculateStandings implements Option B cleanly and validateDuelForm stays global');

// --- SUITE 5: renderMonthlyMedals Filtering + Legacy this.fencers Fallback ---
console.log('\n--- SUITE 5: renderMonthlyMedals Filtering & Legacy Fallback ---');

const medalFencers = [
  { id: 'a1', name: 'Almería Scorer', academy: 'Almería', rank: 'Inizziato', color: 'cyan' },
  { id: 'a2', name: 'Almería Two', academy: 'Almería', rank: 'Inizziato', color: 'cyan' },
  { id: 'a3', name: 'Almería Three', academy: 'Almería', rank: 'Inizziato', color: 'cyan' },
  { id: 'g1', name: 'Granada Champion', academy: 'Granada', rank: 'Inizziato', color: 'emerald' },
  { id: 'g2', name: 'Granada Two', academy: 'Granada', rank: 'Inizziato', color: 'emerald' },
  { id: 'g3', name: 'Granada Three', academy: 'Granada', rank: 'Inizziato', color: 'emerald' }
];
const medalMatches = [
  // Intra-Almería high-scoring bouts (15 OHs for a1)
  { id: 'ma1', fighterAId: 'a1', fighterBId: 'a2', fighterAAcademy: 'Almería', fighterBAcademy: 'Almería', result: 'VICTORY_A', scoreA: 8, scoreB: 1, date: '2026-11-01', timestamp: '2026-11-01T10:00:00Z' },
  { id: 'ma2', fighterAId: 'a1', fighterBId: 'a3', fighterAAcademy: 'Almería', fighterBAcademy: 'Almería', result: 'VICTORY_A', scoreA: 7, scoreB: 1, date: '2026-11-02', timestamp: '2026-11-02T10:00:00Z' },
  // Granada bouts including a LEGACY cross-academy bout with NO stored academies
  { id: 'mg1', fighterAId: 'g1', fighterBId: 'g2', fighterAAcademy: '', fighterBAcademy: '', result: 'VICTORY_A', scoreA: 3, scoreB: 1, date: '2026-11-03', timestamp: '2026-11-03T10:00:00Z' },
  { id: 'mg2', fighterAId: 'g1', fighterBId: 'g3', fighterAAcademy: 'Granada', fighterBAcademy: 'Granada', result: 'VICTORY_A', scoreA: 3, scoreB: 2, date: '2026-11-04', timestamp: '2026-11-04T10:00:00Z' },
  { id: 'mg3-legacy-cross', fighterAId: 'g1', fighterBId: 'a1', fighterAAcademy: '', fighterBAcademy: '', result: 'VICTORY_A', scoreA: 4, scoreB: 0, date: '2026-11-05', timestamp: '2026-11-05T10:00:00Z' }
];

const medalsApp = createApp({ fencers: medalFencers, matches: medalMatches });
const medalsContainer = getOrCreateMockElement('monthlyMedalsSection', 'div');

let badgeCalls = [];
const originalCalcBadges = LeagueBadgesService.calculateMonthlyBadges.bind(LeagueBadgesService);
LeagueBadgesService.calculateMonthlyBadges = (matchesArg, fencersArg, monthKeyArg) => {
  badgeCalls.push({ matchesArg, fencersArg, monthKeyArg });
  return originalCalcBadges(matchesArg, fencersArg, monthKeyArg);
};

// Granada view
badgeCalls = [];
medalsApp.rankingAcademyFilter = 'Granada';
medalsApp.renderMonthlyMedals();

assert.strictEqual(badgeCalls.length, 1);
assert.deepStrictEqual(badgeCalls[0].fencersArg.map(f => f.id), ['g1', 'g2', 'g3'], 'Only Granada fencers must be passed to LeagueBadgesService');
assert.deepStrictEqual(
  badgeCalls[0].matchesArg.map(m => m.id),
  ['mg1', 'mg2', 'mg3-legacy-cross'],
  'Granada badges must include intra-Granada legacy matches and Granada vs Almería legacy cross-academy matches, excluding Almería-only matches'
);
assert(medalsContainer.innerHTML.includes('Granada Champion'), 'Granada Invicto / Top Scorer must display Granada Champion');
assert(!medalsContainer.innerHTML.includes('Almería Scorer'), 'Granada medals must never award a badge to an Almería fencer');

// Almería view
badgeCalls = [];
medalsApp.rankingAcademyFilter = 'Almería';
medalsApp.renderMonthlyMedals();

assert.strictEqual(badgeCalls.length, 1);
assert.deepStrictEqual(badgeCalls[0].fencersArg.map(f => f.id), ['a1', 'a2', 'a3']);
assert.deepStrictEqual(
  badgeCalls[0].matchesArg.map(m => m.id),
  ['ma1', 'ma2', 'mg3-legacy-cross'],
  'Almería badges must include Almería matches plus legacy cross-academy match involving a1'
);
assert(medalsContainer.innerHTML.includes('Almería Scorer'));
assert(!medalsContainer.innerHTML.includes('Granada Champion'));

// Mixto ('all') view
badgeCalls = [];
medalsApp.rankingAcademyFilter = 'all';
medalsApp.renderMonthlyMedals();

assert.strictEqual(badgeCalls[0].fencersArg.length, 6);
assert.strictEqual(badgeCalls[0].matchesArg.length, 5);

// Restore original
LeagueBadgesService.calculateMonthlyBadges = originalCalcBadges;
console.log('✓ renderMonthlyMedals filters fencers & matches via resolveMatchAcademies fallback');

// --- SUITE 6: Segmented Control UI & Re-render Wiring ---
console.log('\n--- SUITE 6: Segmented Control UI Click Wiring & Re-rendering ---');

const uiApp = createApp({ fencers: medalFencers, matches: medalMatches });
const podiumEl = getOrCreateMockElement('podiumContainer', 'div');
const tableBodyEl = getOrCreateMockElement('rankingTableBody', 'tbody');
getOrCreateMockElement('rankingSearchInput', 'input').value = '';

uiApp.setupEventListeners();
uiApp.renderRanking();
uiApp.renderMonthlyMedals();

// Initial state: Mixto active
assert.strictEqual(btnMixto.getAttribute('aria-pressed'), 'true');
assert.strictEqual(btnAlmeria.getAttribute('aria-pressed'), 'false');
assert.strictEqual(btnGranada.getAttribute('aria-pressed'), 'false');
assert(tableBodyEl.innerHTML.includes('Almería Scorer'));
assert(tableBodyEl.innerHTML.includes('Granada Champion'));

// Click Granada
btnGranada.trigger('click');
assert.strictEqual(uiApp.rankingAcademyFilter, 'Granada');
assert.strictEqual(btnMixto.getAttribute('aria-pressed'), 'false');
assert.strictEqual(btnAlmeria.getAttribute('aria-pressed'), 'false');
assert.strictEqual(btnGranada.getAttribute('aria-pressed'), 'true');
assert(btnGranada.className.includes('bg-atlasAccent/20'), 'Active Granada pill must receive active highlight class');
assert(!btnMixto.className.includes('bg-atlasAccent/20'), 'Inactive Mixto pill must lose active highlight class');
assert(podiumEl.innerHTML.includes('Granada Champion'), 'Podium must update to Granada fencers');
assert(!podiumEl.innerHTML.includes('Almería Scorer'), 'Podium must exclude Almería fencers in Granada view');
assert(tableBodyEl.innerHTML.includes('Granada Champion'));
assert(!tableBodyEl.innerHTML.includes('Almería Scorer'));
assert(medalsContainer.innerHTML.includes('Granada Champion'));
assert(!medalsContainer.innerHTML.includes('Almería Scorer'));

// Click Almería
btnAlmeria.trigger('click');
assert.strictEqual(uiApp.rankingAcademyFilter, 'Almería');
assert.strictEqual(btnAlmeria.getAttribute('aria-pressed'), 'true');
assert.strictEqual(btnGranada.getAttribute('aria-pressed'), 'false');
assert(podiumEl.innerHTML.includes('Almería Scorer'));
assert(!podiumEl.innerHTML.includes('Granada Champion'));
assert(tableBodyEl.innerHTML.includes('Almería Scorer'));
assert(!tableBodyEl.innerHTML.includes('Granada Champion'));
assert(medalsContainer.innerHTML.includes('Almería Scorer'));
assert(!medalsContainer.innerHTML.includes('Granada Champion'));

// Click Mixto
btnMixto.trigger('click');
assert.strictEqual(uiApp.rankingAcademyFilter, 'all');
assert.strictEqual(btnMixto.getAttribute('aria-pressed'), 'true');
assert(tableBodyEl.innerHTML.includes('Almería Scorer'));
assert(tableBodyEl.innerHTML.includes('Granada Champion'));

// Edge case: Granada with < 3 fencers clears podium gracefully
uiApp.fencers = optionBFencers; // 2 Almería, 2 Granada
uiApp.matches = optionBMatches;
btnGranada.trigger('click');
assert.strictEqual(podiumEl.innerHTML, '', 'Podium must clear when selected academy has fewer than 3 fencers');
assert(tableBodyEl.innerHTML.includes('Granada Alpha'));
assert(!tableBodyEl.innerHTML.includes('Almería Alpha'));

// Edge case: Granada with 0 fencers shows friendly empty table state & En disputa medals
uiApp.fencers = optionBFencers.filter(f => f.academy !== 'Granada');
btnGranada.trigger('click');
assert.strictEqual(podiumEl.innerHTML, '');
assert(tableBodyEl.innerHTML.includes('No se han encontrado tiradores registrados.'));
assert(medalsContainer.innerHTML.includes('En disputa'));

console.log('✓ Segmented selector updates rankingAcademyFilter, ARIA/classes, Podium, Table, and Monthly Medals');

(async () => {
  await testCombatRecording();
  console.log('\n================================================================');
  console.log('ALL RANKING ACADEMY INTEGRATION & UNIT TESTS PASSED!');
  console.log('================================================================');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
