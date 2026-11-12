# Reviewer Round 2 Progress

## State & Objectives
- Target: Verify scoreboard (+ / -) score button disablement during active combat timer and enablement when timer is stopped/paused.
- Mode: Adversarial Reviewer & QA.
- Finding:
  - Input: Bout timer counts down to 00:00 via real interval tick.
  - Expected: Timer transitions to stopped (`timerRunning = false`) immediately at 0s, buzzer sounds, status becomes "¡Tiempo agotado!", and score buttons are enabled immediately.
  - Actual: `timerRunning` remained `true` for an additional 1000ms delay while visually showing 00:00, keeping buttons locked and status as "Combate en curso", until a subsequent interval tick fired.
  - Root Cause: In `startLiveTimer()`, the interval callback only checked `this.timerSeconds > 0` and decremented without checking if `this.timerSeconds === 0` immediately. The bout completion logic was in `else` which only triggered 1 second later.
  - Fix: Checked `if (this.timerSeconds === 0)` immediately upon decrement, triggering `pauseLiveTimer()`, buzzer, and toast immediately without any 1-second delay, restoring score button enablement at 00:00 exact.
  - Verification: Added adversarial Test 11 to `test_score_buttons_timer.js`. All 11 test groups pass, 103 Python unit tests pass, and all headless stress tests pass.
