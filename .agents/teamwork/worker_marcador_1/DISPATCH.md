# Dispatch: worker_marcador_1

## Task
Implement Milestone M1: "Marcador en Directo Refactor & Usability Enhancement" covering Requirements R1 to R6.

## Inputs
- ORIGINAL_REQUEST: c:\Users\Ana\Documents\LudoSport\.agents\teamwork\ORIGINAL_REQUEST.md
- PROJECT: c:\Users\Ana\Documents\LudoSport\.agents\teamwork\PROJECT.md
- Explorer 1 Report (R1 & R3): c:\Users\Ana\Documents\LudoSport\.agents\teamwork\explorer_marcador_1\handoff.md
- Explorer 2 Report (R2 & R5): c:\Users\Ana\Documents\LudoSport\.agents\teamwork\explorer_marcador_2\handoff.md
- Explorer 3 Report (R4 & R6): c:\Users\Ana\Documents\LudoSport\.agents\teamwork\explorer_marcador_3\handoff.md
- State Folder: c:\Users\Ana\Documents\LudoSport\.agents\teamwork\worker_marcador_1

## Exclusive File Ownership
You have exclusive write access to:
- `index.html`
- `app.js`
- `styles.css`
- Any new test file (e.g., `test_marcador_live.py`)

## Detailed Requirements Summary
1. **R1**: In `index.html` (lines 478, 553), remove `truncate` from `#liveFighterAName` and `#liveFighterBName` and apply `whitespace-normal leading-tight line-clamp-2`. In `styles.css`, add rule for `.live-corner-card h3, #liveFighterAName, #liveFighterBName` with `white-space: normal !important`, `-webkit-line-clamp: 2`, `display: -webkit-box`, `-webkit-box-orient: vertical`, `overflow: hidden`, `line-height: 1.25`.
2. **R2**: In `app.js` constructor, set `this.timerBaseSeconds = 90; this.timerSeconds = 90; this.timerStarted = false;`. In `startLiveTimer()`, set `this.timerStarted = true` and reset to base 90 if 0. In `resetLiveTimer()`, set `this.timerStarted = false` and reset to base 90. In `addLiveTimerSeconds()`, allow cumulative additions without upper bound, and guarantee configured duration >= 90s. In `updateLiveTimerDisplay()`, use `this.timerStarted` to evaluate "Combate en pausa" (do NOT hardcode `timerSeconds < 120`). In `index.html`, update default display to `01:30`, title to `01:30`, and badge to `Tiempo Oficial (01:30)`.
3. **R3**: In `index.html` (lines 488, 563), replace `text-slate-500` with `text-white/60` for "OHs Anotados". In `styles.css`, add `.live-corner-card span.tracking-widest { color: rgba(255, 255, 255, 0.6) !important; }` guaranteeing WCAG AA >= 4.5:1 contrast on navy background `#0f172a`.
4. **R4**: In `index.html` (lines 518-531), reorganize timer buttons into two rows: Row 1 has `#liveTimerToggleBtn` with `w-full`; Row 2 has a 2-col grid for `#liveTimerResetBtn` and `#liveTimerAdd30Btn` styled with secondary ghost/outline (`bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/80`). In `app.js` (`updateLiveTimerDisplay`), ensure `toggleBtn.className` uses `w-full` (not `flex-1`) in both running (amber) and stopped (emerald) states.
5. **R5**: In `app.js` (`updateLiveTimerDisplay`), centrally bind `finishBtn.disabled = this.timerRunning`. In `finishAndSaveLiveCombat()`, add defensive guard `if (this.timerRunning) return;` and reset `this.timerStarted = false`. In `index.html`, add `disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none disabled:brightness-75` to `#liveFinishAndSaveBtn`. In `styles.css`, add `#liveFinishAndSaveBtn:disabled { opacity: 0.4 !important; cursor: not-allowed !important; pointer-events: none !important; box-shadow: none !important; filter: grayscale(0.5) !important; }`.
6. **R6**: In `index.html` (lines 492-499 and 567-574), add `min-h-[48px] min-w-[48px]` to `#liveBtnScoreADec`, `#liveBtnScoreAInc`, `#liveBtnScoreBDec`, and `#liveBtnScoreBInc`. In `styles.css`, add explicit rule `#liveBtnScoreADec, #liveBtnScoreAInc, #liveBtnScoreBDec, #liveBtnScoreBInc { min-height: 48px; min-width: 48px; }`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Verification
- Run existing tests: `python -m unittest discover`, `node test_empirical_challenger.js`.
- Create and run `test_marcador_live.py` covering all 6 requirements (R1-R6) with rigorous assertions.
- Write handoff report in `c:\Users\Ana\Documents\LudoSport\.agents\teamwork\worker_marcador_1\handoff.md`.


## 2026-11-12T10:01:27Z
You are an implementation worker agent. Implement Milestone M1: Marcador en Directo Refactor & Usability Enhancement.

MANDATORY INPUT: You MUST read ORIGINAL_REQUEST.md at c:\Users\Ana\Documents\LudoSport\.agents\teamwork\ORIGINAL_REQUEST.md before starting work.
Also read PROJECT.md at c:\Users\Ana\Documents\LudoSport\.agents\teamwork\PROJECT.md and your dispatch at c:\Users\Ana\Documents\LudoSport\.agents\teamwork\worker_marcador_1\DISPATCH.md.
Also refer to the 3 explorer reports:
- c:\Users\Ana\Documents\LudoSport\.agents\teamwork\explorer_marcador_1\handoff.md (R1 & R3)
- c:\Users\Ana\Documents\LudoSport\.agents\teamwork\explorer_marcador_2\handoff.md (R2 & R5)
- c:\Users\Ana\Documents\LudoSport\.agents\teamwork\explorer_marcador_3\handoff.md (R4 & R6)

Working directory: c:\Users\Ana\Documents\LudoSport
State folder: c:\Users\Ana\Documents\LudoSport\.agents\teamwork\worker_marcador_1

Exclusive write ownership:
- index.html
- app.js
- styles.css
- test_marcador_live.py (for verification)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope & Tasks:
1. R1: Title wrapping for fencer names in live corner cards (remove truncate, add whitespace-normal line-clamp-2, CSS multi-line clamp up to 2 lines).
2. R2: Official timer logic: default base time 01:30 (90s), cumulative +30s without upper limit, configured round time never below 01:30, track timerStarted to avoid false pause glitch.
3. R3: Text contrast for "OHS ANOTADOS" elevated to meet WCAG AA (>= 4.5:1) with text-white/60 and CSS rule.
4. R4: Timer controls visual hierarchy: INICIAR 100% width (w-full in index.html AND app.js updateLiveTimerDisplay), secondary buttons underneath in 2-col grid with ghost/outline styling.
5. R5: Accidental touch prevention on "FINALIZAR Y GUARDAR COMBATE": reactive disabled binding in updateLiveTimerDisplay, defensive guard in finishAndSaveLiveCombat, disabled styling in HTML and styles.css.
6. R6: Tactile hit-areas >= 48x48px for point buttons (+ and -) in index.html and styles.css.

Verification:
- Run existing tests: python -m unittest discover and node test_empirical_challenger.js
- Write and run test_marcador_live.py verifying R1 through R6
- Document all changes, test commands, and results in c:\Users\Ana\Documents\LudoSport\.agents\teamwork\worker_marcador_1\handoff.md
- Send completion message to parent when finished.
