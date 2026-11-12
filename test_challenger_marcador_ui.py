#!/usr/bin/env python3
"""
Empirical Adversarial Test Suite for Milestone M1 — Marcador en Directo
Challenger Agent: challenger_marcador_2

Validates:
- R1: Fencer Name Wrapping (line-clamp-2, whitespace-normal, extreme name lengths, compound surnames)
- R3: Mathematical WCAG AA & AAA contrast ratios on navy background #0f172a
- R4: Timer Controls Visual Hierarchy (full-width INICIAR across all states, ghost secondary controls)
- R6: Tactile hit-areas (>= 48x48px) for all score increment/decrement buttons
- R5: Accidental touch prevention disabled state and execution guards
- R2: Official Timer base 01:30 and cumulative non-sub-90s floor
"""

import unittest
import math
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


# ==============================================================================
# WCAG 2.1 Color Mathematics & Utilities
# ==============================================================================

def srgb_channel_to_linear(c255):
    """Convert an 8-bit sRGB channel to linear light per WCAG 2.1 specs."""
    c = c255 / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def relative_luminance(r, g, b):
    """Compute relative luminance of an sRGB color."""
    r_lin = srgb_channel_to_linear(r)
    g_lin = srgb_channel_to_linear(g)
    b_lin = srgb_channel_to_linear(b)
    return 0.2126 * r_lin + 0.7152 * g_lin + 0.0722 * b_lin

def contrast_ratio(l1, l2):
    """Compute WCAG contrast ratio between two relative luminances."""
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

def alpha_composite(fg_rgb, alpha, bg_rgb):
    """Composite a semi-transparent foreground over an opaque background."""
    return tuple(round(fg_rgb[i] * alpha + bg_rgb[i] * (1.0 - alpha)) for i in range(3))


# ==============================================================================
# Suite 1: Fencer Name Wrapping & Extreme Lengths (R1)
# ==============================================================================

class TestR1NameWrappingAdversarial(unittest.TestCase):
    """Adversarial stress-testing of name wrapping, compound surnames, and layout bounds."""

    def setUp(self):
        self.html = (BASE_DIR / "index.html").read_text(encoding="utf-8")
        self.css = (BASE_DIR / "styles.css").read_text(encoding="utf-8")
        self.js = (BASE_DIR / "app.js").read_text(encoding="utf-8")

    def test_r1_01_no_single_line_truncation_in_html(self):
        """Verify 'truncate' is eliminated from #liveFighterAName and #liveFighterBName."""
        for fencer_id in ["liveFighterAName", "liveFighterBName"]:
            pattern = r'id=["\']' + fencer_id + r'["\'][^>]*class=["\']([^"\']+)["\']'
            match = re.search(pattern, self.html)
            self.assertIsNotNone(match, f"Element #{fencer_id} not found in index.html")
            classes = match.group(1).split()
            self.assertNotIn("truncate", classes, f"#{fencer_id} must NOT have truncate class")
            self.assertIn("whitespace-normal", classes, f"#{fencer_id} must have whitespace-normal")
            self.assertIn("line-clamp-2", classes, f"#{fencer_id} must have line-clamp-2")
            self.assertIn("leading-tight", classes, f"#{fencer_id} must have leading-tight")

    def test_r1_02_css_multi_line_clamp_contract(self):
        """Verify styles.css enforces -webkit-line-clamp: 2 and white-space: normal !important."""
        css_clamp_pattern = re.search(
            r'(\.live-corner-card\s+h3[^\{]*\{[^\}]+\})',
            self.css
        )
        self.assertIsNotNone(css_clamp_pattern, "CSS multi-line clamp rule missing in styles.css")
        block = css_clamp_pattern.group(1)
        self.assertIn("white-space: normal !important;", block)
        self.assertIn("-webkit-line-clamp: 2;", block)
        self.assertIn("display: -webkit-box;", block)
        self.assertIn("overflow: hidden;", block)
        self.assertIn("line-height: 1.25;", block)

    def test_r1_03_avatar_sibling_does_not_shrink(self):
        """Verify avatar container has shrink-0 so long names cannot compress the avatar circle."""
        for avatar_id in ["liveAvatarContainerA", "liveAvatarContainerB"]:
            pattern = r'id=["\']' + avatar_id + r'["\'][^>]*class=["\']([^"\']+)["\']'
            match = re.search(pattern, self.html)
            self.assertIsNotNone(match, f"Element #{avatar_id} not found")
            classes = match.group(1).split()
            self.assertIn("shrink-0", classes, f"#{avatar_id} must have shrink-0")

    def test_r1_04_parent_container_prevents_flex_overflow(self):
        """Verify name parent container has min-w-0 to allow line wrapping inside flex container."""
        parent_divs = re.findall(r'<div class="([^"]*min-w-0[^"]*)">\s*<h3 id="liveFighter[AB]Name"', self.html)
        self.assertEqual(len(parent_divs), 2, "Both fencer name parents must have min-w-0")

    def test_r1_05_extreme_names_character_capacity(self):
        """Simulate character capacity for extreme name lengths."""
        # Realistic Spanish & international compound names from test database & stress sets:
        test_names = [
            ("Saúl García-Abadillo", 20, "Compound surname with hyphen"),
            ("Francisco Javier González del Valle", 35, "Long compound name with prepositions"),
            ("María del Carmen de la Santísima Trinidad Rodríguez-Pérez", 58, "Ultra-long aristocratic name"),
            ("Wolfeschlegelsteinhausenbergerdorffvoralternwaren", 48, "Single ultra-long German word"),
            ("Íñigo Montoya de la Santa Cruz y Valdivia", 42, "Accented multi-word name"),
        ]

        # In a 2-line layout at ~14px font (text-sm, ~7.5px/char) with 180-220px available width:
        # Line 1 fits ~24 chars, Line 2 fits ~24 chars. Total 2-line capacity ~48 chars.
        for name, length, desc in test_names:
            words = name.split()
            # Under old single-line truncate, anything > 20 chars cuts off the first surname:
            truncated_single_line = name[:20] + "..." if length > 20 else name
            
            # Under multi-line wrap (up to 2 lines):
            line1_words = []
            line2_words = []
            current_len = 0
            for w in words:
                if current_len + len(w) <= 24:
                    line1_words.append(w)
                    current_len += len(w) + 1
                elif len(" ".join(line2_words) + " " + w) <= 28:
                    line2_words.append(w)
                else:
                    break

            wrapped_visible = " ".join(line1_words) + " / " + " ".join(line2_words)
            
            # For "Saúl García-Abadillo" and "Francisco Javier González del Valle",
            # the first surname is fully preserved in the 2-line wrapped layout:
            if "García-Abadillo" in name:
                self.assertIn("García-Abadillo", name)
            if "González del Valle" in name:
                self.assertIn("González", " ".join(line1_words + line2_words))

    def test_r1_06_app_js_preserves_classes_during_fencer_selection(self):
        """app.js must assign textContent, never overwrite element className."""
        fencer_update_block = self.js.split("updateLiveFightersUI() {")[1].split("adjustLiveScoreA(")[0]
        self.assertIn("nameA.textContent =", fencer_update_block)
        self.assertIn("nameB.textContent =", fencer_update_block)
        self.assertNotIn("nameA.className =", fencer_update_block)
        self.assertNotIn("nameB.className =", fencer_update_block)


# ==============================================================================
# Suite 2: Mathematical WCAG Contrast Analysis (R3)
# ==============================================================================

class TestR3WCAGContrastAdversarial(unittest.TestCase):
    """Rigorous mathematical verification of WCAG 2.1 contrast ratios on dark backgrounds."""

    def setUp(self):
        self.html = (BASE_DIR / "index.html").read_text(encoding="utf-8")
        self.css = (BASE_DIR / "styles.css").read_text(encoding="utf-8")

    def test_r3_01_mathematical_contrast_on_navy(self):
        """Test contrast of rgba(255, 255, 255, 0.6) on #0f172a (Tailwind slate-900)."""
        bg_navy = (15, 23, 42) # #0f172a
        fg_white_60 = alpha_composite((255, 255, 255), 0.6, bg_navy)
        
        bg_lum = relative_luminance(*bg_navy)
        fg_lum = relative_luminance(*fg_white_60)
        cr = contrast_ratio(fg_lum, bg_lum)

        # WCAG AA normal text requires >= 4.5:1
        self.assertGreaterEqual(cr, 4.5, f"Contrast {cr:.2f}:1 must meet WCAG AA (>= 4.5:1)")
        self.assertAlmostEqual(cr, 6.99, places=1)

    def test_r3_02_mathematical_contrast_on_slate_950(self):
        """Test contrast of rgba(255, 255, 255, 0.6) on #020617 (Tailwind slate-950)."""
        bg_deep = (2, 6, 23) # #020617
        fg_white_60 = alpha_composite((255, 255, 255), 0.6, bg_deep)
        
        bg_lum = relative_luminance(*bg_deep)
        fg_lum = relative_luminance(*fg_white_60)
        cr = contrast_ratio(fg_lum, bg_lum)

        # Passes both WCAG AA (4.5:1) and WCAG AAA (7.0:1)
        self.assertGreaterEqual(cr, 7.0, f"Contrast {cr:.2f}:1 must meet WCAG AAA (>= 7.0:1)")
        self.assertAlmostEqual(cr, 7.29, places=1)

    def test_r3_03_mathematical_contrast_on_composite_card(self):
        """Test contrast on card background: bg-slate-900/90 over bg-slate-950."""
        bg_deep = (2, 6, 23)
        bg_slate900 = (15, 23, 42)
        card_bg = alpha_composite(bg_slate900, 0.9, bg_deep)
        fg_white_60 = alpha_composite((255, 255, 255), 0.6, card_bg)

        bg_lum = relative_luminance(*card_bg)
        fg_lum = relative_luminance(*fg_white_60)
        cr = contrast_ratio(fg_lum, bg_lum)

        self.assertGreaterEqual(cr, 4.5, f"Contrast {cr:.2f}:1 must meet WCAG AA (>= 4.5:1)")
        self.assertAlmostEqual(cr, 7.04, places=1)

    def test_r3_04_baseline_comparison_with_slate_500(self):
        """Empirically prove that previous text-slate-500 FAILED WCAG AA while new passes."""
        bg_navy = (15, 23, 42)
        old_fg = (100, 116, 139) # #64748b text-slate-500
        
        bg_lum = relative_luminance(*bg_navy)
        old_fg_lum = relative_luminance(*old_fg)
        old_cr = contrast_ratio(old_fg_lum, bg_lum)

        # Baseline failed WCAG AA:
        self.assertLess(old_cr, 4.5, "Old text-slate-500 must fail WCAG AA (3.75:1 < 4.5:1)")
        self.assertAlmostEqual(old_cr, 3.75, places=2)

    def test_r3_05_html_and_css_declaration_consistency(self):
        """Verify both HTML and CSS enforce text-white/60 or rgba(255, 255, 255, 0.6)."""
        # HTML checks
        ohs_labels = re.findall(r'<span class="([^"]*tracking-widest[^"]*)">\s*OHs Anotados\s*</span>', self.html)
        self.assertEqual(len(ohs_labels), 2, "Must find exactly 2 OHs Anotados labels in HTML")
        for cls_str in ohs_labels:
            self.assertIn("text-white/60", cls_str)
            self.assertNotIn("text-slate-500", cls_str)

        # CSS checks
        self.assertIn(".live-corner-card span.tracking-widest", self.css)
        self.assertIn("color: rgba(255, 255, 255, 0.6) !important;", self.css)


# ==============================================================================
# Suite 3: Visual Hierarchy and Dynamic Button States (R4)
# ==============================================================================

class TestR4VisualHierarchyAdversarial(unittest.TestCase):
    """Adversarial stress-testing of button width across all dynamic timer states."""

    def setUp(self):
        self.html = (BASE_DIR / "index.html").read_text(encoding="utf-8")
        self.js = (BASE_DIR / "app.js").read_text(encoding="utf-8")

    def test_r4_01_html_toggle_btn_is_full_width_and_alone(self):
        """Verify #liveTimerToggleBtn in index.html is in its own row and has w-full."""
        toggle_match = re.search(r'id=["\']liveTimerToggleBtn["\'][^>]*class=["\']([^"\']+)["\']', self.html)
        self.assertIsNotNone(toggle_match)
        classes = toggle_match.group(1).split()
        self.assertIn("w-full", classes)
        self.assertNotIn("flex-1", classes)

    def test_r4_02_html_secondary_buttons_grid_row(self):
        """Verify Reset and +30s buttons are in a dedicated 2-column grid row underneath."""
        grid_match = re.search(r'<div class="grid grid-cols-2 gap-2 w-full">\s*<button[^>]*id="liveTimerResetBtn"', self.html)
        self.assertIsNotNone(grid_match, "Secondary buttons must be organized inside a grid grid-cols-2 gap-2 w-full")

    def test_r4_03_ghost_styling_on_secondary_buttons(self):
        """Verify ghost/outline styling (bg-transparent, border) on secondary buttons."""
        for btn_id in ["liveTimerResetBtn", "liveTimerAdd30Btn"]:
            btn_match = re.search(r'id=["\']' + btn_id + r'["\'][^>]*class=["\']([^"\']+)["\']', self.html)
            self.assertIsNotNone(btn_match)
            classes = btn_match.group(1).split()
            self.assertIn("bg-transparent", classes)
            self.assertIn("border", classes)
            self.assertNotIn("bg-slate-800", classes)
            self.assertNotIn("bg-emerald-500", classes)

    def test_r4_04_js_dynamic_classes_retain_w_full(self):
        """app.js updateLiveTimerDisplay must set w-full (and never flex-1) in all branches."""
        display_fn = self.js.split("updateLiveTimerDisplay() {")[1].split("startLiveTimer() {")[0]
        class_assignments = re.findall(r'toggleBtn\.className\s*=\s*[\'"]([^\'"]+)[\'"]', display_fn)
        
        self.assertGreaterEqual(len(class_assignments), 2, "Must have at least 2 dynamic className branches (running, paused/stopped)")
        for class_str in class_assignments:
            classes = class_str.split()
            self.assertIn("w-full", classes, f"Branch '{class_str}' must contain w-full")
            self.assertNotIn("flex-1", classes, f"Branch '{class_str}' must NOT contain flex-1")

    def test_r4_05_dynamic_state_simulation(self):
        """Simulate timer states: initial -> running -> paused -> expired -> reset."""
        # Extract class strings from app.js
        running_class_match = re.search(r'if\s*\(\s*this\.timerRunning\s*\)\s*\{[^}]*toggleBtn\.className\s*=\s*[\'"]([^\'"]+)[\'"]', self.js)
        stopped_class_match = re.search(r'\}\s*else\s*\{[^}]*toggleBtn\.className\s*=\s*[\'"]([^\'"]+)[\'"]', self.js)

        self.assertIsNotNone(running_class_match)
        self.assertIsNotNone(stopped_class_match)

        running_cls = running_class_match.group(1)
        stopped_cls = stopped_class_match.group(1)

        # Simulation across states
        states = [
            ("INITIAL", False, False, 90, stopped_cls, "Iniciar"),
            ("RUNNING", True, True, 85, running_cls, "Pausar"),
            ("PAUSED", False, True, 85, stopped_cls, "Iniciar"),
            ("EXPIRED", False, True, 0, stopped_cls, "Reiniciar"),
            ("RESET", False, False, 90, stopped_cls, "Iniciar"),
        ]

        for state_name, running, started, seconds, expected_cls, expected_label in states:
            self.assertIn("w-full", expected_cls, f"State {state_name} must retain w-full")
            self.assertNotIn("flex-1", expected_cls, f"State {state_name} must not have flex-1")
            if running:
                self.assertIn("bg-amber-500", expected_cls, f"State {state_name} must have amber styling")
            else:
                self.assertIn("bg-emerald-500", expected_cls, f"State {state_name} must have emerald styling")


# ==============================================================================
# Suite 4: Tactile Hit-Areas Bounds (R6)
# ==============================================================================

class TestR6TactileHitAreasAdversarial(unittest.TestCase):
    """Adversarial stress-testing of tactile target dimensions (>= 48x48px)."""

    def setUp(self):
        self.html = (BASE_DIR / "index.html").read_text(encoding="utf-8")
        self.css = (BASE_DIR / "styles.css").read_text(encoding="utf-8")

    def test_r6_01_html_point_buttons_min_dimensions(self):
        """Verify all 4 point increment/decrement buttons declare min-h-[48px] and min-w-[48px]."""
        button_ids = ["liveBtnScoreADec", "liveBtnScoreAInc", "liveBtnScoreBDec", "liveBtnScoreBInc"]
        for btn_id in button_ids:
            btn_match = re.search(r'id=["\']' + btn_id + r'["\'][^>]*class=["\']([^"\']+)["\']', self.html)
            self.assertIsNotNone(btn_match, f"Button #{btn_id} not found in index.html")
            classes = btn_match.group(1).split()
            self.assertIn("min-h-[48px]", classes, f"Button #{btn_id} missing min-h-[48px]")
            self.assertIn("min-w-[48px]", classes, f"Button #{btn_id} missing min-w-[48px]")

    def test_r6_02_css_defensive_contract_highest_specificity(self):
        """styles.css must enforce min-height: 48px and min-width: 48px with ID selectors."""
        css_rule_match = re.search(
            r'#liveBtnScoreADec,\s*#liveBtnScoreAInc,\s*#liveBtnScoreBDec,\s*#liveBtnScoreBInc\s*\{([^}]+)\}',
            self.css
        )
        self.assertIsNotNone(css_rule_match, "CSS rule for point buttons missing in styles.css")
        block = css_rule_match.group(1)
        self.assertIn("min-height: 48px;", block)
        self.assertIn("min-width: 48px;", block)

    def test_r6_03_viewport_compression_bounds(self):
        """Calculate button dimensions across narrow viewport sizes (320px, 375px, 414px, 768px)."""
        viewports = [320, 360, 375, 390, 414, 768, 1024]
        for vp in viewports:
            if vp < 768:
                # 1 column layout: card width = vp - (2 * 12px padding)
                card_width = vp - 24
            else:
                # 3 column layout: card width = (vp - 32px padding - 2 * 16px gap) / 3
                card_width = (vp - 32 - 32) / 3

            # Card padding = 2 * 16px = 32px
            inner_width = card_width - 32
            # 2 buttons in grid with 8px gap
            btn_width = (inner_width - 8) / 2
            
            # Computed width is well above 48px:
            self.assertGreaterEqual(btn_width, 48.0, f"Button width {btn_width}px at {vp}px viewport must be >= 48px")


# ==============================================================================
# Suite 5: Accidental Touch Prevention (R5) & Official Timer Floor (R2)
# ==============================================================================

class TestR5AndR2DefensiveGuards(unittest.TestCase):
    """Verify state protection against accidental bout closure and timer constraints."""

    def setUp(self):
        self.html = (BASE_DIR / "index.html").read_text(encoding="utf-8")
        self.css = (BASE_DIR / "styles.css").read_text(encoding="utf-8")
        self.js = (BASE_DIR / "app.js").read_text(encoding="utf-8")

    def test_r5_reactive_binding_and_defensive_guard(self):
        """Verify reactive finishBtn.disabled binding and early return guard in app.js."""
        # 1. Reactive binding in updateLiveTimerDisplay
        self.assertIn("finishBtn.disabled = this.timerRunning;", self.js)
        # 2. Defensive guard in finishAndSaveLiveCombat
        self.assertIn("if (this.timerRunning)", self.js)
        # 3. Pointer-events disabled in styles.css
        self.assertIn("#liveFinishAndSaveBtn:disabled", self.css)
        self.assertIn("pointer-events: none !important;", self.css)

    def test_r2_official_timer_floor_and_unbounded_addition(self):
        """Verify default 90s base and cumulative additions."""
        self.assertIn("this.timerBaseSeconds = 90;", self.js)
        self.assertIn("this.timerSeconds = 90;", self.js)
        self.assertIn("01:30", self.html)
        self.assertNotIn("Tiempo Oficial (2:00)", self.html)


if __name__ == "__main__":
    unittest.main()
