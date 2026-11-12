# Handoff Report: Investigation of Requirements R4 & R6 (Marcador en Directo)

- **Agent**: `explorer_marcador_3`
- **Milestone**: Marcador en Directo Refactor
- **Date**: 2026-11-12
- **Target Requirements**:
  - **R4**: Visual hierarchy of timer controls (100% width for "INICIAR" and secondary ghost/outline styling for "Reset" and "+30s").
  - **R6**: Tactile hit-areas >= 48x48px for point buttons (`+` and `-`).

---

## 1. Observation

### 1.1 Requirement R4: Timer Controls Layout and Dynamic State

#### Observation 1.1.1: HTML Structure of Timer Buttons
In `index.html` (lines 518–531), the timer action buttons are defined inside a single horizontal flex container:
```html
518:               <!-- Timer Action Buttons -->
519:               <div class="flex items-center justify-center gap-2 mt-3">
520:                 <button type="button" id="liveTimerToggleBtn" class="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
521:                   <i data-lucide="play" class="w-4 h-4" id="liveTimerIcon"></i>
522:                   <span id="liveTimerActionLabel">Iniciar</span>
523:                 </button>
524:                 <button type="button" id="liveTimerResetBtn" class="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 active:scale-95 transition-all" title="Reiniciar a 2:00">
525:                   <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
526:                 </button>
527:                 <button type="button" id="liveTimerAdd30Btn" class="px-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-combat font-bold border border-slate-700 active:scale-95 transition-all" title="Añadir 30 segundos">
528:                   +30s
529:                 </button>
530:               </div>
```
- `liveTimerToggleBtn` has class `flex-1`, sharing a single horizontal flex row with `liveTimerResetBtn` and `liveTimerAdd30Btn`.
- `liveTimerResetBtn` and `liveTimerAdd30Btn` have a solid dark background `bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700` without secondary/ghost differentiation.

#### Observation 1.1.2: JavaScript Dynamic Class Overwrite in `app.js`
In `app.js`, method `updateLiveTimerDisplay()` (lines 2363–2411) dynamically assigns `toggleBtn.className` whenever the timer updates or changes state:
```javascript
2382:     if (toggleBtn && label) {
2383:       if (this.timerRunning) {
2384:         label.textContent = 'Pausar';
2385:         toggleBtn.className = 'flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all';
2386:         if (icon) icon.setAttribute('data-lucide', 'pause');
...
2391:       } else {
2392:         label.textContent = this.timerSeconds === 0 ? 'Reiniciar' : 'Iniciar';
2393:         toggleBtn.className = 'flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all';
2394:         if (icon) icon.setAttribute('data-lucide', 'play');
...
2408:     }
```
- At startup, `this.init()` (line 228) calls `this.initLiveScoreboard()` (line 2257), which calls `this.updateLiveTimerDisplay()`.
- Consequently, any class attribute written in `index.html` on `liveTimerToggleBtn` is immediately replaced by line 2393 upon page load, and by line 2385 when the timer starts.
- Both line 2385 and line 2393 explicitly hardcode `flex-1`.

---

### 1.2 Requirement R6: Tactile Hit-Areas for Point Buttons

#### Observation 1.2.1: Live Scoreboard Point Buttons (`tab-live`)
In `index.html`, the point buttons for Combatant A (Corner Alfa) and Combatant B (Corner Beta) are defined at:
- **Combatant A** (lines 492–499):
```html
492:             <div class="w-full grid grid-cols-2 gap-2 mt-2">
493:               <button type="button" id="liveBtnScoreADec" class="py-3 sm:py-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-black text-2xl border border-slate-700 flex items-center justify-center select-none transition-all shadow-md" title="Restar OH">
494:                 −
495:               </button>
496:               <button type="button" id="liveBtnScoreAInc" class="py-3 sm:py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-3xl flex items-center justify-center select-none transition-all shadow-lg shadow-cyan-500/30" title="Sumar OH">
497:                 +
498:               </button>
499:             </div>
```
- **Combatant B** (lines 567–574):
```html
567:             <div class="w-full grid grid-cols-2 gap-2 mt-2">
568:               <button type="button" id="liveBtnScoreBDec" class="py-3 sm:py-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-black text-2xl border border-slate-700 flex items-center justify-center select-none transition-all shadow-md" title="Restar OH">
569:                 −
570:               </button>
571:               <button type="button" id="liveBtnScoreBInc" class="py-3 sm:py-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-3xl flex items-center justify-center select-none transition-all shadow-lg shadow-amber-500/30" title="Sumar OH">
572:                 +
573:               </button>
574:             </div>
```
- Current dimensions: Width is fluid (`grid-cols-2`, each ~90px–170px across viewports), but height relies solely on `py-3 sm:py-4` (24px padding + font line-height).
- Neither `min-h-[48px]` nor `min-w-[48px]` is declared on these 4 buttons.
- In `styles.css`, no rules target `#liveBtnScoreADec`, `#liveBtnScoreAInc`, `#liveBtnScoreBDec`, or `#liveBtnScoreBInc`. Under landscape piste mode (`@media (orientation: landscape) and (max-height: 550px)`), container padding is clamped to `0.5rem`, leaving vertical sizing without a hard floor constraint.

#### Observation 1.2.2: Duel Registration Form Steppers (`tab-duel`)
In `index.html` (lines 333–348), the point adjustment buttons in the manual duel form are:
```html
334: <button type="button" id="btnScoreADec" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-black text-lg border border-slate-700 flex items-center justify-center select-none transition-transform">−</button>
336: <button type="button" id="btnScoreAInc" class="w-9 h-9 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 active:scale-95 text-cyan-300 font-black text-lg border border-cyan-500/40 flex items-center justify-center select-none transition-transform">+</button>
344: <button type="button" id="btnScoreBDec" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-black text-lg border border-slate-700 flex items-center justify-center select-none transition-transform">−</button>
346: <button type="button" id="btnScoreBInc" class="w-9 h-9 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-300 font-black text-lg border border-amber-500/40 flex items-center justify-center select-none transition-transform">+</button>
```
- These buttons explicitly define `w-9 h-9` = `2.25rem` = `36px x 36px`, which is strictly smaller than the 48x48px mobile touch target standard.

---

### 1.3 Test Suite Status
Running existing test suites:
- `python test_ui_refactor.py`: 13 tests ran in 0.028s — OK.
- `python test_badges.py`: 14 tests ran in 0.075s — OK.
- `node test_empirical_challenger.js`: 75 assertions across 3 suites — ALL PASSED.
- `python test_challenger_m1.py`: 17 tests ran in 0.023s — OK.
- Regex search confirms zero existing test assertions on `liveTimerToggleBtn`, `liveBtnScoreADec`, or `btnScoreADec`. Changes to these buttons will cause zero regressions to Milestone M1 tests.

---

## 2. Logic Chain

### 2.1 Logic Chain for Requirement R4 (Timer Visual Hierarchy)
1. **From Observation 1.1.1**: The three buttons (`liveTimerToggleBtn`, `liveTimerResetBtn`, `liveTimerAdd30Btn`) are siblings inside `<div class="flex items-center justify-center gap-2 mt-3">`.
2. **Layout Conflict**: Placing them in the same flex row with `flex-1` prevents `liveTimerToggleBtn` from taking 100% width of its row.
3. **Reorganization Needed**: To satisfy R4 ("Dar protagonismo principal al botón 'INICIAR' haciendo que ocupe todo el ancho disponible en su fila. Mover los botones secundarios justo debajo"), the buttons must be separated into two rows:
   - **Row 1**: `liveTimerToggleBtn` as a direct block/flex child with class `w-full`.
   - **Row 2**: A two-column grid (`grid grid-cols-2 gap-2 w-full`) directly underneath holding `liveTimerResetBtn` and `liveTimerAdd30Btn`.
4. **Visual Subordination (Ghost/Outline)**: The secondary buttons currently have `bg-slate-800` (solid dark surface with high visual weight). Changing their styles to `bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/80 hover:border-slate-600` establishes a clear secondary ghost/outline appearance subordinated to the solid primary action button.
5. **From Observation 1.1.2**: In `app.js`, `updateLiveTimerDisplay()` resets `toggleBtn.className` dynamically on every state change using hardcoded `flex-1`. If an implementer only changes `index.html`, the button will revert to `flex-1` upon page initialization. Therefore, `app.js` lines 2385 and 2393 MUST be updated from `flex-1` to `w-full`.

### 2.2 Logic Chain for Requirement R6 (Tactile Hit-Areas >= 48x48px)
1. **From Observation 1.2.1**: The 4 Live Scoreboard buttons (`liveBtnScoreADec`, `liveBtnScoreAInc`, `liveBtnScoreBDec`, `liveBtnScoreBInc`) occupy 50% grid width, but their height depends on fluid `py-3` and font line-height.
2. **Touch Target Guarantee**: In touch interfaces (WCAG 2.5.5 / 2.5.8 and mobile touch target guidelines), hit areas must not collapse under varying font metrics, browser zoom, or constrained landscape views. Adding `min-h-[48px] min-w-[48px]` provides a deterministic CSS contract guaranteeing >= 48x48px hit area.
3. **Defensive CSS**: Adding a rule in `styles.css` (`#liveBtnScoreADec, #liveBtnScoreAInc, #liveBtnScoreBDec, #liveBtnScoreBInc { min-height: 48px; min-width: 48px; }`) ensures the guarantee holds even if utility classes are altered or CDN delivery fluctuates.
4. **From Observation 1.2.2**: The 4 Duel Form steppers (`btnScoreADec`, `btnScoreAInc`, `btnScoreBDec`, `btnScoreBInc`) currently specify `w-9 h-9` (36px x 36px). If the acceptance criterion ("Todos los botones de incremento y decremento de puntos (+ y -) tienen dimensiones de hit-area de al menos 48x48 píxeles") applies globally across the app, updating these to `w-12 h-12 min-w-[48px] min-h-[48px]` ensures 100% compliance.

---

## 3. Caveats

1. **Dual-Tab Scope of R6**: The prompt and `ORIGINAL_REQUEST.md` primarily focus on the "Marcador en Directo" (`tab-live`). However, the manual duel form (`tab-duel`) also contains `+` and `-` point buttons (`w-9 h-9`, 36px). While the live scorecard is the priority, both should be updated to guarantee complete consistency.
2. **Interaction with Requirement R2**: Requirement R2 modifies the timer base time to 01:30 and adjusts reset behavior. When styling `liveTimerResetBtn`, the tooltip title should be updated from `"Reiniciar a 2:00"` to `"Reiniciar a 01:30"` or `"Reiniciar temporizador"`.
3. **Lucide Icons Rehydration**: In `index.html`, any icon changes inside the reorganized timer buttons (e.g. adding text labels alongside Lucide icons) will be parsed cleanly by `lucide.createIcons()` called within `updateLiveTimerDisplay()`.

---

## 4. Conclusion & Concrete Proposal

### 4.1 Proposed Changes for Requirement R4

#### Target File: `index.html` (Lines 518–531)
**Before:**
```html
              <!-- Timer Action Buttons -->
              <div class="flex items-center justify-center gap-2 mt-3">
                <button type="button" id="liveTimerToggleBtn" class="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                  <i data-lucide="play" class="w-4 h-4" id="liveTimerIcon"></i>
                  <span id="liveTimerActionLabel">Iniciar</span>
                </button>
                <button type="button" id="liveTimerResetBtn" class="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 active:scale-95 transition-all" title="Reiniciar a 2:00">
                  <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                </button>
                <button type="button" id="liveTimerAdd30Btn" class="px-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-combat font-bold border border-slate-700 active:scale-95 transition-all" title="Añadir 30 segundos">
                  +30s
                </button>
              </div>
```

**After:**
```html
              <!-- Timer Action Buttons (R4 Visual Hierarchy) -->
              <div class="mt-3 flex flex-col gap-2 w-full">
                <!-- Primary Action: Iniciar / Pausar (100% width of row) -->
                <button type="button" id="liveTimerToggleBtn" class="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                  <i data-lucide="play" class="w-4 h-4" id="liveTimerIcon"></i>
                  <span id="liveTimerActionLabel">Iniciar</span>
                </button>

                <!-- Secondary Actions Row: Ghost / Outline style underneath INICIAR -->
                <div class="grid grid-cols-2 gap-2 w-full">
                  <button type="button" id="liveTimerResetBtn" class="py-2 px-2.5 rounded-xl bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-700/80 hover:border-slate-600 active:scale-95 transition-all flex items-center justify-center gap-1.5" title="Reiniciar temporizador">
                    <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                    <span>Reset</span>
                  </button>
                  <button type="button" id="liveTimerAdd30Btn" class="py-2 px-2.5 rounded-xl bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 text-xs font-combat font-semibold border border-slate-700/80 hover:border-slate-600 active:scale-95 transition-all flex items-center justify-center gap-1" title="Añadir 30 segundos">
                    <i data-lucide="plus" class="w-3 h-3 text-cyan-400"></i>
                    <span>+30s</span>
                  </button>
                </div>
              </div>
```

#### Target File: `app.js` (Lines 2385 and 2393)
**Before:**
```javascript
2385:         toggleBtn.className = 'flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all';
...
2393:         toggleBtn.className = 'flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all';
```

**After:**
```javascript
2385:         toggleBtn.className = 'w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all';
...
2393:         toggleBtn.className = 'w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all';
```

---

### 4.2 Proposed Changes for Requirement R6

#### Target File: `index.html` (Lines 492–499 & Lines 567–574)
**Before (Corner Alfa):**
```html
            <div class="w-full grid grid-cols-2 gap-2 mt-2">
              <button type="button" id="liveBtnScoreADec" class="py-3 sm:py-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-black text-2xl border border-slate-700 flex items-center justify-center select-none transition-all shadow-md" title="Restar OH">
                −
              </button>
              <button type="button" id="liveBtnScoreAInc" class="py-3 sm:py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-3xl flex items-center justify-center select-none transition-all shadow-lg shadow-cyan-500/30" title="Sumar OH">
                +
              </button>
            </div>
```

**After (Corner Alfa):**
```html
            <div class="w-full grid grid-cols-2 gap-2 mt-2">
              <button type="button" id="liveBtnScoreADec" class="min-h-[48px] min-w-[48px] py-3 sm:py-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-black text-2xl border border-slate-700 flex items-center justify-center select-none transition-all shadow-md" title="Restar OH">
                −
              </button>
              <button type="button" id="liveBtnScoreAInc" class="min-h-[48px] min-w-[48px] py-3 sm:py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-3xl flex items-center justify-center select-none transition-all shadow-lg shadow-cyan-500/30" title="Sumar OH">
                +
              </button>
            </div>
```

**After (Corner Beta — lines 567–574):**
```html
            <div class="w-full grid grid-cols-2 gap-2 mt-2">
              <button type="button" id="liveBtnScoreBDec" class="min-h-[48px] min-w-[48px] py-3 sm:py-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-black text-2xl border border-slate-700 flex items-center justify-center select-none transition-all shadow-md" title="Restar OH">
                −
              </button>
              <button type="button" id="liveBtnScoreBInc" class="min-h-[48px] min-w-[48px] py-3 sm:py-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-3xl flex items-center justify-center select-none transition-all shadow-lg shadow-amber-500/30" title="Sumar OH">
                +
              </button>
            </div>
```

#### Target File: `styles.css` (Append to live referee section)
```css
/* Tactile hit-areas >= 48x48px for point buttons (WCAG 2.5.5 / 2.5.8) */
#liveBtnScoreADec,
#liveBtnScoreAInc,
#liveBtnScoreBDec,
#liveBtnScoreBInc {
  min-height: 48px;
  min-width: 48px;
}
```

#### Optional Global Hardening for Duel Form Steppers (`index.html` lines 334, 336, 344, 346):
Replace `w-9 h-9` with `w-12 h-12 min-w-[48px] min-h-[48px]` on `btnScoreADec`, `btnScoreAInc`, `btnScoreBDec`, and `btnScoreBInc`.

---

## 5. Verification Method

To verify R4 and R6 independently:

### 5.1 Verification Test Commands
Run the existing test suites to confirm zero regressions:
```powershell
python test_ui_refactor.py
python test_badges.py
node test_empirical_challenger.js
python test_challenger_m1.py
```

### 5.2 Automated Assertions for R4 & R6
Add the following unit test methods to a Python test suite (e.g. `test_marcador_refactor.py`):
```python
import unittest
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class TestR4TimerHierarchy(unittest.TestCase):
    def setUp(self):
        self.html = (BASE_DIR / "index.html").read_text(encoding="utf-8")
        self.js = (BASE_DIR / "app.js").read_text(encoding="utf-8")

    def test_r4_html_toggle_btn_full_width(self):
        # liveTimerToggleBtn must have w-full and not flex-1
        match = re.search(r'id=["\']liveTimerToggleBtn["\'][^>]*class=["\']([^"\']+)["\']', self.html)
        self.assertIsNotNone(match)
        classes = match.group(1).split()
        self.assertIn("w-full", classes)
        self.assertNotIn("flex-1", classes)

    def test_r4_js_toggle_btn_classes_full_width(self):
        # app.js updateLiveTimerDisplay must assign w-full in both states
        matches = re.findall(r'toggleBtn\.className\s*=\s*[\'"]([^\'"]+)[\'"]', self.js)
        self.assertGreaterEqual(len(matches), 2)
        for class_str in matches:
            classes = class_str.split()
            self.assertIn("w-full", classes, f"Expected w-full in toggleBtn.className: {class_str}")
            self.assertNotIn("flex-1", classes, f"Unexpected flex-1 in toggleBtn.className: {class_str}")

    def test_r4_secondary_buttons_ghost_outline_style(self):
        # Reset and +30s buttons must have transparent background and border
        reset_match = re.search(r'id=["\']liveTimerResetBtn["\'][^>]*class=["\']([^"\']+)["\']', self.html)
        self.assertIsNotNone(reset_match)
        self.assertIn("bg-transparent", reset_match.group(1))

        add30_match = re.search(r'id=["\']liveTimerAdd30Btn["\'][^>]*class=["\']([^"\']+)["\']', self.html)
        self.assertIsNotNone(add30_match)
        self.assertIn("bg-transparent", add30_match.group(1))

class TestR6TouchHitAreas(unittest.TestCase):
    def setUp(self):
        self.html = (BASE_DIR / "index.html").read_text(encoding="utf-8")
        self.css = (BASE_DIR / "styles.css").read_text(encoding="utf-8")

    def test_r6_live_buttons_min_dimensions(self):
        for btn_id in ["liveBtnScoreADec", "liveBtnScoreAInc", "liveBtnScoreBDec", "liveBtnScoreBInc"]:
            match = re.search(r'id=["\']' + btn_id + r'["\'][^>]*class=["\']([^"\']+)["\']', self.html)
            self.assertIsNotNone(match, f"Button {btn_id} not found in HTML")
            self.assertIn("min-h-[48px]", match.group(1), f"{btn_id} must include min-h-[48px]")
            self.assertIn("min-w-[48px]", match.group(1), f"{btn_id} must include min-w-[48px]")

    def test_r6_styles_css_min_dimensions(self):
        self.assertIn("min-height: 48px", self.css)
        self.assertIn("min-width: 48px", self.css)

if __name__ == "__main__":
    unittest.main()
```

### 5.3 Invalidation Conditions
- If `liveTimerToggleBtn` reverts to `flex-1` upon starting or pausing the timer, the fix was incomplete (omitted `app.js`).
- If `liveBtnScoreADec` or `liveBtnScoreBDec` shrinks under 48px in height during mobile landscape piste mode (`max-height: 550px`), `min-h-[48px]` was omitted or overridden.
