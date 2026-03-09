# Stress Bubble — MVP Upgrade Plan

This document defines the upgrade roadmap for the Stress Bubble project.

Codex should follow this document to implement improvements incrementally instead of relying on ad-hoc prompts.

IMPORTANT RULES

- Do not refactor architecture unless explicitly stated
- Prefer extending existing systems over creating new ones
- Implement changes phase by phase
- Each task should be small enough for a single patch
- Avoid duplicating systems that already exist
- Preserve gameplay logic unless the task explicitly requires a change

---

# Current MVP Status

The project currently includes:

Core gameplay
- bubble spawning
- multiple bubble types (normal / fast / golden / bomb)
- scoring system
- combo system
- timer-based runs
- difficulty multipliers

Game feel
- particles
- floating score text
- combo feedback
- screen shake
- bubble visual polish

UI / UX
- HUD
- result screen
- rank display
- rank progression
- result statistics
- settings panel

Retention systems
- daily challenges
- streak tracking
- best score persistence
- shop / skins

Meta systems
- storage layer
- configuration
- audio system
- run statistics

The game is currently a **complete playable MVP**.

---

# Architectural Notes

Before implementing new features, follow these principles:

1. Rank thresholds are currently defined in `computeRank()` in `src/newtab/newtab.js`.
   Avoid duplicating these thresholds elsewhere.

2. Visual effects such as particles and floating text should always be capped
   to prevent runaway performance costs.

3. Prefer render-layer effects instead of modifying gameplay state when adding
   visual polish.

4. Use existing storage helpers from:


src/shared/storage/storage.js


for persistence.

---

# Phase 1 — MVP Stabilization

Goal:
Improve reliability and onboarding with minimal architectural risk.

Tasks:

## 1. Tutorial / First-Run Hint

Add a lightweight tutorial overlay for new players.

Status: Completed (2026-03-06)

Requirements:
- show only on first run
- explain basic mechanics:
  - pop bubbles quickly
  - combos increase score
  - special bubbles have effects
- dismiss automatically or on interaction

Likely files:


src/newtab/newtab.js
src/shared/ui/screens/homeScreen.js


Complexity: LOW

---

## 2. Visual Effect Guardrails

Prevent excessive visual object counts.

Status: Completed (2026-03-06)

Add caps to:

- particles
- floating score text

Likely files:


src/shared/systems/particlesSystem.js
src/shared/systems/floatingTextSystem.js


Add behavior:


if count > MAX_EFFECTS
drop oldest effects


Complexity: LOW

---

## 3. Surface Additional Run Stats

Expose existing runStats more clearly in result screen.

Status: Completed (2026-03-06)

Possible stats:

- total pops
- max combo
- golden hits
- bomb hits

Files:


src/shared/ui/screens/resultScreen.js


Complexity: LOW

---

# Phase 2 — Retention & Progression

Goal:
Increase replay value and long-term engagement.

---

## 4. Streak Rewards

Current streak tracking exists but does not reward players.

Status: Completed (2026-03-06)

Add milestone rewards:

Example:


3 day streak → +20 coins
7 day streak → +50 coins
14 day streak → +100 coins


Files:


src/shared/systems/streakSystem.js
src/newtab/newtab.js


Complexity: MEDIUM

---

## 5. Achievement System

Add simple badge achievements based on existing run stats.

Status: Completed (2026-03-06)

Examples:

- First golden bubble
- First bomb hit
- Combo 5
- Combo 10
- Score 500
- Score 1000

Implementation:

New system:


src/shared/systems/achievementSystem.js


Persistence:


src/shared/storage/storage.js


UI:


src/shared/ui/screens/resultScreen.js


Complexity: MEDIUM

---

## 6. Daily Challenge Expansion

Expand the challenge pool.

Status: Completed (2026-03-06)

Examples:

- reach combo X
- pop N bubbles
- pop golden bubbles
- survive until low time

Files:


src/shared/systems/dailySystem.js


Complexity: LOW

---

# Phase 3 — Game Feel & Polish

Goal:
Improve player experience and feedback.

---

## 7. HUD Micro Animations

Add subtle animations:

Status: Completed (2026-03-06)

- score tick animation
- combo meter animation
- smoother combo pulses

Files:


src/shared/render/hud.js


Complexity: LOW

---

## 8. Skin Preview Improvements

Allow preview of skins in gameplay visuals.

Status: Completed (2026-03-09)

Files:


src/shared/render/bubbleRenderer.js
src/shared/render/renderer.js
src/shared/ui/shopSystem.js


Complexity: MEDIUM

---

## 9. Audio Improvements

Expand sound palette.

Status: Completed (2026-03-09)

Add:

- stronger combo sound
- golden bubble sound
- low-time warning cue

Files:


src/shared/audio/audioManager.js


Complexity: MEDIUM

---

# Phase 4 — Productization

Goal:
Make the extension production-ready.

---

## 10. Performance Safeguards

Implement adaptive detail.

Status: Completed (2026-03-09)

Example:


if FPS < threshold
reduce particle count


Files:


src/shared/engine/gameEngine.js
src/shared/systems/particlesSystem.js


Complexity: MEDIUM

---

## 11. Accessibility Options

Add options such as:

Status: Completed (2026-03-09)

- reduced motion
- color contrast
- mute audio

Files:


src/shared/ui/screens/homeScreen.js
src/shared/storage/storage.js


Complexity: MEDIUM

---

## 12. Localization Scaffold

Prepare UI text for translation.

Status: Completed (2026-03-09)

Approach:

- extract strings into dictionary
- reference via key

Files:


UI screens


Complexity: MEDIUM

---

# Known Risks

1. Rank thresholds currently exist only inside `computeRank()`.
   If reused elsewhere they may diverge.

2. Visual effects may grow unbounded without caps.

3. Audio system currently uses procedural sounds and may need expansion.

---

# Recommended Implementation Order

Codex should implement features in this order:

1. Tutorial overlay
2. Visual effect caps
3. Streak rewards
4. Achievement system
5. Daily challenge expansion
6. HUD micro-animations
7. Skin preview improvements
8. Audio improvements
9. Performance safeguards
10. Accessibility
11. Localization

---

# Implementation Guidance

When implementing any feature:

1. Inspect existing code first.
2. Extend existing systems rather than creating new architecture.
3. Keep patches small and isolated.
4. Maintain backward compatibility with the current MVP.

---

# End of Upgrade Plan
