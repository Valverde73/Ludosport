# Graph Report - LudoSport  (2026-11-12)

## Corpus Check
- 18 files · ~101,851 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 1, .gs 1, .toml 1)

## Summary
- 513 nodes · 751 edges · 34 communities (7 shown, 27 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fc479f92`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- LudoSportApp
- test_challenger_marcador_ui.py
- TestR4TimerControlsHierarchy
- TestR3LaserVisualThemeAndAnimations
- TestR1MedalleroAndAccessibility
- test_empirical_timer_r2_r5.js
- vercel.json
- .calculate_badges
- TestR2PodiumZeroStateAndDynamicActivation
- TestR2OfficialTimerLogic
- test_empirical_challenger.js
- TestTableMetricsStability
- TestLaserHoverEffectsAndKeyframes
- .initSupabaseClient
- TestScrollClearanceAndDockOverlap
- TestR4TableMetricsAndScrollClearance
- TestR3TextContrast
- TestR5AccidentalTouchPrevention
- TestTableRenderingStressHarness
- TestTableMetricsAndScrollClearance
- TestR1ShooterCardWrapping
- test_challenger_marcador_ui.py
- TestR1NameWrappingAdversarial
- TestR4VisualHierarchyAdversarial
- TestR6TactileHitAreasAdversarial
- test_score_buttons_timer.js
- TestR6TactileHitAreas
- TestPodiumZeroStateVsActiveStateEdgeCases
- TestScoreButtonsDisabledDuringTimer
- TestScoreButtonsTimerContracts

## God Nodes (most connected - your core abstractions)
1. `LudoSportApp` - 83 edges
2. `TestMonthlyBadgesSystem` - 16 edges
3. `TestScoreButtonsTimerContracts` - 9 edges
4. `TestR1NameWrappingAdversarial` - 9 edges
5. `TestR2OfficialTimerLogic` - 9 edges
6. `ClassListMock` - 8 edges
7. `TestR3WCAGContrastAdversarial` - 8 edges
8. `TestTableMetricsStability` - 8 edges
9. `TestLaserHoverEffectsAndKeyframes` - 8 edges
10. `TestR4VisualHierarchyAdversarial` - 8 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (34 total, 27 thin omitted)

### Community 1 - "test_challenger_marcador_ui.py"
Cohesion: 0.08
Nodes (6): TestAdversarialEdgeCases, channel_luminance(), composite_alpha(), contrast_ratio(), relative_luminance(), TestMedalleroAndWcagContrastStress

### Community 5 - "test_empirical_timer_r2_r5.js"
Cohesion: 0.05
Nodes (19): assert, cssContent, fs, htmlContent, jsContent, MockElement, path, relativeLuminance() (+11 more)

### Community 6 - "vercel.json"
Cohesion: 0.50
Nodes (3): cleanUrls, name, version

### Community 7 - ".calculate_badges"
Cohesion: 0.12
Nodes (3): format_month_name(), LeagueBadgesLogic, TestMonthlyBadgesSystem

### Community 10 - "test_empirical_challenger.js"
Cohesion: 0.09
Nodes (11): formatMonthName(), LeagueBadgesService, appModule, appSource, channelLuminance(), fs, getOrCreateMockElement(), MockElement (+3 more)

### Community 25 - "test_challenger_marcador_ui.py"
Cohesion: 0.09
Nodes (6): alpha_composite(), contrast_ratio(), relative_luminance(), srgb_channel_to_linear(), TestR3WCAGContrastAdversarial, TestR5AndR2DefensiveGuards

### Community 29 - "test_score_buttons_timer.js"
Cohesion: 0.07
Nodes (17): app, appModule, appSource, assert, btnADec, btnAInc, btnBDec, btnBInc (+9 more)

## Knowledge Gaps
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TestScoreButtonsTimerContracts` connect `TestScoreButtonsTimerContracts` to `test_challenger_marcador_ui.py`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Should `LudoSportApp` be split into smaller, more focused modules?**
  _Cohesion score 0.07687894434882386 - nodes in this community are weakly interconnected._
- **Why does `TestR1NameWrappingAdversarial` connect `TestR1NameWrappingAdversarial` to `test_challenger_marcador_ui.py`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Should `test_challenger_marcador_ui.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07936507936507936 - nodes in this community are weakly interconnected._
- **Should `test_empirical_timer_r2_r5.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05204872646733112 - nodes in this community are weakly interconnected._
- **Should `.calculate_badges` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `TestR2OfficialTimerLogic` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._