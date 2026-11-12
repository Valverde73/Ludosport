# Handoff Report — Explorer Survey 1: Codebase Structure & Requirement R1

**Date:** 2026-11-11  
**Investigator:** Explorer 1 (`explorer_survey_1`)  
**Scope:** Tech stack identification, build/test workflow, dashboard component map, and deep-dive analysis of Requirement R1 ("Medallero & Títulos del Mes" wrapping and WCAG AA contrast).

---

## 1. Observation

### 1.1 Tech Stack & Build Tooling
- **Architecture:** Zero-dependency, client-side Single Page Application (SPA).
  - No `package.json` at repository root (`Test-Path package.json` returned `False`).
  - No compilation or bundler step (Webpack/Vite/Rollup) required. Runs directly from raw HTML, CSS, and JS files.
- **Frontend Framework & Libraries (`index.html:19-50`):**
  - **Tailwind CSS:** Loaded via CDN `<script src="https://cdn.tailwindcss.com"></script>` (`index.html:20`) with inline JIT config extending custom theme colors (`lsDark: '#080c14'`, `lsCard: '#0f172a'`, `lsBorder: '#1e293b'`, `lsCyan: '#00e5ff'`, `lsAmber: '#f59e0b'`, `lsEmerald: '#10b981'`, `lsRed: '#ef4444'`, `lsPurple: '#8b5cf6'`) and font families (`sans: Inter`, `display: Orbitron`, `combat: Rajdhani`).
  - **Custom CSS:** `styles.css` (291 lines) containing keyframe animations (`fadeIn`, `scaleUp`, `pulseGlow`), saber glow rings, custom scrollbars, tooltip hover popovers, and landscape/piste mobile mode overrides.
  - **Iconography:** Lucide Icons (`https://unpkg.com/lucide@latest`, `index.html:48`) initialized via `lucide.createIcons()` in `app.js:765, 784`.
  - **Typography:** Google Fonts (`Orbitron`, `Inter`, `Rajdhani`) imported in `index.html:17`.
- **Backend & Persistence:**
  - Supabase client (`@supabase/supabase-js`) for cloud synchronization (tables: `fencers`, `matches`).
  - Serverless configuration endpoint: `api/config.js` (used in Vercel/Netlify environments).
  - Complete local fallback: `localStorage` (`ls_fencers`, `ls_matches`, `ls_active_tab`, `ls_rector_pin`, etc.).
  - Deployment configuration: `vercel.json` (serverless rewrite) and `netlify.toml`.
- **Test Suites & Local Execution:**
  - **Python Unit Tests:** `test_badges.py` (362 lines, 14 unit tests) covering `LeagueBadgesLogic` calculation of all 5 monthly badges, tiebreaks, minimum match thresholds, streaks, and empty states.
    - Verified execution command: `python -m unittest test_badges.py`
    - Result: `Ran 14 tests in 0.006s — OK` (exit code 0).
  - **Browser Test Suite:** `tests.html` (215 lines) — browser-based test suite testing `badges.js` directly with visual pass/fail output.
  - **Local Development Server:** `start-server.ps1` (PowerShell HTTP listener on `http://localhost:8080/`, handling static assets and `/api/config`), or standard `python -m http.server 8080`.

### 1.2 Layout & Dashboard Structure
- **Main Entrypoint:** `index.html` (1128 lines)
  - Layout wrapper: `<body class="bg-lsDark text-slate-100 font-sans min-h-screen pb-24 md:pb-10">` (`index.html:52`)
  - Container: `<main class="max-w-2xl mx-auto px-4 mt-2">` (`index.html:154`)
  - Navigation: Fixed/sticky header (`index.html:55-112`) and fixed bottom bar (`<nav class="fixed bottom-0 left-0 right-0 z-30 bg-lsDark/95 ...">`, `index.html:817-857`)
- **Main View Tabs:**
  1. `tab-ranking` (`index.html:157-221`): Podium Top 3 (`#podiumContainer`, line 179), Medallero & Títulos del Mes (`#monthlyMedalsSection`, line 184), Search input (`#rankingSearchInput`, line 191), Leaderboard Table (`#rankingTableBody`, lines 194-215).
  2. `tab-duel` (`index.html:224-428`): Match score registration form.
  3. `tab-live` (`index.html:430-608`): Piste scoreboard and countdown timer.
  4. `tab-history` (`index.html:610-671`): Monthly duel match log.
  5. `tab-fencers` (`index.html:673-740`): Fencer roster management (Rector mode).
  6. `tab-settings` (`index.html:742-813`): League reset, PIN, and Supabase credentials.

### 1.3 Requirement R1 Direct Observations

#### A. Card Location & Generation Logic
- **DOM Container:** `index.html:183-186`
  ```html
  <!-- SECCIÓN DESTACADA: MEDALLERO Y TÍTULOS DEL MES -->
  <div id="monthlyMedalsSection" class="mb-4">
    <!-- Rendered by JS -->
  </div>
  ```
- **Rendering Function:** `app.js:934-1111` (`renderMonthlyMedals()`), called inside `renderAll()` (`app.js:776`).
- **Data Source:** `window.LeagueBadgesService.calculateMonthlyBadges(this.matches, this.fencers, this.currentMonthKey)` from `badges.js:240-345`.
- **Badge Categories Defined (`badges.js:14-70`):**
  1. `INVICTUS`: "Invicto del Mes" (🏆) — min 3 matches, 100% winrate
  2. `TOP_SCORER`: "Máximo Anotador de OHs" (⚡) — most points scored
  3. `IRON_DEFENSE`: "Defensa de Hierro" (🛡️) — min 3 matches, lowest OHs conceded average
  4. `MOST_ACTIVE`: "Rival más Activo" (⚔️) — most matches played
  5. `WIN_STREAK`: "Racha de Victorias" (🔥) — min 2 consecutive wins

#### B. Title Text Wrapping Implementation (`app.js:1069-1079`)
Verbatim code in `app.js`:
```javascript
1069:           <div class="flex items-center justify-between gap-2">
1070:             <div class="flex items-center gap-1.5 min-w-0">
1071:               <div class="w-6 h-6 rounded-lg ${colorScheme.iconBg} border flex items-center justify-center text-xs shrink-0">
1072:                 <i data-lucide="${badge.icon}" class="w-3.5 h-3.5"></i>
1073:               </div>
1074:               <span class="font-display font-bold text-xs ${colorScheme.badgeText} truncate">
1075:                 ${badge.title}
1076:               </span>
1077:             </div>
1078:             <span class="text-xs select-none">${badge.emoji}</span>
1079:           </div>
```
- Line 1074 contains the class `truncate`.
- Line 1070 does not include `flex-1`.
- Grid container (`app.js:1106`): `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">`.

#### C. Secondary Text ("En disputa...") Implementation (`app.js:1045-1052`)
Verbatim code in `app.js`:
```javascript
1045:         winnersHtml = `
1046:           <div class="mt-2.5 py-1.5 px-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[10px] text-slate-500 italic flex items-center gap-1.5">
1047:             <i data-lucide="clock" class="w-3 h-3 text-slate-600 shrink-0"></i>
1048:             <span class="truncate">${badge.emptyStateText}</span>
1049:           </div>
1050:         `;
```
- Background styling: Container has `bg-slate-900/60` sitting directly on the card background `from-... via-lsCard to-lsCard` (`lsCard` = `#0f172a`, navy blue / dark slate).
- Text color: `text-slate-500` (Tailwind value `#64748b`).
- Clock icon color: `text-slate-600` (Tailwind value `#475569`).
- Font size: `text-[10px]` with `italic`.

---

## 2. Logic Chain

### 2.1 Root Cause of Title Truncation
1. **Observation:** Line 1074 uses class `truncate`. In Tailwind CSS, `truncate` sets:
   ```css
   overflow: hidden;
   text-overflow: ellipsis;
   white-space: nowrap;
   ```
2. **Observation:** Container width in `index.html:154` is `max-w-2xl` (672px). Inside `#monthlyMedalsSection` (`app.js:1087`), card padding is `p-3.5`, leaving ~612px.
3. **Observation:** With `grid-cols-3` (`app.js:1106`), each card is ~190px wide with `p-3` (24px horizontal padding), leaving ~166px inner width. Subtracting icon (`w-6` + `gap-1.5` = 30px) and emoji (`~16px` + `gap-2` = 24px), the title element has **~112px** of available horizontal width.
4. **Observation:** The title font is Orbitron (`font-display font-bold text-xs`), a wide geometric uppercase display font. In 112px, Orbitron can fit only ~11 to 13 characters before overflowing.
5. **Observation:** All 5 badge titles exceed 13 characters:
   - "Máximo Anotador de OHs" (22 characters)
   - "Racha de Victorias" (18 characters)
   - "Defensa de Hierro" (17 characters)
   - "Rival más Activo" (16 characters)
   - "Invicto del Mes" (15 characters)
6. **Inference:** Because `white-space: nowrap` is enforced by `truncate`, every badge title is prematurely clipped with an ellipsis ("Máximo Anot...", "Defensa de Hie...").
7. **Conclusion:** Removing `truncate` and replacing it with `white-space: normal` (Tailwind `whitespace-normal`), combined with `line-clamp-2` and `leading-tight`, plus adding `flex-1` to the container, will allow titles to wrap gracefully onto two lines without any text being cut off.

### 2.2 Contrast Ratio Analysis (WCAG 2.1 AA Compliance)
1. **Observation:** The secondary text ("En disputa...") container sits on a navy blue card background `#0f172a` (sRGB luminance: `0.00936`).
2. **Observation:** The text uses `text-slate-500` (`#64748b`, sRGB luminance: `0.17065`).
3. **Observation:** Contrast ratio formula:
   $$\text{Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05} = \frac{0.17065 + 0.05}{0.00936 + 0.05} = \frac{0.22065}{0.05936} = \mathbf{3.75:1}$$
4. **Observation:** WCAG 2.1 Success Criterion 1.4.3 (Contrast Minimum, Level AA) requires a contrast ratio of at least **4.5:1** for normal text (< 18pt / 24px, or < 14pt / 18.5px bold). The text is `text-[10px]` (approx 7.5pt) and italicized.
5. **Inference:** The current contrast of 3.75:1 **FAILS** WCAG Level AA requirements by 0.75 points.
6. **Observation:** The clock icon uses `text-slate-600` (`#475569`, sRGB luminance: `0.08993`).
   $$\text{Ratio} = \frac{0.08993 + 0.05}{0.00936 + 0.05} = \mathbf{2.36:1}$$
   WCAG 2.1 SC 1.4.11 (Non-text Contrast, Level AA) requires at least **3.0:1** for UI components/icons. The clock icon also **FAILS** Level AA.
7. **Alternative Color Evaluations on `#0f172a` background:**
   - **`text-white/60`** (`rgba(255, 255, 255, 0.60)` over `#0f172a` = RGB 159, 162, 169, luminance 0.3644):
     $$\text{Ratio} = \frac{0.3644 + 0.05}{0.00936 + 0.05} = \mathbf{6.98:1} \quad (\text{PASSES AA}, \text{nearly AAA})$$
   - **`text-white/70`** (`rgba(255, 255, 255, 0.70)` over `#0f172a` = RGB 183, 185, 191, luminance 0.4901):
     $$\text{Ratio} = \frac{0.4901 + 0.05}{0.00936 + 0.05} = \mathbf{9.10:1} \quad (\text{PASSES AAA})$$
   - **`text-slate-400`** (`#94a3b8` = RGB 148, 163, 184, luminance 0.3631):
     $$\text{Ratio} = \frac{0.3631 + 0.05}{0.00936 + 0.05} = \mathbf{6.96:1} \quad (\text{PASSES AA})$$
   - **`text-slate-300`** (`#cbd5e1` = RGB 203, 213, 225, luminance 0.6635):
     $$\text{Ratio} = \frac{0.6635 + 0.05}{0.00936 + 0.05} = \mathbf{12.02:1} \quad (\text{PASSES AAA})$$
8. **Conclusion:** Replacing `text-slate-500` with `text-slate-300` or `text-white/70` (or `text-white/60`) and elevating the clock icon from `text-slate-600` to `text-slate-400` or `text-white/60` immediately brings both text and icon into full compliance with WCAG 2.1 AA (and AAA for text).

---

## 3. Caveats
1. **Dynamic Tailwind CDN vs Static CSS:** The project imports Tailwind via CDN (`cdn.tailwindcss.com`). While Tailwind JIT dynamically generates arbitrary opacity classes like `text-white/60` and utility classes like `line-clamp-2` and `whitespace-normal`, having equivalent definitions in `styles.css` ensures zero risk if offline or if CDN behavior varies.
2. **Card Height Uniformity:** In a 3-column CSS Grid, row items stretch by default (`align-items: stretch`). However, if a 2-line title increases card header height while an adjacent card has a 1-line title, the empty-state or winner box could sit at slightly different vertical offsets within the card unless the card itself uses `flex flex-col justify-between`. Adding `flex flex-col justify-between` to `.badge-card` eliminates this potential misalignment.
3. **Empty State String Truncation:** Line 1048 also has `<span class="truncate">${badge.emptyStateText}</span>`. While R1 explicitly targets the card title wrapping and the secondary text contrast, the empty state text itself ("En disputa (mínimo 3 combates y 100% victorias)") also contains a `truncate` class. Adding `title="${badge.emptyStateText}"` or allowing multi-line display avoids clipping the qualification description on very narrow screens.

---

## 4. Conclusion & Actionable Recommendations

### 4.1 Summary of Findings
- **Tech Stack:** Vanilla JS + Tailwind CDN + custom `styles.css` + Supabase + Python test suite (`test_badges.py`).
- **File to Edit for R1:** `app.js` (method `renderMonthlyMedals()`, lines 1046-1076).
- **Secondary File for CSS Hardening (optional but recommended):** `styles.css` (lines 250-289).

### 4.2 Proposed Code Changes for Implementer

#### Target 1: Title Wrapping in `app.js`
**Target File:** `c:\Users\Ana\Documents\LudoSport\app.js`  
**Lines:** 1069–1079  

**Before:**
```javascript
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 min-w-0">
              <div class="w-6 h-6 rounded-lg ${colorScheme.iconBg} border flex items-center justify-center text-xs shrink-0">
                <i data-lucide="${badge.icon}" class="w-3.5 h-3.5"></i>
              </div>
              <span class="font-display font-bold text-xs ${colorScheme.badgeText} truncate">
                ${badge.title}
              </span>
            </div>
            <span class="text-xs select-none">${badge.emoji}</span>
          </div>
```

**Proposed Replacement:**
```javascript
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-start gap-1.5 min-w-0 flex-1">
              <div class="w-6 h-6 rounded-lg ${colorScheme.iconBg} border flex items-center justify-center text-xs shrink-0 mt-0.5">
                <i data-lucide="${badge.icon}" class="w-3.5 h-3.5"></i>
              </div>
              <span class="font-display font-bold text-xs ${colorScheme.badgeText} whitespace-normal leading-tight line-clamp-2" title="${badge.title}">
                ${badge.title}
              </span>
            </div>
            <span class="text-xs select-none shrink-0 mt-0.5">${badge.emoji}</span>
          </div>
```

#### Target 2: Secondary Text Contrast in `app.js`
**Target File:** `c:\Users\Ana\Documents\LudoSport\app.js`  
**Lines:** 1045–1050  

**Before:**
```javascript
        winnersHtml = `
          <div class="mt-2.5 py-1.5 px-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[10px] text-slate-500 italic flex items-center gap-1.5">
            <i data-lucide="clock" class="w-3 h-3 text-slate-600 shrink-0"></i>
            <span class="truncate">${badge.emptyStateText}</span>
          </div>
        `;
```

**Proposed Replacement:**
```javascript
        winnersHtml = `
          <div class="mt-2.5 py-1.5 px-2 rounded-lg bg-slate-900/70 border border-slate-800/80 text-[10px] text-white/70 italic flex items-center gap-1.5" title="${badge.emptyStateText}">
            <i data-lucide="clock" class="w-3 h-3 text-white/60 shrink-0"></i>
            <span class="truncate">${badge.emptyStateText}</span>
          </div>
        `;
```
*(Alternatively, `text-slate-300` for text and `text-slate-400` for the clock icon).*

#### Target 3: Card Flex Structure in `app.js`
**Target File:** `c:\Users\Ana\Documents\LudoSport\app.js`  
**Line:** 1055  

**Before:**
```javascript
<div class="badge-card relative p-3 rounded-2xl bg-gradient-to-br ${colorScheme.bg} border ${colorScheme.border} shadow-lg transition-all"
```

**Proposed Replacement:**
```javascript
<div class="badge-card relative p-3 rounded-2xl bg-gradient-to-br ${colorScheme.bg} border ${colorScheme.border} shadow-lg transition-all flex flex-col justify-between"
```

---

## 5. Verification Method

### 5.1 Automated Unit Tests
Run the existing Python test suite to guarantee zero regression on badge domain calculations:
```powershell
python -m unittest test_badges.py
```
**Expected Output:** `Ran 14 tests in ... OK`.

### 5.2 Browser & Visual Verification
1. Launch local dev server:
   ```powershell
   powershell -File .\start-server.ps1
   # Or alternatively:
   python -m http.server 8080
   ```
2. Open `http://localhost:8080` in Chrome/Edge.
3. Switch to a month with zero or partial matches, or observe the "Medallero & Títulos del Mes" cards in `tab-ranking`.
4. **Verify Title Wrapping:**
   - In DevTools responsive mode (set viewport to 375px mobile and 768px tablet).
   - Inspect the card titles: "Máximo Anotador de OHs", "Racha de Victorias", "Defensa de Hierro".
   - Confirm each title wraps onto two lines without ellipsis (`...`) or overflowing the card boundary.
   - Confirm `white-space` is computed as `normal` on the element.
5. **Verify WCAG Contrast:**
   - In Chrome DevTools Elements tab, inspect the element containing `"En disputa..."`.
   - Hover over the color property in the Styles pane or check the DevTools Accessibility pane.
   - Confirm contrast ratio is $\ge 4.5:1$ (with `text-white/70`, contrast is **9.1:1**; with `text-white/60`, contrast is **6.98:1**).
   - Confirm clock icon contrast is $\ge 3.0:1$.
