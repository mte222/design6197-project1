// SETTINGS
// All adjustable values live here. Change a number, save, and refresh the page.

const SETTINGS = {
  // Grid size: number of cells across and down. Use an odd number so there is a true center cell.
  GRID_SIZE: 81,

  // How many pixels wide each cell is drawn on screen.
  CELL_SIZE: 8,

  // CHANCES, written as "1 in N". For example, 2 means a 1 in 2 chance.
  GRASS_SPREAD_ONE_IN: 2,     // Rule 2
  SHRUB_EMERGE_ONE_IN: 1000,   // Rule 3
  SHRUB_SPREAD_ONE_IN: 6,     // Rule 4
  TREE_EMERGE_ONE_IN: 2000,    // Rule 5
  TREE_SPREAD_ONE_IN: 10,      // Rule 6
  FIRE_IGNITE_ONE_IN: 50000,   // Rule 7
  FIRE_EXTINGUISH_ONE_IN: 2,   // Rule 8 (going out; separate roll from spreading)
  FIRE_SPREAD_ONE_IN: 2,       // Rule 8 (spreading; separate roll from going out)

  // SPREADING MODES, one per spreading rule. Choose one:
  //   "each neighbor" - every one of the 8 neighbors gets its own roll.
  //   "one neighbor"  - pick one of the 8 directions at random and roll once.
  //                     If it points off the edge of the grid, nothing happens.
  GRASS_SPREAD_MODE: "one neighbor", // Rule 2
  SHRUB_SPREAD_MODE: "one neighbor", // Rule 4
  TREE_SPREAD_MODE: "one neighbor",  // Rule 6
  // Fire in "one neighbor" mode picks only from shrub/tree neighbors, plus any
  // off-grid directions (which do nothing). See CLAUDE.md "Fire decisions".
  FIRE_SPREAD_MODE: "one neighbor",  // Rule 8

  // Colors for each cell type.
  COLORS: {
    BARE: "#d8c3a0",  // tan
    GRASS: "#a6d96a", // light green
    SHRUB: "#4f9a3a", // medium green
    TREE: "#1f5226",  // dark green
    FIRE: "#ff5a1f",  // bright orange-red
  },
};
