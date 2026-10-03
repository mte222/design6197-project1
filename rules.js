// RULES
// Each rule below matches a numbered rule in CLAUDE.md.

// Cell types. Bigger numbers win conflicts (see grow below).
const BARE = 0;
const GRASS = 1;
const SHRUB = 2;
const TREE = 3;
// Fire comes in three kinds that behave the same everywhere, except for what they
// leave behind when they go out (rule 10) or are put out by the viewer (rule 12).
// The kind is set by what the cell was when it caught fire: grass becomes
// GRASS_FIRE, a shrub becomes SHRUB_FIRE, a tree becomes TREE_FIRE.
// All kinds beat every plant in the tiebreaker. They never compete with each other,
// because a cell's kind of fire is decided by what that cell was.
const SHRUB_FIRE = 4;
const GRASS_FIRE = 5;
const TREE_FIRE = 6;
const FIRE_TYPES = [SHRUB_FIRE, GRASS_FIRE, TREE_FIRE];
// Burned ground is never part of the tiebreaker: nothing can spread into it.
// Giving it the biggest number means grow can never overwrite it.
const BURNED = 7;

// Is this cell on fire (any kind)?
function isFire(type) {
  return FIRE_TYPES.includes(type);
}

// The kind of fire a plant becomes when it catches fire.
const FIRE_KIND_FOR = { [GRASS]: GRASS_FIRE, [SHRUB]: SHRUB_FIRE, [TREE]: TREE_FIRE };

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

// RULE 13 (setup): Every cell has a fuel clock, kept in a second grid the same
// size as the map. It counts the steps a shrub/tree has gone without burning.
// The clock is updated at the end of each step (see nextFuelAge).
function createStartingFuelAge(size) {
  const fuelAge = [];
  for (let row = 0; row < size; row++) {
    fuelAge.push(new Array(size).fill(0));
  }
  return fuelAge;
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

// Is this spot inside the grid?
function isInGrid(grid, row, col) {
  return row >= 0 && row < grid.length && col >= 0 && col < grid[0].length;
}

// The neighbor of (row, col) in the direction (dRow, dCol), as [row, col].
// Every rule finds its neighbors through here.
// - Wrap-around on: spots past an edge loop around to the opposite side.
// - Wrap-around off: spots past an edge return null (plants and fire stop there).
function neighborAt(grid, row, col, dRow, dCol) {
  let r = row + dRow;
  let c = col + dCol;
  if (SETTINGS.WRAP_EDGES) {
    const rows = grid.length;
    const cols = grid[0].length;
    return [(r + rows) % rows, (c + cols) % cols];
  }
  return isInGrid(grid, r, c) ? [r, c] : null;
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
    const spot = neighborAt(grid, row, col, dRow, dCol);
    if (spot && types.includes(grid[spot[0]][spot[1]])) return true;
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
    const spot = neighborAt(grid, row, col, dRow, dCol);
    if (!spot) { offGrid++; continue; }
    const [r, c] = spot;
    if (grid[r][c] === SHRUB || grid[r][c] === TREE || grid[r][c] === GRASS) burnable.push([r, c]);
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
// real (on-grid) neighbors it has: 8 in the middle, 5 on an edge, 3 in a corner
// (always 8 when wrap-around is on).
function countNeighbors(grid, row, col, types) {
  let matching = 0;
  let real = 0;
  for (const [dRow, dCol] of NEIGHBOR_DIRECTIONS) {
    const spot = neighborAt(grid, row, col, dRow, dCol);
    if (!spot) continue;
    real++;
    if (types.includes(grid[spot[0]][spot[1]])) matching++;
  }
  return { matching, real };
}

// RULE 13: Is this cell heavy fuel? True for a shrub/tree whose clock has reached
// HEAVY_FUEL_AFTER_STEPS, and for a fire that was burning in heavy fuel (a fire's
// clock is paused at what it was when the cell caught fire).
function isHeavyFuel(type, age) {
  const canBeHeavy = type === SHRUB || type === TREE || type === SHRUB_FIRE || type === TREE_FIRE;
  return canBeHeavy && age >= SETTINGS.HEAVY_FUEL_AFTER_STEPS;
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
// The fuel clocks (rule 13) work the same way: "ageBefore" is read, and the
// new clocks are worked out at the end. Returns both new grids.
// "climate" is one entry from SETTINGS.CLIMATES (rule 14).
function runStep(before, ageBefore, climate) {
  const after = before.map(row => row.slice());

  for (let row = 0; row < before.length; row++) {
    for (let col = 0; col < before[row].length; col++) {
      const cell = before[row][col];

      // RULE 2: Grass or wildflowers have a 1 in 2 chance of spreading next to
      // grass/wildflowers, as long as that cell is not occupied by a shrub/tree/fire.
      if (cell === GRASS) {
        for (const [dRow, dCol] of directionsToTry(SETTINGS.GRASS_SPREAD_MODE)) {
          const spot = neighborAt(before, row, col, dRow, dCol);
          if (!spot) continue;
          const [r, c] = spot;
          const target = before[r][c];
          if (target === SHRUB || target === TREE || isFire(target)) continue;
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
          const spot = neighborAt(before, row, col, dRow, dCol);
          if (!spot) continue;
          const [r, c] = spot;
          if (before[r][c] !== BARE) continue;
          if (rollOneIn(SETTINGS.GRASS_FROM_SHRUB_TREE_ONE_IN)) grow(after, r, c, GRASS);
        }
      }

      // RULE 4: Each grass/wildflower cell has a 1 in 1000 chance of having shrubs
      // emerge from it, as long as it is not bordered by a shrub/tree/fire on any side.
      if (cell === GRASS && !hasNeighborOfType(before, row, col, [SHRUB, TREE, ...FIRE_TYPES])) {
        if (rollOneIn(SETTINGS.SHRUB_EMERGE_ONE_IN)) grow(after, row, col, SHRUB);
      }

      // RULE 5: Each shrub cell has a 1 in 6 chance of a shrub replicating in the
      // cell next to it, as long as that cell is not occupied by a tree or fire or
      // bare ground.
      if (cell === SHRUB) {
        for (const [dRow, dCol] of directionsToTry(SETTINGS.SHRUB_SPREAD_MODE)) {
          const spot = neighborAt(before, row, col, dRow, dCol);
          if (!spot) continue;
          const [r, c] = spot;
          const target = before[r][c];
          if (target === TREE || isFire(target) || target === BARE) continue;
          if (target === BURNED) continue; // Nothing can spread into burned ground.
          if (rollOneIn(SETTINGS.SHRUB_SPREAD_ONE_IN)) grow(after, r, c, SHRUB);
        }
      }

      // RULE 6: Each shrub cell has a 1 in 2000 chance of having trees emerge from
      // it, as long as it is not bordered by a tree or fire on any side.
      if (cell === SHRUB && !hasNeighborOfType(before, row, col, [TREE, ...FIRE_TYPES])) {
        if (rollOneIn(SETTINGS.TREE_EMERGE_ONE_IN)) grow(after, row, col, TREE);
      }

      // RULE 7: Each tree cell has a 1 in 10 chance of a tree cell replicating
      // in the cell next to it, as long as that cell is a shrub.
      if (cell === TREE) {
        for (const [dRow, dCol] of directionsToTry(SETTINGS.TREE_SPREAD_MODE)) {
          const spot = neighborAt(before, row, col, dRow, dCol);
          if (!spot) continue;
          const [r, c] = spot;
          if (before[r][c] !== SHRUB) continue;
          if (rollOneIn(SETTINGS.TREE_SPREAD_ONE_IN)) grow(after, r, c, TREE);
        }
      }

      // RULE 8: A fire has a 1 in 50,000 chance of igniting on a shrub/tree cell
      // for each shrub/tree cell next to it.
      // (Only shrub/tree neighbors count. Edge and corner cells are scaled up by
      // 8 / their number of real neighbors, so a full edge counts like a full 8.
      // Only shrubs/trees ignite, so this is always the shrub/tree kind of fire.)
      if (cell === SHRUB || cell === TREE) {
        const { matching, real } = countNeighbors(before, row, col, [SHRUB, TREE]);
        const chance = (matching * 8 / real) / SETTINGS.FIRE_IGNITE_ONE_IN;
        if (Math.random() < chance) grow(after, row, col, FIRE_KIND_FOR[cell]);
      }

      // RULE 9: Each step a fire cell has a 50% chance of extinguishing and a 50%
      // chance of replicating in the cell next to it, as long as that cell is a
      // shrub, tree, or grass. If that cell is grass, the fire only catches 1 in 3 times.
      // (Spreading and going out are two separate rolls: a fire can do both,
      // either one, or neither. For grass, the 1 in 3 roll replaces the 50% roll.
      // If grass doesn't catch, the fire's spreading turn is used up.
      // The new fire's kind depends on what it spreads into: grass makes a grass
      // fire, a shrub or tree makes a shrub/tree fire.)
      if (isFire(cell)) {
        const heavyFire = isHeavyFuel(cell, ageBefore[row][col]);
        for (const [r, c] of fireTargets(before, row, col, SETTINGS.FIRE_SPREAD_MODE)) {
          const intoGrass = before[r][c] === GRASS;
          let chance = intoGrass
            ? SETTINGS.FIRE_GRASS_CATCH_ONE_IN
            : SETTINGS.FIRE_SPREAD_ONE_IN;
          // RULE 13: Fire spreading from or into heavy fuel uses the boosted
          // chance instead (this includes a heavy-fuel fire spreading into grass).
          if (heavyFire || isHeavyFuel(before[r][c], ageBefore[r][c])) {
            chance = SETTINGS.HEAVY_FUEL_SPREAD_ONE_IN;
          }
          if (rollOneIn(chance)) grow(after, r, c, FIRE_KIND_FOR[before[r][c]]);
        }

        // RULE 10: When a fire cell that was grass is extinguished, it returns to
        // bare ground. When a fire cell that was a shrub or tree is extinguished,
        // it becomes burned ground.
        // (Set directly. No other rule can change a fire cell in the same step.)
        // RULE 13: Fire burning in heavy fuel has its own chance of going out.
        const goOutChance = heavyFire
          ? SETTINGS.HEAVY_FUEL_EXTINGUISH_ONE_IN
          : SETTINGS.FIRE_EXTINGUISH_ONE_IN;
        if (rollOneIn(goOutChance)) {
          after[row][col] = cell === GRASS_FIRE ? BARE : BURNED;
        }
      }

      // RULE 11: Each burned ground cell has a 1 in 50 chance each step of becoming
      // bare ground. (Since burned grass goes straight to bare ground, this now only
      // applies to burned shrubs and trees.)
      // (Set directly. Nothing can spread into or emerge from burned ground.)
      if (cell === BURNED) {
        if (rollOneIn(SETTINGS.BURNED_TO_BARE_ONE_IN)) after[row][col] = BARE;
      }
    }
  }

  const ageAfter = before.map((cells, row) =>
    cells.map((was, col) => nextFuelAge(was, after[row][col], ageBefore[row][col], climate)));
  return { grid: after, fuelAge: ageAfter };
}

// RULE 13: Each shrub/tree cell that goes 500 steps without burning becomes heavy
// fuel. Fire burning in heavy fuel has a 1 in 4 chance of going out instead of the
// normal chance. Fire spreading from or into heavy fuel catches 4 in 5 times
// instead of the normal chance. When the viewer puts out a fire, the cell's fuel
// does not reset. Only natural burning resets fuel.
// (This works out a cell's new clock from what it was ("was") and what it is now.
// The heavy-fuel chances are used in rules 9 and 10 above.)
function nextFuelAge(was, now, age, climate) {
  const isPlant = (type) => type === SHRUB || type === TREE;
  // Still a shrub or tree: one more step without burning. (A shrub that became
  // a tree keeps counting.) Just became a shrub from grass: start from 0.
  // RULE 14: Climate changes how much the clock adds each step (normal adds 1).
  if (isPlant(now)) return isPlant(was) ? age + climate.FUEL_BUILDUP : 0;
  // On fire: the clock pauses. If the viewer puts the fire out (rule 12), the
  // cell goes back to being a plant with this same count.
  if (now === SHRUB_FIRE || now === TREE_FIRE) return age;
  // Anything else (grass, bare ground, grass fire, or burned ground after a fire
  // went out on its own): no fuel, so the clock is 0.
  return 0;
}

// RULE 12: Firefighting. While the animation is playing, the viewer can drag a
// brush across the grid to put out fires. Each fire cell put out goes back to what
// it was before it caught fire (grass, shrub, or tree) and uses 1 water from a tank.
// The tank holds 50 water and refills 1 water every 2 steps.
// (This happens right away, between steps, not inside runStep. The fuel clock
// (rule 13) is left alone, so put-out cells keep their fuel. If the brush covers
// more fire than there's water for, the fires closest to the middle go out first.
// The mouse handling and the "only while playing" check are in main.js.)
const PLANT_BEFORE_FIRE = { [GRASS_FIRE]: GRASS, [SHRUB_FIRE]: SHRUB, [TREE_FIRE]: TREE };

// Puts out fires in the brush square centered on (row, col), using at most
// `water`. Changes the grid directly. Returns how much water was used.
function putOutFires(grid, row, col, water) {
  const low = -Math.floor((SETTINGS.BRUSH_SIZE - 1) / 2);
  const high = Math.floor(SETTINGS.BRUSH_SIZE / 2);
  const fires = [];
  for (let dRow = low; dRow <= high; dRow++) {
    for (let dCol = low; dCol <= high; dCol++) {
      const spot = neighborAt(grid, row, col, dRow, dCol);
      if (spot && isFire(grid[spot[0]][spot[1]])) {
        fires.push({ spot, distance: dRow * dRow + dCol * dCol });
      }
    }
  }
  fires.sort((a, b) => a.distance - b.distance);
  const used = Math.min(water, fires.length);
  for (const { spot: [r, c] } of fires.slice(0, used)) {
    grid[r][c] = PLANT_BEFORE_FIRE[grid[r][c]];
  }
  return used;
}

// The tank gains 1 water each time WATER_REFILL_EVERY_STEPS steps pass, up to full.
function refillWater(water, stepCount) {
  if (stepCount % SETTINGS.WATER_REFILL_EVERY_STEPS !== 0) return water;
  return Math.min(water + 1, SETTINGS.WATER_TANK_SIZE);
}
