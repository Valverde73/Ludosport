# Project: LudoSport Marcador en Directo Refactor & Usability Enhancement

## Architecture
- **Tech Stack**: Vanilla JavaScript (ES6+), HTML5, Tailwind CSS (via CDN) + custom `styles.css`.
- **Application Structure**:
  - `index.html`: Main shell, layout, `#tab-live` live scoreboard markup (Corner Alfa, Corner Beta, Center Timer, Action Buttons).
  - `app.js`: Application logic (`LudoSportApp`), state management, timer management (`startLiveTimer`, `pauseLiveTimer`, `resetLiveTimer`, `addLiveTimerSeconds`, `updateLiveTimerDisplay`), bout saving (`finishAndSaveLiveCombat`).
  - `styles.css`: Custom CSS rules, responsive piste layout, touch targets, disabled button styles, typography clamping.
  - `test_marcador_live.py`, `test_challenger_marcador_ui.py`, `test_empirical_timer_r2_r5.js`, `test_challenger_marcador_ui.js`: Verification test suites (95/95 python tests + 1235 node assertions passing).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | R1: Fencer Name Truncation Fix | Remove `truncate` from `#liveFighterAName` and `#liveFighterBName`; add `whitespace-normal leading-tight line-clamp-2` in HTML and CSS multi-line clamp (up to 2 lines) so names and first surnames are never cut off by single-line ellipsis | M1 | ORIGINAL_REQUEST §R1 |
| 2 | R2: Official Timer Logic (01:30 Base) | Adjust default base round duration to 01:30 (90s); cumulative "+30s" allows unbounded increments; ensure configured round duration is strictly >= 01:30 (90s); track `this.timerStarted` to prevent false "Combate en pausa" glitch | M1 | ORIGINAL_REQUEST §R2 |
| 3 | R3: Text Contrast & Accessibility ("OHS ANOTADOS") | Change text color of "OHS ANOTADOS" on live corner cards from `text-slate-500` (#64748b, 3.75:1) to `text-white/60` (or `rgba(255, 255, 255, 0.6)` in CSS, 6.99:1), meeting and exceeding WCAG AA minimum contrast (>= 4.5:1) on `#0f172a` navy background | M1 | ORIGINAL_REQUEST §R3 |
| 4 | R4: Timer Controls Visual Hierarchy | Make "INICIAR / PAUSAR" (`#liveTimerToggleBtn`) occupy 100% width of its row (`w-full` in `index.html` AND `app.js` `updateLiveTimerDisplay`); place secondary buttons ("Reset" and "+30s") underneath in a 2-column grid with ghost/outline styling (`bg-transparent border border-slate-700/80`) | M1 | ORIGINAL_REQUEST §R4 |
| 5 | R5: Accidental Touch Prevention on Save | Bind `#liveFinishAndSaveBtn.disabled = this.timerRunning` centrally in `updateLiveTimerDisplay()`; add defensive guard `if (this.timerRunning) return;` in `finishAndSaveLiveCombat()`; apply visual disabled styles (`disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none disabled:brightness-75` in HTML and `:disabled` rule in `styles.css`) | M1 | ORIGINAL_REQUEST §R5 |
| 6 | R6: Tactile Hit-Areas (>= 48x48px) | Ensure all score increment and decrement buttons (`liveBtnScoreADec`, `liveBtnScoreAInc`, `liveBtnScoreBDec`, `liveBtnScoreBInc`) have `min-h-[48px] min-w-[48px]` in `index.html` and explicit CSS contract in `styles.css` | M1 | ORIGINAL_REQUEST §R6 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Marcador en Directo Refactor | Implementation of R1, R2, R3, R4, R5, R6 in `app.js`, `styles.css`, and `index.html` + comprehensive verification | Survey complete | DONE |

## Interface Contracts & Code Layout
### Code Layout & Ownership
- `index.html`:
  - Lines 478, 560: `#liveFighterAName`, `#liveFighterBName` (`whitespace-normal leading-tight line-clamp-2`, no `truncate`).
  - Lines 488, 570: `#liveScoreADisplay` / "OHs Anotados" (`text-white/60 tracking-widest`).
  - Lines 509, 512, 528: Header badge "Tiempo Oficial (01:30)", initial display "01:30", reset tooltip "Reiniciar temporizador".
  - Lines 519-537: Timer buttons layout (row 1: `#liveTimerToggleBtn` `w-full`; row 2: 2-col grid for `#liveTimerResetBtn` and `#liveTimerAdd30Btn` with ghost styling).
  - Line 547: `#liveFinishAndSaveBtn` (`disabled:...` Tailwind utilities).
  - Lines 493, 496, 575, 578: `#liveBtnScoreADec`, `#liveBtnScoreAInc`, `#liveBtnScoreBDec`, `#liveBtnScoreBInc` (`min-h-[48px] min-w-[48px]`).
- `app.js`:
  - Lines 63-67: Constructor state initialization (`timerBaseSeconds = 90`, `timerSeconds = 90`, `timerStarted = false`).
  - Lines 2365-2415: `updateLiveTimerDisplay()`:
    - Bind `finishBtn.disabled = this.timerRunning`.
    - Update `toggleBtn.className` to use `w-full` (not `flex-1`) in both running (amber) and stopped (emerald) states.
    - Evaluate status text using `this.timerStarted` instead of hardcoded `timerSeconds < 120`.
  - Lines 2420-2488:
    - `startLiveTimer()`: set `this.timerStarted = true`, reset to `Math.max(90, this.timerBaseSeconds || 90)` when 0.
    - `resetLiveTimer()`: reset `this.timerStarted = false`, set `timerSeconds = Math.max(90, this.timerBaseSeconds || 90)`.
    - `addLiveTimerSeconds(extra = 30)`: unbounded cumulative addition, min duration floor >= 90s.
    - `setRoundDuration(sec)`: floor clamp >= 90s.
  - Lines 2493+:
    - `finishAndSaveLiveCombat()`: defensive guard `if (this.timerRunning) { this.showToast(...); return; }`, reset `this.timerStarted = false`.
- `styles.css`:
  - Lines 460-470: Multi-line clamping rule for fencer titles: `.live-corner-card h3, #liveFighterAName, #liveFighterBName { white-space: normal !important; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.25; }`.
  - Lines 472-475: Contrast enforcement for OHs label: `.live-corner-card span.tracking-widest { color: rgba(255, 255, 255, 0.6) !important; }`.
  - Lines 477-484: Disabled state styling: `#liveFinishAndSaveBtn:disabled { opacity: 0.4 !important; cursor: not-allowed !important; pointer-events: none !important; box-shadow: none !important; filter: grayscale(0.5) !important; }`.
  - Lines 486-494: Hit-areas touch target guarantee: `#liveBtnScoreADec, #liveBtnScoreAInc, #liveBtnScoreBDec, #liveBtnScoreBInc { min-height: 48px; min-width: 48px; }`.
