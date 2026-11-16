/**
 * Test Suite: Fencer Academy Selector Integration & Supabase Sync
 * 
 * Verifies Requirements R1 and R2:
 * 1. Selector exists in fencer modal with options 'Almería' and 'Granada'.
 * 2. openFencerModal initializes selector to 'Almería' for new fencers.
 * 3. openFencerModal populates selector with current fencer's academy ('Almería' or 'Granada') when editing.
 * 4. saveFencerFromModal updates fencer object with selected academy.
 * 5. saveFencerFromModal sends upsert payload to Supabase containing academy.
 * 6. fencerToDb and fencerFromDb accurately map academy between frontend and database.
 * 7. supabase_schema.sql includes academy column in fencers table, migration, and seed.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// --- 1. Static Checks ---
console.log('--- SUITE 1: Static Contracts in HTML and SQL ---');
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
const sqlSchema = fs.readFileSync(path.join(__dirname, 'supabase_schema.sql'), 'utf-8');
const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');

// HTML: Check selector inside fencerModal
assert(indexHtml.includes('id="fencerAcademyInput"'), 'index.html must include id="fencerAcademyInput"');
assert(indexHtml.includes('<option value="Almería">Almería</option>'), 'Selector must include option Almería');
assert(indexHtml.includes('<option value="Granada">Granada</option>'), 'Selector must include option Granada');
console.log('✓ index.html defines #fencerAcademyInput with options Almería and Granada');

// SQL Schema: Check table definition, migration and seed
assert(sqlSchema.includes("academy TEXT NOT NULL DEFAULT 'Almería'"), 'supabase_schema.sql must define academy column with default Almería');
assert(sqlSchema.includes("ALTER TABLE public.fencers ADD COLUMN IF NOT EXISTS academy TEXT NOT NULL DEFAULT 'Almería';"), 'supabase_schema.sql must include idempotent ALTER TABLE migration');
assert(sqlSchema.includes("academy = EXCLUDED.academy"), 'supabase_schema.sql must update academy on conflict');
console.log('✓ supabase_schema.sql includes table column, idempotent ALTER TABLE, and seed mapping for academy');

// --- 2. Dynamic DOM & App Setup ---
console.log('\n--- SUITE 2: Dynamic Runtime & State Machine ---');

class ClassListMock {
  constructor() { this._set = new Set(); }
  add(...tokens) { for (const t of tokens) this._set.add(t); }
  remove(...tokens) { for (const t of tokens) this._set.delete(t); }
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
    this.classList = new ClassListMock();
  }
  setAttribute(name, val) { this.attributes[name] = String(val); }
  getAttribute(name) { return this.attributes[name] !== undefined ? this.attributes[name] : null; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  focus() {}
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
global.window.matchMedia = () => ({ matches: false, addEventListener: () => {} });
global.document = {
  getElementById: (id) => getOrCreateMockElement(id),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
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
const { LudoSportApp, DEFAULT_FENCERS } = appModule.exports;

// Check DEFAULT_FENCERS
assert.strictEqual(DEFAULT_FENCERS.length, 14, 'Should have 14 default fencers');
DEFAULT_FENCERS.forEach(f => {
  assert.strictEqual(f.academy, 'Almería', `Default fencer ${f.name} should belong to Almería`);
});
console.log('✓ All 14 DEFAULT_FENCERS have academy === "Almería"');

function createTestApp() {
  const instance = Object.create(LudoSportApp.prototype);
  instance.currentMonthKey = '112026';
  instance.isAdmin = true; // Modo Rector
  instance.isTestMode = false;
  instance.fencers = DEFAULT_FENCERS.map(f => ({ ...f }));
  instance.matches = [];
  instance.availableMonths = ['112026'];
  instance.saveLocalCache = () => {};
  instance.renderAll = () => {};
  instance.showToast = () => {};
  return instance;
}

const app = createTestApp();

// Mock Supabase client to inspect upsert calls
let lastUpsertPayload = null;
app.supabase = {
  from(table) {
    return {
      upsert: (payload) => {
        lastUpsertPayload = { table, payload };
        return Promise.resolve({ error: null });
      },
      select: () => Promise.resolve({ data: [], error: null })
    };
  }
};

// --- SUITE 3: Mappers Verification ---
console.log('\n--- SUITE 3: fencerToDb & fencerFromDb Mappers ---');
// fencerToDb
const dbRow1 = app.fencerToDb({ id: 'f-100', name: 'Test Granada', academy: 'Granada' });
assert.strictEqual(dbRow1.academy, 'Granada');

const dbRow2 = app.fencerToDb({ id: 'f-101', name: 'Test Almería', academy: 'Almería' });
assert.strictEqual(dbRow2.academy, 'Almería');

const dbRow3 = app.fencerToDb({ id: 'f-102', name: 'Legacy Almeria', academy: 'Almeria' });
assert.strictEqual(dbRow3.academy, 'Almería', 'Legacy Almeria without accent should map to Almería');

const dbRow4 = app.fencerToDb({ id: 'f-103', name: 'Empty Academy' });
assert.strictEqual(dbRow4.academy, 'Almería', 'Undefined academy should default to Almería');

// fencerFromDb
const localFencer1 = app.fencerFromDb({ id: 'f-200', name: 'Db Granada', academy: 'Granada' });
assert.strictEqual(localFencer1.academy, 'Granada');

const localFencer2 = app.fencerFromDb({ id: 'f-201', name: 'Db Almería', academy: 'Almería' });
assert.strictEqual(localFencer2.academy, 'Almería');

const localFencer3 = app.fencerFromDb({ id: 'f-202', name: 'Db Legacy', academy: 'Almeria' });
assert.strictEqual(localFencer3.academy, 'Almería');

const localFencer4 = app.fencerFromDb({ id: 'f-203', name: 'Db Empty', academy: '' });
assert.strictEqual(localFencer4.academy, 'Almería');
console.log('✓ fencerToDb and fencerFromDb properly map, normalize, and default academy');

// --- SUITE 4: Modal UI Open Behavior ---
console.log('\n--- SUITE 4: openFencerModal Integration ---');
const academyInput = getOrCreateMockElement('fencerAcademyInput', 'select');
const nameInput = getOrCreateMockElement('fencerNameInput', 'input');
const editIdInput = getOrCreateMockElement('fencerEditId', 'input');
const modalEl = getOrCreateMockElement('fencerModal', 'div');

// 1. Open for New Fencer
app.openFencerModal();
assert.strictEqual(academyInput.value, 'Almería', 'New fencer modal should default academy to Almería');
assert.strictEqual(editIdInput.value, '', 'New fencer editId should be empty');
assert.strictEqual(modalEl.classList.contains('hidden'), false, 'Modal should be shown');
console.log('✓ openFencerModal() initializes academy to "Almería" for new fencers');

// 2. Open for Existing Fencer (Granada)
const existingFencerGranada = { id: 'f-test-g', name: 'Fighter Granada', academy: 'Granada', rank: 'Novizio', color: 'cyan' };
app.openFencerModal(existingFencerGranada);
assert.strictEqual(academyInput.value, 'Granada', 'Editing Granada fencer should select Granada');
assert.strictEqual(editIdInput.value, 'f-test-g');
console.log('✓ openFencerModal(fencer) reflects existing fencer academy ("Granada")');

// 3. Open for Existing Fencer (Almería)
const existingFencerAlmeria = { id: 'f-test-a', name: 'Fighter Almería', academy: 'Almería', rank: 'Inizziato', color: 'cyan' };
app.openFencerModal(existingFencerAlmeria);
assert.strictEqual(academyInput.value, 'Almería', 'Editing Almería fencer should select Almería');
console.log('✓ openFencerModal(fencer) reflects existing fencer academy ("Almería")');

// 4. Open for Existing Fencer with unaccented "Almeria"
const legacyFencer = { id: 'f-test-leg', name: 'Fighter Legacy', academy: 'Almeria', rank: 'Inizziato', color: 'cyan' };
app.openFencerModal(legacyFencer);
assert.strictEqual(academyInput.value, 'Almería', 'Legacy "Almeria" should normalize to "Almería"');
console.log('✓ openFencerModal(fencer) normalizes legacy "Almeria" to "Almería"');

// --- SUITE 5: Modal Save Behavior & Supabase Sync ---
console.log('\n--- SUITE 5: saveFencerFromModal State & Supabase Persistence ---');

// 1. Save New Fencer with Granada
editIdInput.value = '';
nameInput.value = 'Nuevo Tirador Granada';
academyInput.value = 'Granada';
lastUpsertPayload = null;

const fakeEvent = { preventDefault: () => {} };
app.saveFencerFromModal(fakeEvent);

const createdFencer = app.fencers.find(f => f.name === 'Nuevo Tirador Granada');
assert(createdFencer, 'New fencer should be added to app.fencers');
assert.strictEqual(createdFencer.academy, 'Granada', 'Created fencer should have academy === "Granada"');
assert(lastUpsertPayload, 'Supabase upsert must be called on create');
assert.strictEqual(lastUpsertPayload.table, 'fencers');
assert.strictEqual(lastUpsertPayload.payload.academy, 'Granada', 'Supabase payload must contain academy === "Granada"');
console.log('✓ Creating new fencer saves academy to local state and syncs to Supabase');

// 2. Modify Existing Fencer to Almería
editIdInput.value = createdFencer.id;
nameInput.value = 'Nuevo Tirador Almería';
academyInput.value = 'Almería';
lastUpsertPayload = null;

app.saveFencerFromModal(fakeEvent);

const updatedFencer = app.fencers.find(f => f.id === createdFencer.id);
assert.strictEqual(updatedFencer.name, 'Nuevo Tirador Almería');
assert.strictEqual(updatedFencer.academy, 'Almería', 'Modified fencer should have academy updated to "Almería"');
assert(lastUpsertPayload, 'Supabase upsert must be called on update');
assert.strictEqual(lastUpsertPayload.payload.academy, 'Almería', 'Supabase payload must contain updated academy');
console.log('✓ Modifying existing fencer updates academy in state and syncs to Supabase');

// 3. Security check: non-admin mode blocks fencer save
app.isAdmin = false;
app.isTestMode = false;
editIdInput.value = '';
nameInput.value = 'Unauthorized Fencer';
academyInput.value = 'Granada';
lastUpsertPayload = null;

app.saveFencerFromModal(fakeEvent);
const blockedFencer = app.fencers.find(f => f.name === 'Unauthorized Fencer');
assert.strictEqual(blockedFencer, undefined, 'Non-admin should not be able to save fencers');
assert.strictEqual(lastUpsertPayload, null, 'No Supabase upsert should be made when non-admin');
console.log('✓ Non-admin permission check guards saveFencerFromModal');

console.log('\n================================================================');
console.log('ALL FENCER ACADEMY INTEGRATION TESTS PASSED SUCCESSFULLY!');
console.log('================================================================');
