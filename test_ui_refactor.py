#!/usr/bin/env python3
"""
Unit and integration test suite for Milestone M1 (Dashboard UI Refactor & Laser Theme Hardening).
Validates Requirements R1, R2, R3, R4 across app.js, index.html, and styles.css.
"""

import unittest
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class TestR1MedalleroAndAccessibility(unittest.TestCase):
    """Requirement R1: Medallero & Títulos del Mes text wrapping and WCAG AA contrast."""

    def setUp(self):
        self.app_js = (BASE_DIR / "app.js").read_text(encoding="utf-8")
        self.styles_css = (BASE_DIR / "styles.css").read_text(encoding="utf-8")

    def test_r1_badge_title_wrapping(self):
        """Title must use whitespace-normal, leading-tight, line-clamp-2 and not truncate."""
        # Find renderMonthlyMedals method definition
        self.assertIn("renderMonthlyMedals() {", self.app_js)
        medals_func = self.app_js.split("renderMonthlyMedals() {")[1].split("renderDuelFormOptions() {")[0]

        # Check badge.title element
        self.assertIn("whitespace-normal", medals_func)
        self.assertIn("line-clamp-2", medals_func)
        self.assertIn("leading-tight", medals_func)

        # Title span must not have truncate
        title_span_match = re.search(r'<span[^>]*font-display[^>]*>\s*\$\{badge\.title\}', medals_func)
        self.assertIsNotNone(title_span_match, "Badge title span not found")
        self.assertNotIn("truncate", title_span_match.group(0), "Title span must not contain truncate class")

    def test_r1_wcag_contrast_values(self):
        """Empty state text and clock icon must meet WCAG AA contrast on navy background."""
        medals_func = self.app_js.split("renderMonthlyMedals() {")[1].split("renderDuelFormOptions() {")[0]

        # Empty state text must be text-white/70 or text-white/60 (or text-slate-300)
        self.assertTrue(
            "text-white/70" in medals_func or "text-white/60" in medals_func or "text-slate-300" in medals_func,
            "Empty state secondary text must use high-contrast color (text-white/70 or text-white/60)"
        )

        # Clock icon must be text-white/60 or text-slate-400
        self.assertTrue(
            "text-white/60" in medals_func or "text-white/70" in medals_func or "text-slate-400" in medals_func,
            "Clock icon must use high-contrast color (text-white/60 or text-slate-400)"
        )

    def test_r1_mathematical_contrast_wcag_aa(self):
        """Mathematically compute sRGB relative luminance and contrast ratios."""
        def relative_luminance(r, g, b):
            def srgb_channel(c):
                c = c / 255.0
                return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
            return 0.2126 * srgb_channel(r) + 0.7152 * srgb_channel(g) + 0.0722 * srgb_channel(b)

        def contrast_ratio(l1, l2):
            lighter = max(l1, l2)
            darker = min(l1, l2)
            return (lighter + 0.05) / (darker + 0.05)

        # Background: lsCard #0f172a
        bg_lum = relative_luminance(15, 23, 42)

        # Alpha composite white (255, 255, 255) with alpha=0.7 over #0f172a
        r_70 = round(255 * 0.7 + 15 * 0.3)
        g_70 = round(255 * 0.7 + 23 * 0.3)
        b_70 = round(255 * 0.7 + 42 * 0.3)
        lum_70 = relative_luminance(r_70, g_70, b_70)
        cr_70 = contrast_ratio(lum_70, bg_lum)

        # Alpha composite white (255, 255, 255) with alpha=0.6 over #0f172a
        r_60 = round(255 * 0.6 + 15 * 0.4)
        g_60 = round(255 * 0.6 + 23 * 0.4)
        b_60 = round(255 * 0.6 + 42 * 0.4)
        lum_60 = relative_luminance(r_60, g_60, b_60)
        cr_60 = contrast_ratio(lum_60, bg_lum)

        # Normal text WCAG AA requires >= 4.5:1
        self.assertGreaterEqual(cr_70, 4.5, f"text-white/70 contrast ratio {cr_70:.2f} must be >= 4.5:1")
        # Non-text UI components WCAG AA requires >= 3.0:1
        self.assertGreaterEqual(cr_60, 3.0, f"text-white/60 contrast ratio {cr_60:.2f} must be >= 3.0:1")


class TestR2PodiumZeroStateAndDynamicActivation(unittest.TestCase):
    """Requirement R2: Podium Zero-State & Dynamic Neon Activation."""

    def setUp(self):
        self.app_js = (BASE_DIR / "app.js").read_text(encoding="utf-8")
        self.styles_css = (BASE_DIR / "styles.css").read_text(encoding="utf-8")

    def test_r2_dynamic_activation_evaluation(self):
        """renderRanking must evaluate isPodiumActive based on at least one victory."""
        self.assertIn("renderRanking() {", self.app_js)
        ranking_func = self.app_js.split("renderRanking() {")[1].split("renderMonthlyMedals() {")[0]

        self.assertIn("isPodiumActive", ranking_func)
        self.assertTrue(
            re.search(r'isPodiumActive\s*=\s*standings\.some\(s\s*=>\s*\(s\.won\s*\|\|\s*0\)\s*>=\s*1\)', ranking_func) or
            re.search(r'isPodiumActive\s*=\s*standings\.some\(s\s*=>\s*s\.won\s*>=\s*1\)', ranking_func),
            "isPodiumActive must check if any fencer has won >= 1 match"
        )
        self.assertIn('setAttribute(\'data-podium-state\'', ranking_func)

    def test_r2_zero_state_attenuation(self):
        """Zero-state must disable bouncing crown, use neutral badge 1, uniform card size, and borderGlow=false."""
        ranking_func = self.app_js.split("renderRanking() {")[1].split("renderMonthlyMedals() {")[0]

        # Must have if (isPodiumActive) ... else branch
        self.assertIn("if (isPodiumActive)", ranking_func)

        # In zero-state branch:
        zero_branch = ranking_func.split("} else {")[1].split("if (window.lucide)")[0]
        self.assertNotIn("animate-bounce", zero_branch)
        self.assertNotIn('data-lucide="crown"', zero_branch)
        self.assertIn("border-slate-800", zero_branch)
        self.assertIn("bg-lsCard/60", zero_branch)

        # All 3 avatar calls in zero state must pass borderGlow=false
        avatar_calls = re.findall(r'this\.getFencerAvatarHtml\([^)]+\)', zero_branch)
        self.assertEqual(len(avatar_calls), 3, "Expected 3 avatar calls in zero state podium")
        for call in avatar_calls:
            self.assertIn("false", call, f"Zero state avatar must disable borderGlow: {call}")
            self.assertIn("'w-10 h-10'", call, f"Zero state avatars must be uniform w-10 h-10: {call}")

    def test_r2_active_state_highlights(self):
        """Active state must render bouncing gold crown, elevated 1st card, and borderGlow=true."""
        ranking_func = self.app_js.split("renderRanking() {")[1].split("renderMonthlyMedals() {")[0]
        active_branch = ranking_func.split("if (isPodiumActive) {")[1].split("} else {")[0]

        self.assertIn("animate-bounce", active_branch)
        self.assertIn('data-lucide="crown"', active_branch)
        self.assertIn("amber-500", active_branch)
        self.assertIn("w-12 h-12", active_branch)
        self.assertIn("pulse-laser-amber", active_branch)

    def test_r2_lucide_icons_refresh(self):
        """Lucide icons must be refreshed after dynamic podium DOM insertion."""
        ranking_func = self.app_js.split("renderRanking() {")[1].split("renderMonthlyMedals() {")[0]
        self.assertIn("lucide.createIcons", ranking_func)


class TestR3LaserVisualThemeAndAnimations(unittest.TestCase):
    """Requirement R3: Laser halo hover effects and pulse keyframe animations."""

    def setUp(self):
        self.styles_css = (BASE_DIR / "styles.css").read_text(encoding="utf-8")
        self.index_html = (BASE_DIR / "index.html").read_text(encoding="utf-8")
        self.app_js = (BASE_DIR / "app.js").read_text(encoding="utf-8")

    def test_r3_keyframes_defined(self):
        """laserPulseCyan and laserPulseAmber keyframes and utility classes must be declared."""
        self.assertIn("@keyframes laserPulseCyan", self.styles_css)
        self.assertIn("@keyframes laserPulseAmber", self.styles_css)
        self.assertIn(".pulse-laser-cyan", self.styles_css)
        self.assertIn(".pulse-laser-amber", self.styles_css)

        # Verify keyframes animate both border-color and box-shadow
        cyan_kf = re.search(r'@keyframes laserPulseCyan\s*\{([^}]+(\{[^}]+\})*[^}]*)\}', self.styles_css)
        self.assertIsNotNone(cyan_kf)
        self.assertIn("border-color", cyan_kf.group(0))
        self.assertIn("box-shadow", cyan_kf.group(0))

        amber_kf = re.search(r'@keyframes laserPulseAmber\s*\{([^}]+(\{[^}]+\})*[^}]*)\}', self.styles_css)
        self.assertIsNotNone(amber_kf)
        self.assertIn("border-color", amber_kf.group(0))
        self.assertIn("box-shadow", amber_kf.group(0))

    def test_r3_pulse_classes_applied(self):
        """pulse-laser-cyan must be on Duelo button, pulse-laser-amber on active 1st place podium."""
        self.assertIn("pulse-laser-cyan", self.index_html)
        self.assertIn("pulse-laser-amber", self.app_js)

    def test_r3_laser_hover_halos(self):
        """Multi-layer box-shadow laser halos must be defined on hover targets."""
        # Table rows hover
        self.assertIn("tr[data-fencer-profile]:hover", self.styles_css)
        tr_hover = re.search(r'tr\[data-fencer-profile\]:hover\s*\{([^}]+)\}', self.styles_css)
        self.assertIsNotNone(tr_hover)
        self.assertIn("box-shadow", tr_hover.group(1))
        # Count shadow layers (at least 2 comma-separated layers for multi-layer laser effect)
        box_shadow_val = re.search(r'box-shadow:\s*([^;]+);', tr_hover.group(1))
        self.assertIsNotNone(box_shadow_val)
        self.assertGreaterEqual(box_shadow_val.group(1).count("rgba"), 2)

        # Podium card hover
        self.assertIn(".podium-card:hover", self.styles_css)
        podium_hover = re.search(r'\.podium-card:hover\s*\{([^}]+)\}', self.styles_css)
        self.assertIsNotNone(podium_hover)
        self.assertIn("box-shadow", podium_hover.group(1))

        # Gold podium card hover
        self.assertIn(".podium-card.podium-gold:hover", self.styles_css)

        # Badge card hover
        self.assertIn(".badge-card:hover", self.styles_css)
        badge_hover = re.search(r'\.badge-card:hover\s*\{([^}]+)\}', self.styles_css)
        self.assertIsNotNone(badge_hover)
        self.assertIn("box-shadow", badge_hover.group(1))

    def test_r3_table_border_separate(self):
        """Table must use border-separate and border-spacing-0 for box-shadow support on rows."""
        self.assertIn("ranking-table", self.index_html)
        self.assertIn("border-separate", self.index_html)
        self.assertIn("border-spacing-0", self.index_html)
        self.assertIn(".ranking-table", self.styles_css)


class TestR4TableMetricsAndScrollClearance(unittest.TestCase):
    """Requirement R4: Classification table metrics stability and scroll clearance."""

    def setUp(self):
        self.styles_css = (BASE_DIR / "styles.css").read_text(encoding="utf-8")
        self.index_html = (BASE_DIR / "index.html").read_text(encoding="utf-8")
        self.app_js = (BASE_DIR / "app.js").read_text(encoding="utf-8")

    def test_r4_metric_columns_fixed_width_and_centering(self):
        """Metric columns PJ, V, E, D (38px), DIF (46px), PTS (48px) must have fixed min-width and text-align center."""
        # CSS rules
        self.assertIn("min-width: 38px", self.styles_css)
        self.assertIn("min-width: 46px", self.styles_css)
        self.assertIn("min-width: 48px", self.styles_css)
        self.assertIn("text-align: center", self.styles_css)
        self.assertIn("font-variant-numeric: tabular-nums", self.styles_css)

        # HTML header elements
        self.assertIn("w-[38px] min-w-[38px]", self.index_html)
        self.assertIn("w-[46px] min-w-[46px]", self.index_html)
        self.assertIn("w-[48px] min-w-[48px]", self.index_html)

        # JS cell elements
        self.assertIn("w-[38px] min-w-[38px]", self.app_js)
        self.assertIn("w-[46px] min-w-[46px]", self.app_js)
        self.assertIn("w-[48px] min-w-[48px]", self.app_js)

    def test_r4_scroll_clearance_and_bug_fix(self):
        """md:pb-10 bug must be removed and bottom padding >= 112px on body."""
        # md:pb-10 must NOT exist on body
        body_tag = re.search(r'<body[^>]*>', self.index_html)
        self.assertIsNotNone(body_tag)
        self.assertNotIn("md:pb-10", body_tag.group(0), "md:pb-10 bug must be removed from body tag")

        # Bottom padding in index.html must be pb-28 or pb-32
        self.assertTrue(
            "pb-28" in body_tag.group(0) or "pb-32" in body_tag.group(0),
            "Body tag must have pb-28 or pb-32 class"
        )

        # styles.css must define padding-bottom >= 112px on body:not(.piste-mode)
        self.assertIn("body:not(.piste-mode)", self.styles_css)
        piste_rule = re.search(r'body:not\(\.piste-mode\)\s*\{([^}]+)\}', self.styles_css)
        self.assertIsNotNone(piste_rule)
        self.assertIn("padding-bottom", piste_rule.group(1))
        self.assertIn("112px", piste_rule.group(1))


if __name__ == "__main__":
    unittest.main()
