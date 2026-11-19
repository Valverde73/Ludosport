# LudoSport ATLAS — Frontend Color & Brand Adaptation

*   **Author:** Emilio Valverde
*   **Status:** Proposed
*   **Date:** 2026-11-18

--------------------------------------------------------------------------------

## Problem Statement

La interfaz web de la liga mensual utiliza actualmente una paleta azul marino/cian (`#080c14` en `lsDark` / `#090d16` en `theme-color`, `#0f172a` en `lsCard` y `#00e5ff` en `lsCyan`) y el título `LudoSport` (`<h1>` en `index.html:66`, `<title>` `LudoSport Arena - Liga Mensual` en `index.html:6`), lo que no coincide con la identidad visual oficial de **LudoSport ATLAS** (`#000000`, `#242323`, `#d3732b`, `#ffffff`).

## Goals & Non-Goals

### Goals

*   Aplicar la paleta oficial de **LudoSport ATLAS** en el marco global de la interfaz (excluyendo colores semánticos de estado, lados de duelo y sables individuales):
    *   Fondo principal (`atlasBg`): `#000000`.
    *   Superficies, tarjetas y contenedores (`atlasSurface`): `#242323`.
    *   Bordes decorativos (`atlasBorder`): `#3a3838`; bordes de controles interactivos: `border-neutral-500` (`#737373`).
    *   Acento primario de marca (`atlasAccent`): `#d3732b` (y `atlasAccentLight`: `#e0823a` para texto/enlaces naranja sobre fondo oscuro).
    *   Texto principal: `#ffffff`.
*   Actualizar `<title>` (`LudoSport ATLAS - Liga Mensual`), `<meta name="theme-color" content="#000000">` y la cabecera visible (`LudoSport ATLAS`).
*   Cumplir WCAG 2.1 AA (`>= 4.5:1` en texto normal y `>= 3.0:1` SC 1.4.11 en bordes interactivos) y actualizar la suite de tests de UI para validar los nuevos tokens.

### Non-Goals

*   Cambiar las tipografías actuales (`Inter`, `Orbitron`, `Rajdhani`).
*   Rediseñar flujos funcionales, marcador en vivo, cálculo de ranking o lógica de insignias (`badges.js`).
*   Modificar backend, `supabase_schema.sql`, [api/config.js](file:///c:/Users/Ana/Documents/LudoSport/api/config.js), [Code.gs](file:///c:/Users/Ana/Documents/LudoSport/Code.gs), [README.md](file:///c:/Users/Ana/Documents/LudoSport/README.md) ni [tests.html](file:///c:/Users/Ana/Documents/LudoSport/tests.html). (No existe archivo `manifest.json` ni `manifest.webmanifest` en el repositorio).
*   Alterar los colores individuales del sable de cada tirador (`fencer.color`, `getSaberColorName()`, `getFencerAvatarHtml()`, `.saber-ring-*` en sus 6 familias: `cyan`, `emerald`, `amber`, `purple`, `rose`, `white`) ni los colores semánticos de estado (`emerald` victoria/sync, `amber` modo pruebas/1.º puesto `.pulse-laser-amber`, `rose`/`red` error/derrota) ni los lados de duelo en el marcador en vivo (**Corner Alfa** `cyan-*` / `"Lado Azul"` vs. **Corner Beta** `amber-*` / `"Lado Ámbar/Rojo"`).
*   Introducir selector de temas dinámicos ni cambiar `Liga Mensual Oficial` (`index.html:68`).

--------------------------------------------------------------------------------

## Proposed Architecture

La adaptación visual se define mediante **tokens semánticos `atlas*` en `tailwind.config.theme.extend.colors`** dentro de [index.html](file:///c:/Users/Ana/Documents/LudoSport/index.html) como fuente única de verdad con literales hexadecimales (compatibles con modificadores de opacidad `/90`, `/95`, `/60`, `/20` de Tailwind v3 Play CDN), sin variables `:root` en [styles.css](file:///c:/Users/Ana/Documents/LudoSport/styles.css).

### 1. Tokens y Separación de Subsistemas

```text
+-------------------------------------------------------------------+
|      tailwind.config (index.html) — Fuente única de verdad        |
|  atlasBg: #000000 | atlasSurface: #242323 | atlasBorder: #3a3838  |
|  atlasAccent: #d3732b | atlasAccentLight: #e0823a                 |
+-------------------------------------------------------------------+
         |                                      |
         v                                      v
+-------------------------+          +------------------------------+
| Marco de la App (UI)    |          | Elementos preservados        |
| - index.html (shell)    |          | - fencer.color / .saber-ring |
| - styles.css (9 grupos) |          |   (6 familias de sable)      |
| - app.js (vistas +      |          | - Corner Alfa (cyan) vs      |
|   colorScheme via-*)    |          |   Corner Beta (amber)        |
+-------------------------+          +------------------------------+
```

*   **`colorScheme` en [app.js](file:///c:/Users/Ana/Documents/LudoSport/app.js) (`renderMonthlyMedals()`):** No controla sables individuales; estiliza las 5 tarjetas de medallas mensuales. Se migra `via-lsCard to-lsCard` a `via-atlasSurface to-atlasSurface` y el fallback `slate-*` a `atlasBorder`/`atlasSurface`/`text-white`, manteniendo `TOP_SCORER` en `cyan`.
*   **`badges.js`:** Es lógica pura independiente del DOM (`0` clases `slate-*`) y no requiere cambios funcionales.

### 2. Reglas de Contraste WCAG 2.1

*   `#ffffff` sobre `#000000` (`21.00:1`) y sobre `#242323` (`15.68:1`).
*   Texto secundario sobre `#242323`: `text-white/70` (`8.34:1` AAA) o `text-white/60` (`6.52:1` AA).
*   `atlasAccentLight` (`#e0823a`): `5.54:1` sobre `#242323` y `7.42:1` sobre `#000000` (uso en texto/enlaces naranja).
*   `atlasAccent` (`#d3732b`): `4.67:1` sobre `#242323` y `6.26:1` sobre `#000000`; con texto `#000000` encima (`text-black`) alcanza `6.26:1` AA (obligatorio en CTAs primarios como `#liveFinishAndSaveBtn` en `index.html:560`, evitando `text-white` que da `3.36:1`).
*   Pills `bg-atlasAccent/20` sobre `#242323`: usar `text-white` (`11.88:1` AAA), nunca texto naranja (`3.54:1`–`4.20:1`).
*   Bordes: `atlasBorder` (`#3a3838`, `1.35:1`) solo para divisores decorativos; `border-neutral-500` (`#737373`, `3.31:1` sobre `#242323`, `4.43:1` sobre `#000000`) para controles interactivos (`<input>`, `<select>`, botones outline).

--------------------------------------------------------------------------------

## Alternatives Considered

### Alternative A: Literales hex en `tailwind.config` vs. variables CSS `--atlas-*-rgb`

*   **Pros de `--atlas-*-rgb`**: Permitía compartir canales RGB entre `styles.css` y `tailwind.config` si existiera cambio de tema en tiempo de ejecución.
*   **Contras**: Añade indirección en dos archivos cuando `Non-Goals` excluye temas dinámicos y `<meta name="theme-color">` exige hex literal; actualmente hay `0` variables `:root` en el proyecto.

### Alternative B: Renombrado semántico `atlas*` vs. remapeo de `ls*`

*   **Pros de remapear `ls*`**: Diff ligeramente menor al conservar `lsDark`, `lsCard`, `lsCyan` y `.pulse-laser-cyan`.
*   **Contras**: Deja identificadores llamados `lsCyan` y `.pulse-laser-cyan` pintando naranja (`#d3732b`), generando confusión en mantenimiento futuro.

--------------------------------------------------------------------------------

## Risks & Mitigations

1.  **Regresión en tarjetas de medallas (`colorScheme`):** Eliminar `lsCard` sin actualizar `via-lsCard to-lsCard` en `app.js:1071-1113` rompe el degradado de las tarjetas. *Mitigación:* migrar `via-lsCard to-lsCard` a `via-atlasSurface to-atlasSurface` en la Fase 2.
2.  **Fallos WCAG 2.1 AA / SC 1.4.11:** `#3a3838` en inputs (`1.35:1`), `text-white` sobre `#d3732b` (`3.36:1`) o texto naranja sobre `bg-atlasAccent/20` (`3.54:1`–`4.20:1`) incumplen contraste. *Mitigación:* aplicar `border-neutral-500`, `text-black` en CTAs `#d3732b` y `text-white` en pills `/20`.
3.  **Colisión visual Corner Alfa vs. Corner Beta:** Convertir `cyan-*` de Corner Alfa a `#d3732b` naranja lo confundiría con Corner Beta (`amber-*`) en arbitraje en directo. *Mitigación:* excluir Corner Alfa/Beta en `Non-Goals`.
4.  **Rotura de tests por aserciones literales:** `9` archivos de test comprueban tokens `ls*`, `slate-900`/`#0f172a` o `laserPulseCyan`. *Mitigación:* ejecutar la migración en 3 fases incrementales y actualizar los 9 archivos de test.

--------------------------------------------------------------------------------

## Detailed Implementation Plan

### Fase 1: Tokens Aditivos y Keyframes (Sin Romper Tests Existentes)

1.  **`index.html` (Modify):** Añadir `atlasBg: '#000000'`, `atlasSurface: '#242323'`, `atlasBorder: '#3a3838'`, `atlasAccent: '#d3732b'` y `atlasAccentLight: '#e0823a'` en `tailwind.config.theme.extend.colors` manteniendo temporalmente los tokens `ls*` existentes.
2.  **`styles.css` (Modify):** Añadir `@keyframes laserPulseAccent` y `.pulse-laser-accent` junto a las reglas existentes.
3.  **Checkpoint:** Ejecutar `python -B -m unittest discover -p "test_*.py"` y los 6 scripts `node` para confirmar `100%` en verde.

### Fase 2: Migración de HTML, CSS, JS y Suite de Tests

#### `styles.css` (Modify)
*   Actualizar `body` (`lines 8-14`): `background-color: #000000; color: #ffffff;` con `radial-gradient(circle at 50% 0%, rgba(211, 115, 43, 0.08) 0%, transparent 60%)` y eliminar el segundo gradiente púrpura (`100% 100%`).
*   Actualizar los 9 grupos activos de marca a la gama `#d3732b` / `#242323` / `#3a3838`: `body` (`8-14`), `@keyframes laserPulseAccent` / `.pulse-laser-accent` (`49-61, 77-79` con `rgba(211, 115, 43, 0.35/0.85/0.5/0.25)`), `.nav-tab.active` & `.nav-tab.active i` (`102-108`), `::-webkit-scrollbar-*` (`126-137`), `.podium-card:hover` (`169-176`), `[data-podium-state="zero"] .podium-card:hover` (`194-198`), `tr[data-fencer-profile]:hover` (`257-269`), `#fencersGridList > div:hover, .fencer-card:hover` (`277-284`), `.badge-card:hover/:focus/:focus-visible` (`349-361`). Conservar `@keyframes laserPulseAmber` / `.pulse-laser-amber` y `.podium-gold`.

#### `index.html` (Modify)
*   `<title>LudoSport ATLAS - Liga Mensual</title>` (`L6`), `<meta name="theme-color" content="#000000">` (`L9`), `<body>` (`L52`: `bg-atlasBg text-white font-sans ... selection:bg-atlasAccent selection:text-black`).
*   Cabecera (`L59-70`): icono tile con `bg-gradient-to-tr from-atlasAccent to-atlasAccentLight text-black`, ping `bg-atlasAccent`, `<h1>` con texto `LudoSport ATLAS` (`from-white via-orange-200 to-atlasAccentLight`), subtítulo `Liga Mensual Oficial` (`text-atlasAccentLight/80`).
*   `#liveFinishAndSaveBtn` (`L560`): `bg-atlasAccent hover:bg-atlasAccentLight text-black` (`6.26:1` AA).
*   `OHs Anotados` (`L501, L583` y `styles.css:474`): subir `text-white/60` / `0.6` a `text-white/70` / `0.7` (`8.34:1` sobre `#242323`, `9.90:1` sobre `#000000`) para mantener WCAG AAA (`>= 7.0`).
*   Tabla determinista de mapeo (`465` tokens `slate-*` y acentos fríos):
    *   `bg-slate-950` -> `bg-atlasBg`; `bg-slate-900`/`800` -> `bg-atlasSurface` (o `bg-white/5`).
    *   `text-slate-100`/`200` -> `text-white`; `text-slate-300`/`400`/`500`/`600` y `placeholder-slate-500` -> `text-white/70` (o `text-white/60`).
    *   `text-slate-950` -> `text-black` (excepto Corner Alfa `L509`).
    *   `border-lsBorder` / `border-slate-700`/`800` en divisores -> `border-atlasBorder`; en `<input>`, `<select>` y botones outline -> `border-neutral-500`.
    *   `blue-500` (`408, 560, 902`), `indigo-500` (`560`), `cyan-950/60` (`240`) -> `atlasAccent`/`atlasSurface` (conservar Corner Alfa `cyan-*` en `L468-512` y Corner Beta `amber-*` en `L566-575`).

#### `app.js` (Modify)
*   Aplicar la misma tabla de mapeo en plantillas dinámicas, `showToast()` (`2008-2011`) y `colorScheme` (`1071-1113`: `via-lsCard to-lsCard` -> `via-atlasSurface to-atlasSurface`, fallback `slate-*` -> `atlasBorder`/`atlasSurface`/`text-white`, manteniendo `TOP_SCORER` `cyan`).
*   Conservar intactos `fencer.color`, `getSaberColorName()`, `getFencerAvatarHtml()`, `.saber-ring-*` y puntos de color de sable (`1717, 2172`).

#### Tests Impactados (9 archivos, 1 entrada por archivo)
*   `test_ui_refactor.py` (Modify): actualizar `TestR1` (`42, 48, 65-85`), `TestR2` (`119-120`) y `TestR3` (`156-174`) a `atlas*`, `laserPulseAccent` y `pulse-laser-accent`.
*   `test_challenger_marcador_ui.py` (Modify): validar `white/70` (`8.34:1` / `9.90:1` AAA) sobre `#242323` y `#000000` (`>= 7.0`).
*   `test_challenger_marcador_ui.js` (Modify): validar `white/70` (`8.34` / `9.90` AAA) sobre `#242323` / `#000000` y actualizar `text-slate-950` en mocks (`218, 225`).
*   `test_challenger_m1.py` (Modify): actualizar `text-slate-400` (`95`), `text-cyan-300` (`104`), `@keyframes laserPulseCyan` (`220-223`), capas `rgba(0, 229, 255` (`250, 256, 268`) y `text-slate-500` (`327`).
*   `test_empirical_challenger.py` (Modify): actualizar `bg-lsCard/60` (`63`), `border-slate-800/80` (`64`) y cálculos `#0f172a` (`124-152`) a `atlasSurface` / `#242323`.
*   `test_empirical_challenger.js` (Modify): actualizar `bg-lsCard/60` (`130`), `border-slate-800/80` (`131`), WCAG `#0f172a` (`264-295`), `text-cyan-300` (`344, 380`) y `text-slate-400` (`376`).
*   `test_marcador_live.py` (Modify): actualizar `not text-slate-500` (`100, 104`), `0.6` -> `0.7` (`109`) y `#0f172a` (`120-125`).
*   `test_ranking_academy.js` (Modify): actualizar `bg-cyan-500/20` (`546-547`) para coincidir con `app.js:881-883`.
*   `test_table_simulation.py` (Modify): actualizar `render_row_python_model()` (`22-64`) y `assertIn("text-slate-500", ...)` (`132`) para evitar fallos por aserciones obsoletas.

### Fase 3: Limpieza de Tokens Legacy y CSS Muerto

1.  **`index.html` (Modify):** Eliminar `lsDark`, `lsCard`, `lsBorder`, `lsCyan`, `lsCyanGlow`, `lsAmber`, `lsEmerald`, `lsRed`, `lsPurple`.
2.  **`styles.css` (Modify):** Eliminar `@keyframes laserPulseCyan`, `.pulse-laser-cyan`, `@keyframes pulseGlow` (`39-46`), `.glow-saber-cyan` (`93-95`), `.glow-saber-amber` (`97-99`) y `.result-btn.selected*` (`140-161`).

### Verification Plan

Todos los tests Python y Node.js usan stdlib/built-ins de Node y se ejecutan offline sin `start-server.ps1` (que solo sirve archivos estáticos y mock `/api/config` en `start-server.ps1:1-61` para revisión visual manual).

*   **Python Test Suite**: `python -B -m unittest discover -p "test_*.py"` (incluyendo aserciones automáticas para `#000000` sobre `#d3732b` `>= 4.5:1`, `#e0823a` sobre `#242323`/`#000000` `>= 4.5:1`, `text-white` sobre `bg-atlasAccent/20` `>= 4.5:1`, `border-neutral-500` `>= 3.0:1`, `<title>`, `<meta name="theme-color" content="#000000">`, cabecera `LudoSport ATLAS`, ausencia de tokens `ls*` eliminados y preservación de `fencer.color`/`.saber-ring-*` + Corner Alfa/Beta).
*   **Node/JS Test Suite** (cada script por separado):
    *   `node test_challenger_marcador_ui.js`
    *   `node test_empirical_challenger.js`
    *   `node test_empirical_timer_r2_r5.js` (suite sin cambios)
    *   `node test_fencer_academy.js` (suite sin cambios)
    *   `node test_ranking_academy.js`
    *   `node test_score_buttons_timer.js` (suite sin cambios)
*   **Manual / Visual Check**: Levantar `start-server.ps1` y verificar en navegador: fondo `#000000`, tarjetas `#242323`, acentos `#d3732b`/`#e0823a`, texto `#ffffff`, cabecera `LudoSport ATLAS`, tipografías intactas, Corner Alfa/Beta diferenciados y las 6 familias de sable (`cyan`, `emerald`, `amber`, `purple`, `rose`, `white`).

--------------------------------------------------------------------------------

*Drafted with EGM*
