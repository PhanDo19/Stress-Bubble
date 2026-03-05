# Stress Bubble – Engine Implementation Tasks

This document defines step-by-step tasks for implementing the Stress Bubble game engine.

Each task corresponds to one module.

AI should implement tasks sequentially.

---

# Phase 1 – Core Engine

## Task 1 – Create Game Engine Core

File:
engine/gameEngine.js

Goal:
Implement the main game engine object.

Responsibilities:
- initialize game state
- manage systems
- control game loop

Engine structure:

{
 state
 score
 combo
 stress
 bubbles[]
 particles[]
}

Functions:

init()
start()
restart()
pause()
resume()

---

## Task 2 – Implement State Machine

File:
engine/stateMachine.js

States:

HOME
PLAYING
PAUSED
RESULT

Functions:

setState()
getState()

State transitions:

HOME → PLAYING  
PLAYING → RESULT  
PLAYING → PAUSED  
PAUSED → PLAYING

---

## Task 3 – Implement Game Loop

File:
engine/time.js

Use requestAnimationFrame.

Loop:

update()
render()

Track deltaTime.

---

# Phase 2 – Bubble Systems

## Task 4 – Bubble Object

File:
systems/bubbleFactory.js

Function:

createBubble(type)

Bubble structure:

{
 id
 type
 x
 y
 vx
 vy
 radius
 lifetime
}

Types:

normal
fast
golden
bomb

---

## Task 5 – Spawn System

File:
systems/spawnSystem.js

Responsibilities:

spawn bubbles at intervals
use spawn rates from config

Rules:

max bubbles on screen = 12

avoid overlapping spawn

Function:

spawnBubble(state)

---

## Task 6 – Movement System

File:
systems/movementSystem.js

Implement movement states:

Calm
Active
Chaos

Calm:
bubbles float upward

Active:
random drift

Chaos:
bounce physics

Function:

updateMovement(bubbles, deltaTime)

---

## Task 7 – Bubble Lifetime System

File:
systems/lifetimeSystem.js

Remove bubbles when:

lifetime expires
bubble leaves screen

---

# Phase 3 – Gameplay Mechanics

## Task 8 – Collision Detection

File:
systems/collisionSystem.js

Detect click collision.

Logic:

distance(mouse, bubbleCenter) < radius

Return popped bubble.

---

## Task 9 – Score System

File:
systems/scoreSystem.js

Formula:

score += basePoints * multiplier

Bubble values:

normal = 10  
fast = 20  
golden = 100

Bomb:

-150 score

---

## Task 10 – Combo System

File:
systems/comboSystem.js

Track combo window.

Window:

1.2 seconds

Multiplier:

1–2 hits → x1  
3–5 → x2  
6–8 → x3  
9–12 → x5  
13+ → x8

---

## Task 11 – Stress System

File:
systems/stressSystem.js

Range:

0–100

Events:

miss → +8  
hit → -3  
bomb → +12

If stress ≥100:

trigger game end.

---

# Phase 4 – Visual Systems

## Task 12 – Particle System

File:
systems/particlesSystem.js

Create pop particles.

Particle object:

{
 x
 y
 vx
 vy
 life
}

Limit:

30 particles

---

## Task 13 – Renderer

File:
render/renderer.js

Render pipeline:

clear canvas  
draw background  
draw bubbles  
draw particles  
draw HUD

---

## Task 14 – Bubble Renderer

File:
render/bubbleRenderer.js

Draw bubbles by type.

Colors:

normal → blue  
fast → purple  
golden → gold  
bomb → red

---

## Task 15 – HUD Renderer

File:
render/hud.js

Draw:

score
combo
stress bar
time

---

# Phase 5 – UI Integration

## Task 16 – Input System

File:
ui/input.js

Mouse click → bubble pop

Keyboard:

Space → start  
R → restart  
Esc → pause

---

## Task 17 – Home Screen

File:
ui/screens/homeScreen.js

Displays:

Play button
Daily challenge
Best score

---

## Task 18 – Result Screen

File:
ui/screens/resultScreen.js

Displays:

Final score
Rank
Near-miss message

---

# Phase 6 – Data Systems

## Task 19 – Storage System

File:
storage/storage.js

Use chrome.storage.local.

Functions:

saveBestScore()
loadBestScore()

saveCoins()
loadCoins()

---

## Task 20 – Daily Challenge System

File:
systems/dailySystem.js

Generate challenge from date.

Example:

POP 120  
COMBO x8  
NO BOMB

Reward:

200 coins

---

## Task 21 – Streak System

File:
systems/streakSystem.js

Track daily play streak.

Rules:

play today → streak++

miss day → reset to 1

---

# Phase 7 – Economy

## Task 22 – Coin System

File:
systems/coinSystem.js

Coins per game:

80–160

---

## Task 23 – Shop System

File:
ui/shopSystem.js

Unlock skins with coins.

---

# Phase 8 – Extension Integration

## Task 24 – New Tab Integration

File:
newtab/newtab.js

Initialize engine.

Bind UI controls.

---

## Task 25 – Popup Integration

File:
popup/popup.js

Initialize smaller game canvas.

---

# Final Task – Game Completion

Game should support:

Classic mode  
Rage mode  
Zen mode  

Save best scores.

Display results.