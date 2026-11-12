# Handoff Report — Explorer 2: Requirement R2 (Podium Zero-State & Dynamic Neon Activation)

## 1. Observation

### 1.1 DOM Container & Location
- **File**: `index.html` (lines 178–181)
  ```html
  <!-- Ranking Podium / Top 3 Preview -->
  <div id="podiumContainer" class="grid grid-cols-3 gap-2 mb-4">
    <!-- Rendered by JS -->
  </div>
  ```
- **Context**: Located inside `#viewRanking` (`<div id="viewRanking" class="space-y-4">`, line 155), directly between the ranking header/refresh controls (`lines 156–176`) and the "Medallero & Títulos del Mes" section (`#monthlyMedalsSection`, line 184).

### 1.2 Data Flow & Stats Calculation
- **File**: `app.js`, method `calculateStandings()` (lines 582–667)
  ```javascript
  calculateStandings() {
    const statsMap = {};

    // Initialize every fencer with 0
    this.fencers.forEach(f => {
      statsMap[f.id] = {
        fencer: f,
        matchesPlayed: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        diff: 0,
        points: 0
      };
    });

    // Compute matches
    this.matches.forEach(m => {
      ...
      if (m.result === 'VICTORY_A') {
        if (statsA) { statsA.won++; statsA.points += 3; }
        if (statsB) { statsB.lost++; }
      } else if (m.result === 'VICTORY_B') {
        if (statsB) { statsB.won++; statsB.points += 3; }
        if (statsA) { statsA.lost++; }
      } else if (m.result === 'DRAW') {
        if (statsA) { statsA.drawn++; statsA.points += 1; }
        if (statsB) { statsB.drawn++; statsB.points += 1; }
      }
    });

    // Sort order:
    // 1. Points descending (PTS)
    // 2. Victories descending (V)
    // 3. Goal/Point difference descending (DIF)
    // 4. Points scored descending (PF)
    // 5. Matches played ascending
    // 6. Name alphabetically
    const standings = Object.values(statsMap).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.won !== a.won) return b.won - a.won;
      if (b.diff !== a.diff) return b.diff - a.diff;
      if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
      if (a.matchesPlayed !== b.matchesPlayed) return a.matchesPlayed - b.matchesPlayed;
      return a.fencer.name.localeCompare(b.fencer.name);
    });

    return standings;
  }
  ```

### 1.3 Current Podium Rendering Implementation
- **File**: `app.js`, method `renderRanking()` (lines 834–876)
  ```javascript
    // Render Podium (Top 3)
    if (podiumContainer) {
      if (standings.length >= 3) {
        const first = standings[0];
        const second = standings[1];
        const third = standings[2];

        podiumContainer.innerHTML = `
          <!-- 2nd Place -->
          <div data-fencer-profile="${second.fencer.id}" title="Ver perfil de ${second.fencer.name}" class="podium-card cursor-pointer p-2.5 rounded-2xl bg-lsCard/90 border border-slate-700/60 flex flex-col items-center justify-end text-center pt-4 hover:border-slate-500 transition-all">
            <span class="w-6 h-6 rounded-full bg-slate-400/20 text-slate-300 font-bold text-xs flex items-center justify-center mb-1">2</span>
            <div class="mb-1.5 shadow-md">
              ${this.getFencerAvatarHtml(second.fencer, 'w-10 h-10', true)}
            </div>
            <div class="font-bold text-xs text-slate-200 truncate w-full">${second.fencer.name}</div>
            <div class="text-[10px] text-slate-400">${second.points} pts &bull; ${second.won}V &bull; Dif ${second.diff >= 0 ? '+' : ''}${second.diff}</div>
          </div>

          <!-- 1st Place (Gold / Crown) -->
          <div data-fencer-profile="${first.fencer.id}" title="Ver perfil de ${first.fencer.name}" class="podium-card cursor-pointer p-3 rounded-2xl bg-gradient-to-b from-amber-500/15 via-lsCard to-lsCard border border-amber-500/50 flex flex-col items-center justify-end text-center pt-2 relative shadow-lg shadow-amber-500/10 hover:border-amber-400 transition-all">
            <i data-lucide="crown" class="w-5 h-5 text-amber-400 mb-0.5 animate-bounce"></i>
            <div class="mb-1.5 shadow-lg shadow-amber-500/30">
              ${this.getFencerAvatarHtml(first.fencer, 'w-12 h-12', true)}
            </div>
            <div class="font-bold text-xs text-amber-300 truncate w-full">${first.fencer.name}</div>
            <div class="text-[11px] font-bold text-slate-200">${first.points} pts</div>
            <div class="text-[10px] text-amber-400/80">${first.won}V &bull; Dif ${first.diff >= 0 ? '+' : ''}${first.diff}</div>
          </div>

          <!-- 3rd Place -->
          <div data-fencer-profile="${third.fencer.id}" title="Ver perfil de ${third.fencer.name}" class="podium-card cursor-pointer p-2.5 rounded-2xl bg-lsCard/90 border border-amber-700/40 flex flex-col items-center justify-end text-center pt-4 hover:border-amber-600 transition-all">
            <span class="w-6 h-6 rounded-full bg-amber-800/20 text-amber-500 font-bold text-xs flex items-center justify-center mb-1">3</span>
            <div class="mb-1.5 shadow-md">
              ${this.getFencerAvatarHtml(third.fencer, 'w-10 h-10', true)}
            </div>
            <div class="font-bold text-xs text-slate-200 truncate w-full">${third.fencer.name}</div>
            <div class="text-[10px] text-slate-400">${third.points} pts &bull; ${third.won}V &bull; Dif ${third.diff >= 0 ? '+' : ''}${third.diff}</div>
          </div>
        `;
      } else {
        podiumContainer.innerHTML = '';
      }
    }
  ```

### 1.4 Avatar Saber Glow Implementation
- **File**: `app.js`, method `getFencerAvatarHtml(fencer, size = 'w-9 h-9', borderGlow = true)` (lines 1923–1945)
  - Parameter `borderGlow`:
    - When `true`: assigns `border-2 saber-ring-${ringColor}`
    - When `false`: assigns `border border-slate-700` (neutral, NO box-shadow glow)
- **File**: `styles.css` (lines 137–164)
  - `.saber-ring-cyan`: `box-shadow: 0 0 10px rgba(0, 229, 255, 0.4);`
  - `.saber-ring-amber`: `box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);`
  - `.saber-ring-emerald`: `box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);`
  - `.saber-ring-rose`: `box-shadow: 0 0 10px rgba(244, 63, 94, 0.4);`
  - `.saber-ring-purple`: `box-shadow: 0 0 10px rgba(168, 85, 247, 0.4);`

### 1.5 Current Zero-State Behavior
- **Observed Defect**: There is **no check** whatsoever for whether any matches or victories have been logged.
- When `this.matches = []` (league/month start or reset):
  - Every fencer has `points = 0`, `won = 0`, `diff = 0`.
  - The alphabetical sorting (`fencer.name.localeCompare`) places the first three alphabetical fencers (e.g. "Alberto Delgado", "Auri Haro", "Isa Liria") into 1st, 2nd, and 3rd place.
  - The 1st place fencer is rendered with an active champion format:
    1. Bouncing crown icon: `<i data-lucide="crown" class="animate-bounce text-amber-400"></i>`
    2. Golden gradient background: `bg-gradient-to-b from-amber-500/15 via-lsCard to-lsCard`
    3. Glowing amber border: `border-amber-500/50 hover:border-amber-400`
    4. Glowing amber outer box-shadow: `shadow-lg shadow-amber-500/10`
    5. Glowing amber avatar halo: `shadow-lg shadow-amber-500/30`
    6. Neon saber avatar ring: `saber-ring-${color}` with glow
    7. Asymmetric elevated height: `p-3 pt-2` with larger avatar (`w-12 h-12`)
    8. Golden typography: `text-amber-300` and `text-amber-400/80`
  - 3rd place gets bronze glowing border: `border-amber-700/40 hover:border-amber-600` and `bg-amber-800/20 text-amber-500`.

---

## 2. Logic Chain

1. **Premise (Requirement R2)**:
   - When all fighters have 0 points and 0 victories (e.g., season start), neon colors must be attenuated and the highlighted podium format must be disabled.
   - Neon colors and glowing highlights must activate dynamically **only when at least one fighter registers >= 1 victory**.

2. **Deduction of Activation Condition**:
   - Let `standings` be the array produced by `this.calculateStandings()`.
   - Each item `s` has `s.won` (number of victories) and `s.points` (league points).
   - In season start: all items have `s.won === 0` and `s.points === 0`.
   - The trigger condition for activating neon colors and the highlighted podium format is:
     ```javascript
     const isPodiumActive = standings.some(s => (s.won || 0) >= 1);
     ```
   - When `isPodiumActive === false`:
     - The podium is in **Zero-State / Attenuated Mode**.
     - All fighters have 0 victories (and at start 0 points).
   - When `isPodiumActive === true`:
     - At least one fighter has won a match.
     - The podium switches dynamically to **Active Highlighted Mode**.

3. **Deduction of Visual De-escalation in Zero-State**:
   - **Disabling Highlighted Format**:
     - The 1st card must not be elevated above the others. Padding should be uniform `p-2.5 pt-4` across all 3 cards.
     - Avatar size on 1st card should be `w-10 h-10` (same as 2nd and 3rd).
     - The bouncing crown (`<i data-lucide="crown" class="animate-bounce text-amber-400"></i>`) must be replaced with a neutral numeric position badge `<span class="w-6 h-6 rounded-full bg-slate-800/60 text-slate-400 font-bold text-xs flex items-center justify-center mb-1 border border-slate-700/50">1</span>`, matching positions 2 and 3.
   - **Attenuating Neon Colors & Glows**:
     - Remove golden background gradient (`bg-gradient-to-b from-amber-500/15 via-lsCard to-lsCard`) -> use neutral card background `bg-lsCard/60` or `bg-lsCard/80`.
     - Remove glowing borders (`border-amber-500/50`, `border-amber-700/40`) -> use neutral `border border-slate-800`.
     - Remove box-shadow glows (`shadow-lg shadow-amber-500/10`, `shadow-lg shadow-amber-500/30`) -> use `shadow-none` or subtle `shadow-sm`.
     - Attenuate avatar saber rings: pass `borderGlow = isPodiumActive` to `getFencerAvatarHtml(fencer, size, isPodiumActive)`. In zero-state, `borderGlow` evaluates to `false`, rendering `border border-slate-700` instead of `.saber-ring-*` with box-shadow.
     - Attenuate text colors: use neutral `text-slate-300` and `text-slate-500` instead of `text-amber-300` and `text-amber-400/80`.
     - Position badges for all 3 cards in zero-state use uniform slate badge styling: `bg-slate-800/60 text-slate-400 border border-slate-700/50`.

4. **Dynamic Transition Lifecycle**:
   - When a match is registered or loaded:
     - `this.calculateStandings()` recalculates `won` for both fighters.
     - `renderRanking()` checks `isPodiumActive`.
     - If `isPodiumActive === true`, full neon classes, crown animation, gradients, and saber halos render.
     - If matches are cleared, reset, or an empty month is selected: `isPodiumActive === false`, immediately reverting to the muted zero-state.

---

## 3. Caveats

1. **Draws Only Edge Case**:
   - If a season starts with a match that finishes as a DRAW (e.g. 1-1, DRAW), both participants gain 1 point (`points: 1`), but 0 victories (`won: 0`).
   - The requirement specifically mandates: *"Los colores y brillos deben activarse dinámicamente solo cuando al menos un jugador registre una victoria."*
   - Therefore, `standings.some(s => s.won >= 1)` is the strict, correct check. If product requirements ever expand to "any match played", a secondary check `|| standings.some(s => s.matchesPlayed >= 1)` could be used, but `s.won >= 1` satisfies the exact written specification.
2. **Fewer Than 3 Fencers**:
   - If a league roster has fewer than 3 registered fencers, `standings.length < 3` holds and `podiumContainer.innerHTML = ''` remains the appropriate fallback.
3. **Icons Initialization**:
   - When rendering dynamic icons in `podiumContainer` (such as the bouncing crown in active mode or icons in zero-state), `window.lucide?.createIcons()` must be ensured after updating `podiumContainer.innerHTML` (e.g., inside `renderRanking()`).

---

## 4. Conclusion & Recommended Implementation

### 4.1 Recommended Implementation in `app.js` (`renderRanking()`)

Replace lines 834–876 in `app.js`:

```javascript
    // Render Podium (Top 3)
    if (podiumContainer) {
      if (standings.length >= 3) {
        const first = standings[0];
        const second = standings[1];
        const third = standings[2];

        // R2: Active podium format is enabled dynamically only when at least one fighter registers >= 1 victory
        const isPodiumActive = standings.some(s => (s.won || 0) >= 1);
        podiumContainer.setAttribute('data-podium-state', isPodiumActive ? 'active' : 'zero');

        if (isPodiumActive) {
          // ACTIVE PODIUM FORMAT: Highlighted champion card, bouncing gold crown, amber glowing gradients & neon halos
          podiumContainer.innerHTML = `
            <!-- 2nd Place (Silver) -->
            <div data-fencer-profile="${second.fencer.id}" title="Ver perfil de ${second.fencer.name}" class="podium-card cursor-pointer p-2.5 rounded-2xl bg-lsCard/90 border border-slate-700/60 flex flex-col items-center justify-end text-center pt-4 hover:border-slate-500 transition-all">
              <span class="w-6 h-6 rounded-full bg-slate-400/20 text-slate-300 font-bold text-xs flex items-center justify-center mb-1">2</span>
              <div class="mb-1.5 shadow-md">
                ${this.getFencerAvatarHtml(second.fencer, 'w-10 h-10', true)}
              </div>
              <div class="font-bold text-xs text-slate-200 truncate w-full">${second.fencer.name}</div>
              <div class="text-[10px] text-slate-400">${second.points} pts &bull; ${second.won}V &bull; Dif ${second.diff >= 0 ? '+' : ''}${second.diff}</div>
            </div>

            <!-- 1st Place (Gold / Crown Highlighted Hero) -->
            <div data-fencer-profile="${first.fencer.id}" title="Ver perfil de ${first.fencer.name}" class="podium-card cursor-pointer p-3 rounded-2xl bg-gradient-to-b from-amber-500/15 via-lsCard to-lsCard border border-amber-500/50 flex flex-col items-center justify-end text-center pt-2 relative shadow-lg shadow-amber-500/10 hover:border-amber-400 transition-all">
              <i data-lucide="crown" class="w-5 h-5 text-amber-400 mb-0.5 animate-bounce"></i>
              <div class="mb-1.5 shadow-lg shadow-amber-500/30">
                ${this.getFencerAvatarHtml(first.fencer, 'w-12 h-12', true)}
              </div>
              <div class="font-bold text-xs text-amber-300 truncate w-full">${first.fencer.name}</div>
              <div class="text-[11px] font-bold text-slate-200">${first.points} pts</div>
              <div class="text-[10px] text-amber-400/80">${first.won}V &bull; Dif ${first.diff >= 0 ? '+' : ''}${first.diff}</div>
            </div>

            <!-- 3rd Place (Bronze) -->
            <div data-fencer-profile="${third.fencer.id}" title="Ver perfil de ${third.fencer.name}" class="podium-card cursor-pointer p-2.5 rounded-2xl bg-lsCard/90 border border-amber-700/40 flex flex-col items-center justify-end text-center pt-4 hover:border-amber-600 transition-all">
              <span class="w-6 h-6 rounded-full bg-amber-800/20 text-amber-500 font-bold text-xs flex items-center justify-center mb-1">3</span>
              <div class="mb-1.5 shadow-md">
                ${this.getFencerAvatarHtml(third.fencer, 'w-10 h-10', true)}
              </div>
              <div class="font-bold text-xs text-slate-200 truncate w-full">${third.fencer.name}</div>
              <div class="text-[10px] text-slate-400">${third.points} pts &bull; ${third.won}V &bull; Dif ${third.diff >= 0 ? '+' : ''}${third.diff}</div>
            </div>
          `;
        } else {
          // ZERO-STATE FORMAT: Attenuated neon colors, uniform non-highlighted cards, disabled crown/glows
          podiumContainer.innerHTML = `
            <!-- 2nd Position (Attenuated) -->
            <div data-fencer-profile="${second.fencer.id}" title="Ver perfil de ${second.fencer.name}" class="podium-card cursor-pointer p-2.5 rounded-2xl bg-lsCard/60 border border-slate-800/80 flex flex-col items-center justify-end text-center pt-4 opacity-85 hover:opacity-100 hover:border-slate-700 transition-all">
              <span class="w-6 h-6 rounded-full bg-slate-800/60 text-slate-400 font-bold text-xs flex items-center justify-center mb-1 border border-slate-700/50">2</span>
              <div class="mb-1.5">
                ${this.getFencerAvatarHtml(second.fencer, 'w-10 h-10', false)}
              </div>
              <div class="font-bold text-xs text-slate-300 truncate w-full">${second.fencer.name}</div>
              <div class="text-[10px] text-slate-500">0 pts &bull; 0V &bull; Dif 0</div>
            </div>

            <!-- 1st Position (Attenuated - No Crown, Flat Layout) -->
            <div data-fencer-profile="${first.fencer.id}" title="Ver perfil de ${first.fencer.name}" class="podium-card cursor-pointer p-2.5 rounded-2xl bg-lsCard/60 border border-slate-800/80 flex flex-col items-center justify-end text-center pt-4 opacity-85 hover:opacity-100 hover:border-slate-700 transition-all">
              <span class="w-6 h-6 rounded-full bg-slate-800/60 text-slate-400 font-bold text-xs flex items-center justify-center mb-1 border border-slate-700/50">1</span>
              <div class="mb-1.5">
                ${this.getFencerAvatarHtml(first.fencer, 'w-10 h-10', false)}
              </div>
              <div class="font-bold text-xs text-slate-300 truncate w-full">${first.fencer.name}</div>
              <div class="text-[10px] text-slate-500">0 pts &bull; 0V &bull; Dif 0</div>
            </div>

            <!-- 3rd Position (Attenuated) -->
            <div data-fencer-profile="${third.fencer.id}" title="Ver perfil de ${third.fencer.name}" class="podium-card cursor-pointer p-2.5 rounded-2xl bg-lsCard/60 border border-slate-800/80 flex flex-col items-center justify-end text-center pt-4 opacity-85 hover:opacity-100 hover:border-slate-700 transition-all">
              <span class="w-6 h-6 rounded-full bg-slate-800/60 text-slate-400 font-bold text-xs flex items-center justify-center mb-1 border border-slate-700/50">3</span>
              <div class="mb-1.5">
                ${this.getFencerAvatarHtml(third.fencer, 'w-10 h-10', false)}
              </div>
              <div class="font-bold text-xs text-slate-300 truncate w-full">${third.fencer.name}</div>
              <div class="text-[10px] text-slate-500">0 pts &bull; 0V &bull; Dif 0</div>
            </div>
          `;
        }

        if (window.lucide) {
          window.lucide.createIcons();
        }
      } else {
        podiumContainer.innerHTML = '';
      }
    }
```

### 4.2 Supplementary CSS in `styles.css` (Optional Enhancements)
Add to `styles.css` around line 135:
```css
/* Podium Zero-State Attenuation */
[data-podium-state="zero"] .podium-card {
  box-shadow: none !important;
}
```

---

## 5. Verification Method

### 5.1 Verification Commands & Test Script
1. **Existing Unit Tests Validation**:
   ```powershell
   python -m unittest test_badges.py
   ```
   Ensures that badges logic remains 100% green.

2. **Automated Zero-State & Activation Assertion**:
   Create or run a browser test or quick node/DOM verification:
   - Case A: With `matches = []`:
     - Assert `isPodiumActive === false`.
     - Assert `podiumContainer.getAttribute('data-podium-state') === 'zero'`.
     - Assert `podiumContainer.querySelector('[data-lucide="crown"]')` is `null`.
     - Assert avatar rings do not contain `saber-ring-` class with box-shadow.
     - Assert cards do not contain `bg-gradient-to-b` or `border-amber-500/50`.
   - Case B: Inject 1 match with `result: 'VICTORY_A'`:
     - Assert `isPodiumActive === true`.
     - Assert `podiumContainer.getAttribute('data-podium-state') === 'active'`.
     - Assert crown icon exists: `podiumContainer.querySelector('[data-lucide="crown"]') !== null`.
     - Assert first card has `from-amber-500/15` and avatar has `saber-ring-` class.

3. **Manual / Dev Server Inspection**:
   - Start the local dev server (e.g. `python -m http.server 8000` or `start-server.ps1`).
   - Open browser at `http://localhost:8000/`.
   - Clear matches or select a fresh month with no matches:
     - Observe `#podiumContainer`: verify that 3 muted cards display in neutral gray/slate tones, no bouncing crown, no amber glow, no neon saber avatar halos.
   - Register a combat with a victory:
     - Observe `#podiumContainer` immediately updating dynamically: 1st place card glows gold, crown bounces, avatar saber ring lights up neon, 2nd and 3rd place show their respective silver and bronze accents.
