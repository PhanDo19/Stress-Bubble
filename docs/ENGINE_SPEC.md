# Game Engine Specification

## Main Loop

Game uses requestAnimationFrame.

Loop:

update()
render()

---

## Game State

Possible states:

HOME
PLAYING
PAUSED
RESULT

---

## Engine Object

GameEngine contains:

state
score
combo
stress
bubbles[]
particles[]

---

## Update Cycle

update()

1 update timer
2 spawn bubbles
3 update movement
4 handle collisions
5 update combo
6 update stress
7 remove expired bubbles

---

## Render Cycle

render()

1 clear canvas
2 draw background
3 draw bubbles
4 draw particles
5 draw HUD

---

## Bubble Object

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

---

## Collision

distance(mouse, bubbleCenter) < radius

→ bubble popped

---

## Movement States

### Calm

Bubbles float upward.

velocityY constant.

### Active

Bubbles drift randomly.

vx random
vy upward

### Chaos

Bubbles bounce physics.

Wall collision:

velocity *= -1