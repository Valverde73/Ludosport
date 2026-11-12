/**
 * Test Suite: Score Buttons Disabled State during Timer Active
 * 
 * Verifies:
 * 1. Score buttons (+ and - for fighters A and B) are enabled initially when timer is stopped.
 * 2. Score buttons become disabled immediately when timer starts / runs.
 * 3. Score buttons become enabled immediately when timer is paused.
 * 4. Score buttons become disabled immediately when timer resumes.
 * 5. Score buttons remain enabled when timer is reset.
 * 6. Score buttons are enabled when timer reaches 00:00 (time up).
 * 7. Score adjustment methods (adjustLiveScoreA, adjustLiveScoreB) reject calls when timer is running.
 * 8. Score adjustment methods work normally when timer is paused / stopped.
 * 9. HTML contains disabled utilities on score buttons.
 * 10. CSS contains disabled rules for score buttons.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// DOM Mock
class ClassListMock {
  constructor() {
    this._set = new Set();
  }
  add(...tokens) { for (const t of tokens) this._set.add(t); }
  remove(...tokens) { for (const t of tokens) this._set.delete(t); }
  contains(token) { return this._set.has(token); }
  toggle(token, force) {
    if (force === true) { this._set.add(token); return true; }
    if (force === false) { this._set.delete(token); return false; }
    if (this._set.has(token)) { this._set.delete(token); return false; }
    this._set.add(token); return true;
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
  }
  setAttribute(name, val) { this.attributes[name] = String(val); }
  getAttribute(name) { return this.attributes[name] !== undefined ? this.attributes[name] : null; }
  addEventListener() {}
  removeEventListener() {}
}

const mockElements = {};
function getOrCreateMockElement(id, tagName = 'div') {
  if (!mockElements[id]) {
    mockElements[id] = new MockElement(id, tagName);
  }
  return mockElements[id];
}

global.window = global;
global.window.addEventListener = () => {};
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

let appSource = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
appSource = appSource.replace(
  /window\.addEventListener\('DOMContentLoaded'[\s\S]*$/,
  'module.exports = { LudoSportApp };'
);

const appModule = new module.constructor();
appModule._compile(appSource, 'app.js');
const { LudoSportApp } = appModule.exports;

function createTestApp() {
  const instance = Object.create(LudoSportApp.prototype);
  instance.currentMonthKey = '112026';
  instance.isAdmin = false;
  instance.isTestMode = false;
  instance.fencers = [
    { id: 'f-1', name: 'Mar Garcia', rank: 'Inizziato', color: 'cyan' },
    { id: 'f-2', name: 'Auri Haro', rank: 'Inizziato', color: 'cyan' }
  ];
  instance.matches = [];
  instance.availableMonths = ['112026'];
  instance.saveLocalCache = () => {};
  instance.renderAll = () => {};
  instance.liveFighterAId = 'f-1';
  instance.liveFighterBId = 'f-2';
  instance.liveScoreA = 0;
  instance.liveScoreB = 0;
  instance.timerBaseSeconds = 90;
  instance.timerSeconds = 90;
  instance.timerInterval = null;
  instance.timerRunning = false;
  instance.timerStarted = false;
  instance.isSoundEnabled = false;
  instance.playBeep = () => {};
  instance.showToast = () => {};
  return instance;
}

const app = createTestApp();

console.log('--- RUNNING SCORE BUTTONS TIMER TESTS ---');

const btnAInc = getOrCreateMockElement('liveBtnScoreAInc', 'button');
const btnADec = getOrCreateMockElement('liveBtnScoreADec', 'button');
const btnBInc = getOrCreateMockElement('liveBtnScoreBInc', 'button');
const btnBDec = getOrCreateMockElement('liveBtnScoreBDec', 'button');
const scoreButtons = [btnAInc, btnADec, btnBInc, btnBDec];

// Test 1: Initial state - All score buttons enabled
app.updateLiveTimerDisplay();
scoreButtons.forEach(btn => {
  assert.strictEqual(btn.disabled, false, `${btn.id} must be enabled initially`);
});
console.log('✓ Initial state: all score buttons enabled');

// Test 2: Start timer - All score buttons disabled
app.startLiveTimer();
assert.strictEqual(app.timerRunning, true, 'Timer should be running');
scoreButtons.forEach(btn => {
  assert.strictEqual(btn.disabled, true, `${btn.id} must be disabled when timer is running`);
});
console.log('✓ Timer started: all score buttons disabled');

// Test 3: Defensive guard - adjustLiveScore rejected while running
const prevScoreA = app.liveScoreA;
const prevScoreB = app.liveScoreB;
app.adjustLiveScoreA(1);
assert.strictEqual(app.liveScoreA, prevScoreA, 'adjustLiveScoreA(1) must be rejected while timer is running');
app.adjustLiveScoreA(-1);
assert.strictEqual(app.liveScoreA, prevScoreA, 'adjustLiveScoreA(-1) must be rejected while timer is running');
app.adjustLiveScoreB(1);
assert.strictEqual(app.liveScoreB, prevScoreB, 'adjustLiveScoreB(1) must be rejected while timer is running');
app.adjustLiveScoreB(-1);
assert.strictEqual(app.liveScoreB, prevScoreB, 'adjustLiveScoreB(-1) must be rejected while timer is running');
console.log('✓ Defensive guard: score adjustments blocked while timer running');

// Test 4: Pause timer - All score buttons re-enabled
app.pauseLiveTimer();
assert.strictEqual(app.timerRunning, false, 'Timer should be paused');
scoreButtons.forEach(btn => {
  assert.strictEqual(btn.disabled, false, `${btn.id} must be enabled when timer is paused`);
});
console.log('✓ Timer paused: all score buttons enabled');

// Test 5: Score adjustments work while paused
app.adjustLiveScoreA(1);
assert.strictEqual(app.liveScoreA, prevScoreA + 1, 'adjustLiveScoreA(1) must succeed while timer is paused');
app.adjustLiveScoreB(2);
assert.strictEqual(app.liveScoreB, prevScoreB + 2, 'adjustLiveScoreB(2) must succeed while timer is paused');
app.adjustLiveScoreA(-1);
assert.strictEqual(app.liveScoreA, prevScoreA, 'adjustLiveScoreA(-1) must succeed while timer is paused');
console.log('✓ Score adjustments succeed when timer is paused');

// Test 6: Resume timer - All score buttons disabled again
app.startLiveTimer();
assert.strictEqual(app.timerRunning, true, 'Timer should be resumed');
scoreButtons.forEach(btn => {
  assert.strictEqual(btn.disabled, true, `${btn.id} must be disabled when timer resumes`);
});
console.log('✓ Timer resumed: all score buttons disabled again');

// Test 7: Reset timer - All score buttons enabled
app.resetLiveTimer();
assert.strictEqual(app.timerRunning, false, 'Timer should be stopped after reset');
scoreButtons.forEach(btn => {
  assert.strictEqual(btn.disabled, false, `${btn.id} must be enabled when timer is reset`);
});
console.log('✓ Timer reset: all score buttons enabled');

// Test 8: Toggle timer rapid test
app.toggleLiveTimer(); // start
assert.strictEqual(app.timerRunning, true);
scoreButtons.forEach(btn => assert.strictEqual(btn.disabled, true));
app.toggleLiveTimer(); // pause
assert.strictEqual(app.timerRunning, false);
scoreButtons.forEach(btn => assert.strictEqual(btn.disabled, false));
console.log('✓ Toggle timer: score buttons disabled state accurately mirrors timerRunning');

// Test 9: Time up (timer reaches 0) - All score buttons re-enabled
app.startLiveTimer();
app.timerSeconds = 0;
// Trigger timeout logic
app.pauseLiveTimer();
scoreButtons.forEach(btn => {
  assert.strictEqual(btn.disabled, false, `${btn.id} must be enabled when timer expires`);
});
console.log('✓ Time up: all score buttons enabled');

// Test 10: HTML and CSS checks
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
const stylesCss = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf-8');

['liveBtnScoreADec', 'liveBtnScoreAInc', 'liveBtnScoreBDec', 'liveBtnScoreBInc'].forEach(id => {
  assert(indexHtml.includes(id), `index.html must contain #${id}`);
  const btnTag = indexHtml.split(`id="${id}"`)[1].split('>')[0];
  assert(btnTag.includes('disabled:opacity'), `#${id} must declare disabled:opacity utility`);
  assert(btnTag.includes('disabled:cursor-not-allowed'), `#${id} must declare disabled:cursor-not-allowed utility`);
  assert(btnTag.includes('disabled:pointer-events-none'), `#${id} must declare disabled:pointer-events-none utility`);
  assert(stylesCss.includes(`#${id}:disabled`), `styles.css must declare #${id}:disabled`);
});
console.log('✓ HTML & CSS: disabled utilities and CSS rules declared for all score buttons');

// Test 11: Real interval countdown tick reaching 00:00 immediately transitions state and enables score buttons
{
  let capturedIntervalCb = null;
  const originalSetInterval = global.setInterval;
  global.setInterval = (cb, ms) => {
    capturedIntervalCb = cb;
    return originalSetInterval(cb, ms);
  };

  const app2 = createTestApp();
  app2.timerBaseSeconds = 90;
  app2.timerSeconds = 1;
  app2.startLiveTimer();

  assert.strictEqual(app2.timerRunning, true, 'Timer must be running before last tick');
  scoreButtons.forEach(btn => assert.strictEqual(btn.disabled, true, 'Buttons must be disabled while running at 1s'));

  // Trigger the 1-second tick reaching 00:00
  capturedIntervalCb();

  assert.strictEqual(app2.timerSeconds, 0, 'Timer must reach 0s');
  assert.strictEqual(app2.timerRunning, false, 'Timer running must immediately become false on 00:00 without lag');
  assert.strictEqual(app2.timerInterval, null, 'Timer interval must be cleanly cleared');
  scoreButtons.forEach(btn => {
    assert.strictEqual(btn.disabled, false, `${btn.id} must be immediately enabled when timer reaches 0s`);
  });

  global.setInterval = originalSetInterval;
  console.log('✓ Interval countdown tick reaching 00:00: immediate stop and score buttons enabled');
}

// Test 12: Finish and save resets board, updates outcome banner, and leaves score buttons enabled
{
  const app3 = createTestApp();
  app3.liveScoreA = 3;
  app3.liveScoreB = 1;
  app3.updateLiveOutcomeBanner();
  
  const banner = getOrCreateMockElement('liveOutcomeBanner');
  assert(banner.innerHTML.includes('Victoria para Mar Garcia'), 'Banner should show victory before save');

  app3.finishAndSaveLiveCombat();
  assert.strictEqual(app3.liveScoreA, 0, 'Score A must reset to 0');
  assert.strictEqual(app3.liveScoreB, 0, 'Score B must reset to 0');
  assert.strictEqual(app3.timerRunning, false, 'Timer must not be running after save');
  scoreButtons.forEach(btn => {
    assert.strictEqual(btn.disabled, false, `${btn.id} must be enabled after saving match`);
  });
  assert(banner.innerHTML.includes('Empate Técnico'), 'Banner must be reset to tie / 0 - 0 after saving match');
  console.log('✓ Finish and save: resets scores, outcome banner, and keeps score buttons enabled');
}

// Test 13: Overtime / Sudden Death flow: score buttons state during golden score
{
  const app4 = createTestApp();
  app4.timerSeconds = 0;
  app4.pauseLiveTimer();
  scoreButtons.forEach(btn => assert.strictEqual(btn.disabled, false));

  // Add 30 seconds for Sudden Death
  app4.addLiveTimerSeconds(30);
  assert.strictEqual(app4.timerSeconds, 30);
  assert.strictEqual(app4.timerRunning, false);
  scoreButtons.forEach(btn => assert.strictEqual(btn.disabled, false, 'Score buttons enabled during overtime setup'));

  // Start overtime
  app4.startLiveTimer();
  assert.strictEqual(app4.timerRunning, true);
  scoreButtons.forEach(btn => assert.strictEqual(btn.disabled, true, 'Score buttons disabled during overtime countdown'));

  // Pause overtime to score point
  app4.pauseLiveTimer();
  assert.strictEqual(app4.timerRunning, false);
  scoreButtons.forEach(btn => assert.strictEqual(btn.disabled, false, 'Score buttons enabled when referee pauses overtime'));
  app4.adjustLiveScoreA(1);
  assert.strictEqual(app4.liveScoreA, 1, 'Score adjustment succeeds while overtime is paused');
  console.log('✓ Overtime / Sudden death flow: score buttons enabled during setup and pauses, disabled while running');
}

console.log('ALL SCORE BUTTON TIMER TESTS PASSED!');
