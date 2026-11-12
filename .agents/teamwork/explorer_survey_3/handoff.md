# Handoff Report — Explorer 3: Survey of Requirements R3 & R4

- **Author**: Explorer 3 (Investigation & Synthesis)
- **Target Audience**: Orchestrator & Implementer Agents
- **Date**: 2026-11-11
- **Project**: LudoSport Arena Refactoring
- **Scope**: Requirement R3 (Laser Halo Hover Effects & Pulse Animation) & Requirement R4 (Classification Table Metrics Stability & Scroll Clearance)

---

## 1. Observation

### 1.1 Requirement R3 Observations (Laser Visual Theme & Animations)

#### 1.1.1 Player Cards & Classification Table Rows
- **Classification Table Rows (`app.js` & `index.html`)**:
  - `index.html:197`: `<table class="w-full text-left border-collapse">`
  - `index.html:210`: `<tbody id="rankingTableBody" class="divide-y divide-slate-800/60 text-xs font-medium">`
  - `app.js:908`: `<tr data-fencer-profile="${item.fencer.id}" title="Clic para ver perfil y estadísticas de ${item.fencer.name}" class="hover:bg-slate-800/40 transition-colors cursor-pointer">`
  - Current styling in `styles.css:182-190`:
    ```css
    tr[data-fencer-profile],
    div[data-fencer-profile] {
      cursor: pointer;
      transition: transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
    }

    tr[data-fencer-profile]:hover {
      background-color: rgba(0, 229, 255, 0.08) !important;
    }
    ```
    *Observation*: Currently, hovering over a table row only alters `background-color`. There is no `box-shadow` or laser glow applied.
    *CSS Standard Observation*: In W3C CSS Backgrounds and Borders Module Level 3 (section 6), `box-shadow` does **not** apply to internal table elements (`<tr>`, `<td>`) when the parent `<table>` has `border-collapse: collapse;`. Setting `box-shadow` directly on a `<tr>` inside a collapsed-border table is silently ignored by Chromium, WebKit, and Gecko.

- **Podium Cards (`app.js` & `styles.css`)**:
  - `app.js:843` (2nd place): `<div data-fencer-profile="${second.fencer.id}" title="Ver perfil de ${second.fencer.name}" class="podium-card cursor-pointer p-2.5 rounded-2xl bg-lsCard/90 border border-slate-700/60 flex flex-col items-center justify-end text-center pt-4 hover:border-slate-500 transition-all">`
  - `app.js:853` (1st place / Gold): `<div data-fencer-profile="${first.fencer.id}" title="Ver perfil de ${first.fencer.name}" class="podium-card cursor-pointer p-3 rounded-2xl bg-gradient-to-b from-amber-500/15 via-lsCard to-lsCard border border-amber-500/50 flex flex-col items-center justify-end text-center pt-2 relative shadow-lg shadow-amber-500/10 hover:border-amber-400 transition-all">`
  - `app.js:864` (3rd place): `<div data-fencer-profile="${third.fencer.id}" title="Ver perfil de ${third.fencer.name}" class="podium-card cursor-pointer p-2.5 rounded-2xl bg-lsCard/90 border border-amber-700/40 flex flex-col items-center justify-end text-center pt-4 hover:border-amber-600 transition-all">`
  - `styles.css:127-134`:
    ```css
    .podium-card {
      position: relative;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .podium-card:hover {
      transform: translateY(-2px);
    }
    ```
    *Observation*: Podium cards have a transform on hover, but no laser halo `box-shadow` is applied.

- **Badges / Medals Cards (`app.js` & `styles.css`)**:
  - `app.js:1055`: `<div class="badge-card relative p-3 rounded-2xl bg-gradient-to-br ${colorScheme.bg} border ${colorScheme.border} shadow-lg transition-all" ...>`
  - `styles.css:251-257`:
    ```css
    .badge-card {
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .badge-card:hover {
      transform: translateY(-2px);
    }
    ```

- **Fencers Grid List Cards (`app.js:1578`)**:
  - `<div class="bg-lsCard border border-lsBorder rounded-xl p-3 flex items-center justify-between gap-3 shadow-md hover:border-slate-700 transition-all">`

#### 1.1.2 Pulse Keyframes & Highlighted Elements
- `styles.css:39-46`:
  ```css
  @keyframes pulseGlow {
    0%, 100% {
      box-shadow: 0 0 15px rgba(0, 229, 255, 0.2);
    }
    50% {
      box-shadow: 0 0 25px rgba(0, 229, 255, 0.45);
    }
  }
  ```
- *Search across codebase*: The `@keyframes pulseGlow` rule is declared at line 39 of `styles.css`, but is **never referenced or applied anywhere** in `styles.css`, `index.html`, or `app.js`.
- *Search for prominent/highlighted elements*:
  1. 1st Place Podium Card (`app.js:853`): Gold-themed card with `<i data-lucide="crown" class="w-5 h-5 text-amber-400 mb-0.5 animate-bounce"></i>`.
  2. Central Floating "Duelo" Button (`index.html:828-833`):
     ```html
     <button data-tab="tab-duel" class="nav-tab flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-cyan-400 transition-all relative">
       <div class="w-9 h-9 -mt-4 rounded-full bg-gradient-to-tr from-cyan-600 to-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30">
         <i data-lucide="swords" class="w-4 h-4"></i>
       </div>
       <span class="text-[10px] font-semibold mt-0.5">Duelo</span>
     </button>
     ```
  3. First Place Ranking Row (`app.js:896`): Gold badge `bg-amber-400/20 text-amber-400 border border-amber-400/40`.

---

### 1.2 Requirement R4 Observations (Table Metric Stability & Scroll Padding)

#### 1.2.1 Metric Columns in Classification Table
- Header Columns in `index.html:199-209`:
  ```html
  <tr class="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
    <th class="py-2.5 pl-3 pr-2 w-10 text-center">Pos</th>
    <th class="py-2.5 px-2">Tirador</th>
    <th class="py-2.5 px-1.5 text-center" title="Combates Disputados">PJ</th>
    <th class="py-2.5 px-1.5 text-center text-emerald-400" title="Victorias">V</th>
    <th class="py-2.5 px-1.5 text-center text-amber-400" title="Empates">E</th>
    <th class="py-2.5 px-1.5 text-center text-rose-400" title="Derrotas">D</th>
    <th class="py-2.5 px-1.5 text-center text-slate-400" title="Diferencia de puntos (Tocados a favor - en contra)">DIF</th>
    <th class="py-2.5 pr-3 pl-2 text-center font-black text-cyan-300" title="Puntos Totales de Liga">PTS</th>
  </tr>
  ```
- Cell Columns in `app.js:909-927`:
  ```javascript
  <td class="py-2.5 pl-3 pr-2 text-center">${posBadge}</td>
  <td class="py-2.5 px-2">...</td>
  <td class="py-2.5 px-1.5 text-center text-slate-400 font-combat text-xs font-semibold">${item.matchesPlayed}</td>
  <td class="py-2.5 px-1.5 text-center text-emerald-400 font-combat text-xs font-bold">${item.won}</td>
  <td class="py-2.5 px-1.5 text-center text-amber-400 font-combat text-xs font-bold">${item.drawn}</td>
  <td class="py-2.5 px-1.5 text-center text-rose-400 font-combat text-xs font-bold">${item.lost}</td>
  <td class="py-2.5 px-1.5 text-center">${diffBadge}</td>
  <td class="py-2.5 pr-3 pl-2 text-center font-combat font-black text-sm text-cyan-300">${item.points}</td>
  ```
- *Observations*:
  1. Only `Pos` has a fixed width (`w-10`).
  2. None of `PJ`, `V`, `E`, `D`, `DIF`, or `PTS` have any `min-width` or `width` defined in HTML, CSS, or JS.
  3. The table has default `table-layout: auto`.
  4. With 1-digit values (e.g. `V=2, E=0, D=1, DIF=+3, PTS=6`), columns are narrow (~25px-30px).
  5. With 2-digit values (e.g. `V=14, E=2, D=11, DIF=-18, PTS=44`), columns expand (~40px-52px), causing horizontal layout shifts when re-rendering, filtering fencers, or progressing across match weeks.
  6. The `font-combat` family (`Rajdhani`) does not enforce `font-variant-numeric: tabular-nums` by default, contributing to character width variances.

#### 1.2.2 Container Padding & Dock/Button Overlap
- Layout structure in `index.html`:
  - `index.html:52`: `<body class="bg-lsDark text-slate-100 font-sans min-h-screen pb-24 md:pb-10 selection:bg-lsCyan selection:text-black">`
  - `index.html:154`: `<main class="max-w-2xl mx-auto px-4 mt-2">`
  - `index.html:818`: `<nav class="fixed bottom-0 left-0 right-0 z-40 bg-lsDark/95 backdrop-blur-lg border-t border-lsBorder px-2 py-1.5">`
  - Floating Duelo Button in `index.html:828-831`: `<div class="w-9 h-9 -mt-4 rounded-full bg-gradient-to-tr ...">`
- Dimensions measured:
  - Fixed `<nav>` dock base height: `py-1.5` (12px) + icon (22px) + text (14px) = ~48px-56px.
  - Floating Duelo button: `w-9 h-9` (36px), with `-mt-4` (-16px margin) protruding above `<nav>`, reaching ~72px above viewport bottom. Outer shadow extends to ~82px.
- *Critical Layout Bug Observed*:
  - Line 52 specifies `pb-24 md:pb-10`.
  - On viewports >= 768px (`md`), `body` padding-bottom drops to `md:pb-10` = **40px** (2.5rem).
  - Since the bottom nav is ~56px tall and the Duelo button reaches ~72px-82px, on screens >= 768px the bottom rows of the classification table and the footer note are **clipped and hidden directly underneath the fixed dock**.
  - On mobile (< 768px), `pb-24` is 96px, which is borderline tight when considering mobile browser bottom chrome bars and safe area insets (`env(safe-area-inset-bottom)`).

---

### 1.3 Test Suite Observations
- Executed `python test_badges.py`:
  - Output: `Ran 14 tests in 0.089s — OK` (14 unit tests for monthly badges logic).
- Inspected `tests.html`:
  - Contains DOM-based assertion runner for badges calculation.
- *Observation*: There are currently **no automated UI or CSS tests** for table metrics alignment, keyframe animations, hover box-shadow effects, or scroll bottom clearance.

---

## 2. Logic Chain

### 2.1 Logic Chain for Requirement R3 (Laser Halo & Pulse Animation)
1. **Starting from Observation 1.1.1**: The lightsaber aesthetic requires multi-stage luminescence rather than a single flat shadow. A laser blade exhibits a concentrated white/cyan core, a vibrant inner aura, and a diffuse outer halo.
2. Therefore, a multi-layer `box-shadow` declaration simulates this phenomenon accurately:
   - Layer 1 (core): `0 0 8px rgba(0, 229, 255, 0.5)`
   - Layer 2 (inner aura): `0 0 18px rgba(0, 229, 255, 0.25)`
   - Layer 3 (diffuse halo): `0 0 32px rgba(0, 229, 255, 0.12)`
   - Plus active border accent: `border-color: rgba(0, 229, 255, 0.65) !important;`
3. For the 1st place champion card (gold/amber):
   - Layer 1: `0 0 10px rgba(245, 158, 11, 0.55)`
   - Layer 2: `0 0 22px rgba(245, 158, 11, 0.3)`
   - Layer 3: `0 0 36px rgba(245, 158, 11, 0.15)`
   - Border: `border-color: rgba(245, 158, 11, 0.8) !important;`
4. **Addressing the Table Row Rendering Obstacle**:
   - Because `index.html:197` sets `border-collapse: collapse`, browsers standardly discard `box-shadow` on `<tr>` elements.
   - To make the laser halo work seamlessly on classification table rows, the table structure must employ `border-collapse: separate; border-spacing: 0;` (Tailwind `border-separate border-spacing-0`).
   - In addition, setting `position: relative; z-index: 10;` on hovered `tr` and adding coordinating top/bottom border highlights (`border-top-color`, `border-bottom-color`) to its child `<td>` elements guarantees that the entire row illuminates as a single lightsaber beam across all desktop and mobile browsers.
5. **Starting from Observation 1.1.2**: `@keyframes pulseGlow` exists but is inactive.
6. A continuous, subtle pulse animation targeting element borders must modulate both `border-color` and `box-shadow`:
   - `0%, 100%`: subtle rest state (`border-color: rgba(..., 0.35); box-shadow: 0 0 8px rgba(..., 0.2);`)
   - `50%`: peak luminescence (`border-color: rgba(..., 0.85); box-shadow: 0 0 18px rgba(..., 0.45), 0 0 28px rgba(..., 0.2);`)
7. Applying this pulse animation to:
   - 1st Place Podium Card (`.pulse-laser-amber`)
   - Central Floating "Duelo" Button (`.pulse-laser-cyan`)
   - Leader Row / Position 1 badge in the classification table
   directly fulfills the laser theme requirement without visual clutter.

---

### 2.2 Logic Chain for Requirement R4 (Metric Stability & Scroll Clearance)
1. **Starting from Observation 1.2.1**: With `table-layout: auto` and no explicit `min-width` on `PJ`, `V`, `E`, `D`, `DIF`, and `PTS`, any variation between 1-digit and 2-digit numbers alters cell geometry.
2. The maximum values in a monthly league are:
   - `PJ`, `V`, `E`, `D`: 0 to 99 (2 digits).
   - `DIF`: -99 to +99 (3 characters, including sign).
   - `PTS`: 0 to 200 (up to 3 digits).
3. To achieve zero horizontal shift while preserving mobile screen budget (total viewport ~360px):
   - `PJ`, `V`, `E`, `D`: fixed `min-width: 38px; width: 38px;`
   - `DIF`: fixed `min-width: 46px; width: 46px;`
   - `PTS`: fixed `min-width: 48px; width: 48px;`
   - All columns require `text-align: center;` and `font-variant-numeric: tabular-nums;`.
4. Applying these rules in `styles.css` (via nth-child selectors or `.col-metric` classes) and complementing them in `index.html` `<th>` and `app.js` `<td>` ensures absolute geometric stability under all data conditions.
5. **Starting from Observation 1.2.2**: The fixed bottom dock is ~56px tall and the Duelo button reaches ~72px-82px. The existing `body` class `md:pb-10` sets bottom padding to only 40px on screens >= 768px, causing severe content obstruction.
6. Setting a unified bottom padding of `calc(112px + env(safe-area-inset-bottom, 0px))` (or Tailwind `pb-28 sm:pb-32`) ensures:
   - Complete visibility of the final classification table row and the descriptive footer note.
   - At least 30px of clear buffer between the bottom-most interactive content and the top peak of the floating "Duelo" button.
   - Clean scrolling on mobile, tablet, and desktop viewports alike.
   - Piste referee mode (`body.piste-mode`) remains unaffected via `:not(.piste-mode)`.

---

## 3. Caveats

1. **Table Structure Modification**:
   - Changing `<table class="w-full text-left border-collapse">` to `border-separate border-spacing-0` requires verifying that table cell dividers (`divide-y divide-slate-800/60` in `tbody`) continue to render cleanly. In standard CSS, `border-b border-slate-800/60` on `td` or `divide-y` functions consistently with `border-spacing: 0`.
2. **Interaction with Requirement R2 (Podium Zero-State)**:
   - Requirement R2 mandates that when all fencers have 0 wins, the podium glow and highlights must be dimmed.
   - The pulse animation on the 1st place podium card (`.pulse-laser-amber`) must be conditional: it must **not** animate when the podium is in its zero-state (atenuado).
3. **Hardware Acceleration & Performance**:
   - Continuous `box-shadow` animation can cause repaints if applied to dozens of elements simultaneously. Restricting the `@keyframes` pulse animation strictly to the most prominent elements (1st place podium card and floating Duelo button) maintains 60 FPS performance on mobile devices.

---

## 4. Conclusion & Proposed Implementation Specifications

### 4.1 Requirement R3: Concrete Implementation Details

#### A. Add Laser Halo Hover Rules to `styles.css`
```css
/* ==========================================================================
   R3: Laser Halo Hover Effects & Border Glows
   ========================================================================== */

/* 1. Classification Table Rows */
.ranking-table {
  border-collapse: separate !important;
  border-spacing: 0 !important;
}

tr[data-fencer-profile] {
  cursor: pointer;
  position: relative;
  transition: transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
}

tr[data-fencer-profile]:hover {
  background-color: rgba(0, 229, 255, 0.1) !important;
  box-shadow: 
    0 0 8px rgba(0, 229, 255, 0.45),
    0 0 18px rgba(0, 229, 255, 0.22),
    0 0 32px rgba(0, 229, 255, 0.1) !important;
  z-index: 10;
}

tr[data-fencer-profile]:hover td {
  border-top-color: rgba(0, 229, 255, 0.6) !important;
  border-bottom-color: rgba(0, 229, 255, 0.6) !important;
}

/* 2. Podium Cards */
.podium-card {
  position: relative;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), 
              border-color 0.2s ease, 
              box-shadow 0.2s ease;
}

.podium-card:hover {
  transform: translateY(-3px);
  box-shadow: 
    0 0 10px rgba(0, 229, 255, 0.45),
    0 0 22px rgba(0, 229, 255, 0.25),
    0 0 36px rgba(0, 229, 255, 0.12);
  border-color: rgba(0, 229, 255, 0.65) !important;
}

/* Gold Podium Card Hover (1st Place) */
.podium-card.podium-gold:hover,
.podium-card:has(.text-amber-400):hover {
  box-shadow: 
    0 0 12px rgba(245, 158, 11, 0.55),
    0 0 24px rgba(245, 158, 11, 0.3),
    0 0 40px rgba(245, 158, 11, 0.15) !important;
  border-color: rgba(245, 158, 11, 0.8) !important;
}

/* 3. Medallero Badges Cards */
.badge-card:hover {
  transform: translateY(-3px);
  box-shadow: 
    0 0 10px rgba(0, 229, 255, 0.4),
    0 0 20px rgba(0, 229, 255, 0.2),
    0 0 35px rgba(0, 229, 255, 0.1) !important;
}

/* 4. Fencers Grid List Cards */
#fencersGridList > div:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 229, 255, 0.5) !important;
  box-shadow: 
    0 0 10px rgba(0, 229, 255, 0.35),
    0 0 20px rgba(0, 229, 255, 0.18);
}
```

#### B. Add Laser Border Pulse Animation `@keyframes` in `styles.css`
```css
/* ==========================================================================
   R3: Continuous Laser Border Pulse Animations
   ========================================================================== */

@keyframes laserPulseCyan {
  0%, 100% {
    border-color: rgba(0, 229, 255, 0.35);
    box-shadow: 0 0 8px rgba(0, 229, 255, 0.2), inset 0 0 4px rgba(0, 229, 255, 0.08);
  }
  50% {
    border-color: rgba(0, 229, 255, 0.85);
    box-shadow: 
      0 0 16px rgba(0, 229, 255, 0.5),
      0 0 28px rgba(0, 229, 255, 0.25),
      inset 0 0 8px rgba(0, 229, 255, 0.15);
  }
}

@keyframes laserPulseAmber {
  0%, 100% {
    border-color: rgba(245, 158, 11, 0.35);
    box-shadow: 0 0 8px rgba(245, 158, 11, 0.2), inset 0 0 4px rgba(245, 158, 11, 0.1);
  }
  50% {
    border-color: rgba(245, 158, 11, 0.9);
    box-shadow: 
      0 0 18px rgba(245, 158, 11, 0.55),
      0 0 30px rgba(245, 158, 11, 0.28),
      inset 0 0 8px rgba(245, 158, 11, 0.2);
  }
}

.pulse-laser-cyan {
  animation: laserPulseCyan 2.4s infinite ease-in-out;
}

.pulse-laser-amber {
  animation: laserPulseAmber 2.4s infinite ease-in-out;
}
```

#### C. Locations to Apply the Pulse Classes
1. **1st Place Podium Card** (`app.js:853`):
   Append `pulse-laser-amber` to the container class when active.
2. **Central Floating "Duelo" Button** (`index.html:829`):
   Add `pulse-laser-cyan` to `<div class="w-9 h-9 -mt-4 rounded-full ... pulse-laser-cyan">`.

---

### 4.2 Requirement R4: Concrete Implementation Details

#### A. Add Table Column Metrics CSS Rules to `styles.css`
```css
/* ==========================================================================
   R4: Classification Table Metrics Stability (Fixed min-width & Centering)
   ========================================================================== */

/* Universal tabular digits to eliminate character-width jitter */
.ranking-table th,
.ranking-table td {
  font-variant-numeric: tabular-nums;
}

/* Metric Columns: PJ, V, E, D */
.col-metric-num,
.ranking-table th:nth-child(3), .ranking-table td:nth-child(3),
.ranking-table th:nth-child(4), .ranking-table td:nth-child(4),
.ranking-table th:nth-child(5), .ranking-table td:nth-child(5),
.ranking-table th:nth-child(6), .ranking-table td:nth-child(6) {
  min-width: 38px !important;
  width: 38px !important;
  text-align: center !important;
}

/* Metric Column: DIF (+/- difference) */
.col-metric-dif,
.ranking-table th:nth-child(7), .ranking-table td:nth-child(7) {
  min-width: 46px !important;
  width: 46px !important;
  text-align: center !important;
}

/* Metric Column: PTS (Total League Points) */
.col-metric-pts,
.ranking-table th:nth-child(8), .ranking-table td:nth-child(8) {
  min-width: 48px !important;
  width: 48px !important;
  text-align: center !important;
}
```

#### B. Update `index.html` Table Structure
1. Add `.ranking-table` class and replace `border-collapse` with `border-separate border-spacing-0` on line 197:
   ```html
   <table class="ranking-table w-full text-left border-separate border-spacing-0">
   ```
2. Update `<th>` elements on lines 202-207 with explicit min-width classes:
   ```html
   <th class="py-2.5 px-1 w-[38px] min-w-[38px] text-center" title="Combates Disputados">PJ</th>
   <th class="py-2.5 px-1 w-[38px] min-w-[38px] text-center text-emerald-400" title="Victorias">V</th>
   <th class="py-2.5 px-1 w-[38px] min-w-[38px] text-center text-amber-400" title="Empates">E</th>
   <th class="py-2.5 px-1 w-[38px] min-w-[38px] text-center text-rose-400" title="Derrotas">D</th>
   <th class="py-2.5 px-1 w-[46px] min-w-[46px] text-center text-slate-400" title="Diferencia de puntos">DIF</th>
   <th class="py-2.5 pr-3 pl-1 w-[48px] min-w-[48px] text-center font-black text-cyan-300" title="Puntos Totales de Liga">PTS</th>
   ```

#### C. Update `app.js` Table Row Cell Templates
Update lines 921-926 in `renderRanking()`:
```javascript
<td class="py-2.5 px-1 w-[38px] min-w-[38px] text-center text-slate-400 font-combat text-xs font-semibold">${item.matchesPlayed}</td>
<td class="py-2.5 px-1 w-[38px] min-w-[38px] text-center text-emerald-400 font-combat text-xs font-bold">${item.won}</td>
<td class="py-2.5 px-1 w-[38px] min-w-[38px] text-center text-amber-400 font-combat text-xs font-bold">${item.drawn}</td>
<td class="py-2.5 px-1 w-[38px] min-w-[38px] text-center text-rose-400 font-combat text-xs font-bold">${item.lost}</td>
<td class="py-2.5 px-1 w-[46px] min-w-[46px] text-center">${diffBadge}</td>
<td class="py-2.5 pr-3 pl-1 w-[48px] min-w-[48px] text-center font-combat font-black text-sm text-cyan-300">${item.points}</td>
```

#### D. Fix Container Scroll Padding (`index.html:52` & `styles.css`)
1. In `index.html:52`:
   - Replace:
     `<body class="bg-lsDark text-slate-100 font-sans min-h-screen pb-24 md:pb-10 selection:bg-lsCyan selection:text-black">`
   - With:
     `<body class="bg-lsDark text-slate-100 font-sans min-h-screen pb-28 sm:pb-32 selection:bg-lsCyan selection:text-black">`
     *(Removes the buggy `md:pb-10` which was shrinking padding to 40px on desktop!)*
2. In `styles.css`:
   ```css
   /* Ensure content is never obscured by fixed bottom dock + floating Duelo button */
   body:not(.piste-mode) {
     padding-bottom: calc(112px + env(safe-area-inset-bottom, 0px)) !important;
   }
   ```

---

## 5. Verification Method

### 5.1 Automated Test Verification
Because the project does not have a Node test suite, an automated verification script (`test_ui_refactor.py`) should be implemented and run:

```bash
python test_ui_refactor.py
```

The script must assert:
1. `styles.css` contains `@keyframes laserPulseCyan`, `@keyframes laserPulseAmber`, and multiple `box-shadow` rules for `.podium-card:hover`, `tr[data-fencer-profile]:hover`, and `.badge-card:hover`.
2. `styles.css` contains `min-width` rules (38px, 46px, 48px) and `text-align: center` for table metric columns.
3. `styles.css` contains `padding-bottom: calc(112px...` or equivalent >= 100px on `body:not(.piste-mode)`.
4. `index.html` does NOT contain `md:pb-10` on `body`.
5. Existing unit tests continue to pass:
   ```bash
   python test_badges.py
   ```

### 5.2 Manual Browser Verification Checklist
1. **Server Launch**: Run `.\start-server.ps1` or `python -m http.server 8080` and open `http://localhost:8080`.
2. **Laser Hover Effects**:
   - Hover over each row in the classification table. Verify the entire row lights up with a cyan laser halo (`box-shadow` multiple) and elevated cyan border lines.
   - Hover over the podium cards. Verify the 1st place card displays a warm golden halo and places 2 and 3 display cyan halos.
   - Hover over fencer cards in "Tiradores" and badge cards in "Medallero". Verify smooth transform elevation and halo resplandor.
3. **Pulse Animation**:
   - Observe the 1st place podium card: its border should gently breathe with a subtle golden glow.
   - Observe the central floating "Duelo" button in the bottom dock: its border should gently pulse with a cyan laser glow.
4. **Metric Columns Stability**:
   - Switch to "🧪 Modo Pruebas" and click "Cargar Demo".
   - Notice columns V, E, D, DIF, PTS contain both 1-digit and 2-digit numbers (e.g. 10 pts, +12 dif).
   - Type names into `rankingSearchInput`. Observe the filtered rows. Confirm the columns remain rigidly aligned with zero horizontal jitter or column jumping.
5. **Scroll Clearance**:
   - Scroll to the bottom of the "Ranking" tab on both mobile screen emulation (375px width) and desktop screen width (1200px width).
   - Verify that the last row of the table, plus the descriptive footer ("Liga todos contra todos a 1 sola vuelta mensual..."), are completely visible above the floating "Duelo" button, with a clear safety buffer of ~30px.

---

### Invalidation Conditions
This investigation report is invalidated if:
1. The bottom navigation bar is redesigned to be non-fixed or completely moved to the top.
2. The HTML `table` is completely replaced by a CSS Grid/Flexbox layout.
