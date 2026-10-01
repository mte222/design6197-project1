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

// ONE STEP
// Every cell looks at the grid as it was at the start of the step ("before"),
// and all changes are written into a new grid ("after") that replaces it at the end.
function runStep(before) {
  const after = before.map(row => row.slice());
  return after;
}
