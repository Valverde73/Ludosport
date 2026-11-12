/**
 * Empirical Adversarial Challenger Test Suite
 * Milestone M1: Dashboard UI Refactor & Laser Theme Hardening
 * 
 * Executes live in Node.js runtime against app.js and badges.js.
 */

const fs = require('fs');
const path = require('path');
const { LeagueBadgesService } = require('./badges.js');

// Simple DOM Mock for Headless Execution
class MockElement {
  constructor(id, tagName = 'div') {
    this.id = id;
    this.tagName = tagName;
    this.innerHTML = '';
    this.value = '';
    this.attributes = {};
    this.classList = new Set();
    this.children = [];
  }

  setAttribute(name, val) {
    this.attributes[name] = String(val);
  }

  getAttribute(name) {
    return this.attributes[name] !== undefined ? this.attributes[name] : null;
  }

  addEventListener() {}
  removeEventListener() {}
}

const mockElements = {};
function getOrCreateMockElement(id) {
  if (!mockElements[id]) {
    mockElements[id] = new MockElement(id);
  }
  return mockElements[id];
}

global.window = global;
global.document = {
  getElementById: (id) => getOrCreateMockElement(id),
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.localStorage = {
  _store: {},
  getItem: (k) => global.localStorage._store[k] || null,
  setItem: (k, v) => { global.localStorage._store[k] = String(v); },
  removeItem: (k) => { delete global.localStorage._store[k]; }
};
global.LeagueBadgesService = LeagueBadgesService;

// Load LudoSportApp definition
let appSource = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
appSource = appSource.replace(
  /window\.addEventListener\('DOMContentLoaded'[\s\S]*$/,
  'module.exports = { LudoSportApp };'
);

const appModule = new module.constructor();
appModule._compile(appSource, 'app.js');
const { LudoSportApp } = appModule.exports;

// Create headless app instance bypassing browser-only init
function createHeadlessApp() {
  const instance = Object.create(LudoSportApp.prototype);
  instance.currentMonthKey = '112026';
  instance.isAdmin = false;
  instance.isTestMode = false;
  instance.fencers = [];
  instance.matches = [];
  instance.availableMonths = ['112026'];
  return instance;
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion Failed: ${message}`);
  } else {
    passedTests++;
    console.log(`  ✓ ${message}`);
  }
}

console.log('================================================================');
console.log('EMPIRICAL ADVERSARIAL STRESS TEST SUITE — MILESTONE M1');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// TEST SUITE 1: PODIUM ZERO-STATE VS ACTIVE STATE EDGE CASES
// -----------------------------------------------------------------------------
console.log('--- SUITE 1: Podium Zero-State vs Active State Edge Cases ---');

// Edge Case 1.1: 0 matches (Empty league start)
console.log('\n[Case 1.1] 0 Matches: 5 Fencers registered, 0 matches played');
{
  const app = createHeadlessApp();
  app.fencers = [
    { id: 'f-1', name: 'Mar Garcia', rank: 'Inizziato' },
    { id: 'f-2', name: 'Auri Haro', rank: 'Inizziato' },
    { id: 'f-3', name: 'Mario Ferrer', rank: 'Inizziato' },
    { id: 'f-4', name: 'Isa Liria', rank: 'Inizziato' },
    { id: 'f-5', name: 'Ulises Carmona', rank: 'Inizziato' }
  ];
  app.matches = [];

  const standings = app.calculateStandings();
  assert(standings.length === 5, 'Standings calculated for 5 fencers');
  assert(standings.every(s => s.won === 0 && s.points === 0), 'All fencers have 0 victories and 0 points');

  const podium = getOrCreateMockElement('podiumContainer');
  app.renderRanking();

  assert(podium.getAttribute('data-podium-state') === 'zero', 'Podium state attribute is "zero"');
  assert(!podium.innerHTML.includes('animate-bounce'), 'Zero-state does NOT contain animate-bounce');
  assert(!podium.innerHTML.includes('data-lucide="crown"'), 'Zero-state does NOT contain crown icon');
  assert(!podium.innerHTML.includes('pulse-laser-amber'), 'Zero-state does NOT contain pulse-laser-amber');
  assert(!podium.innerHTML.includes('podium-gold'), 'Zero-state does NOT contain podium-gold');
  assert(!podium.innerHTML.includes('from-amber-500'), 'Zero-state does NOT contain amber gradient');
  assert(podium.innerHTML.includes('bg-lsCard/60'), 'Zero-state uses attenuated bg-lsCard/60');
  assert(podium.innerHTML.includes('border-slate-800/80'), 'Zero-state uses attenuated border-slate-800/80');
  assert(podium.innerHTML.includes('0 pts &bull; 0V &bull; Dif +0'), 'Cards correctly display "0 pts • 0V • Dif +0"');
}

// Edge Case 1.2: Matches exist, but ALL are DRAWS (0 victories for everyone)
console.log('\n[Case 1.2] Matches exist, but ALL are DRAWS (0 victories for all fencers)');
{
  const app = createHeadlessApp();
  app.fencers = [
    { id: 'f-1', name: 'Mar Garcia', rank: 'Inizziato' },
    { id: 'f-2', name: 'Auri Haro', rank: 'Inizziato' },
    { id: 'f-3', name: 'Mario Ferrer', rank: 'Inizziato' },
    { id: 'f-4', name: 'Isa Liria', rank: 'Inizziato' }
  ];
  app.matches = [
    { id: 'm-1', fighterAId: 'f-1', fighterBId: 'f-2', result: 'DRAW', scoreA: 3, scoreB: 3 },
    { id: 'm-2', fighterAId: 'f-3', fighterBId: 'f-4', result: 'DRAW', scoreA: 2, scoreB: 2 },
    { id: 'm-3', fighterAId: 'f-1', fighterBId: 'f-3', result: 'DRAW', scoreA: 1, scoreB: 1 }
  ];

  const standings = app.calculateStandings();
  const f1 = standings.find(s => s.fencer.id === 'f-1');
  const f2 = standings.find(s => s.fencer.id === 'f-2');
  assert(f1.matchesPlayed === 2 && f1.drawn === 2 && f1.won === 0 && f1.points === 2, 'F1 has 2 points from 2 draws but 0 victories');
  assert(f2.matchesPlayed === 1 && f2.drawn === 1 && f2.won === 0 && f2.points === 1, 'F2 has 1 point from 1 draw but 0 victories');
  assert(standings.every(s => s.won === 0), 'All fencers strictly have 0 victories despite having points');

  const podium = getOrCreateMockElement('podiumContainer');
  app.renderRanking();

  // Requirement: Colors/highlights activate ONLY when at least one fencer registers >= 1 victory
  assert(podium.getAttribute('data-podium-state') === 'zero', 'Podium state remains strictly "zero" when all matches are draws');
  assert(!podium.innerHTML.includes('animate-bounce'), 'Podium does NOT show bouncing crown on draw-only league');
  assert(!podium.innerHTML.includes('data-lucide="crown"'), 'Podium does NOT show crown on draw-only league');
  assert(!podium.innerHTML.includes('podium-gold'), 'Podium does NOT show gold styling on draw-only league');
  assert(podium.innerHTML.includes('2 pts &bull; 0V &bull; Dif +0'), 'Leader card reflects 2 pts but 0V');
}

// Edge Case 1.3: Exactly 1 fencer registers 1 victory
console.log('\n[Case 1.3] 1 Fencer registers 1 victory (Dynamic Activation check)');
{
  const app = createHeadlessApp();
  app.fencers = [
    { id: 'f-1', name: 'Mar Garcia', rank: 'Inizziato' },
    { id: 'f-2', name: 'Auri Haro', rank: 'Inizziato' },
    { id: 'f-3', name: 'Mario Ferrer', rank: 'Inizziato' },
    { id: 'f-4', name: 'Isa Liria', rank: 'Inizziato' }
  ];
  app.matches = [
    { id: 'm-1', fighterAId: 'f-1', fighterBId: 'f-2', result: 'VICTORY_A', scoreA: 3, scoreB: 1 }
  ];

  const standings = app.calculateStandings();
  assert(standings[0].fencer.id === 'f-1', 'F1 is ranked #1');
  assert(standings[0].won === 1 && standings[0].points === 3, 'F1 has 1 victory and 3 points');

  const podium = getOrCreateMockElement('podiumContainer');
  app.renderRanking();

  assert(podium.getAttribute('data-podium-state') === 'active', 'Podium state switches dynamically to "active"');
  assert(podium.innerHTML.includes('podium-gold'), 'Active podium renders podium-gold');
  assert(podium.innerHTML.includes('pulse-laser-amber'), 'Active podium renders pulse-laser-amber');
  assert(podium.innerHTML.includes('data-lucide="crown"'), 'Active podium renders crown icon');
  assert(podium.innerHTML.includes('animate-bounce'), 'Active podium renders animate-bounce on crown');
  assert(podium.innerHTML.includes('w-12 h-12'), 'Active champion card has elevated w-12 h-12 avatar');
  assert(podium.innerHTML.includes('3 pts'), 'Champion card shows 3 pts');
  assert(podium.innerHTML.includes('1V &bull; Dif +2'), 'Champion card shows 1V • Dif +2');
}

// Edge Case 1.4: Fewer than 3 fencers in total (0, 1, 2 fencers)
console.log('\n[Case 1.4] Fewer than 3 fencers total: 0 fencers, 1 fencer, 2 fencers');
{
  const app = createHeadlessApp();
  const podium = getOrCreateMockElement('podiumContainer');
  const table = getOrCreateMockElement('rankingTableBody');

  // 1.4a: 0 fencers
  app.fencers = [];
  app.matches = [];
  app.renderRanking();
  assert(podium.innerHTML === '', 'Podium container is cleared empty with 0 fencers');
  assert(table.innerHTML.includes('No se han encontrado tiradores registrados'), 'Table shows friendly empty state for 0 fencers');

  // 1.4b: 1 fencer
  app.fencers = [{ id: 'f-1', name: 'Mar Garcia', rank: 'Inizziato' }];
  app.matches = [];
  app.renderRanking();
  assert(podium.innerHTML === '', 'Podium container is cleared empty with 1 fencer');
  assert(table.innerHTML.includes('Mar Garcia'), 'Table renders single fencer row without error');

  // 1.4c: 2 fencers with a match and victory
  app.fencers = [
    { id: 'f-1', name: 'Mar Garcia', rank: 'Inizziato' },
    { id: 'f-2', name: 'Auri Haro', rank: 'Inizziato' }
  ];
  app.matches = [
    { id: 'm-1', fighterAId: 'f-1', fighterBId: 'f-2', result: 'VICTORY_A', scoreA: 3, scoreB: 0 }
  ];
  app.renderRanking();
  assert(podium.innerHTML === '', 'Podium container is safely cleared empty with 2 fencers (< 3 fencers)');
  assert(!podium.innerHTML.includes('undefined'), 'Podium contains no "undefined" strings');
  assert(table.innerHTML.includes('Mar Garcia') && table.innerHTML.includes('Auri Haro'), 'Table renders both fencers correctly');
}

// -----------------------------------------------------------------------------
// TEST SUITE 2: MEDALLERO TEXT & WCAG CONTRAST STRESS TEST
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 2: Medallero Text & WCAG Contrast Stress Test ---');

// Exact W3C WCAG 2.1 Luminance and Contrast Formula
function channelLuminance(c255) {
  const c = c255 / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r, g, b) {
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

function contrastRatio(lum1, lum2) {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function compositeAlpha(fgR, fgG, fgB, alpha, bgR, bgG, bgB) {
  return [
    Math.round(fgR * alpha + bgR * (1 - alpha)),
    Math.round(fgG * alpha + bgG * (1 - alpha)),
    Math.round(fgB * alpha + bgB * (1 - alpha))
  ];
}

console.log('\n[Case 2.1] Mathematical WCAG 2.1 Contrast Calculations on Navy #0f172a');
{
  // Background: #0f172a (15, 23, 42)
  const [bgR, bgG, bgB] = [15, 23, 42];
  const bgLum = relativeLuminance(bgR, bgG, bgB);

  // text-white/70 (rgba(255, 255, 255, 0.70)) over #0f172a
  const [r70, g70, b70] = compositeAlpha(255, 255, 255, 0.70, bgR, bgG, bgB);
  const lum70 = relativeLuminance(r70, g70, b70);
  const cr70 = contrastRatio(lum70, bgLum);

  // text-white/60 (rgba(255, 255, 255, 0.60)) over #0f172a
  const [r60, g60, b60] = compositeAlpha(255, 255, 255, 0.60, bgR, bgG, bgB);
  const lum60 = relativeLuminance(r60, g60, b60);
  const cr60 = contrastRatio(lum60, bgLum);

  // Old buggy text-slate-500 (#64748b) over #0f172a
  const [oldR, oldG, oldB] = [100, 116, 139];
  const oldLum = relativeLuminance(oldR, oldG, oldB);
  const oldCR = contrastRatio(oldLum, bgLum);

  console.log(`    - Navy background (#0f172a) relative luminance: ${bgLum.toFixed(5)}`);
  console.log(`    - text-white/70 composite rgb(${r70},${g70},${b70}) luminance: ${lum70.toFixed(5)}, Contrast: ${cr70.toFixed(2)}:1`);
  console.log(`    - text-white/60 composite rgb(${r60},${g60},${b60}) luminance: ${lum60.toFixed(5)}, Contrast: ${cr60.toFixed(2)}:1`);
  console.log(`    - [Prior baseline] text-slate-500 rgb(100,116,139) Contrast: ${oldCR.toFixed(2)}:1`);

  assert(oldCR < 4.5, `Original text-slate-500 had contrast ${oldCR.toFixed(2)}:1 which FAILED WCAG AA 4.5:1`);
  assert(cr70 >= 4.5, `text-white/70 contrast ${cr70.toFixed(2)}:1 PASSES WCAG AA normal text (>= 4.5:1)`);
  assert(cr70 >= 7.0, `text-white/70 contrast ${cr70.toFixed(2)}:1 PASSES WCAG AAA normal text (>= 7.0:1)`);
  assert(cr60 >= 3.0, `text-white/60 contrast ${cr60.toFixed(2)}:1 PASSES WCAG AA non-text/icons (>= 3.0:1)`);
  assert(cr60 >= 4.5, `text-white/60 contrast ${cr60.toFixed(2)}:1 PASSES WCAG AA normal text (>= 4.5:1)`);
}

// Case 2.2: Badge titles of varying length (up to 30 chars)
console.log('\n[Case 2.2] Badge Titles of Varying Lengths (7 to 30 characters)');
{
  const app = createHeadlessApp();
  const medalsSection = getOrCreateMockElement('monthlyMedalsSection');

  const testTitles = [
    { len: 7, title: 'OH King' },
    { len: 15, title: 'Duelista Feroz' },
    { len: 17, title: 'Defensa de Hierro' },
    { len: 18, title: 'Racha de Victorias' },
    { len: 22, title: 'Máximo Anotador de OHs' },
    { len: 25, title: 'Tirador de Élite Galáct' },
    { len: 27, title: 'Especialista en Contrashock' },
    { len: 30, title: 'Gran Campeón de Sables Láser' }
  ];

  // Mock service returning badges with varying length titles
  window.LeagueBadgesService = {
    calculateMonthlyBadges: () => testTitles.map((t, idx) => ({
      id: `badge-${idx}`,
      title: t.title,
      emoji: '⚡',
      icon: 'zap',
      color: 'cyan',
      description: `Test description for ${t.title}`,
      hasWinner: false,
      emptyStateText: 'En disputa este mes'
    }))
  };

  app.renderMonthlyMedals();

  assert(medalsSection.innerHTML.includes('grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5'),
    'Container uses responsive grid (cols-1, sm:cols-2, md:cols-3)');

  // Verify each title is rendered with multi-line classes and title attribute
  testTitles.forEach(t => {
    assert(medalsSection.innerHTML.includes(`title="${t.title}"`),
      `Title ${t.len}ch ("${t.title}") has full title tooltip attribute`);
    assert(medalsSection.innerHTML.includes(t.title),
      `Title ${t.len}ch rendered in HTML output`);
  });

  // Verify CSS classes on badge-card and title
  assert(medalsSection.innerHTML.includes('whitespace-normal leading-tight line-clamp-2'),
    'All badge titles have whitespace-normal, leading-tight, and line-clamp-2');
  assert(!medalsSection.innerHTML.includes('font-display font-bold text-xs text-cyan-300 truncate'),
    'Badge titles do NOT have the old truncate class');
  assert(medalsSection.innerHTML.includes('flex flex-col justify-between'),
    'Badge cards use flex flex-col justify-between for stable vertical card grid alignment');
  assert(medalsSection.innerHTML.includes('text-white/70 italic'),
    'Empty state text rendered with text-white/70');
  assert(medalsSection.innerHTML.includes('text-white/60 shrink-0'),
    'Empty state clock icon rendered with text-white/60');
}

// -----------------------------------------------------------------------------
// TEST SUITE 3: TABLE METRICS STABILITY & DOCK CLEARANCE
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 3: Table Metrics Stability & Dock Clearance ---');

console.log('\n[Case 3.1] Table Metric Columns Geometry & Classes');
{
  const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const stylesCss = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
  const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

  // Verify <th> widths in index.html
  assert(indexHtml.includes('class="ranking-table w-full text-left border-separate border-spacing-0"'),
    'Table uses border-separate and border-spacing-0 for proper row box-shadow rendering');
  assert(indexHtml.includes('class="py-2.5 px-1.5 w-[38px] min-w-[38px] text-center"'),
    'Header metric columns PJ, V, E, D have fixed w-[38px] min-w-[38px] text-center');
  assert(indexHtml.includes('w-[46px] min-w-[46px] text-center'),
    'Header DIF column has fixed w-[46px] min-w-[46px] text-center');
  assert(indexHtml.includes('w-[48px] min-w-[48px] text-center'),
    'Header PTS column has fixed w-[48px] min-w-[48px] text-center');

  // Verify <td> widths in app.js
  assert(appJs.includes('w-[38px] min-w-[38px] text-center text-slate-400 font-combat text-xs font-semibold'),
    'app.js sets fixed 38px width on PJ td');
  assert(appJs.includes('w-[46px] min-w-[46px] text-center'),
    'app.js sets fixed 46px width on DIF td');
  assert(appJs.includes('w-[48px] min-w-[48px] text-center font-combat font-black text-sm text-cyan-300'),
    'app.js sets fixed 48px width on PTS td');

  // Verify tabular-nums in styles.css
  assert(stylesCss.includes('font-variant-numeric: tabular-nums'),
    'styles.css enforces tabular-nums on metric columns to prevent horizontal digit jitter');
}

console.log('\n[Case 3.2] Scroll Clearance & Dock Overlap Elimination');
{
  const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const stylesCss = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');

  assert(!indexHtml.includes('md:pb-10'), 'index.html does NOT contain the md:pb-10 reduction bug');
  assert(indexHtml.includes('pb-28 sm:pb-32'), 'index.html body has pb-28 sm:pb-32 clearance classes');
  assert(stylesCss.includes('padding-bottom: calc(112px + env(safe-area-inset-bottom, 0px)) !important;'),
    'styles.css enforces 112px bottom padding on body:not(.piste-mode)');
  assert(stylesCss.includes('body.piste-mode'), 'Fullscreen piste-mode reset rules are preserved');
}

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`ALL TESTS PASSED: ${passedTests} / ${totalTests} assertions`);
console.log('STATUS: VERIFIED & EMPIRICALLY REPRODUCED');
console.log('================================================================');
