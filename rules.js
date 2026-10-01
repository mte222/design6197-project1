// RULES
// Each rule below matches a numbered rule in CLAUDE.md.

// Cell types. Bigger numbers are bigger plants.
const BARE = 0;
const GRASS = 1;
const SHRUB = 2;
const TREE = 3;

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

// Is this spot inside the grid? (Plants stop at the edge.)
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

// Changes a cell in the new grid. If more than one rule changes the same cell
// in the same step, the bigger plant wins (tree beats shrub, shrub beats grass).
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

      // RULE 2: Grass/wildflowers have a 1 in 2 chance of spreading next to
      // grass/wildflowers, as long as that cell is not occupied by a shrub/tree.
      if (cell === GRASS) {
        for (const [dRow, dCol] of directionsToTry(SETTINGS.GRASS_SPREAD_MODE)) {
          const r = row + dRow;
          const c = col + dCol;
          if (!isInGrid(before, r, c)) continue;
          const target = before[r][c];
          if (target === SHRUB || target === TREE) continue;
          if (rollOneIn(SETTINGS.GRASS_SPREAD_ONE_IN)) grow(after, r, c, GRASS);
        }
      }

      // RULE 3: Each grass/wildflower cell has a 1 in 100 chance of having shrubs
      // emerge from it, as long as it is not bordered by a shrub/tree on any side.
      if (cell === GRASS && !hasNeighborOfType(before, row, col, [SHRUB, TREE])) {
        if (rollOneIn(SETTINGS.SHRUB_EMERGE_ONE_IN)) grow(after, row, col, SHRUB);
      }

      // RULE 4: Each shrub cell has a 1 in 3 chance of a shrub replicating in the
      // cell next to it, as long as that cell is not occupied by a tree.
      if (cell === SHRUB) {
        for (const [dRow, dCol] of directionsToTry(SETTINGS.SHRUB_SPREAD_MODE)) {
          const r = row + dRow;
          const c = col + dCol;
          if (!isInGrid(before, r, c)) continue;
          if (before[r][c] === TREE) continue;
          if (rollOneIn(SETTINGS.SHRUB_SPREAD_ONE_IN)) grow(after, r, c, SHRUB);
        }
      }

      // RULE 5: Each grass/wildflower/shrub cell has a 1 in 200 chance of having
      // trees emerge from it, as long as it is not bordered by a tree on any side.
      if ((cell === GRASS || cell === SHRUB) && !hasNeighborOfType(before, row, col, [TREE])) {
        if (rollOneIn(SETTINGS.TREE_EMERGE_ONE_IN)) grow(after, row, col, TREE);
      }

      // RULE 6: Each tree cell has a 1 in 4 chance of a tree cell replicating
      // in the cell next to it.
      if (cell === TREE) {
        for (const [dRow, dCol] of directionsToTry(SETTINGS.TREE_SPREAD_MODE)) {
          const r = row + dRow;
          const c = col + dCol;
          if (!isInGrid(before, r, c)) continue;
          if (rollOneIn(SETTINGS.TREE_SPREAD_ONE_IN)) grow(after, r, c, TREE);
        }
      }
    }
  }

  return after;
}
