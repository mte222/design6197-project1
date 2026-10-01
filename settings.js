// SETTINGS
// All adjustable values live here. Change a number, save, and refresh the page.

const SETTINGS = {
  // Grid size: number of cells across and down. Use an odd number so there is a true center cell.
  GRID_SIZE: 81,

  // How many pixels wide each cell is drawn on screen.
  CELL_SIZE: 8,

  // CHANCES, written as "1 in N". For example, 2 means a 1 in 2 chance.
  GRASS_SPREAD_ONE_IN: 2,     // Rule 2
  SHRUB_EMERGE_ONE_IN: 100,   // Rule 3

  // SPREADING MODES, one per spreading rule. Choose one:
  //   "each neighbor" - every one of the 8 neighbors gets its own roll.
  //   "one neighbor"  - pick one of the 8 directions at random and roll once.
  //                     If it points off the edge of the grid, nothing happens.
  GRASS_SPREAD_MODE: "one neighbor", // Rule 2

  // Colors for each cell type.
  COLORS: {
    BARE: "#d8c3a0",  // tan
    GRASS: "#a6d96a", // light green
    SHRUB: "#4f9a3a", // medium green
    TREE: "#1f5226",  // dark green
  },
};
