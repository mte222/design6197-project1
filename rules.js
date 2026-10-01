// RULES
// Each rule below matches a numbered rule in CLAUDE.md.

// Cell types. Bigger numbers win conflicts (see grow below).
const BARE = 0;
const GRASS = 1;
const SHRUB = 2;
const TREE = 3;
const FIRE = 4;
// Burned ground is never part of the tiebreaker: nothing can spread into it.
// Giving it the biggest number means grow can never overwrite it.
const BURNED = 5;

// RULE 1: Starting point.
// The map starts as a grid full of bare ground, with grass in the center cell.
function createStartingGrid(size) {
  const grid = [];
  for (let row = 0; row < size; row++) {
    grid.push(new Array(size).fill(BARE));
  }
  const center = Math.floor(size / 2);
  grid[center][center] = GRASS;
  return grid;
}

// HELPERS

// The 8 directions to a cell's neighbors: borders and diagonals.
const NEIGHBOR_DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

// Rolls a "1 in N" chance. Returns true if it succeeds.
function rollOneIn(n) {
  return Math.random() < 1 / n;
}

// Is this spot inside the grid? (Plants and fire stop at the edge.)
function isInGrid(grid, row, col) {
  return row >= 0 && row < grid.length && col >= 0 && col < grid[0].length;
}

// Which directions a spreading cell tries this step, based on its spreading mode.
function directionsToTry(mode) {
  if (mode === "each neighbor") return NEIGHBOR_DIRECTIONS;
  if (mode === "one neighbor") {
    return [NEIGHBOR_DIRECTIONS[Math.floor(Math.random() * 8)]];
  }
  throw new Error('Spreading mode must be "each neighbor" or "one neighbor", but got: ' + mode);
}

// Does this cell have any of the given types among its 8 neighbors?
function hasNeighborOfType(grid, row, col, types) {
  for (const [dRow, dCol] of NEIGHBOR_DIRECTIONS) {
    const r = row + dRow;
    const c = col + dCol;
    if (isInGrid(grid, r, c) && types.includes(grid[r][c])) return true;
  }
  return false;
}

// Which neighbor cells a fire tries to spread into this step, based on its mode.
// A fire only ever picks cells it can burn (shrubs, trees, and grass). In "one
// neighbor" mode, off-grid directions are also in the draw, and picking one does nothing.
function fireTargets(grid, row, col, mode) {
  const burnable = [];
  let offGrid = 0;
  for (const [dRow, dCol] of NEIGHBOR_DIRECTIONS) {
    const r = row + dRow;
    const c = col + dCol;
    if (!isInGrid(grid, r, c)) offGrid++;
    else if (grid[r][c] === SHRUB || grid[r][c] === TREE || grid[r][c] === GRASS) burnable.push([r, c]);
  }
  if (mode === "each neighbor") return burnable;
  if (mode === "one neighbor") {
    const drawSize = burnable.length + offGrid;
    if (burnable.length === 0) return [];
    const pick = Math.floor(Math.random() * drawSize);
    return pick < burnable.length ? [burnable[pick]] : []; // off-grid pick: nothing
  }
  throw new Error('Spreading mode must be "each neighbor" or "one neighbor", but got: ' + mode);
}

// How many of this cell's neighbors are one of the given types, and how many
// real (on-grid) neighbors it has: 8 in the middle, 5 on an edge, 3 in a corner.
function countNeighbors(grid, row, col, types) {
  let matching = 0;
  let real = 0;
  for (const [dRow, dCol] of NEIGHBOR_DIRECTIONS) {
    const r = row + dRow;
    const c = col + dCol;
    if (!isInGrid(grid, r, c)) continue;
    real++;
    if (types.includes(grid[r][c])) matching++;
  }
  return { matching, real };
}

// Changes a cell in the new grid. If more than one rule changes the same cell
// in the same step, the bigger one wins (fire beats tree, tree beats shrub,
// shrub beats grass).
function grow(after, row, col, type) {
  if (type > after[row][col]) after[row][col] = type;
}

// ONE STEP
// Every cell looks at the grid as it was at the start of the step ("before"),
// and all changes are written into a new grid ("after") that replaces it at the end.
function runStep(before) {
  const after = before.map(row => row.slice());

  for (let row = 0; row < before.length; row++) {
    for (let col = 0; col < before[row].length; col++) {
      const cell = before[row][col];

      // RULE 2: Grass or wildflowers have a 1 in 2 chance of spreading next to
      // grass/wildflowers, as long as that cell is not occupied by a shrub/tree/fire.
      if (cell === GRASS) {
        for (const [dRow, dCol] of directionsToTry(SETTINGS.GRASS_SPREAD_MODE)) {
          const r = row + dRow;
          const c = col + dCol;
          if (!isInGrid(before, r, c)) continue;
          const target = before[r][c];
          if (target === SHRUB || target === TREE || target === FIRE) continue;
          if (target === BURNED) continue; // Nothing can spread into burned ground.
          if (rollOneIn(SETTINGS.GRASS_SPREAD_ONE_IN)) grow(after, r, c, GRASS);
        }
      }

      // RULE 3: Grass has a 1 in 4 chance of spreading from shrubs/trees cells to
      // the cells next to them.
      // (Grass only lands on bare ground. This pick is separate from the shrub's
      // or tree's own spreading pick in rules 5 and 7.)
      if (cell === SHRUB || cell === TREE) {
        for (const [dRow, dCol] of directionsToTry(SETTINGS.GRASS_FROM_SHRUB_TREE_MODE)) {
          const r = row + dRow;
          const c = col + dCol;
          if (!isInGrid(before, r, c)) continue;
          if (before[r][c] !== BARE) continue;
          if (rollOneIn(SETTINGS.GRASS_FROM_SHRUB_TREE_ONE_IN)) grow(after, r, c, GRASS);
        }
      }

      // RULE 4: Each grass/wildflower cell has a 1 in 1000 chance of having shrubs
      // emerge from it, as long as it is not bordered by a shrub/tree/fire on any side.
      if (cell === GRASS && !hasNeighborOfType(before, row, col, [SHRUB, TREE, FIRE])) {
        if (rollOneIn(SETTINGS.SHRUB_EMERGE_ONE_IN)) grow(after, row, col, SHRUB);
      }

      // RULE 5: Each shrub cell has a 1 in 6 chance of a shrub replicating in the
      // cell next to it, as long as that cell is not occupied by a tree or fire or
      // bare ground.
      if (cell === SHRUB) {
        for (const [dRow, dCol] of directionsToTry(SETTINGS.SHRUB_SPREAD_MODE)) {
          const r = row + dRow;
          const c = col + dCol;
          if (!isInGrid(before, r, c)) continue;
          const target = before[r][c];
          if (target === TREE || target === FIRE || target === BARE) continue;
          if (target === BURNED) continue; // Nothing can spread into burned ground.
          if (rollOneIn(SETTINGS.SHRUB_SPREAD_ONE_IN)) grow(after, r, c, SHRUB);
        }
      }

      // RULE 6: Each shrub cell has a 1 in 2000 chance of having trees emerge from
      // it, as long as it is not bordered by a tree or fire on any side.
      if (cell === SHRUB && !hasNeighborOfType(before, row, col, [TREE, FIRE])) {
        if (rollOneIn(SETTINGS.TREE_EMERGE_ONE_IN)) grow(after, row, col, TREE);
      }

      // RULE 7: Each tree cell has a 1 in 10 chance of a tree cell replicating
      // in the cell next to it, as long as that cell is a shrub.
      if (cell === TREE) {
        for (const [dRow, dCol] of directionsToTry(SETTINGS.TREE_SPREAD_MODE)) {
          const r = row + dRow;
          const c = col + dCol;
          if (!isInGrid(before, r, c)) continue;
          if (before[r][c] !== SHRUB) continue;
          if (rollOneIn(SETTINGS.TREE_SPREAD_ONE_IN)) grow(after, r, c, TREE);
        }
      }

      // RULE 8: A fire has a 1 in 50,000 chance of igniting on a shrub/tree cell
      // for each shrub/tree cell next to it.
      // (Only shrub/tree neighbors count. Edge and corner cells are scaled up by
      // 8 / their number of real neighbors, so a full edge counts like a full 8.)
      if (cell === SHRUB || cell === TREE) {
        const { matching, real } = countNeighbors(before, row, col, [SHRUB, TREE]);
        const chance = (matching * 8 / real) / SETTINGS.FIRE_IGNITE_ONE_IN;
        if (Math.random() < chance) grow(after, row, col, FIRE);
      }

      // RULE 9: Each step a fire cell has a 50% chance of extinguishing and a 50%
      // chance of replicating in the cell next to it, as long as that cell is a
      // shrub, tree, or grass. If that cell is grass, the fire only catches 1 in 3 times.
      // (Spreading and going out are two separate rolls: a fire can do both,
      // either one, or neither. For grass, the 1 in 3 roll replaces the 50% roll.
      // If grass doesn't catch, the fire's spreading turn is used up.)
      if (cell === FIRE) {
        for (const [r, c] of fireTargets(before, row, col, SETTINGS.FIRE_SPREAD_MODE)) {
          const chance = before[r][c] === GRASS
            ? SETTINGS.FIRE_GRASS_CATCH_ONE_IN
            : SETTINGS.FIRE_SPREAD_ONE_IN;
          if (rollOneIn(chance)) grow(after, r, c, FIRE);
        }

        // RULE 10: When a fire cell is extinguished, the cell becomes burned ground.
        // (Set directly. No other rule can change a fire cell in the same step.)
        if (rollOneIn(SETTINGS.FIRE_EXTINGUISH_ONE_IN)) after[row][col] = BURNED;
      }

      // RULE 11: Each burned ground cell has a 1 in 50 chance each step of becoming
      // bare ground.
      // (Set directly. Nothing can spread into or emerge from burned ground.)
      if (cell === BURNED) {
        if (rollOneIn(SETTINGS.BURNED_TO_BARE_ONE_IN)) after[row][col] = BARE;
      }
    }
  }

  return after;
}
