# Stress Bubble – Architecture

## System Overview

The game runs entirely inside a Chrome Extension.

Modules:

Game Engine
Game Systems
Renderer
UI Layer
Storage Layer
Audio System

---

## Directory Structure

src/

shared/
engine/
systems/
render/
ui/
storage/

newtab/
popup/

assets/

---

## Game Engine

Responsibilities:

- run main loop
- update systems
- manage game state

Loop uses requestAnimationFrame.

---

## Systems

spawnSystem
movementSystem
comboSystem
stressSystem
scoreSystem
particlesSystem
audioSystem

Each system is independent.

---

## Rendering

Canvas 2D.

Renderer draws:

background
bubbles
particles
HUD

---

## UI Layer

Handles:

Home screen  
Game screen  
Result screen  
Shop screen

---

## Storage

Uses chrome.storage.local.

Stores:

bestScore  
coins  
skins  
streak  
dailyChallenge  

---

## Extension Integration

New Tab override:
chrome_url_overrides

Popup UI:
action.default_popup

---

## Future Backend

API ready:

POST /score  
GET /leaderboard