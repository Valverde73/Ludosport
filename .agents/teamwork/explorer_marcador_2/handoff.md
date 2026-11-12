# Handoff Report: Explorer Marcador 2 (Requirements R2 & R5)

## 1. Observation

Direct examination of `app.js`, `index.html`, and `styles.css` revealed the following exact implementation details and code locations:

### 1.1 Requirement R2: Timer Duration, Reset, Formatting, and Increments

1. **Timer State Initialization in Constructor (`app.js:63-65`)**:
   ```javascript
   this.liveScoreA = 0;
   this.liveScoreB = 0;
   this.timerSeconds = 120; // 2 minutes official bout
   this.timerInterval = null;
   this.timerRunning = false;
   ```
   - Direct observation: `this.timerSeconds` is hardcoded to `120` seconds. There is no `this.timerBaseSeconds` or `this.timerStarted` property.

2. **Timer Formatting & Status Text Evaluation (`app.js:2371-2407`)**:
   ```javascript
   const mins = Math.floor(this.timerSeconds / 60);
   const secs = this.timerSeconds % 60;
   display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
   ```
   and status text condition:
   ```javascript
   } else {
     label.textContent = this.timerSeconds === 0 ? 'Reiniciar' : 'Iniciar';
     toggleBtn.className = '...';
     if (statusText) {
       if (this.timerSeconds === 0) {
         statusText.textContent = '¡Tiempo agotado!';
         statusText.className = 'text-[11px] font-bold text-rose-400 mt-1';
       } else if (this.timerSeconds < 120) {
         statusText.textContent = 'Combate en pausa';
         statusText.className = 'text-[11px] font-semibold text-amber-400 mt-1';
       } else {
         statusText.textContent = 'Listo para iniciar';
         statusText.className = 'text-[11px] font-semibold text-slate-400 mt-1';
       }
     }
   }
   ```
   - Direct observation: At line 2399, `this.timerSeconds < 120` is hardcoded. If the default time is changed to 90 seconds (01:30) without updating this logic, a freshly loaded or reset scoreboard (`timerSeconds = 90`) will evaluate `90 < 120` as `true`, displaying **"Combate en pausa"** instead of **"Listo para iniciar"**.

3. **Timer Start & Restart from Zero (`app.js:2413-2416`)**:
   ```javascript
   startLiveTimer() {
     if (this.timerInterval) clearInterval(this.timerInterval);
     if (this.timerSeconds === 0) this.timerSeconds = 120;

     this.timerRunning = true;
     this.playBeep(750, 0.15);
     this.updateLiveTimerDisplay();
   ```
   - Direct observation: At line 2415, restarting the timer after it reaches 00:00 hardcodes `this.timerSeconds = 120;`.

4. **Timer Reset (`app.js:2457-2462`)**:
   ```javascript
   resetLiveTimer() {
     this.pauseLiveTimer();
     this.timerSeconds = 120;
     this.updateLiveTimerDisplay();
     this.playBeep(500, 0.1);
   }
   ```
   - Direct observation: Resetting hardcodes `this.timerSeconds = 120;`.

5. **Timer Increment "+30s" (`app.js:2464-2467`)**:
   ```javascript
   addLiveTimerSeconds(extra = 30) {
     this.timerSeconds += extra;
     this.updateLiveTimerDisplay();
   }
   ```
   - Direct observation: `addLiveTimerSeconds` increments `timerSeconds` cumulatively with no upper bound. However, there is no enforcement mechanism preventing negative inputs or reductions below the official minimum 01:30 (90 seconds).

6. **Static HTML Labels in `index.html`**:
   - `index.html:237`: `<p class="text-[11px] text-slate-400 truncate">Cronómetro de 2:00, botones táctiles gigantes y vista horizontal.</p>`
   - `index.html:430`: `<p class="text-xs text-slate-400">Arbitraje táctil de asaltos a 2:00 &bull; Ideal en horizontal</p>`
   - `index.html:509`: `Tiempo Oficial (2:00)`
   - `index.html:512`: `<div id="liveTimerDisplay" ...>02:00</div>`
   - `index.html:524`: `<button type="button" id="liveTimerResetBtn" ... title="Reiniciar a 2:00">`

---

### 1.2 Requirement R5: Accidental Touch Prevention on "FINALIZAR Y GUARDAR COMBATE"

1. **HTML Button Element (`index.html:540-543`)**:
   ```html
   <button type="button" id="liveFinishAndSaveBtn" class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:brightness-110 text-white font-display font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
     <i data-lucide="check-circle-2" class="w-4 h-4"></i>
     Finalizar y Guardar Combate
   </button>
   ```
   - Direct observation: The button currently has no `disabled` attribute, no Tailwind `disabled:...` variant classes (e.g., `disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none`), and no dedicated `:disabled` CSS rules in `styles.css`.

2. **Click Listener Wiring (`app.js:3007`)**:
   ```javascript
   document.getElementById('liveFinishAndSaveBtn')?.addEventListener('click', () => this.finishAndSaveLiveCombat());
   ```

3. **Method `finishAndSaveLiveCombat()` (`app.js:2469-2495`)**:
   ```javascript
   async finishAndSaveLiveCombat() {
     const fA = this.fencers.find(f => f.id === this.liveFighterAId);
     const fB = this.fencers.find(f => f.id === this.liveFighterBId);

     if (!fA || !fB) {
       this.showToast('Selecciona a ambos tiradores (Alfa y Beta) antes de finalizar', 'amber');
       return;
     }
     ...
     this.pauseLiveTimer();
   ```
   - Direct observation: `finishAndSaveLiveCombat()` does NOT guard against invocation while `this.timerRunning` is true. If tapped during an active bout, it pauses the timer and saves the combat prematurely.

4. **Centralized Timer UI Refresh (`app.js:2363-2411`)**:
   - `updateLiveTimerDisplay()` is invoked synchronously during all timer transitions:
     - When starting: `startLiveTimer()` (`app.js:2419`)
     - During countdown tick: `setInterval` (`app.js:2427`)
     - When paused: `pauseLiveTimer()` (`app.js:2445`)
     - When toggled: `toggleLiveTimer()` via start/pause
     - When reset: `resetLiveTimer()` (`app.js:2460`)
     - When time is added: `addLiveTimerSeconds()` (`app.js:2466`)
     - When bout ends at 00:00: `pauseLiveTimer()` (`app.js:2430`)
     - When scoreboard loads: `initLiveScoreboard()` (`app.js:2257`)
   - Direct observation: Currently `updateLiveTimerDisplay()` updates `#liveTimerDisplay`, `#liveTimerStatusText`, `#liveTimerToggleBtn`, `#liveTimerIcon`, and `#liveTimerActionLabel`, but does NOT update `#liveFinishAndSaveBtn.disabled`.

---

## 2. Logic Chain

From the observations above, the required design and reasoning follow:

### 2.1 Logic Chain for Requirement R2 (Official Timer Logic)

1. **Base Time Constant & Configuration**:
   - *Premise (Obs 1.1.1, 1.1.4)*: The official duration must be 01:30 (90 seconds). Setting `this.timerSeconds = 90` and `this.timerBaseSeconds = 90` aligns initial state with the official rule.
   - *Premise (Obs 1.1.6)*: Changing `02:00` to `01:30` in `index.html` (header badge, display text, and reset tooltip) ensures visual consistency before JS hydration.

2. **Eliminating the Status Text Glitch via `this.timerStarted`**:
   - *Premise (Obs 1.1.2)*: Checking `this.timerSeconds < 120` caused false "Combate en pausa" when `timerSeconds` was reduced to 90.
   - *Reasoning*: The status text represents one of four states:
     a) Running (`this.timerRunning === true`): "Combate en curso" (emerald)
     b) Finished (`this.timerSeconds === 0`): "¡Tiempo agotado!" (rose)
     c) Paused mid-bout (`!this.timerRunning && this.timerStarted && this.timerSeconds > 0`): "Combate en pausa" (amber)
     d) Ready to start (`!this.timerRunning && !this.timerStarted && this.timerSeconds > 0`): "Listo para iniciar" (slate)
   - Introducing `this.timerStarted = false` in `constructor`, setting `this.timerStarted = true` in `startLiveTimer()`, and resetting `this.timerStarted = false` in `resetLiveTimer()` and `finishAndSaveLiveCombat()` provides deterministic, bug-free status messages regardless of whether the round was extended to 2:00, 2:30, or kept at 01:30.

3. **Cumulative "+30s" without Upper Bound**:
   - *Premise (Obs 1.1.5)*: `this.timerSeconds += extra` naturally permits infinite cumulative increments.
   - *Enforcement of Minimum Duration (>= 90s)*:
     To ensure the configured round duration can NEVER be set or reduced below 01:30 (90s):
     - If `setRoundDuration(sec)` is invoked: `this.timerBaseSeconds = Math.max(90, sec);`
     - If `addLiveTimerSeconds(extra)` is called with a negative value: `this.timerSeconds = Math.max(90, this.timerSeconds + extra);`
     - `resetLiveTimer()`: `this.timerSeconds = Math.max(90, this.timerBaseSeconds || 90);`
     - `startLiveTimer()` on 00:00: `if (this.timerSeconds === 0) this.timerSeconds = Math.max(90, this.timerBaseSeconds || 90);`

### 2.2 Logic Chain for Requirement R5 (Accidental Touch Prevention)

1. **Centralized Disabled Binding**:
   - *Premise (Obs 1.2.4)*: `updateLiveTimerDisplay()` is the single source of truth called on every timer state transition (running, paused, reset, finished).
   - *Reasoning*: Adding:
     ```javascript
     const finishBtn = document.getElementById('liveFinishAndSaveBtn');
     if (finishBtn) {
       finishBtn.disabled = this.timerRunning;
     }
     ```
     guarantees that:
     - While `this.timerRunning` is `true`, `finishBtn.disabled` is `true`.
     - When paused (`pauseLiveTimer`), `finishBtn.disabled` is `false`.
     - When timer runs down to `00:00`, `pauseLiveTimer` is called, so `finishBtn.disabled` becomes `false`.
     - When reset (`resetLiveTimer`), `finishBtn.disabled` becomes `false`.

2. **Defensive Guard in `finishAndSaveLiveCombat`**:
   - *Premise (Obs 1.2.3)*: Scripted calls, keyboard events, or browser quirks could attempt to fire the click listener while running.
   - *Reasoning*: Adding an early guard:
     ```javascript
     if (this.timerRunning) {
       this.showToast('Pausa el cronómetro antes de finalizar el combate', 'amber');
       return;
     }
     ```
     ensures data integrity and prevents race conditions.

3. **Multi-layer Visual Disabled Styling**:
   - *Premise (Obs 1.2.1)*: Touchscreens require immediate visual and interaction cues that a button cannot be tapped.
   - *Reasoning*:
     - In `index.html`: Add Tailwind utilities `disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none disabled:brightness-75`.
     - In `styles.css`: Add explicit CSS rule:
       ```css
       #liveFinishAndSaveBtn:disabled {
         opacity: 0.4 !important;
         cursor: not-allowed !important;
         pointer-events: none !important;
         box-shadow: none !important;
         filter: grayscale(0.5) !important;
       }
       ```
     - Combining `pointer-events: none` with `disabled` completely suppresses touches on mobile Safari/Chrome, and `opacity: 0.4` + `grayscale` clearly communicates the lock state to arbiters.

---

## 3. Caveats

1. **Decoupling from R4 Layout Refactor**: Requirement R4 proposes moving `#liveTimerToggleBtn` to full width and rearranging Reset and +30s buttons. Our proposed changes strictly target DOM IDs (`#liveTimerToggleBtn`, `#liveTimerResetBtn`, `#liveTimerAdd30Btn`, `#liveFinishAndSaveBtn`, `#liveTimerDisplay`, `#liveTimerStatusText`). This ensures zero conflict when Worker applies R4's layout changes.
2. **Audio Context on Mobile**: Web Audio API requires user gesture activation. Because `toggleLiveTimer()` is triggered by user touch/click, audio beeps are active during normal operation. If sound is muted (`!this.isSoundEnabled`), beeps are safely skipped.
3. **No Caveats on Persistence**: Marcador live scoreboard is purposefully in-memory per bout session; match data is persisted to LocalStorage and Supabase upon clicking "FINALIZAR Y GUARDAR COMBATE".

---

## 4. Conclusion & Proposed Implementation Blueprint

### 4.1 Target Files & Snippets

#### A. File: `app.js`

1. **Constructor (`app.js:63`)**:
   ```javascript
   // Live Scoreboard & Timer State
   this.liveFighterAId = '';
   this.liveFighterBId = '';
   this.liveScoreA = 0;
   this.liveScoreB = 0;
   this.timerBaseSeconds = 90; // 01:30 base official bout duration
   this.timerSeconds = 90;
   this.timerInterval = null;
   this.timerRunning = false;
   this.timerStarted = false;
   this.isSoundEnabled = true;
   ```

2. **In `updateLiveTimerDisplay()` (`app.js:2363-2411`)**:
   ```javascript
   updateLiveTimerDisplay() {
     const display = document.getElementById('liveTimerDisplay');
     const statusText = document.getElementById('liveTimerStatusText');
     const toggleBtn = document.getElementById('liveTimerToggleBtn');
     const icon = document.getElementById('liveTimerIcon');
     const label = document.getElementById('liveTimerActionLabel');
     const finishBtn = document.getElementById('liveFinishAndSaveBtn');

     // Accidental touch prevention: disabled while timer is running
     if (finishBtn) {
       finishBtn.disabled = this.timerRunning;
     }

     if (display) {
       const mins = Math.floor(this.timerSeconds / 60);
       const secs = this.timerSeconds % 60;
       display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

       if (this.timerSeconds <= 10 && this.timerSeconds > 0) {
         display.classList.add('timer-critical');
       } else {
         display.classList.remove('timer-critical');
       }
     }

     if (toggleBtn && label) {
       if (this.timerRunning) {
         label.textContent = 'Pausar';
         toggleBtn.className = 'flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all';
         if (icon) icon.setAttribute('data-lucide', 'pause');
         if (statusText) {
           statusText.textContent = 'Combate en curso';
           statusText.className = 'text-[11px] font-semibold text-emerald-400 mt-1';
         }
       } else {
         label.textContent = this.timerSeconds === 0 ? 'Reiniciar' : 'Iniciar';
         toggleBtn.className = 'flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all';
         if (icon) icon.setAttribute('data-lucide', 'play');
         if (statusText) {
           if (this.timerSeconds === 0) {
             statusText.textContent = '¡Tiempo agotado!';
             statusText.className = 'text-[11px] font-bold text-rose-400 mt-1';
           } else if (this.timerStarted) {
             statusText.textContent = 'Combate en pausa';
             statusText.className = 'text-[11px] font-semibold text-amber-400 mt-1';
           } else {
             statusText.textContent = 'Listo para iniciar';
             statusText.className = 'text-[11px] font-semibold text-slate-400 mt-1';
           }
         }
       }
     }

     if (window.lucide) window.lucide.createIcons();
   }
   ```

3. **In `startLiveTimer()`, `resetLiveTimer()`, and `addLiveTimerSeconds()` (`app.js:2413-2467`)**:
   ```javascript
   startLiveTimer() {
     if (this.timerInterval) clearInterval(this.timerInterval);
     if (this.timerSeconds === 0) {
       this.timerSeconds = Math.max(90, this.timerBaseSeconds || 90);
     }

     this.timerRunning = true;
     this.timerStarted = true;
     this.playBeep(750, 0.15);
     this.updateLiveTimerDisplay();

     this.timerInterval = setInterval(() => {
       if (this.timerSeconds > 0) {
         this.timerSeconds--;
         if (this.timerSeconds <= 5 && this.timerSeconds > 0) {
           this.playBeep(600, 0.08);
         }
         this.updateLiveTimerDisplay();
       } else {
         // Bout time over!
         this.pauseLiveTimer();
         this.playBeep(880, 0.25);
         setTimeout(() => this.playBeep(880, 0.25), 300);
         setTimeout(() => this.playBeep(1100, 0.5), 600);
         this.showToast('🔔 ¡Tiempo de asalto finalizado!', 'rose');
       }
     }, 1000);
   }

   pauseLiveTimer() {
     if (this.timerInterval) {
       clearInterval(this.timerInterval);
       this.timerInterval = null;
     }
     this.timerRunning = false;
     this.updateLiveTimerDisplay();
   }

   toggleLiveTimer() {
     if (this.timerRunning) {
       this.pauseLiveTimer();
       this.playBeep(450, 0.1);
     } else {
       this.startLiveTimer();
     }
   }

   resetLiveTimer() {
     this.pauseLiveTimer();
     this.timerStarted = false;
     this.timerSeconds = Math.max(90, this.timerBaseSeconds || 90);
     this.updateLiveTimerDisplay();
     this.playBeep(500, 0.1);
   }

   addLiveTimerSeconds(extra = 30) {
     if (extra < 0 && !this.timerRunning) {
       this.timerSeconds = Math.max(90, this.timerSeconds + extra);
     } else {
       this.timerSeconds += extra;
     }
     this.updateLiveTimerDisplay();
   }
   ```

4. **In `finishAndSaveLiveCombat()` (`app.js:2469+`)**:
   ```javascript
   async finishAndSaveLiveCombat() {
     if (this.timerRunning) {
       this.showToast('Pausa o detén el cronómetro antes de finalizar el combate', 'amber');
       return;
     }

     const fA = this.fencers.find(f => f.id === this.liveFighterAId);
     const fB = this.fencers.find(f => f.id === this.liveFighterBId);
     ...
     this.pauseLiveTimer();
     this.timerStarted = false;
     ...
     this.resetLiveTimer();
     ...
   ```

#### B. File: `index.html`

1. **Header Badge and Initial Display (`index.html:507-526`)**:
   - Line 509: Change `Tiempo Oficial (2:00)` to `Tiempo Oficial (01:30)`.
   - Line 512: Change `02:00` to `01:30`.
   - Line 524: Change `title="Reiniciar a 2:00"` to `title="Reiniciar a 01:30"`.
   - Lines 237 & 430: Update promotional/header text to refer to "asaltos a 01:30".

2. **Finalize Button Tailwind Classes (`index.html:540`)**:
   ```html
   <button type="button" id="liveFinishAndSaveBtn" class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none disabled:brightness-75 text-white font-display font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
     <i data-lucide="check-circle-2" class="w-4 h-4"></i>
     Finalizar y Guardar Combate
   </button>
   ```

#### C. File: `styles.css`

Add explicit disabled styling rule:
```css
/* Accidental Touch Prevention: Live Finish Button Disabled State */
#liveFinishAndSaveBtn:disabled {
  opacity: 0.4 !important;
  cursor: not-allowed !important;
  pointer-events: none !important;
  box-shadow: none !important;
  filter: grayscale(0.5) !important;
}
```

---

## 5. Verification Method

### 5.1 Verification Commands
Run unit and integration tests using Python's test runner:
```powershell
python -m unittest test_marcador_timer.py
```
And verify existing test suite remains green:
```powershell
python test_ui_refactor.py
```

### 5.2 Verification Script Specification (`test_marcador_timer.py`)
The verification test should assert:
1. `test_r2_initial_timer_seconds`: Asserts `timerSeconds = 90` and `timerBaseSeconds = 90` in `app.js:constructor`.
2. `test_r2_html_initial_display`: Asserts `01:30` exists in `#liveTimerDisplay` and `Tiempo Oficial (01:30)` in `index.html`.
3. `test_r2_reset_to_base_duration`: Asserts `resetLiveTimer` sets `timerSeconds` to base 90.
4. `test_r2_cumulative_increment_unbounded`: Asserts `addLiveTimerSeconds` increments by 30 cumulatively.
5. `test_r2_min_duration_enforcement`: Asserts configured round duration is strictly >= 90s.
6. `test_r2_status_text_not_hardcoded_120`: Asserts `timerSeconds < 120` bug is eliminated.
7. `test_r5_finish_button_disabled_binding`: Asserts `updateLiveTimerDisplay` sets `finishBtn.disabled = this.timerRunning`.
8. `test_r5_finish_button_handler_guard`: Asserts `finishAndSaveLiveCombat` checks `this.timerRunning` before saving.
9. `test_r5_disabled_css_and_attributes`: Asserts `#liveFinishAndSaveBtn:disabled` in `styles.css` has `opacity: 0.4` and `pointer-events: none`.

### 5.3 Invalidation Conditions
- If `#liveTimerDisplay` starts at `02:00` or `timerSeconds` defaults to 120, R2 is invalidated.
- If "+30s" has an artificial ceiling or does not accumulate, R2 is invalidated.
- If configuring the bout duration can set the clock below 01:30 (90s), R2 is invalidated.
- If `#liveFinishAndSaveBtn` remains enabled or interactive while `this.timerRunning === true`, R5 is invalidated.
- If `#liveFinishAndSaveBtn` remains disabled after the timer is paused, reset, or reaches 00:00, R5 is invalidated.
