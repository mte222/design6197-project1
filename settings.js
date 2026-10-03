// SETTINGS
// All adjustable values live here. Change a number, save, and refresh the page.

const SETTINGS = {
  // Grid size: number of cells across and down. Use an odd number so there is a true center cell.
  GRID_SIZE: 81,

  // How many pixels wide each cell is drawn on screen.
  CELL_SIZE: 8,

  // WRAP-AROUND EDGES: true or false.
  //   true  - the left edge connects to the right and the top to the bottom,
  //           so every cell has exactly 8 neighbors.
  //   false - plants and fire stop at the edge (the original edge choices).
  WRAP_EDGES: true,

  // FIREFIGHTING (Rule 12): true or false.
  //   true  - while playing, drag on the grid to put out fires.
  //   false - the brush does nothing and the water readout is hidden.
  FIREFIGHTING: true,
  BRUSH_SIZE: 5,               // Rule 12: brush is a square this many cells across
  WATER_TANK_SIZE: 100,         // Rule 12: most water the tank can hold (1 water = 1 fire cell)
  WATER_REFILL_EVERY_STEPS: 2, // Rule 12: the tank gains 1 water each time this many steps pass

  // CHANCES, written as "1 in N". For example, 2 means a 1 in 2 chance.
  GRASS_SPREAD_ONE_IN: 5,     // Rule 2
  GRASS_FROM_SHRUB_TREE_ONE_IN: 10, // Rule 3
  SHRUB_EMERGE_ONE_IN: 5000,   // Rule 4
  SHRUB_SPREAD_ONE_IN: 60,     // Rule 5
  TREE_EMERGE_ONE_IN: 1000,    // Rule 6
  TREE_SPREAD_ONE_IN: 100,      // Rule 7
  FIRE_IGNITE_ONE_IN: 50000,   // Rule 8 (chance per shrub/tree neighbor)
  FIRE_EXTINGUISH_ONE_IN: 2,   // Rule 9 (going out; separate roll from spreading)
  FIRE_SPREAD_ONE_IN: 2,       // Rule 9 (spreading; separate roll from going out)
  FIRE_GRASS_CATCH_ONE_IN: 3,  // Rule 9 (spreading into grass; used instead of FIRE_SPREAD_ONE_IN)
  BURNED_TO_BARE_ONE_IN: 50,   // Rule 11

  // FUEL BUILDUP (Rule 13)
  HEAVY_FUEL_AFTER_STEPS: 500,     // Rule 13: steps without burning before a shrub/tree is heavy fuel
  HEAVY_FUEL_EXTINGUISH_ONE_IN: 3, // Rule 13: going out, for fire burning in heavy fuel (used instead of FIRE_EXTINGUISH_ONE_IN)
  HEAVY_FUEL_SPREAD_ONE_IN: 1.5,  // Rule 13: spreading from or into heavy fuel (used instead of the normal chance)

  // SPREADING MODES, one per spreading rule. Choose one:
  //   "each neighbor" - every one of the 8 neighbors gets its own roll.
  //   "one neighbor"  - pick one of the 8 directions at random and roll once.
  //                     If it points off the edge of the grid, nothing happens.
  GRASS_SPREAD_MODE: "one neighbor", // Rule 2
  GRASS_FROM_SHRUB_TREE_MODE: "one neighbor", // Rule 3
  SHRUB_SPREAD_MODE: "one neighbor", // Rule 5
  TREE_SPREAD_MODE: "one neighbor",  // Rule 7
  // Fire in "one neighbor" mode picks only from shrub/tree neighbors, plus any
  // off-grid directions (which do nothing). See CLAUDE.md "Fire decisions".
  FIRE_SPREAD_MODE: "one neighbor",  // Rule 9

  // Colors for each cell type.
  COLORS: {
    BARE: "#d8c3a0",  // tan
    GRASS: "#a6d96a", // light green
    SHRUB: "#4f9a3a", // medium green
    TREE: "#1f5226",  // dark green
    FIRE: "#ff5a1f",  // bright orange-red
    BURNED: "#3a3532", // charcoal
  },
};
