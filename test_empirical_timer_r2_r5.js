/**
/**
 * Empirical Adversarial Challenger Test Suite
 * Milestone M1: Marcador en Directo - Timer Logic (R2) & Accidental Touch Prevention (R5)
 * 
 * Executes live in Node.js runtime against app.js.
 * Tests real state transitions, interval timers, DOM bindings, and defensive guards.
 */

const fs = require('fs');
const path = require('path');

// Simple DOM Mock for Headless Execution
class ClassListMock {
  constructor() {
    this._set = new Set();
  }
  add(...tokens) {
    for (const t of tokens) this._set.add(t);
  }
  remove(...tokens) {
    for (const t of tokens) this._set.delete(t);
  }
  contains(token) {
    return this._set.has(token);
  }
  toggle(token, force) {
    if (force === true) {
      this._set.add(token);
      return true;
    } else if (force === false) {
      this._set.delete(token);
      return false;
    }
    if (this._set.has(token)) {
      this._set.delete(token);
      return false;
    } else {
      this._set.add(token);
      return true;
    }
  }
  has(token) {
    return this._set.has(token);
  }
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
    this.classList = new ClassListMock();
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

// Global DOM registry
const mockElements = {};
function getOrCreateMockElement(id, tagName = 'div') {
  if (!mockElements[id]) {
    mockElements[id] = new MockElement(id, tagName);
  }
  return mockElements[id];
}

global.window = global;
global.document = {
  getElementById: (id) => getOrCreateMockElement(id),
  createElement: (tag) => new MockElement('mock-' + Date.now(), tag),
  addEventListener: () => {},
  removeEventListener: () => {}
};

global.localStorage = {
  _store: {},
  getItem: (k) => global.localStorage._store[k] || null,
  setItem: (k, v) => { global.localStorage._store[k] = String(v); },
  removeItem: (k) => { delete global.localStorage._store[k]; }
};

global.confirm = () => true;
global.alert = () => {};

// Load and compile LudoSportApp from app.js
let appSource = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
appSource = appSource.replace(
  /window\.addEventListener\('DOMContentLoaded'[\s\S]*$/,
  'module.exports = { LudoSportApp };'
);

const appModule = new module.constructor();
appModule._compile(appSource, 'app.js');
const { LudoSportApp } = appModule.exports;

// Headless app factory
function createHeadlessLiveApp() {
  const instance = Object.create(LudoSportApp.prototype);
  // Constructor state
  instance.currentMonthKey = '112026';
  instance.isAdmin = false;
  instance.isTestMode = false;
  instance.fencers = [
    { id: 'f-1', name: 'Mar Garcia', rank: 'Inizziato', color: 'cyan', joinedAt: '2026-01-01', photoUrl: '' },
    { id: 'f-2', name: 'Auri Haro', rank: 'Inizziato', color: 'cyan', joinedAt: '2026-01-01', photoUrl: '' },
    { id: 'f-3', name: 'Mario Ferrer', rank: 'Inizziato', color: 'cyan', joinedAt: '2026-01-01', photoUrl: '' },
    { id: 'f-10', name: 'Saúl García-Abadillo', rank: 'Inizziato', color: 'cyan', joinedAt: '2026-01-01', photoUrl: '' }
  ];
  instance.matches = [];
  instance.availableMonths = ['112026'];
  instance.liveFighterAId = 'f-1';
  instance.liveFighterBId = 'f-2';
  instance.liveScoreA = 0;
  instance.liveScoreB = 0;
  instance.timerBaseSeconds = 90;
  instance.timerSeconds = 90;
  instance.timerInterval = null;
  instance.timerRunning = false;
  instance.timerStarted = false;
  instance.isSoundEnabled = false; // mute beeps in test runner
  instance.lastToast = null;

  instance.showToast = function(msg, type = 'emerald') {
    instance.lastToast = { msg, type };
  };

  instance.playBeep = function() {};
  instance.findExistingMatch = function(aId, bId) {
    return instance.matches.find(m =>
      (m.fighterAId === aId && m.fighterBId === bId) ||
      (m.fighterAId === bId && m.fighterBId === aId)
    );
  };

  // Reset mock elements before use
  for (const k in mockElements) {
    delete mockElements[k];
  }

  return instance;
}

// Test Runner utilities
let totalAssertions = 0;
let passedAssertions = 0;
const failureList = [];

function assert(condition, message) {
  totalAssertions++;
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    failureList.push(message);
    throw new Error(`Assertion Failed: ${message}`);
  } else {
    passedAssertions++;
    console.log(`  ✓ ${message}`);
  }
}

console.log('================================================================');
console.log('EMPIRICAL ADVERSARIAL STRESS TEST: MARCADOR EN DIRECTO (R2 & R5)');
console.log('================================================================\n');

// =============================================================================
// SUITE 1: Constructor Baseline & Initial State Machine Invariants
// =============================================================================
console.log('--- SUITE 1: Constructor Baseline & Initial State Machine Invariants ---');
{
  const app = createHeadlessLiveApp();
  app.updateLiveTimerDisplay();

  const display = getOrCreateMockElement('liveTimerDisplay');
  const status = getOrCreateMockElement('liveTimerStatusText');
  const toggleBtn = getOrCreateMockElement('liveTimerToggleBtn');
  const actionLabel = getOrCreateMockElement('liveTimerActionLabel');
  const finishBtn = getOrCreateMockElement('liveFinishAndSaveBtn');

  assert(app.timerBaseSeconds === 90, 'Constructor timerBaseSeconds is strictly 90');
  assert(app.timerSeconds === 90, 'Constructor timerSeconds is strictly 90');
  assert(app.timerRunning === false, 'Constructor timerRunning is false');
  assert(app.timerStarted === false, 'Constructor timerStarted is false');
  assert(display.textContent === '01:30', 'Initial display formats 90s as "01:30"');
  assert(status.textContent === 'Listo para iniciar', 'Initial status text is strictly "Listo para iniciar"');
  assert(!status.textContent.includes('pausa'), 'Initial status text NEVER contains "pausa" (glitch eliminated)');
  assert(actionLabel.textContent === 'Iniciar', 'Initial action label is "Iniciar"');
  assert(toggleBtn.className.includes('w-full'), 'Toggle button includes w-full (100% row width)');
  assert(!toggleBtn.className.includes('flex-1'), 'Toggle button does NOT have flex-1');
  assert(finishBtn.disabled === false, 'Finalizar y Guardar button is enabled (disabled=false) initially');
}

// =============================================================================
// SUITE 2: Unbounded Cumulative Addition (+30s) Stress Testing
// =============================================================================
console.log('\n--- SUITE 2: Unbounded Cumulative Addition (+30s) Stress Testing ---');
{
  const app = createHeadlessLiveApp();
  const display = getOrCreateMockElement('liveTimerDisplay');
  app.updateLiveTimerDisplay();

  // Test 2.1: Single +30s addition
  app.addLiveTimerSeconds(30);
  assert(app.timerSeconds === 120, '1x +30s: timerSeconds is 120');
  assert(display.textContent === '02:00', '1x +30s: display shows "02:00"');

  // Test 2.2: Second +30s addition
  app.addLiveTimerSeconds(30);
  assert(app.timerSeconds === 150, '2x +30s: timerSeconds is 150');
  assert(display.textContent === '02:30', '2x +30s: display shows "02:30"');

  // Test 2.3: 5x +30s additions
  for (let i = 0; i < 5; i++) app.addLiveTimerSeconds(30);
  assert(app.timerSeconds === 300, '7x +30s: timerSeconds reaches 300 (05:00)');
  assert(display.textContent === '05:00', '7x +30s: display shows "05:00"');

  // Test 2.4: 50x rapid cumulative additions stress test
  for (let i = 0; i < 50; i++) app.addLiveTimerSeconds(30);
  assert(app.timerSeconds === 1800, '57x +30s: timerSeconds reaches 1800 (30 minutes)');
  assert(display.textContent === '30:00', '57x +30s: display shows "30:00" without bounds overflow');

  // Test 2.5: Default parameter verification
  app.timerSeconds = 90;
  app.addLiveTimerSeconds(); // extra defaults to 30
  assert(app.timerSeconds === 120, 'Default addLiveTimerSeconds() extra parameter defaults strictly to 30');

  // Test 2.6: Floor protection against negative decrement below 90
  app.timerSeconds = 90;
  app.addLiveTimerSeconds(-30);
  assert(app.timerSeconds === 90, 'addLiveTimerSeconds(-30) clamped at floor 90s (does not drop to 60)');

  app.timerSeconds = 120;
  app.addLiveTimerSeconds(-60);
  assert(app.timerSeconds === 90, 'addLiveTimerSeconds(-60) clamped at floor 90s (does not drop to 60)');
}

// =============================================================================
// SUITE 3: Minimum Duration Floor Enforcement (setRoundDuration)
// =============================================================================
console.log('\n--- SUITE 3: Minimum Duration Floor Enforcement (setRoundDuration) ---');
{
  const app = createHeadlessLiveApp();
  const display = getOrCreateMockElement('liveTimerDisplay');

  // Valid durations >= 90
  app.setRoundDuration(120);
  assert(app.timerBaseSeconds === 120, 'setRoundDuration(120) sets base to 120');
  assert(app.timerSeconds === 120, 'setRoundDuration(120) updates timerSeconds to 120');
  assert(display.textContent === '02:00', 'Display shows "02:00"');

  app.setRoundDuration(180);
  assert(app.timerBaseSeconds === 180, 'setRoundDuration(180) sets base to 180');
  assert(display.textContent === '03:00', 'Display shows "03:00"');

  // Adversarial values < 90
  app.setRoundDuration(60);
  assert(app.timerBaseSeconds === 90, 'setRoundDuration(60) is clamped to minimum 90s');
  assert(app.timerSeconds === 90, 'timerSeconds clamped to 90s');

  app.setRoundDuration(0);
  assert(app.timerBaseSeconds === 90, 'setRoundDuration(0) is clamped to minimum 90s');

  app.setRoundDuration(-120);
  assert(app.timerBaseSeconds === 90, 'setRoundDuration(-120) is clamped to minimum 90s');

  // Non-numeric / hostile inputs
  app.setRoundDuration('invalid');
  assert(app.timerBaseSeconds === 90, 'setRoundDuration("invalid") defaults safely to 90s');

  app.setRoundDuration(NaN);
  assert(app.timerBaseSeconds === 90, 'setRoundDuration(NaN) defaults safely to 90s');

  app.setRoundDuration(null);
  assert(app.timerBaseSeconds === 90, 'setRoundDuration(null) defaults safely to 90s');

  // Mid-combat protection: when timer is started, setRoundDuration changes base for future, but does NOT mutate active round
  app.timerSeconds = 45;
  app.timerStarted = true;
  app.setRoundDuration(150);
  assert(app.timerBaseSeconds === 150, 'timerBaseSeconds updated to 150 for future bouts');
  assert(app.timerSeconds === 45, 'Active combat timerSeconds remains at 45 (not overwritten mid-bout)');
}

// =============================================================================
// SUITE 4: Accidental Touch Prevention (R5) Across Full Lifecycle
// =============================================================================
console.log('\n--- SUITE 4: Accidental Touch Prevention (R5) Across Full Lifecycle ---');
{
  const app = createHeadlessLiveApp();
  const finishBtn = getOrCreateMockElement('liveFinishAndSaveBtn');
  const actionLabel = getOrCreateMockElement('liveTimerActionLabel');
  const status = getOrCreateMockElement('liveTimerStatusText');
  const btnAInc = getOrCreateMockElement('liveBtnScoreAInc');
  const btnADec = getOrCreateMockElement('liveBtnScoreADec');
  const btnBInc = getOrCreateMockElement('liveBtnScoreBInc');
  const btnBDec = getOrCreateMockElement('liveBtnScoreBDec');
  const scoreBtns = [btnAInc, btnADec, btnBInc, btnBDec];

  // 4.1: Initial State
  app.updateLiveTimerDisplay();
  assert(finishBtn.disabled === false, 'State 1 (Fresh): finishBtn.disabled is false');
  assert(app.timerRunning === false, 'State 1 (Fresh): timerRunning is false');
  scoreBtns.forEach(btn => assert(btn.disabled === false, `State 1 (Fresh): ${btn.id}.disabled is false`));

  // 4.2: Start Timer
  app.startLiveTimer();
  assert(app.timerRunning === true, 'State 2 (Running): timerRunning is true');
  assert(finishBtn.disabled === true, 'State 2 (Running): finishBtn.disabled is strictly TRUE');
  scoreBtns.forEach(btn => assert(btn.disabled === true, `State 2 (Running): ${btn.id}.disabled is strictly TRUE`));
  assert(actionLabel.textContent === 'Pausar', 'State 2 (Running): actionLabel is "Pausar"');
  assert(status.textContent === 'Combate en curso', 'State 2 (Running): status is "Combate en curso"');

  // 4.3: Pause Timer
  app.pauseLiveTimer();
  assert(app.timerRunning === false, 'State 3 (Paused): timerRunning is false');
  assert(finishBtn.disabled === false, 'State 3 (Paused): finishBtn.disabled is restored to FALSE');
  scoreBtns.forEach(btn => assert(btn.disabled === false, `State 3 (Paused): ${btn.id}.disabled is restored to FALSE`));
  assert(actionLabel.textContent === 'Iniciar', 'State 3 (Paused): actionLabel reverts to "Iniciar"');
  assert(status.textContent === 'Combate en pausa', 'State 3 (Paused): status is "Combate en pausa"');

  // 4.4: Resume Timer
  app.startLiveTimer();
  assert(app.timerRunning === true, 'State 4 (Resumed): timerRunning is true');
  assert(finishBtn.disabled === true, 'State 4 (Resumed): finishBtn.disabled is strictly TRUE');
  scoreBtns.forEach(btn => assert(btn.disabled === true, `State 4 (Resumed): ${btn.id}.disabled is strictly TRUE`));

  // 4.5: Reset Timer while running
  app.resetLiveTimer();
  assert(app.timerRunning === false, 'State 5 (Reset from running): timerRunning is false');
  assert(app.timerStarted === false, 'State 5 (Reset from running): timerStarted is reset to false');
  assert(app.timerSeconds === 90, 'State 5 (Reset from running): timerSeconds reset to 90');
  assert(finishBtn.disabled === false, 'State 5 (Reset from running): finishBtn.disabled is FALSE');
  scoreBtns.forEach(btn => assert(btn.disabled === false, `State 5 (Reset from running): ${btn.id}.disabled is FALSE`));
  assert(status.textContent === 'Listo para iniciar', 'State 5 (Reset from running): status is "Listo para iniciar"');

  // 4.6: +30s added while paused
  app.addLiveTimerSeconds(30);
  assert(finishBtn.disabled === false, 'State 6 (+30s paused): finishBtn.disabled remains false');
  scoreBtns.forEach(btn => assert(btn.disabled === false, `State 6 (+30s paused): ${btn.id}.disabled remains false`));

  // 4.7: +30s added while running
  app.startLiveTimer();
  app.addLiveTimerSeconds(30);
  assert(app.timerRunning === true, 'State 7 (+30s running): timer is still running');
  assert(finishBtn.disabled === true, 'State 7 (+30s running): finishBtn.disabled remains strictly TRUE');
  scoreBtns.forEach(btn => assert(btn.disabled === true, `State 7 (+30s running): ${btn.id}.disabled remains strictly TRUE`));
  app.pauseLiveTimer();
}

// =============================================================================
// SUITE 5: Defensive Guard in finishAndSaveLiveCombat (R5)
// =============================================================================
console.log('\n--- SUITE 5: Defensive Guard in finishAndSaveLiveCombat (R5) ---');
{
  const app = createHeadlessLiveApp();
  app.liveFighterAId = 'f-1';
  app.liveFighterBId = 'f-2';
  app.liveScoreA = 3;
  app.liveScoreB = 1;

  // Test 5.1: Adversarial call to finishAndSaveLiveCombat while timer is RUNNING
  app.startLiveTimer();
  assert(app.timerRunning === true, 'Timer is running before save attempt');

  const matchCountBefore = app.matches.length;
  app.finishAndSaveLiveCombat(); // Synchronous part should abort immediately

  assert(app.matches.length === matchCountBefore, 'Match was NOT saved while timer was running (aborted)');
  assert(app.lastToast !== null, 'Warning toast was triggered');
  assert(app.lastToast.msg.includes('Pausa o detén el cronómetro'), 'Toast message instructs user to pause timer');
  assert(app.lastToast.type === 'amber', 'Toast type is warning "amber"');
  assert(app.timerRunning === true, 'Timer is still running uninterrupted after aborted save');

  // Test 5.2: Legitimate save when PAUSED
  app.pauseLiveTimer();
  assert(app.timerRunning === false, 'Timer is paused');

  app.finishAndSaveLiveCombat();
  assert(app.matches.length === matchCountBefore + 1, 'Match successfully saved when timer is paused');
  assert(app.matches[0].fighterAId === 'f-1', 'Match has correct fighter A');
  assert(app.matches[0].fighterBId === 'f-2', 'Match has correct fighter B');
  assert(app.matches[0].scoreA === 3 && app.matches[0].scoreB === 1, 'Match scores correctly recorded');
  assert(app.liveScoreA === 0 && app.liveScoreB === 0, 'Live board scores reset after saving');
}

// =============================================================================
// SUITE 6: Rapid Toggle & High-Frequency Stress Test
// =============================================================================
console.log('\n--- SUITE 6: Rapid Toggle & High-Frequency Stress Test ---');
{
  const app = createHeadlessLiveApp();
  const finishBtn = getOrCreateMockElement('liveFinishAndSaveBtn');

  // Rapidly toggle timer 200 times
  let expectedRunning = false;
  for (let i = 0; i < 200; i++) {
    app.toggleLiveTimer();
    expectedRunning = !expectedRunning;

    assert(app.timerRunning === expectedRunning, `Toggle #${i+1}: timerRunning matches expected ${expectedRunning}`);
    assert(finishBtn.disabled === expectedRunning, `Toggle #${i+1}: finishBtn.disabled exactly mirrors timerRunning (${expectedRunning})`);
    if (expectedRunning) {
      assert(app.timerInterval !== null, `Toggle #${i+1}: interval is active`);
    } else {
      assert(app.timerInterval === null, `Toggle #${i+1}: interval is cleared`);
    }
  }

  // Ensure timer is cleanly paused at end
  if (app.timerRunning) app.pauseLiveTimer();
  assert(app.timerRunning === false, 'Timer cleanly paused after 200 toggles');
  assert(finishBtn.disabled === false, 'finishBtn.disabled is false after toggles');

  // Idempotency: multiple startLiveTimer calls in a row
  app.startLiveTimer();
  const firstInterval = app.timerInterval;
  app.startLiveTimer();
  app.startLiveTimer();
  assert(app.timerRunning === true, 'Multiple startLiveTimer calls keep timerRunning true');
  assert(finishBtn.disabled === true, 'finishBtn.disabled remains true');
  app.pauseLiveTimer();

  // Idempotency: multiple pauseLiveTimer calls in a row
  app.pauseLiveTimer();
  app.pauseLiveTimer();
  assert(app.timerRunning === false, 'Multiple pauseLiveTimer calls maintain timerRunning false');
  assert(app.timerInterval === null, 'Interval remains null');
  assert(finishBtn.disabled === false, 'finishBtn.disabled remains false');
}

// =============================================================================
// SUITE 7: Simulated Full Countdown to 00:00 & Restart (R2)
// =============================================================================
console.log('\n--- SUITE 7: Simulated Full Countdown to 00:00 & Restart (R2) ---');
{
  const app = createHeadlessLiveApp();
  const display = getOrCreateMockElement('liveTimerDisplay');
  const status = getOrCreateMockElement('liveTimerStatusText');
  const actionLabel = getOrCreateMockElement('liveTimerActionLabel');
  const finishBtn = getOrCreateMockElement('liveFinishAndSaveBtn');

  app.timerBaseSeconds = 90;
  app.timerSeconds = 90;
  app.startLiveTimer();

  // Step countdown from 90 down to 1
  for (let s = 90; s >= 1; s--) {
    assert(app.timerSeconds === s, `Countdown tick: timerSeconds is ${s}`);
    const expectedMins = Math.floor(s / 60);
    const expectedSecs = s % 60;
    const expectedStr = `${String(expectedMins).padStart(2, '0')}:${String(expectedSecs).padStart(2, '0')}`;
    assert(display.textContent === expectedStr, `Display shows "${expectedStr}" at ${s}s`);
    assert(finishBtn.disabled === true, `finishBtn.disabled is true at ${s}s`);

    if (s <= 10 && s > 0) {
      assert(display.classList.has('timer-critical'), `Critical pulse style active at ${s}s`);
    } else {
      assert(!display.classList.has('timer-critical'), `Critical style not active at ${s}s`);
    }

    // Decrement 1 second
    app.timerSeconds--;
    app.updateLiveTimerDisplay();
  }

  // Now at 00:00
  assert(app.timerSeconds === 0, 'Timer has reached 0s');
  assert(display.textContent === '00:00', 'Display shows "00:00"');
  assert(!display.classList.has('timer-critical'), 'timer-critical class removed at 00:00');

  // Trigger timeout pause (simulating end of round)
  app.pauseLiveTimer();
  assert(app.timerRunning === false, 'Timer running is false upon timeout');
  assert(finishBtn.disabled === false, 'finishBtn.disabled is restored to false at 00:00');
  assert(actionLabel.textContent === 'Reiniciar', 'actionLabel switches to "Reiniciar" when timerSeconds is 0');
  assert(status.textContent === '¡Tiempo agotado!', 'statusText shows "¡Tiempo agotado!"');

  // Restart from 00:00
  app.startLiveTimer();
  assert(app.timerSeconds === 90, 'Restarting from 00:00 restores strictly 90s (NOT 120s)');
  assert(display.textContent === '01:30', 'Display after restart shows "01:30"');
  assert(app.timerRunning === true, 'Timer is running after restart');
  assert(app.timerStarted === true, 'timerStarted is true after restart');
  assert(finishBtn.disabled === true, 'finishBtn.disabled is true after restart');
  assert(actionLabel.textContent === 'Pausar', 'actionLabel switches to "Pausar" after restart');
  assert(status.textContent === 'Combate en curso', 'statusText shows "Combate en curso"');

  app.pauseLiveTimer();
}

// =============================================================================
// SUITE 8: Overtime / Sudden Death (+30s from 00:00)
// =============================================================================
console.log('\n--- SUITE 8: Overtime / Sudden Death (+30s from 00:00) ---');
{
  const app = createHeadlessLiveApp();
  const display = getOrCreateMockElement('liveTimerDisplay');
  const status = getOrCreateMockElement('liveTimerStatusText');
  const actionLabel = getOrCreateMockElement('liveTimerActionLabel');
  const finishBtn = getOrCreateMockElement('liveFinishAndSaveBtn');

  // Combat reaches 00:00
  app.timerStarted = true;
  app.timerSeconds = 0;
  app.timerRunning = false;
  app.updateLiveTimerDisplay();

  assert(display.textContent === '00:00', 'Timer is at 00:00');
  assert(actionLabel.textContent === 'Reiniciar', 'Action label is Reiniciar');

  // Referee adds 30 seconds for Sudden Death
  app.addLiveTimerSeconds(30);

  assert(app.timerSeconds === 30, 'Timer has 30 seconds for Sudden Death');
  assert(display.textContent === '00:30', 'Display shows "00:30"');
  assert(actionLabel.textContent === 'Iniciar', 'Action label transitions to "Iniciar"');
  assert(status.textContent === 'Combate en pausa', 'Status displays "Combate en pausa" (round in progress with overtime)');
  assert(finishBtn.disabled === false, 'finishBtn is enabled while paused in overtime');

  // Referee resumes combat
  app.startLiveTimer();
  assert(app.timerRunning === true, 'Overtime is running');
  assert(finishBtn.disabled === true, 'finishBtn is disabled during overtime action');
  assert(status.textContent === 'Combate en curso', 'Status is "Combate en curso"');
  app.pauseLiveTimer();
}

// =============================================================================
// SUITE 9: HTML & CSS Static Layout & Disabled Utility Contracts
// =============================================================================
console.log('\n--- SUITE 9: HTML & CSS Static Layout & Disabled Utility Contracts ---');
{
  const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const stylesCss = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
  const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

  // 9.1: HTML disabled utilities
  assert(indexHtml.includes('id="liveFinishAndSaveBtn"'), 'index.html contains #liveFinishAndSaveBtn');
  const btnSnippet = indexHtml.split('id="liveFinishAndSaveBtn"')[1].split('>')[0];
  assert(btnSnippet.includes('disabled:opacity-40'), 'Button has disabled:opacity-40');
  assert(btnSnippet.includes('disabled:cursor-not-allowed'), 'Button has disabled:cursor-not-allowed');
  assert(btnSnippet.includes('disabled:pointer-events-none'), 'Button has disabled:pointer-events-none');
  assert(btnSnippet.includes('disabled:shadow-none'), 'Button has disabled:shadow-none');

  // 9.2: CSS disabled rule
  assert(stylesCss.includes('#liveFinishAndSaveBtn:disabled'), 'styles.css has #liveFinishAndSaveBtn:disabled rule');
  const cssRule = stylesCss.split('#liveFinishAndSaveBtn:disabled')[1].split('}')[0];
  assert(cssRule.includes('opacity: 0.4 !important'), 'CSS rule enforces opacity: 0.4 !important');
  assert(cssRule.includes('cursor: not-allowed !important'), 'CSS rule enforces cursor: not-allowed !important');
  assert(cssRule.includes('pointer-events: none !important'), 'CSS rule enforces pointer-events: none !important');

  // 9.3: Initial static timer values in index.html
  assert(indexHtml.includes('01:30'), 'index.html specifies 01:30 initial time');
  assert(indexHtml.includes('Tiempo Oficial (01:30)'), 'index.html header badge specifies Tiempo Oficial (01:30)');
  assert(!indexHtml.includes('Tiempo Oficial (2:00)'), 'index.html does NOT contain legacy 2:00 badge');
  assert(!indexHtml.includes('Tiempo Oficial (02:00)'), 'index.html does NOT contain legacy 02:00 badge');

  // 9.4: Timer row visual hierarchy in index.html and app.js
  const toggleSnippet = indexHtml.split('id="liveTimerToggleBtn"')[1].split('>')[0];
  assert(toggleSnippet.includes('w-full'), 'Toggle button in index.html has w-full');
  assert(!toggleSnippet.includes('flex-1'), 'Toggle button in index.html does NOT have flex-1');

  // 9.5: Secondary ghost buttons in index.html
  const resetSnippet = indexHtml.split('id="liveTimerResetBtn"')[1].split('>')[0];
  assert(resetSnippet.includes('bg-transparent'), 'Reset button has ghost style bg-transparent');
  const add30Snippet = indexHtml.split('id="liveTimerAdd30Btn"')[1].split('>')[0];
  assert(add30Snippet.includes('bg-transparent'), '+30s button has ghost style bg-transparent');

  // 9.6: app.js state tracking and glitch prevention
  assert(!appJs.includes('this.timerSeconds < 120'), 'app.js does NOT contain legacy "this.timerSeconds < 120" check');
  assert(appJs.includes('this.timerStarted'), 'app.js uses this.timerStarted to detect pause state');
}

// =============================================================================
// SUMMARY REPORT
// =============================================================================
console.log('\n================================================================');
console.log(`ALL ASSERTIONS PASSED: ${passedAssertions} / ${totalAssertions}`);
console.log('STATUS: VERIFIED & EMPIRICALLY REPRODUCED WITHOUT FLAWS');
console.log('================================================================');
