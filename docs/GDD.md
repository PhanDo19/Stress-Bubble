# Stress Bubble – Game Design Document

## Overview
Stress Bubble là một mini-game pop bubble chạy trực tiếp trên Chrome New Tab.

Game duration: 45s  
Audience: global casual users

Goal:
- quick stress relief
- replayable sessions
- easy to understand in <5 seconds

---

## Core Loop

Open Tab
→ Press Play
→ Pop bubbles
→ Build combo
→ Avoid bombs
→ Score result
→ Replay

---

## Modes

### Classic
Duration: 45s

Movement states:
Calm → Active → Chaos

### Rage
Duration: 20s

Spawn faster  
More bombs

### Zen
Relax mode  
No bombs

---

## Bubble Types

Normal
+10 score

Fast
+20 score
smaller size

Golden
+100 score
slow motion effect

Bomb
-150 score
combo reset

---

## Combo System

Combo window: 1.2s

Multiplier:

0–2 hits → x1  
3–5 hits → x2  
6–8 hits → x3  
9–12 hits → x5  
13+ hits → x8

---

## Stress System

Range: 0–100

Miss → +8  
Hit → -3  
Bomb → +12

Stress ≥100
→ overload → game ends

---

## Rank System

Bronze 0  
Silver 1800  
Gold 2600  
Diamond 3400  
Master 4200

Result screen shows near-miss:
“Need X to next rank”

---

## Daily Challenge

Examples:

POP 120  
COMBO x8  
NO BOMB  
GOLDEN x3  

Reward: 200 coins

---

## Economy

Coins per game:
80–160

Skin prices:

Common 300  
Rare 800  
Epic 1500

---

## Monetization

Premium cosmetic packs.

Starter pack $1.99  
Arcade pack $2.99  
Ultimate pack $4.99

Cosmetics only.
No gameplay advantage.

---

## Signature Feature

Dynamic movement states:

Calm → floating bubbles  
Active → random drift  
Chaos → bouncing physics

This creates a feeling of rising chaos.