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
Cell types: bare ground, grass/wildflowers, shrub, tree, fire, burned ground.

1. Starting point: Map starts with grass in center cell of grid full of bare ground cells. "Next to" is considered direct border as well as diagonal.
2. Grass or wildflowers have a 1 in 2 chance of spreading next to grass/wildflowers, as long as that cell is not occupied by a shrub/tree/fire.
3. Grass has a 1 in 4 chance of spreading from shrubs/trees cells to the cells next to them.
4. Each grass/wildflower cell has a 1 in 1000 chance of having shrubs emerge from it, as long as it is not bordered by a shrub/tree/fire on any side.
5. Each shrub cell has a 1 in 6 chance of a shrub replicating in the cell next to it, as long as that cell is not occupied by a tree or fire or bare ground.
6. Each shrub cell has a 1 in 2000 chance of having trees emerge from it, as long as it is not bordered by a tree or fire on any side.
7. Each tree cell has a 1 in 10 chance of a tree cell replicating in the cell next to it, as long as that cell is a shrub.
8. A fire has a 1 in 50,000 chance of igniting on a shrub/tree cell for each shrub/tree cell next to it.
9. Each step a fire cell has a 50% chance of extinguishing and a 50% chance of replicating in the cell next to it, as long as that cell is a shrub, tree, or grass. If that cell is grass, the fire only catches 1 in 3 times.
10. When a fire cell is extinguished, the cell becomes burned ground.
11. Each burned ground cell has a 1 in 50 chance each step of becoming bare ground.

**Burned ground:** Burned ground is a new cell type. Nothing can spread into it or emerge from it until it becomes bare ground.

**Probability values:** The plant probabilities change constantly because I adjust them myself in `settings.js`. Never change any probability values in the code unless I specifically ask. If the numbers in `settings.js` differ from the numbers in the rules text, `settings.js` is correct.

### Decisions (answered open questions)
- **Spreading rolls:** Rules 2, 3, 5, and 7 each have their own setting in the code, with two choices:
  - "each neighbor": every neighboring cell gets its own roll.
  - "one neighbor": the cell picks one random neighbor and rolls once.
  These are settings in the code only, with no on-screen control. I want to test both.
- **Update timing:** All cells look at the grid as it was at the start of the step, then all changes are applied together. A cell that changes during a step can't act until the next step.
- **Conflicts:** If more than one rule tries to change the same cell in the same step, the bigger plant wins: fire beats tree, tree beats shrub, shrub beats grass.
- **Grid edges:** Plants stop at the edge (no wrapping). Edge cells have 5 neighbors and corner cells have 3.
- **"One neighbor" mode at edges:** The cell picks from all 8 directions, including spots off the grid. If it picks an off-grid spot, nothing happens that step, so plants on the edge spread a bit less.

### Rule 3 decisions (grass spreading from shrubs/trees)
- **Who rolls:** Every shrub and tree cell does its own rule 3 roll each step.
- **Where grass can land:** Bare ground only. Rule 3 never replaces a shrub, tree, or fire.
- **"One neighbor" mode:** Same as the plants: pick any of the 8 directions; if that cell isn't bare ground (or is off the grid), nothing happens.
- **Separate from rules 5 and 7:** A shrub or tree makes its rule 3 pick separately from its own spreading pick (rule 5 or 7), so it can do both in one step.
- **Tiebreaker:** No conflict is possible (rule 3 only targets bare ground, where nothing else but grass can land), so the existing order stays.

### Fire decisions
- **Rule 8, ignition:** Every shrub and tree cell rolls its own chance each step. The chance grows with the number of shrub/tree neighbors: 1 neighbor = 1 in 50,000, 8 neighbors = 8 in 50,000, no shrub/tree neighbors = can't ignite.
  - **Which neighbors count:** Only shrubs and trees (equally). Fire, burned ground, bare ground, and grass don't count.
  - **Edges:** Scaled up so edge and corner cells can reach the same maximum as a full set of 8. The count is multiplied by 8 ÷ (number of real neighbors): e.g. an edge cell with 5 of 5 shrub/tree neighbors gets 8 in 50,000; a corner cell with 3 of 3 also gets 8 in 50,000.
- **Rule 9, two separate rolls:** Each step, a fire cell rolls once for going out and separately for spreading. It can do both, either one, or neither (keep burning without spreading).
- **Rule 9, "one neighbor" mode:** The fire picks only from neighbors it can burn (shrubs, trees, and now grass), never bare ground, burned ground, or other fire. If it has none, nothing spreads. *(Grass details pending: see open questions.)*
- **Rule 9, "each neighbor" mode:** Each shrub/tree/grass neighbor gets its own roll.
- **Fire at grid edges:** Fire stops at the edge (no wrapping). In "one neighbor" mode, a fire on the edge also has its off-grid directions added to its draw as wasted picks, so fires at the edge spread a bit less.

### Burned ground decisions
- **Rule 11:** A random 1 in 50 chance each step (not a fixed timer).
- **Nothing spreads into burned ground,** under any rule (including rule 2, even though its list doesn't name burned ground).
- **Burned ground does not block emergence next to it.** Rules 4 and 6 only list shrub/tree/fire neighbors as blockers.
- **Tiebreaker:** No conflict is possible (nothing can target fire cells or burned ground), so the existing order stays.
- **Rule 7, "one neighbor" mode:** If the tree picks a cell that isn't a shrub, nothing happens.
- **Color:** charcoal.

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
