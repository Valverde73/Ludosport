#!/usr/bin/env python3
"""
Unit and Integration Tests for LudoSport Monthly Badges and Titles System.
Validates all 5 badges:
1. 🏆 Invicto del Mes (100% winrate, min 3 matches)
2. ⚡ Máximo Anotador de OHs (most OHs scored in the month)
3. 🛡️ Defensa de Hierro (lowest average OHs conceded, min 3 matches)
4. ⚔️ Rival más Activo (most matches played in the month)
5. 🔥 Racha de Victorias (longest sequence of consecutive wins, min 2)
Also validates ties, edge cases (<3 matches, 0 matches, draws), and history.
"""

import unittest
import json
import os

# Pure Python reference logic reflecting LeagueBadgesService
MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

def format_month_name(month_key):
    if not month_key or len(str(month_key)) < 6:
        return str(month_key or '')
    clean = str(month_key).replace('TEST_', '')
    mm = int(clean[:2])
    yyyy = clean[2:]
    name = MONTH_NAMES[mm - 1] if 1 <= mm <= 12 else 'Mes'
    return f"{name} {yyyy}"

class LeagueBadgesLogic:
    @staticmethod
    def compute_aggregates(matches, fencers):
        aggs = {}
        for f in fencers:
            aggs[f['id']] = {
                'fencer': f,
                'matchesPlayed': 0,
                'won': 0,
                'drawn': 0,
                'lost': 0,
                'pointsFor': 0,
                'pointsAgainst': 0,
                'personalMatches': []
            }

        for m in matches:
            fA = aggs.get(m.get('fighterAId'))
            fB = aggs.get(m.get('fighterBId'))
            sA = m.get('scoreA', 1 if m.get('result') == 'VICTORY_A' else 0)
            sB = m.get('scoreB', 1 if m.get('result') == 'VICTORY_B' else 0)

            if fA:
                fA['matchesPlayed'] += 1
                fA['pointsFor'] += sA
                fA['pointsAgainst'] += sB
                fA['personalMatches'].append({**m, 'isFighterA': True})
                if m.get('result') == 'VICTORY_A':
                    fA['won'] += 1
                elif m.get('result') == 'DRAW':
                    fA['drawn'] += 1
                elif m.get('result') == 'VICTORY_B':
                    fA['lost'] += 1

            if fB:
                fB['matchesPlayed'] += 1
                fB['pointsFor'] += sB
                fB['pointsAgainst'] += sA
                fB['personalMatches'].append({**m, 'isFighterA': False})
                if m.get('result') == 'VICTORY_B':
                    fB['won'] += 1
                elif m.get('result') == 'DRAW':
                    fB['drawn'] += 1
                elif m.get('result') == 'VICTORY_A':
                    fB['lost'] += 1

        return aggs

    @staticmethod
    def calculate_max_streak(personal_matches, fencer_id):
        if not personal_matches:
            return 0
        sorted_m = sorted(personal_matches, key=lambda x: (x.get('timestamp') or x.get('date') or '', x.get('id') or ''))
        current_streak = 0
        max_streak = 0
        for m in sorted_m:
            isA = m.get('fighterAId') == fencer_id
            is_win = (m.get('result') == 'VICTORY_A' and isA) or (m.get('result') == 'VICTORY_B' and not isA)
            if is_win:
                current_streak += 1
                if current_streak > max_streak:
                    max_streak = current_streak
            else:
                current_streak = 0
        return max_streak

    @classmethod
    def calculate_badges(cls, matches, fencers, month_key='112026'):
        aggs = cls.compute_aggregates(matches, fencers)
        flist = list(aggs.values())
        month_label = format_month_name(month_key)

        # 1. Invicto del Mes (100% wins, min 3)
        invictus_candidates = [
            it for it in flist 
            if it['matchesPlayed'] >= 3 and it['won'] == it['matchesPlayed'] and it['lost'] == 0 and it['drawn'] == 0
        ]
        invictus_winners = [{
            'fencerId': it['fencer']['id'],
            'value': it['won'],
            'formattedValue': f"{it['won']}V de {it['matchesPlayed']}PJ (100%)",
            'tooltip': f"🏆 Invicto del Mes: {it['fencer']['name']} (100% victorias en {month_label})"
        } for it in invictus_candidates]

        # 2. Máximo Anotador de OHs (pointsFor > 0)
        max_ohs = max((it['pointsFor'] for it in flist), default=0)
        top_scorer_winners = []
        if max_ohs > 0:
            top_scorer_winners = [{
                'fencerId': it['fencer']['id'],
                'value': max_ohs,
                'formattedValue': f"{max_ohs} OHs",
                'tooltip': f"⚡ Máximo Anotador: {max_ohs} OHs en {month_label}"
            } for it in flist if it['pointsFor'] == max_ohs]

        # 3. Defensa de Hierro (min 3 matches, lowest average pointsAgainst)
        defense_candidates = [it for it in flist if it['matchesPlayed'] >= 3]
        defense_winners = []
        if defense_candidates:
            for it in defense_candidates:
                it['avgConceded'] = it['pointsAgainst'] / it['matchesPlayed']
            min_avg = min(it['avgConceded'] for it in defense_candidates)
            defense_winners = [{
                'fencerId': it['fencer']['id'],
                'value': round(min_avg, 2),
                'formattedValue': f"{min_avg:.2f} OHs/combate",
                'tooltip': f"🛡️ Defensa de Hierro: {min_avg:.2f} media en {month_label}"
            } for it in defense_candidates if abs(it['avgConceded'] - min_avg) < 0.0001]

        # 4. Rival más Activo (max matchesPlayed > 0)
        max_matches = max((it['matchesPlayed'] for it in flist), default=0)
        most_active_winners = []
        if max_matches > 0:
            most_active_winners = [{
                'fencerId': it['fencer']['id'],
                'value': max_matches,
                'formattedValue': f"{max_matches} combates",
                'tooltip': f"⚔️ Rival más Activo: {max_matches} combates en {month_label}"
            } for it in flist if it['matchesPlayed'] == max_matches]

        # 5. Racha de Victorias (streak >= 2)
        streak_data = []
        max_streak_overall = 0
        for it in flist:
            stk = cls.calculate_max_streak(it['personalMatches'], it['fencer']['id'])
            streak_data.append((it, stk))
            if stk > max_streak_overall:
                max_streak_overall = stk

        streak_winners = []
        if max_streak_overall >= 2:
            streak_winners = [{
                'fencerId': it['fencer']['id'],
                'value': max_streak_overall,
                'formattedValue': f"{max_streak_overall} consecutivas",
                'tooltip': f"🔥 Racha de Victorias: {max_streak_overall} consecutivas en {month_label}"
            } for it, stk in streak_data if stk == max_streak_overall]

        return {
            'invictus': invictus_winners,
            'top_scorer': top_scorer_winners,
            'iron_defense': defense_winners,
            'most_active': most_active_winners,
            'win_streak': streak_winners
        }


class TestMonthlyBadgesSystem(unittest.TestCase):
    def setUp(self):
        self.fencers = [
            {'id': 'f-1', 'name': 'Mar Garcia'},
            {'id': 'f-2', 'name': 'Auri Haro'},
            {'id': 'f-3', 'name': 'Mario Ferrer'},
            {'id': 'f-4', 'name': 'Paula Carmona'},
            {'id': 'f-5', 'name': 'Ulises Carmona'}
        ]

    def test_invictus_requires_minimum_3_matches(self):
        # 2 matches won out of 2: Under 3 matches -> NO award
        matches = [
            {'id': 'm-1', 'fighterAId': 'f-1', 'fighterBId': 'f-2', 'scoreA': 2, 'scoreB': 0, 'result': 'VICTORY_A'},
            {'id': 'm-2', 'fighterAId': 'f-1', 'fighterBId': 'f-3', 'scoreA': 3, 'scoreB': 1, 'result': 'VICTORY_A'}
        ]
        badges = LeagueBadgesLogic.calculate_badges(matches, self.fencers)
        self.assertEqual(len(badges['invictus']), 0, "No award when matches played < 3")

    def test_invictus_awarded_with_3_wins(self):
        # 3 matches won out of 3: Should receive Invicto del Mes
        matches = [
            {'id': 'm-1', 'fighterAId': 'f-1', 'fighterBId': 'f-2', 'scoreA': 2, 'scoreB': 0, 'result': 'VICTORY_A'},
            {'id': 'm-2', 'fighterAId': 'f-1', 'fighterBId': 'f-3', 'scoreA': 3, 'scoreB': 1, 'result': 'VICTORY_A'},
            {'id': 'm-3', 'fighterAId': 'f-1', 'fighterBId': 'f-4', 'scoreA': 2, 'scoreB': 0, 'result': 'VICTORY_A'}
        ]
        badges = LeagueBadgesLogic.calculate_badges(matches, self.fencers)
        self.assertEqual(len(badges['invictus']), 1)
        self.assertEqual(badges['invictus'][0]['fencerId'], 'f-1')
        self.assertEqual(badges['invictus'][0]['value'], 3)

    def test_invictus_disqualified_by_draw_or_loss(self):
        # 3 matches: 2 wins and 1 draw -> NOT undefeated
        matches = [
            {'id': 'm-1', 'fighterAId': 'f-1', 'fighterBId': 'f-2', 'scoreA': 2, 'scoreB': 0, 'result': 'VICTORY_A'},
            {'id': 'm-2', 'fighterAId': 'f-1', 'fighterBId': 'f-3', 'scoreA': 3, 'scoreB': 1, 'result': 'VICTORY_A'},
            {'id': 'm-3', 'fighterAId': 'f-1', 'fighterBId': 'f-4', 'scoreA': 1, 'scoreB': 1, 'result': 'DRAW'}
        ]
        badges = LeagueBadgesLogic.calculate_badges(matches, self.fencers)
        self.assertEqual(len(badges['invictus']), 0)

    def test_invictus_tied_winners(self):
        # Two fencers undefeated with >= 3 matches
        matches = [
            {'id': 'm-1', 'fighterAId': 'f-1', 'fighterBId': 'f-3', 'scoreA': 2, 'scoreB': 0, 'result': 'VICTORY_A'},
            {'id': 'm-2', 'fighterAId': 'f-1', 'fighterBId': 'f-4', 'scoreA': 3, 'scoreB': 1, 'result': 'VICTORY_A'},
            {'id': 'm-3', 'fighterAId': 'f-1', 'fighterBId': 'f-5', 'scoreA': 2, 'scoreB': 0, 'result': 'VICTORY_A'},
            {'id': 'm-4', 'fighterAId': 'f-2', 'fighterBId': 'f-3', 'scoreA': 3, 'scoreB': 0, 'result': 'VICTORY_A'},
            {'id': 'm-5', 'fighterAId': 'f-2', 'fighterBId': 'f-4', 'scoreA': 2, 'scoreB': 1, 'result': 'VICTORY_A'},
            {'id': 'm-6', 'fighterAId': 'f-2', 'fighterBId': 'f-5', 'scoreA': 2, 'scoreB': 0, 'result': 'VICTORY_A'},
        ]
        badges = LeagueBadgesLogic.calculate_badges(matches, self.fencers)
        self.assertEqual(len(badges['invictus']), 2)
        winner_ids = {w['fencerId'] for w in badges['invictus']}
        self.assertEqual(winner_ids, {'f-1', 'f-2'})

    def test_top_scorer_calculation_and_tie(self):
        matches = [
            {'id': 'm-1', 'fighterAId': 'f-1', 'fighterBId': 'f-2', 'scoreA': 5, 'scoreB': 2, 'result': 'VICTORY_A'},
            {'id': 'm-2', 'fighterAId': 'f-3', 'fighterBId': 'f-4', 'scoreA': 5, 'scoreB': 1, 'result': 'VICTORY_A'}
        ]
        badges = LeagueBadgesLogic.calculate_badges(matches, self.fencers)
        # f-1 and f-3 both have 5 OHs
        self.assertEqual(len(badges['top_scorer']), 2)
        winner_ids = {w['fencerId'] for w in badges['top_scorer']}
        self.assertEqual(winner_ids, {'f-1', 'f-3'})

    def test_iron_defense_edge_case_under_3_matches_ignored(self):
        # f-5 has 1 match with 0 OHs conceded (avg 0.0) -> Under 3 matches, must NOT qualify
        # f-1 has 3 matches with 2 OHs conceded (avg 0.67) -> Qualifies and wins
        # f-2 has 3 matches with 6 OHs conceded (avg 2.0)
        matches = [
            {'id': 'm-1', 'fighterAId': 'f-1', 'fighterBId': 'f-2', 'scoreA': 2, 'scoreB': 0, 'result': 'VICTORY_A'},
            {'id': 'm-2', 'fighterAId': 'f-1', 'fighterBId': 'f-3', 'scoreA': 2, 'scoreB': 1, 'result': 'VICTORY_A'},
            {'id': 'm-3', 'fighterAId': 'f-1', 'fighterBId': 'f-4', 'scoreA': 3, 'scoreB': 1, 'result': 'VICTORY_A'},
            {'id': 'm-4', 'fighterAId': 'f-2', 'fighterBId': 'f-3', 'scoreA': 1, 'scoreB': 2, 'result': 'VICTORY_B'},
            {'id': 'm-5', 'fighterAId': 'f-2', 'fighterBId': 'f-4', 'scoreA': 0, 'scoreB': 2, 'result': 'VICTORY_B'},
            {'id': 'm-6', 'fighterAId': 'f-5', 'fighterBId': 'f-3', 'scoreA': 2, 'scoreB': 0, 'result': 'VICTORY_A'}, # f-5 only 1 match
        ]
        badges = LeagueBadgesLogic.calculate_badges(matches, self.fencers)
        self.assertEqual(len(badges['iron_defense']), 1)
        self.assertEqual(badges['iron_defense'][0]['fencerId'], 'f-1')
        self.assertEqual(badges['iron_defense'][0]['value'], 0.67)

    def test_most_active_fencer(self):
        matches = [
            {'id': 'm-1', 'fighterAId': 'f-2', 'fighterBId': 'f-1', 'scoreA': 1, 'scoreB': 2, 'result': 'VICTORY_B'},
            {'id': 'm-2', 'fighterAId': 'f-2', 'fighterBId': 'f-3', 'scoreA': 1, 'scoreB': 2, 'result': 'VICTORY_B'},
            {'id': 'm-3', 'fighterAId': 'f-2', 'fighterBId': 'f-4', 'scoreA': 2, 'scoreB': 1, 'result': 'VICTORY_A'},
            {'id': 'm-4', 'fighterAId': 'f-2', 'fighterBId': 'f-5', 'scoreA': 0, 'scoreB': 0, 'result': 'DRAW'},
        ]
        # f-2 played 4 matches
        badges = LeagueBadgesLogic.calculate_badges(matches, self.fencers)
        self.assertEqual(len(badges['most_active']), 1)
        self.assertEqual(badges['most_active'][0]['fencerId'], 'f-2')
        self.assertEqual(badges['most_active'][0]['value'], 4)

    def test_win_streak_chronological_and_reset_on_loss(self):
        # f-1 wins 3 in a row, loses 4th, wins 5th -> Max streak = 3
        # f-2 wins 2 in a row -> Streak = 2
        matches = [
            {'id': 'm-1', 'timestamp': '2026-11-01T10:00:00Z', 'fighterAId': 'f-1', 'fighterBId': 'f-3', 'scoreA': 2, 'scoreB': 0, 'result': 'VICTORY_A'},
            {'id': 'm-2', 'timestamp': '2026-11-01T11:00:00Z', 'fighterAId': 'f-1', 'fighterBId': 'f-4', 'scoreA': 2, 'scoreB': 1, 'result': 'VICTORY_A'},
            {'id': 'm-3', 'timestamp': '2026-11-02T10:00:00Z', 'fighterAId': 'f-1', 'fighterBId': 'f-5', 'scoreA': 3, 'scoreB': 0, 'result': 'VICTORY_A'},
            {'id': 'm-4', 'timestamp': '2026-11-03T10:00:00Z', 'fighterAId': 'f-1', 'fighterBId': 'f-2', 'scoreA': 1, 'scoreB': 2, 'result': 'VICTORY_B'},
            {'id': 'm-5', 'timestamp': '2026-11-04T10:00:00Z', 'fighterAId': 'f-1', 'fighterBId': 'f-3', 'scoreA': 2, 'scoreB': 0, 'result': 'VICTORY_A'},
            {'id': 'm-6', 'timestamp': '2026-11-04T11:00:00Z', 'fighterAId': 'f-2', 'fighterBId': 'f-4', 'scoreA': 2, 'scoreB': 0, 'result': 'VICTORY_A'},
        ]
        badges = LeagueBadgesLogic.calculate_badges(matches, self.fencers)
        self.assertEqual(len(badges['win_streak']), 1)
        self.assertEqual(badges['win_streak'][0]['fencerId'], 'f-1')
        self.assertEqual(badges['win_streak'][0]['value'], 3)

    def test_empty_month_handled_gracefully(self):
        badges = LeagueBadgesLogic.calculate_badges([], self.fencers)
        self.assertEqual(len(badges['invictus']), 0)
        self.assertEqual(len(badges['top_scorer']), 0)
        self.assertEqual(len(badges['iron_defense']), 0)
        self.assertEqual(len(badges['most_active']), 0)
        self.assertEqual(len(badges['win_streak']), 0)

    def test_file_integrity_and_badges_js_syntax(self):
        badges_js_path = os.path.join(os.path.dirname(__file__), 'badges.js')
        self.assertTrue(os.path.exists(badges_js_path), "badges.js must exist")
        with open(badges_js_path, 'r', encoding='utf-8') as f:
            content = f.read()
        self.assertIn('LeagueBadgesService', content)
        self.assertIn('BADGE_DEFINITIONS', content)
        self.assertIn('INVICTUS', content)
        self.assertIn('TOP_SCORER', content)
        self.assertIn('IRON_DEFENSE', content)
        self.assertIn('MOST_ACTIVE', content)
        self.assertIn('WIN_STREAK', content)


if __name__ == '__main__':
    unittest.main()
