#!/usr/bin/env python3
"""
Unit and integration test suite for Milestone M1:
Marcador en Directo Refactor & Usability Enhancement (Requirements R1 - R6).
"""

import unittest
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


class TestR1ShooterCardWrapping(unittest.TestCase):
    """R1: Title wrapping for fencer names in live corner cards."""

    def setUp(self):
        self.html = (BASE_DIR / "index.html").read_text(encoding="utf-8")
        self.css = (BASE_DIR / "styles.css").read_text(encoding="utf-8")

    def test_r1_html_fencer_name_no_truncate(self):
        """liveFighterAName and liveFighterBName must not have truncate class."""
        for fencer_id in ["liveFighterAName", "liveFighterBName"]:
            match = re.search(r'id=["\']' + fencer_id + r'["\'][^>]*class=["\']([^"\']+)["\']', self.html)
            self.assertIsNotNone(match, f"Element #{fencer_id} not found in index.html")
            classes = match.group(1).split()
            self.assertNotIn("truncate", classes, f"#{fencer_id} must NOT have truncate class")
            self.assertIn("whitespace-normal", classes, f"#{fencer_id} must have whitespace-normal")
            self.assertIn("line-clamp-2", classes, f"#{fencer_id} must have line-clamp-2")
            self.assertIn("leading-tight", classes, f"#{fencer_id} must have leading-tight")

    def test_r1_css_multiline_clamp(self):
        """styles.css must enforce multi-line clamping and white-space: normal."""
        self.assertIn(".live-corner-card h3", self.css)
        self.assertIn("#liveFighterAName", self.css)
        self.assertIn("#liveFighterBName", self.css)
        self.assertIn("white-space: normal", self.css)
        self.assertIn("-webkit-line-clamp: 2", self.css)
        self.assertIn("overflow: hidden", self.css)


class TestR2OfficialTimerLogic(unittest.TestCase):
    """R2: Official timer logic: default base 01:30 (90s), cumulative +30s, min duration floor, timerStarted."""

    def setUp(self):
        self.js = (BASE_DIR / "app.js").read_text(encoding="utf-8")
        self.html = (BASE_DIR / "index.html").read_text(encoding="utf-8")

    def test_r2_constructor_state(self):
        """Constructor must initialize timerBaseSeconds=90, timerSeconds=90, timerStarted=false."""
        self.assertIn("this.timerBaseSeconds = 90", self.js)
        self.assertIn("this.timerSeconds = 90", self.js)
        self.assertIn("this.timerStarted = false", self.js)

    def test_r2_html_initial_display(self):
        """index.html must display 01:30 as official initial time and badge."""
        self.assertIn("01:30", self.html)
        self.assertIn("Tiempo Oficial (01:30)", self.html)
        self.assertNotIn("Tiempo Oficial (2:00)", self.html)
        self.assertNotIn("02:00", self.html)

    def test_r2_start_timer_base_floor(self):
        """startLiveTimer must restore base duration (>=90s) when restarting from 0."""
        self.assertIn("startLiveTimer() {", self.js)
        start_fn = self.js.split("startLiveTimer() {")[1].split("pauseLiveTimer() {")[0]
        self.assertIn("this.timerStarted = true", start_fn)
        self.assertIn("Math.max(90", start_fn)

    def test_r2_reset_timer_base_floor(self):
        """resetLiveTimer must reset timerStarted to false and restore base duration (>=90s)."""
        self.assertIn("resetLiveTimer() {", self.js)
        reset_fn = self.js.split("resetLiveTimer() {")[1].split("addLiveTimerSeconds(")[0]
        self.assertIn("this.timerStarted = false", reset_fn)
        self.assertIn("Math.max(90", reset_fn)

    def test_r2_cumulative_increment_unbounded(self):
        """addLiveTimerSeconds must add extra cumulatively with floor constraint."""
        self.assertIn("addLiveTimerSeconds(", self.js)
        add_fn = self.js.split("addLiveTimerSeconds(")[1].split("finishAndSaveLiveCombat() {")[0]
        self.assertIn("this.timerSeconds += extra", add_fn)

    def test_r2_status_text_not_hardcoded_120(self):
        """updateLiveTimerDisplay must use timerStarted, never hardcoded timerSeconds < 120."""
        display_fn = self.js.split("updateLiveTimerDisplay() {")[1].split("startLiveTimer() {")[0]
        self.assertNotIn("timerSeconds < 120", display_fn)
        self.assertIn("this.timerStarted", display_fn)


class TestR3TextContrast(unittest.TestCase):
    """R3: Text contrast for OHS ANOTADOS elevated to meet WCAG AA (>= 4.5:1)."""

    def setUp(self):
        self.html = (BASE_DIR / "index.html").read_text(encoding="utf-8")
        self.css = (BASE_DIR / "styles.css").read_text(encoding="utf-8")

    def test_r3_html_ohs_label_color(self):
        """OHs Anotados spans in live corner cards must use text-white/60, not text-slate-500."""
        corner_alfa = self.html.split('id="liveScoreADisplay"')[1].split('id="liveBtnScoreADec"')[0]
        self.assertIn("text-white/60", corner_alfa)
        self.assertNotIn("text-slate-500", corner_alfa)

        corner_beta = self.html.split('id="liveScoreBDisplay"')[1].split('id="liveBtnScoreBDec"')[0]
        self.assertIn("text-white/60", corner_beta)
        self.assertNotIn("text-slate-500", corner_beta)

    def test_r3_css_rule(self):
        """styles.css must enforce high-contrast rgba(255, 255, 255, 0.6) for tracking-widest label."""
        self.assertIn(".live-corner-card span.tracking-widest", self.css)
        self.assertIn("rgba(255, 255, 255, 0.6)", self.css)

    def test_r3_mathematical_contrast_wcag_aa(self):
        """Mathematical computation of contrast ratio of text-white/60 on navy #0f172a."""
        def relative_luminance(r, g, b):
            def ch(c):
                c = c / 255.0
                return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
            return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)

        # Background: #0f172a -> (15, 23, 42)
        bg_lum = relative_luminance(15, 23, 42)

        # Alpha composite white (255, 255, 255) with alpha=0.6 over #0f172a
        fg_r = round(255 * 0.6 + 15 * 0.4)
        fg_g = round(255 * 0.6 + 23 * 0.4)
        fg_b = round(255 * 0.6 + 42 * 0.4)
        fg_lum = relative_luminance(fg_r, fg_g, fg_b)

        contrast = (fg_lum + 0.05) / (bg_lum + 0.05)
        # WCAG AA for normal text requires >= 4.5:1
        self.assertGreaterEqual(contrast, 4.5, f"Contrast ratio {contrast:.2f} must be >= 4.5:1")


class TestR4TimerControlsHierarchy(unittest.TestCase):
    """R4: Timer controls visual hierarchy: INICIAR 100% width, secondary ghost buttons."""

    def setUp(self):
        self.html = (BASE_DIR / "index.html").read_text(encoding="utf-8")
        self.js = (BASE_DIR / "app.js").read_text(encoding="utf-8")

    def test_r4_html_iniciar_full_width(self):
        """liveTimerToggleBtn in index.html must have w-full and not flex-1."""
        match = re.search(r'id=["\']liveTimerToggleBtn["\'][^>]*class=["\']([^"\']+)["\']', self.html)
        self.assertIsNotNone(match)
        classes = match.group(1).split()
        self.assertIn("w-full", classes)
        self.assertNotIn("flex-1", classes)

    def test_r4_js_iniciar_classes_full_width(self):
        """app.js updateLiveTimerDisplay must assign w-full (not flex-1) in both running and stopped states."""
        matches = re.findall(r'toggleBtn\.className\s*=\s*[\'"]([^\'"]+)[\'"]', self.js)
        self.assertGreaterEqual(len(matches), 2)
        for class_str in matches:
            classes = class_str.split()
            self.assertIn("w-full", classes)
            self.assertNotIn("flex-1", classes)

    def test_r4_secondary_buttons_ghost_styling(self):
        """liveTimerResetBtn and liveTimerAdd30Btn must have ghost/outline style."""
        reset_match = re.search(r'id=["\']liveTimerResetBtn["\'][^>]*class=["\']([^"\']+)["\']', self.html)
        self.assertIsNotNone(reset_match)
        self.assertIn("bg-transparent", reset_match.group(1))

        add30_match = re.search(r'id=["\']liveTimerAdd30Btn["\'][^>]*class=["\']([^"\']+)["\']', self.html)
        self.assertIsNotNone(add30_match)
        self.assertIn("bg-transparent", add30_match.group(1))


class TestR5AccidentalTouchPrevention(unittest.TestCase):
    """R5: Accidental touch prevention on FINALIZAR Y GUARDAR COMBATE button."""

    def setUp(self):
        self.js = (BASE_DIR / "app.js").read_text(encoding="utf-8")
        self.html = (BASE_DIR / "index.html").read_text(encoding="utf-8")
        self.css = (BASE_DIR / "styles.css").read_text(encoding="utf-8")

    def test_r5_reactive_disabled_binding(self):
        """updateLiveTimerDisplay must bind finishBtn.disabled = this.timerRunning."""
        display_fn = self.js.split("updateLiveTimerDisplay() {")[1].split("startLiveTimer() {")[0]
        self.assertIn("finishBtn.disabled = this.timerRunning", display_fn)

    def test_r5_defensive_guard_in_finish_handler(self):
        """finishAndSaveLiveCombat must have defensive guard against timerRunning."""
        finish_fn = self.js.split("finishAndSaveLiveCombat() {")[1].split("const fA =")[0]
        self.assertIn("if (this.timerRunning)", finish_fn)

    def test_r5_html_disabled_utilities(self):
        """index.html #liveFinishAndSaveBtn must declare Tailwind disabled utilities."""
        match = re.search(r'id=["\']liveFinishAndSaveBtn["\'][^>]*class=["\']([^"\']+)["\']', self.html)
        self.assertIsNotNone(match)
        classes = match.group(1).split()
        self.assertTrue(any(c.startswith("disabled:opacity") for c in classes))
        self.assertTrue(any(c.startswith("disabled:cursor") for c in classes))
        self.assertTrue(any(c.startswith("disabled:pointer-events") for c in classes))

    def test_r5_css_disabled_rule(self):
        """styles.css must declare #liveFinishAndSaveBtn:disabled rule with pointer-events: none."""
        self.assertIn("#liveFinishAndSaveBtn:disabled", self.css)
        self.assertIn("pointer-events: none", self.css)
        self.assertIn("opacity: 0.4", self.css)


class TestR6TactileHitAreas(unittest.TestCase):
    """R6: Tactile hit-areas >= 48x48px for point buttons (+ and -)."""

    def setUp(self):
        self.html = (BASE_DIR / "index.html").read_text(encoding="utf-8")
        self.css = (BASE_DIR / "styles.css").read_text(encoding="utf-8")

    def test_r6_html_score_buttons_min_dimensions(self):
        """All 4 score buttons in live corner cards must have min-h-[48px] and min-w-[48px]."""
        for btn_id in ["liveBtnScoreADec", "liveBtnScoreAInc", "liveBtnScoreBDec", "liveBtnScoreBInc"]:
            match = re.search(r'id=["\']' + btn_id + r'["\'][^>]*class=["\']([^"\']+)["\']', self.html)
            self.assertIsNotNone(match, f"Button #{btn_id} not found in index.html")
            classes = match.group(1).split()
            self.assertIn("min-h-[48px]", classes, f"#{btn_id} missing min-h-[48px]")
            self.assertIn("min-w-[48px]", classes, f"#{btn_id} missing min-w-[48px]")

    def test_r6_css_min_dimensions_contract(self):
        """styles.css must enforce min-height: 48px and min-width: 48px."""
        self.assertIn("#liveBtnScoreADec", self.css)
        self.assertIn("#liveBtnScoreAInc", self.css)
        self.assertIn("#liveBtnScoreBDec", self.css)
        self.assertIn("#liveBtnScoreBInc", self.css)
        self.assertIn("min-height: 48px", self.css)
        self.assertIn("min-width: 48px", self.css)


class TestScoreButtonsDisabledDuringTimer(unittest.TestCase):
    """Requirements: Score buttons (+ / -) disabled while timer is active, enabled when stopped."""

    def setUp(self):
        self.html = (BASE_DIR / "index.html").read_text(encoding="utf-8")
        self.css = (BASE_DIR / "styles.css").read_text(encoding="utf-8")
        self.js = (BASE_DIR / "app.js").read_text(encoding="utf-8")

    def test_update_timer_display_disables_score_buttons(self):
        """updateLiveTimerDisplay must dynamically bind disabled = this.timerRunning on all 4 score buttons."""
        display_fn = self.js.split("updateLiveTimerDisplay() {")[1].split("startLiveTimer() {")[0]
        for btn_id in ["liveBtnScoreADec", "liveBtnScoreAInc", "liveBtnScoreBDec", "liveBtnScoreBInc"]:
            self.assertIn(btn_id, display_fn, f"#{btn_id} missing in updateLiveTimerDisplay")
        self.assertIn(".disabled = this.timerRunning", display_fn)

    def test_adjust_live_score_defensive_guards(self):
        """adjustLiveScoreA and adjustLiveScoreB must return early if timer is running."""
        fn_a = self.js.split("adjustLiveScoreA(delta) {")[1].split("adjustLiveScoreB(delta) {")[0]
        fn_b = self.js.split("adjustLiveScoreB(delta) {")[1].split("updateLiveOutcomeBanner() {")[0]
        self.assertIn("this.timerRunning", fn_a)
        self.assertIn("this.timerRunning", fn_b)

    def test_score_buttons_html_disabled_utilities(self):
        """All 4 score buttons in index.html must declare Tailwind disabled utilities."""
        for btn_id in ["liveBtnScoreADec", "liveBtnScoreAInc", "liveBtnScoreBDec", "liveBtnScoreBInc"]:
            match = re.search(r'id=["\']' + btn_id + r'["\'][^>]*class=["\']([^"\']+)["\']', self.html)
            self.assertIsNotNone(match, f"#{btn_id} not found in index.html")
            classes = match.group(1).split()
            self.assertTrue(any(c.startswith("disabled:opacity") for c in classes))
            self.assertTrue(any(c.startswith("disabled:cursor") for c in classes))
            self.assertTrue(any(c.startswith("disabled:pointer-events") for c in classes))

    def test_score_buttons_css_disabled_rules(self):
        """styles.css must declare disabled styling with pointer-events: none and opacity reduction."""
        for btn_id in ["liveBtnScoreADec", "liveBtnScoreAInc", "liveBtnScoreBDec", "liveBtnScoreBInc"]:
            self.assertIn(f"#{btn_id}:disabled", self.css)
        self.assertIn("pointer-events: none", self.css)


if __name__ == "__main__":
    unittest.main()
