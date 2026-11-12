#!/usr/bin/env python3
"""
Unit tests for Score Buttons (+ / -) Disabled State during Timer Active.
"""

import unittest
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


class TestScoreButtonsTimerContracts(unittest.TestCase):
    """Test score buttons disabled/enabled state contracts with timer in app.js, index.html, styles.css."""

    def setUp(self):
        self.html = (BASE_DIR / "index.html").read_text(encoding="utf-8")
        self.css = (BASE_DIR / "styles.css").read_text(encoding="utf-8")
        self.js = (BASE_DIR / "app.js").read_text(encoding="utf-8")

    def test_app_js_disables_score_buttons_in_timer_display(self):
        """updateLiveTimerDisplay must bind disabled = this.timerRunning to all live score buttons."""
        display_fn = self.js.split("updateLiveTimerDisplay() {")[1].split("startLiveTimer() {")[0]
        for btn_id in ["liveBtnScoreADec", "liveBtnScoreAInc", "liveBtnScoreBDec", "liveBtnScoreBInc"]:
            self.assertIn(btn_id, display_fn, f"{btn_id} must be controlled in updateLiveTimerDisplay")
        self.assertIn(".disabled = this.timerRunning", display_fn)

    def test_app_js_defensive_guard_adjust_score(self):
        """adjustLiveScoreA and adjustLiveScoreB must guard against this.timerRunning."""
        score_a_fn = self.js.split("adjustLiveScoreA(delta) {")[1].split("adjustLiveScoreB(delta) {")[0]
        score_b_fn = self.js.split("adjustLiveScoreB(delta) {")[1].split("updateLiveOutcomeBanner() {")[0]
        self.assertIn("this.timerRunning", score_a_fn)
        self.assertIn("this.timerRunning", score_b_fn)

    def test_index_html_score_buttons_have_disabled_utilities(self):
        """index.html must include disabled utilities for all 4 score buttons."""
        for btn_id in ["liveBtnScoreADec", "liveBtnScoreAInc", "liveBtnScoreBDec", "liveBtnScoreBInc"]:
            match = re.search(r'id=["\']' + btn_id + r'["\'][^>]*class=["\']([^"\']+)["\']', self.html)
            self.assertIsNotNone(match, f"#{btn_id} not found in index.html")
            classes = match.group(1).split()
            self.assertTrue(any(c.startswith("disabled:opacity") for c in classes), f"#{btn_id} missing disabled:opacity")
            self.assertTrue(any(c.startswith("disabled:cursor") for c in classes), f"#{btn_id} missing disabled:cursor")
            self.assertTrue(any(c.startswith("disabled:pointer-events") for c in classes), f"#{btn_id} missing disabled:pointer-events")

    def test_styles_css_disabled_score_buttons_rules(self):
        """styles.css must style score buttons when disabled."""
        for btn_id in ["liveBtnScoreADec", "liveBtnScoreAInc", "liveBtnScoreBDec", "liveBtnScoreBInc"]:
            self.assertIn(f"#{btn_id}:disabled", self.css, f"Missing #{btn_id}:disabled rule in styles.css")
        self.assertIn("pointer-events: none", self.css)

    def test_timer_zero_transition_immediate_stop(self):
        """startLiveTimer interval callback must stop immediately when timer reaches 0."""
        start_fn = self.js.split("startLiveTimer() {")[1].split("pauseLiveTimer() {")[0]
        self.assertIn("if (this.timerSeconds === 0)", start_fn)
        self.assertIn("this.pauseLiveTimer()", start_fn)

    def test_finish_and_save_clears_and_updates_outcome_banner(self):
        """finishAndSaveLiveCombat must reset timer and update banner."""
        finish_fn = self.js.split("finishAndSaveLiveCombat() {")[1].split("toggleLiveFullscreen() {")[0]
        self.assertIn("this.resetLiveTimer()", finish_fn)
        self.assertIn("this.updateLiveOutcomeBanner()", finish_fn)


if __name__ == "__main__":
    unittest.main()
