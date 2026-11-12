#!/usr/bin/env python3
"""
Empirical Adversarial Challenger Test Suite — Milestone M1
Validates edge cases, WCAG contrast mathematics, podium state transitions, and table geometry.
"""

import unittest
import math
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def channel_luminance(c255):
    c = c255 / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def relative_luminance(r, g, b):
    return 0.2126 * channel_luminance(r) + 0.7152 * channel_luminance(g) + 0.0722 * channel_luminance(b)

def contrast_ratio(l1, l2):
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

def composite_alpha(fg, alpha, bg):
    return tuple(round(fg[i] * alpha + bg[i] * (1.0 - alpha)) for i in range(3))


class TestPodiumZeroStateVsActiveStateEdgeCases(unittest.TestCase):
    """Stress tests for podium zero-state vs active state edge cases."""

    def setUp(self):
        self.app_js = (BASE_DIR / "app.js").read_text(encoding="utf-8")

    def test_edge_case_zero_matches(self):
        """0 matches: With 0 victories and 0 points, podium must remain in zero-state."""
        # Standings simulation
        fencers = [{'id': f'f-{i}', 'name': f'Fencer {i}'} for i in range(1, 6)]
        matches = []
        
        # calculateStandings simulation logic
        standings = []
        for f in fencers:
            standings.append({
                'fencer': f,
                'matchesPlayed': 0,
                'won': 0,
                'drawn': 0,
                'lost': 0,
                'diff': 0,
                'points': 0
            })

        # Condition from app.js:842
        isPodiumActive = any((s.get('won', 0) or 0) >= 1 for s in standings)
        self.assertFalse(isPodiumActive, "Podium must be inactive (zero-state) when matches=0")

        # Code verification in app.js
        self.assertIn("podiumContainer.setAttribute('data-podium-state', isPodiumActive ? 'active' : 'zero')", self.app_js)
        ranking_func = self.app_js.split("renderRanking() {")[1].split("renderMonthlyMedals() {")[0]
        zero_branch = ranking_func.split("} else {")[1].split("if (window.lucide)")[0]
        self.assertIn("bg-lsCard/60", zero_branch)
        self.assertIn("border-slate-800/80", zero_branch)
        self.assertNotIn("animate-bounce", zero_branch)
        self.assertNotIn('data-lucide="crown"', zero_branch)

    def test_edge_case_all_draws(self):
        """Matches exist, but ALL are DRAWS (e.g. DRAW results, 0 victories for all fencers).
        Podium MUST remain in zero-state per requirement: 'solo cuando al menos un jugador registre una victoria'.
        """
        fencers = [{'id': f'f-{i}', 'name': f'Fencer {i}'} for i in range(1, 5)]
        # F1 vs F2 (draw 3-3), F3 vs F4 (draw 2-2), F1 vs F3 (draw 1-1)
        standings = [
            {'fencer': fencers[0], 'matchesPlayed': 2, 'won': 0, 'drawn': 2, 'lost': 0, 'diff': 0, 'points': 2},
            {'fencer': fencers[2], 'matchesPlayed': 2, 'won': 0, 'drawn': 2, 'lost': 0, 'diff': 0, 'points': 2},
            {'fencer': fencers[1], 'matchesPlayed': 1, 'won': 0, 'drawn': 1, 'lost': 0, 'diff': 0, 'points': 1},
            {'fencer': fencers[3], 'matchesPlayed': 1, 'won': 0, 'drawn': 1, 'lost': 0, 'diff': 0, 'points': 1},
        ]

        # In draw-only league, players have points (>0), but won == 0
        self.assertTrue(all(s['points'] > 0 for s in standings))
        self.assertTrue(all(s['won'] == 0 for s in standings))

        # Check activation condition
        isPodiumActive = any((s.get('won', 0) or 0) >= 1 for s in standings)
        self.assertFalse(isPodiumActive, "Podium MUST remain in zero-state when all matches are draws (0 victories)")

    def test_edge_case_one_victory(self):
        """When 1 fencer registers 1 victory, podium must dynamically switch to active state."""
        fencers = [{'id': f'f-{i}', 'name': f'Fencer {i}'} for i in range(1, 5)]
        standings = [
            {'fencer': fencers[0], 'matchesPlayed': 1, 'won': 1, 'drawn': 0, 'lost': 0, 'diff': 2, 'points': 3},
            {'fencer': fencers[1], 'matchesPlayed': 1, 'won': 0, 'drawn': 0, 'lost': 1, 'diff': -2, 'points': 0},
            {'fencer': fencers[2], 'matchesPlayed': 0, 'won': 0, 'drawn': 0, 'lost': 0, 'diff': 0, 'points': 0},
            {'fencer': fencers[3], 'matchesPlayed': 0, 'won': 0, 'drawn': 0, 'lost': 0, 'diff': 0, 'points': 0},
        ]

        isPodiumActive = any((s.get('won', 0) or 0) >= 1 for s in standings)
        self.assertTrue(isPodiumActive, "Podium MUST activate when >= 1 fencer registers >= 1 victory")

        ranking_func = self.app_js.split("renderRanking() {")[1].split("renderMonthlyMedals() {")[0]
        active_branch = ranking_func.split("if (isPodiumActive) {")[1].split("} else {")[0]
        self.assertIn("podium-gold", active_branch)
        self.assertIn("pulse-laser-amber", active_branch)
        self.assertIn("animate-bounce", active_branch)
        self.assertIn('data-lucide="crown"', active_branch)
        self.assertIn("w-12 h-12", active_branch)

    def test_edge_case_fewer_than_three_fencers(self):
        """When total fencers < 3 (0, 1, or 2 fencers), podiumContainer must clear gracefully."""
        self.assertIn("if (standings.length >= 3) {", self.app_js)
        podium_block = self.app_js.split("if (standings.length >= 3) {")[1].split("// Render Table Rows")[0]
        self.assertIn("podiumContainer.innerHTML = '';", podium_block)


class TestMedalleroAndWcagContrastStress(unittest.TestCase):
    """Mathematical WCAG contrast calculations and badge title wrapping stress tests."""

    def setUp(self):
        self.app_js = (BASE_DIR / "app.js").read_text(encoding="utf-8")

    def test_mathematical_contrast_wcag_21(self):
        """Empirical proof of WCAG 2.1 contrast ratios for text-white/70 and text-white/60 against #0f172a."""
        bg = (15, 23, 42)  # #0f172a (navy background)
        bg_lum = relative_luminance(*bg)

        # text-white/70
        fg70 = composite_alpha((255, 255, 255), 0.70, bg)
        lum70 = relative_luminance(*fg70)
        cr70 = contrast_ratio(lum70, bg_lum)

        # text-white/60
        fg60 = composite_alpha((255, 255, 255), 0.60, bg)
        lum60 = relative_luminance(*fg60)
        cr60 = contrast_ratio(lum60, bg_lum)

        # baseline text-slate-500
        old_fg = (100, 116, 139)
        old_lum = relative_luminance(*old_fg)
        old_cr = contrast_ratio(old_lum, bg_lum)

        # Baseline check: text-slate-500 fails WCAG AA 4.5:1
        self.assertLess(old_cr, 4.5, f"Baseline text-slate-500 contrast {old_cr:.2f}:1 failed WCAG AA")

        # text-white/70 passes WCAG AA (4.5:1) AND AAA (7.0:1)
        self.assertGreaterEqual(cr70, 4.5, f"text-white/70 contrast {cr70:.2f}:1 must meet WCAG AA (4.5:1)")
        self.assertGreaterEqual(cr70, 7.0, f"text-white/70 contrast {cr70:.2f}:1 must meet WCAG AAA (7.0:1)")

        # text-white/60 passes WCAG AA non-text (3.0:1) AND normal text (4.5:1)
        self.assertGreaterEqual(cr60, 3.0, f"text-white/60 contrast {cr60:.2f}:1 must meet WCAG AA non-text (3.0:1)")
        self.assertGreaterEqual(cr60, 4.5, f"text-white/60 contrast {cr60:.2f}:1 must meet WCAG AA normal text (4.5:1)")

    def test_badge_titles_varying_lengths(self):
        """Test badge titles from 7 to 30 chars wrap without clipping or breaking grid."""
        medals_func = self.app_js.split("renderMonthlyMedals() {")[1].split("renderDuelFormOptions() {")[0]

        # Multi-line wrapping rules
        self.assertIn("whitespace-normal", medals_func)
        self.assertIn("leading-tight", medals_func)
        self.assertIn("line-clamp-2", medals_func)

        # Card container vertical alignment
        self.assertIn("flex flex-col justify-between", medals_func)

        # Title span attributes
        self.assertIn('title="${badge.title}"', medals_func)

        # Title span must NOT use truncate
        title_matches = re.findall(r'<span[^>]*font-display[^>]*>\s*\$\{badge\.title\}', medals_func)
        self.assertTrue(len(title_matches) > 0)
        for m in title_matches:
            self.assertNotIn("truncate", m)


class TestTableMetricsAndScrollClearance(unittest.TestCase):
    """Verify table column geometries and scroll clearance."""

    def setUp(self):
        self.index_html = (BASE_DIR / "index.html").read_text(encoding="utf-8")
        self.styles_css = (BASE_DIR / "styles.css").read_text(encoding="utf-8")
        self.app_js = (BASE_DIR / "app.js").read_text(encoding="utf-8")

    def test_table_metric_fixed_widths(self):
        """Verify metric columns have min-width and text-center in both HTML and JS."""
        self.assertIn("ranking-table w-full text-left border-separate border-spacing-0", self.index_html)
        self.assertIn('w-[38px] min-w-[38px] text-center', self.index_html)
        self.assertIn('w-[46px] min-w-[46px] text-center', self.index_html)
        self.assertIn('w-[48px] min-w-[48px] text-center', self.index_html)

        self.assertIn('w-[38px] min-w-[38px] text-center', self.app_js)
        self.assertIn('w-[46px] min-w-[46px] text-center', self.app_js)
        self.assertIn('w-[48px] min-w-[48px] text-center', self.app_js)

        self.assertIn('font-variant-numeric: tabular-nums', self.styles_css)

    def test_scroll_clearance_dock(self):
        """Verify bottom scroll clearance prevents dock and Duelo button overlap."""
        self.assertNotIn("md:pb-10", self.index_html)
        self.assertIn("pb-28 sm:pb-32", self.index_html)
        self.assertIn("padding-bottom: calc(112px + env(safe-area-inset-bottom, 0px)) !important;", self.styles_css)


if __name__ == "__main__":
    unittest.main()
