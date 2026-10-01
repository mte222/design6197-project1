# Successional Forest — Emergent Animation

## What this project is
An animation for a class on AI, design, and creativity. A grid of cells starts as bare ground with a single grass cell in the center. Simple rules about spreading and emerging plants should produce distinct patches of grass, shrubs, and trees: a complex order that emerges from simple rules.

I am designing the rules myself. You are helping me build them. The current goal is a **working prototype** of the rules below, exactly as written. I plan to push the project much further later.

## About me
- Graduate student. Comfortable with design software, new to coding and completely new to Git.
- Explain things in simple, plain language. Avoid jargon, or define it when you use it.
- When you run a command or make a change, briefly say what it does and why.

## Who decides what
- **The rules are mine.** Do not add, remove, or change any rule, chance, or condition without asking me first.
- If a rule is unclear or two rules conflict, **stop and ask** instead of guessing. Explain the options in plain language and what each would look like on screen.
- You can suggest ideas, but label them as suggestions and wait for my answer before building them.
- Technical decisions that don't change how the rules behave (file structure, code style, drawing method) are yours to make. Briefly tell me what you chose.

## The rules (current version)
Cell types: bare ground, grass/wildflowers, shrub, tree.

1. **Starting point:** The map starts with grass in the center cell of a grid full of bare ground cells. "Next to" means direct borders as well as diagonals (8 neighbors).
2. Grass/wildflowers have a 1 in 2 chance of spreading next to grass/wildflowers, as long as that cell is not occupied by a shrub/tree.
3. Each grass/wildflower cell has a 1 in 100 chance of having shrubs emerge from it, as long as it is not bordered by a shrub/tree on any side.
4. Each shrub cell has a 1 in 3 chance of a shrub replicating in the cell next to it, as long as that cell is not occupied by a tree.
5. Each grass/wildflower/shrub cell has a 1 in 200 chance of having trees emerge from it, as long as it is not bordered by a tree on any side.
6. Each tree cell has a 1 in 4 chance of a tree cell replicating in the cell next to it.

### Decisions (answered open questions)
- **Spreading rolls:** Rules 2, 4, and 6 each have their own setting in the code, with two choices:
  - "each neighbor": every neighboring cell gets its own roll.
  - "one neighbor": the cell picks one random neighbor and rolls once.
  These are settings in the code only, with no on-screen control. I want to test both.
- **Update timing:** All cells look at the grid as it was at the start of the step, then all changes are applied together. A cell that changes during a step can't act until the next step.
- **Conflicts:** If more than one rule tries to change the same cell in the same step, the bigger plant wins: tree beats shrub, shrub beats grass.
- **Grid edges:** Plants stop at the edge (no wrapping). Edge cells have 5 neighbors and corner cells have 3.
- **"One neighbor" mode at edges:** The cell picks from all 8 directions, including spots off the grid. If it picks an off-grid spot, nothing happens that step, so plants on the edge spread a bit less.

## Prototype scope
- Shows the grid animating step by step.
- Controls: play/pause, step forward one step, reset, speed.
- A step counter.
- Simple, clear colors for each cell type.
- Nothing else until I ask. Keep it small and working.

## Technical setup
- Plain HTML, CSS, and JavaScript. No frameworks and no build tools, so it runs by opening `index.html` in a browser.
- Draw the grid with HTML canvas.
- Keep **the rules in their own file** (e.g. `rules.js`), separate from drawing and controls, written so each rule in the code matches a numbered rule above, with a comment naming it. I want to be able to read the rules in the code.
- Keep chance values (1 in 2, 1 in 100, etc.) as named settings in one place so they're easy to adjust later.

## Git (version control)
I am learning Git through this project.
- Make a commit after each working change, with a short, clear message describing what changed (e.g. "Add rule 4: shrubs spread to neighbors").
- Tell me when you commit and what the message is.
- Never run destructive commands (force push, reset --hard, rebase, deleting branches, rewriting history) without asking me and explaining what they would do.
- For experiments that might not work out, suggest making a branch first.
- No GitHub or remote setup unless I ask.
