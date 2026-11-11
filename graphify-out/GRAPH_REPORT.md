# Graph Report - LudoSport  (2026-11-11)

## Corpus Check
- 6 files · ~22,491 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 1, .gs 1, .toml 1)

## Summary
- 853 nodes · 1445 edges · 82 communities (47 shown, 35 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `03ffd3d6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- LudoSportApp
- server.cjs
- lifecycle.test.js
- test_plugin.py
- test-bootstrap-caching.mjs
- server.test.js
- vercel.json
- .calculate_badges
- test-sync-to-codex-plugin.sh
- analyze-token-usage.py
- LeagueBadgesService
- branding.test.js
- setup.sh
- auth.test.js
- test-session-bootstrap.mjs
- sync-to-codex-plugin.sh
- test-helpers.sh
- bump-version.sh
- lint-shell.sh
- test-package-codex-plugin.sh
- test-pi-extension.mjs
- superpowers.ts
- test-lint-shell.sh
- superpowers/package.json
- hooks
- windows-lifecycle.test.sh
- helper.js
- stop-server.test.sh
- test-run-hook-cmd-windows.sh
- package-codex-plugin.sh
- test-sdd-workspace.sh
- test-session-start.sh
- test-hook-registration.mjs
- test-find-polluter.sh
- stop-server.sh
- test-render-graphs.sh
- contact_links
- plugin.yaml
- start-server.test.sh
- test-executing-plans-scripts.sh
- test-bump-version.sh
- render-antigravity-logo.sh
- test-worktree-path-policy.sh
- test-skill-structure.sh
- run-all.sh script
- start-server.sh
- test-antigravity-tools.sh
- test-logo.sh
- test-devin-plugin.sh
- FUNDING.yml
- find-polluter.sh
- antigravity/run-tests.sh
- antigravity/test-plugin-manifest.sh
- run-skill-tests.sh
- test-marketplace-manifest.sh
- run-extended-multiturn-test.sh
- run-haiku-test.sh
- run-multiturn-test.sh
- kimi/run-tests.sh
- kimi/test-plugin-manifest.sh
- opencode/run-tests.sh
- test-hook-registration.sh script
- test-session-bootstrap.sh script
- test-sdd-helper-paths.sh
- test-no-dev-files-in-skills.sh
- test-skill-size.sh
- superpowers.js
- ref_path
- test-skill-registration.mjs
- helper.test.js
- render-graphs.js
- ref_assert

## God Nodes (most connected - your core abstractions)
1. `LudoSportApp` - 81 edges
2. `main()` - 27 edges
3. `main()` - 16 edges
4. `runTests()` - 16 edges
5. `runTests()` - 16 edges
6. `TestMonthlyBadgesSystem` - 14 edges
7. `handleRequest()` - 14 edges
8. `runTests()` - 13 edges
9. `_load_plugin()` - 13 edges
10. `sync-to-codex-plugin.sh script` - 12 edges

## Surprising Connections (you probably didn't know these)
- `run_and_check()` --calls--> `cleanup_test_project()`  [EXTRACTED]
  .agents/skills/superpowers/tests/claude-code/test-worktree-native-preference.sh → .agents/skills/superpowers/tests/claude-code/test-helpers.sh
- `test-subagent-driven-development.sh script` --calls--> `assert_contains()`  [EXTRACTED]
  .agents/skills/superpowers/tests/claude-code/test-subagent-driven-development.sh → .agents/skills/superpowers/tests/claude-code/test-helpers.sh
- `test-subagent-driven-development.sh script` --calls--> `assert_order()`  [EXTRACTED]
  .agents/skills/superpowers/tests/claude-code/test-subagent-driven-development.sh → .agents/skills/superpowers/tests/claude-code/test-helpers.sh
- `test-subagent-driven-development-integration.sh script` --calls--> `create_test_project()`  [EXTRACTED]
  .agents/skills/superpowers/tests/claude-code/test-subagent-driven-development-integration.sh → .agents/skills/superpowers/tests/claude-code/test-helpers.sh
- `run_and_check()` --calls--> `create_test_project()`  [EXTRACTED]
  .agents/skills/superpowers/tests/claude-code/test-worktree-native-preference.sh → .agents/skills/superpowers/tests/claude-code/test-helpers.sh

## Import Cycles
- None detected.

## Communities (82 total, 35 thin omitted)

### Community 0 - "LudoSportApp"
Cohesion: 0.07
Nodes (4): DEFAULT_FENCERS, LudoSportApp, MONTH_NAMES, normalizeSupabaseUrl()

### Community 1 - "server.cjs"
Cohesion: 0.05
Nodes (57): bootstrapPage(), brandMarkup(), broadcast(), browserLauncherForPlatform(), chmodOwnerOnly(), RFC-6455, clients, companionUrl() (+49 more)

### Community 2 - "lifecycle.test.js"
Cohesion: 0.16
Nodes (21): assert, firstServerStarted(), fs, httpStatus(), isWindowsLikeShell(), killAndWait(), makeShellTempDir(), newestSessionDir() (+13 more)

### Community 3 - "test_plugin.py"
Cohesion: 0.07
Nodes (12): _build_bootstrap(), _frontmatter_value(), register(), _skills_dir(), _strip_frontmatter(), mock_ctx(), _fire_pre_llm(), _load_plugin() (+4 more)

### Community 4 - "test-bootstrap-caching.mjs"
Cohesion: 0.12
Nodes (6): afterFirst, afterSecond, firstOutput, mappingFailures, result, secondOutput

### Community 5 - "server.test.js"
Cohesion: 0.09
Nodes (30): dependencies, ws@^8.21.0, name, scripts, test, version, assert, assertStartedOnExpectedPort() (+22 more)

### Community 6 - "vercel.json"
Cohesion: 0.40
Nodes (4): cleanUrls, name, routes, version

### Community 7 - ".calculate_badges"
Cohesion: 0.14
Nodes (3): format_month_name(), LeagueBadgesLogic, TestMonthlyBadgesSystem

### Community 8 - "test-sync-to-codex-plugin.sh"
Cohesion: 0.15
Nodes (31): add_openai_agent_metadata_fixture(), assert_branch_absent(), assert_contains(), assert_current_branch(), assert_equals(), assert_file_equals(), assert_matches(), assert_not_contains() (+23 more)

### Community 9 - "analyze-token-usage.py"
Cohesion: 0.11
Nodes (9): analyze_main_session(), calculate_cost(), format_tokens(), main(), _bootstrap(), _load(), TestBootstrapContent, TestSkillsDirResolution (+1 more)

### Community 12 - "branding.test.js"
Cohesion: 0.17
Nodes (24): assert, assertBrandedFallbackText(), assertBrandedWithLogo(), assertFramedLogoSupportsDarkTheme(), assertFramedScreenUsesBrandHeader(), assertHeaderAvoidsNarrowOverlap(), assertLogoKeepsTransparentBackground(), assertTelemetryImage() (+16 more)

### Community 13 - "setup.sh"
Cohesion: 0.11
Nodes (17): HOME, OPENCODE_CONFIG_DIR, setup.sh script, XDG_CONFIG_HOME, run_missing_file_check(), run_present_file_check(), test-bootstrap-caching.sh script, test-plugin-loading.sh script (+9 more)

### Community 14 - "auth.test.js"
Cohesion: 0.15
Nodes (20): assert, assertSecurityHeaders(), assertStartedOnExpectedPort(), cleanup(), CONTENT_DIR, EXPECTED_SECURITY_HEADERS, fs, get() (+12 more)

### Community 15 - "test-session-bootstrap.mjs"
Cohesion: 0.10
Nodes (14): checkpoint, childEvent, empty, freshRootEvent, newPromptAfterCheckpoint, originalChild, originalRetainedUserChild, pluginURL (+6 more)

### Community 16 - "sync-to-codex-plugin.sh"
Cohesion: 0.21
Nodes (17): append_git_ignored_directory_excludes(), append_git_ignored_file_excludes(), apply_to_preview_checkout(), confirm(), copy_local_destination_overlay(), copy_preserved_destination_metadata(), die(), ignored_directory_has_tracked_descendants() (+9 more)

### Community 17 - "test-helpers.sh"
Cohesion: 0.18
Nodes (10): assert_contains(), assert_order(), cleanup_test_project(), create_test_project(), run_claude(), test-helpers.sh script, test-subagent-driven-development-integration.sh script, test-subagent-driven-development.sh script (+2 more)

### Community 18 - "bump-version.sh"
Cohesion: 0.30
Nodes (12): cmd_audit(), cmd_bump(), cmd_check(), preflight_manifests(), read_json_field(), read_manifest_field(), read_yaml_field(), require_tool() (+4 more)

### Community 19 - "lint-shell.sh"
Cohesion: 0.38
Nodes (12): add_shell_file(), collect_all_shell_files(), collect_changed_shell_files(), collect_requested_shell_files(), die(), ensure_git_work_tree(), is_shell_file(), require_tool() (+4 more)

### Community 20 - "test-package-codex-plugin.sh"
Cohesion: 0.36
Nodes (11): assert_contains(), assert_equals(), assert_not_matches(), extract_archive(), fail(), list_archive(), normalize_archive_paths(), pass() (+3 more)

### Community 21 - "test-pi-extension.mjs"
Cohesion: 0.15
Nodes (5): __dirname, extensionPath, packageJsonPath, piToolsPath, repoRoot

### Community 22 - "superpowers.ts"
Cohesion: 0.24
Nodes (10): bootstrapSkillPath, extensionDir, firstNonCompactionSummaryIndex(), getBootstrapContent(), messageContainsBootstrap(), packageRoot, piToolMapping(), skillsDir (+2 more)

### Community 23 - "test-lint-shell.sh"
Cohesion: 0.40
Nodes (9): assert_contains(), assert_not_contains(), configure_git_identity(), fail(), make_fixture_repo(), pass(), run_lint_shell(), test-lint-shell.sh script (+1 more)

### Community 24 - "superpowers/package.json"
Cohesion: 0.20
Nodes (9): description, keywords, main, name, pi, extensions, skills, type (+1 more)

### Community 25 - "hooks"
Cohesion: 0.20
Nodes (9): entry, files, id, language, name, pass_filenames, repos, hooks (+1 more)

### Community 26 - "windows-lifecycle.test.sh"
Cohesion: 0.36
Nodes (8): fail(), get_key_from_info(), get_port_from_info(), http_check(), pass(), windows-lifecycle.test.sh script, skip(), wait_for_server_info()

### Community 27 - "helper.js"
Cohesion: 0.42
Nodes (7): connect(), nextReconnectDelay(), reloadAfterRecovery(), sessionKey(), setStatus(), showTombstone(), websocketUrl()

### Community 28 - "stop-server.test.sh"
Cohesion: 0.39
Nodes (7): bad(), new_server_id(), ok(), stop-server.test.sh script, track_dir(), track_pid(), untrack_pid()

### Community 29 - "test-run-hook-cmd-windows.sh"
Cohesion: 0.39
Nodes (7): fail(), fake_bash(), junction(), make_plugin(), pass(), run_hook(), test-run-hook-cmd-windows.sh script

### Community 30 - "package-codex-plugin.sh"
Cohesion: 0.46
Nodes (6): die(), infer_format_from_output(), metadata_root_from_dir(), prepare_metadata_root(), package-codex-plugin.sh script, usage()

### Community 31 - "test-sdd-workspace.sh"
Cohesion: 0.43
Nodes (6): fail(), main(), native_readable(), pass(), physical_path(), test-sdd-workspace.sh script

### Community 32 - "test-session-start.sh"
Cohesion: 0.57
Nodes (6): assert_closed_stdout(), assert_command_output(), fail(), make_home(), pass(), test-session-start.sh script

### Community 34 - "test-find-polluter.sh"
Cohesion: 0.43
Nodes (6): assert_contains(), fail(), pass(), run_polluter(), setup_project(), test-find-polluter.sh script

### Community 35 - "stop-server.sh"
Cohesion: 0.52
Nodes (6): command_has_server_id(), command_line_for_pid(), is_brainstorm_server(), mark_stopped(), read_expected_server_id(), stop-server.sh script

### Community 36 - "test-render-graphs.sh"
Cohesion: 0.67
Nodes (5): assert_contains(), assert_not_contains(), fail(), pass(), test-render-graphs.sh script

### Community 37 - "contact_links"
Cohesion: 0.33
Nodes (5): blank_issues_enabled, contact_links, about, name, url

### Community 38 - "plugin.yaml"
Cohesion: 0.33
Nodes (5): author, description, name, provides_hooks, version

### Community 39 - "start-server.test.sh"
Cohesion: 0.53
Nodes (4): fail(), make_fake_uname(), pass(), start-server.test.sh script

### Community 40 - "test-executing-plans-scripts.sh"
Cohesion: 0.53
Nodes (4): fail(), main(), pass(), test-executing-plans-scripts.sh script

### Community 42 - "test-bump-version.sh"
Cohesion: 0.60
Nodes (3): fail(), make_fixture(), test-bump-version.sh script

### Community 44 - "render-antigravity-logo.sh"
Cohesion: 0.83
Nodes (3): die(), render-antigravity-logo.sh script, usage()

### Community 45 - "test-worktree-path-policy.sh"
Cohesion: 0.83
Nodes (3): assert_contains(), assert_not_contains(), test-worktree-path-policy.sh script

### Community 46 - "test-skill-structure.sh"
Cohesion: 0.83
Nodes (3): fail(), pass(), test-skill-structure.sh script

### Community 76 - "superpowers.js"
Cohesion: 0.20
Nodes (12): _bootstrapCache, _cacheChildSession(), _childSessionCache, __dirname, extractAndStripFrontmatter(), getBootstrapContent(), isChildSession(), setup() (+4 more)

### Community 77 - "ref_path"
Cohesion: 0.20
Nodes (6): assert, crypto, RFC-6455, path, runTests(), SERVER_PATH

### Community 78 - "test-skill-registration.mjs"
Cohesion: 0.18
Nodes (8): added, failures, fixtureRoot, frontmatterFixtures, pluginPath, result, skillsDir, survived

### Community 79 - "helper.test.js"
Cohesion: 0.20
Nodes (6): assert, fs, HELPER, moduleShim, path, src

### Community 80 - "render-graphs.js"
Cohesion: 0.60
Nodes (5): combineGraphs(), extractDotBlocks(), extractGraphBody(), main(), renderToSvg()

## Knowledge Gaps
- **5 isolated node(s):** `RFC-6455`, `HOME`, `OPENCODE_CONFIG_DIR`, `XDG_CONFIG_HOME`, `RFC-6455`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 280 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ws` connect `server.test.js` to `lifecycle.test.js`, `auth.test.js`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `RFC-6455`, `HOME`, `OPENCODE_CONFIG_DIR` to the rest of the system?**
  _5 weakly-connected nodes found - possible missing edges._
- **Should `LudoSportApp` be split into smaller, more focused modules?**
  _Cohesion score 0.07450980392156863 - nodes in this community are weakly interconnected._
- **Should `server.cjs` be split into smaller, more focused modules?**
  _Cohesion score 0.05499735589635114 - nodes in this community are weakly interconnected._
- **Should `test_plugin.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06914893617021277 - nodes in this community are weakly interconnected._
- **Should `test-bootstrap-caching.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `server.test.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0944741532976827 - nodes in this community are weakly interconnected._