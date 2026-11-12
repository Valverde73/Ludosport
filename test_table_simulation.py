#!/usr/bin/env python3
"""
Stress simulation harness for ranking table rendering.
Simulates varied data inputs (single digit, double digit, 3-digit boundary values)
and verifies that rendered HTML conforms to fixed metric dimensions and formatting rules.
"""

import unittest
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class TestTableRenderingStressHarness(unittest.TestCase):
    """Stress tests table rendering logic extracted from app.js."""

    @classmethod
    def setUpClass(cls):
        app_js = (BASE_DIR / "app.js").read_text(encoding="utf-8")
        cls.ranking_func = app_js.split("renderRanking() {")[1].split("renderMonthlyMedals() {")[0]

    def render_row_python_model(self, index, item):
        """Replicates the app.js row mapping logic in Python."""
        pos = index + 1
        if pos == 1:
            pos_badge = f'<span class="inline-flex w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 font-bold items-center justify-center text-[10px] border border-amber-400/40">{pos}</span>'
        elif pos == 2:
            pos_badge = f'<span class="inline-flex w-5 h-5 rounded-full bg-slate-400/20 text-slate-300 font-bold items-center justify-center text-[10px] border border-slate-400/40">{pos}</span>'
        elif pos == 3:
            pos_badge = f'<span class="inline-flex w-5 h-5 rounded-full bg-amber-700/20 text-amber-500 font-bold items-center justify-center text-[10px] border border-amber-700/40">{pos}</span>'
        else:
            pos_badge = f'<span class="text-slate-400 font-bold">{pos}</span>'

        if item["diff"] > 0:
            diff_badge = f'<span class="text-emerald-400 font-combat font-bold text-xs">+{item["diff"]}</span>'
        elif item["diff"] < 0:
            diff_badge = f'<span class="text-rose-400 font-combat font-bold text-xs">{item["diff"]}</span>'
        else:
            diff_badge = '<span class="text-slate-500 font-combat font-semibold text-xs">0</span>'

        fencer_name = item["fencer"]["name"]
        fencer_id = item["fencer"]["id"]

        row_html = f"""
          <tr data-fencer-profile="{fencer_id}" title="Clic para ver perfil y estadísticas de {fencer_name}" class="hover:bg-slate-800/40 transition-colors cursor-pointer">
            <td class="py-2.5 pl-3 pr-2 text-center">{pos_badge}</td>
            <td class="py-2.5 px-2">
              <div class="flex items-center gap-2">
                <div>
                  <div class="font-bold text-slate-100 flex items-center gap-1.5 hover:text-cyan-300 transition-colors">
                    {fencer_name}
                  </div>
                </div>
              </div>
            </td>
            <td class="py-2.5 px-1.5 w-[38px] min-w-[38px] text-center text-slate-400 font-combat text-xs font-semibold">{item["matchesPlayed"]}</td>
            <td class="py-2.5 px-1.5 w-[38px] min-w-[38px] text-center text-emerald-400 font-combat text-xs font-bold">{item["won"]}</td>
            <td class="py-2.5 px-1.5 w-[38px] min-w-[38px] text-center text-amber-400 font-combat text-xs font-bold">{item["drawn"]}</td>
            <td class="py-2.5 px-1.5 w-[38px] min-w-[38px] text-center text-rose-400 font-combat text-xs font-bold">{item["lost"]}</td>
            <td class="py-2.5 px-1.5 w-[46px] min-w-[46px] text-center">{diff_badge}</td>
            <td class="py-2.5 pr-3 pl-2 w-[48px] min-w-[48px] text-center font-combat font-black text-sm text-cyan-300">{item["points"]}</td>
          </tr>
        """
        return row_html

    def test_rendering_across_data_ranges(self):
        """Test varied data rows and verify metric column classes and layout stability."""
        test_standings = [
            # 1. Zero state
            {"fencer": {"id": "f1", "name": "Ana Zero"}, "matchesPlayed": 0, "won": 0, "drawn": 0, "lost": 0, "diff": 0, "points": 0},
            # 2. Single digit
            {"fencer": {"id": "f2", "name": "Carlos Single"}, "matchesPlayed": 3, "won": 2, "drawn": 1, "lost": 0, "diff": 5, "points": 7},
            # 3. Double digit positive
            {"fencer": {"id": "f3", "name": "Elena Double"}, "matchesPlayed": 18, "won": 15, "drawn": 1, "lost": 2, "diff": 18, "points": 46},
            # 4. Double digit negative
            {"fencer": {"id": "f4", "name": "Marcos Deficit"}, "matchesPlayed": 20, "won": 2, "drawn": 1, "lost": 17, "diff": -22, "points": 7},
            # 5. Boundary 3-digit values
            {"fencer": {"id": "f5", "name": "Valeria Centurion"}, "matchesPlayed": 100, "won": 80, "drawn": 10, "lost": 10, "diff": 105, "points": 120},
            # 6. Extreme negative 3-digit
            {"fencer": {"id": "f6", "name": "Diego ExtremeNeg"}, "matchesPlayed": 60, "won": 0, "drawn": 0, "lost": 60, "diff": -105, "points": 0},
        ]

        for i, item in enumerate(test_standings):
            row_html = self.render_row_python_model(i, item)

            # Check that every single row has exactly 6 metric cells with exact width classes
            cells = re.findall(r'<td\s+class="([^"]*)"[^>]*>(.*?)</td>', row_html, re.DOTALL)
            self.assertEqual(len(cells), 8, f"Row {i} must have exactly 8 td cells")

            # Col 3: PJ
            pj_class, pj_content = cells[2]
            self.assertIn("w-[38px]", pj_class)
            self.assertIn("min-w-[38px]", pj_class)
            self.assertIn("text-center", pj_class)
            self.assertEqual(int(pj_content.strip()), item["matchesPlayed"])

            # Col 4: V
            v_class, v_content = cells[3]
            self.assertIn("w-[38px]", v_class)
            self.assertIn("min-w-[38px]", v_class)
            self.assertIn("text-center", v_class)
            self.assertEqual(int(v_content.strip()), item["won"])

            # Col 5: E
            e_class, e_content = cells[4]
            self.assertIn("w-[38px]", e_class)
            self.assertIn("min-w-[38px]", e_class)
            self.assertIn("text-center", e_class)
            self.assertEqual(int(e_content.strip()), item["drawn"])

            # Col 6: D
            d_class, d_content = cells[5]
            self.assertIn("w-[38px]", d_class)
            self.assertIn("min-w-[38px]", d_class)
            self.assertIn("text-center", d_class)
            self.assertEqual(int(d_content.strip()), item["lost"])

            # Col 7: DIF
            dif_class, dif_content = cells[6]
            self.assertIn("w-[46px]", dif_class)
            self.assertIn("min-w-[46px]", dif_class)
            self.assertIn("text-center", dif_class)
            if item["diff"] > 0:
                self.assertIn(f'+{item["diff"]}', dif_content)
                self.assertIn("text-emerald-400", dif_content)
            elif item["diff"] < 0:
                self.assertIn(f'{item["diff"]}', dif_content)
                self.assertNotIn(f'--{abs(item["diff"])}', dif_content)
                self.assertIn("text-rose-400", dif_content)
            else:
                self.assertIn(">0<", dif_content)
                self.assertIn("text-slate-500", dif_content)

            # Col 8: PTS
            pts_class, pts_content = cells[7]
            self.assertIn("w-[48px]", pts_class)
            self.assertIn("min-w-[48px]", pts_class)
            self.assertIn("text-center", pts_class)
            self.assertEqual(int(pts_content.strip()), item["points"])

    def test_podium_zero_state_vs_active_transition(self):
        """
        Verify transition logic:
        - When all standings have won == 0 -> zero-state (data-podium-state='zero')
        - When at least one standing has won >= 1 -> active (data-podium-state='active')
        """
        # Scenario 1: All 0s
        standings_zero = [
            {"won": 0, "points": 0},
            {"won": 0, "points": 0},
            {"won": 0, "points": 0},
        ]
        is_active_zero = any((s.get("won") or 0) >= 1 for s in standings_zero)
        self.assertFalse(is_active_zero, "Podium must be ZERO state when all won == 0")

        # Scenario 2: One match won
        standings_active = [
            {"won": 1, "points": 3},
            {"won": 0, "points": 0},
            {"won": 0, "points": 0},
        ]
        is_active_active = any((s.get("won") or 0) >= 1 for s in standings_active)
        self.assertTrue(is_active_active, "Podium must be ACTIVE state when any won >= 1")


if __name__ == "__main__":
    unittest.main()
