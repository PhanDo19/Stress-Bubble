# Coding Rules

Language: JavaScript ES Modules.

---

Naming

camelCase for variables and functions.

PascalCase for classes.

---

Files

One module per file.

Systems must not depend on UI code.

---

Functions

Prefer pure functions.

Avoid global state.

---

Game State

All mutable game state stored in engine.

Systems receive state as parameter.

---

Performance

Limit particles to 30.

Limit bubbles to 12.

Use requestAnimationFrame.

Avoid expensive loops.