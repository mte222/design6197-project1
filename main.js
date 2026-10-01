// MAIN
// Draws the grid on the canvas. (Controls will be added here later.)

const canvas = document.getElementById("grid");
const ctx = canvas.getContext("2d");

const COLOR_FOR_TYPE = {
  [BARE]: SETTINGS.COLORS.BARE,
  [GRASS]: SETTINGS.COLORS.GRASS,
  [SHRUB]: SETTINGS.COLORS.SHRUB,
  [TREE]: SETTINGS.COLORS.TREE,
};

let grid = createStartingGrid(SETTINGS.GRID_SIZE);

canvas.width = SETTINGS.GRID_SIZE * SETTINGS.CELL_SIZE;
canvas.height = SETTINGS.GRID_SIZE * SETTINGS.CELL_SIZE;

function drawGrid() {
  const size = SETTINGS.CELL_SIZE;
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      ctx.fillStyle = COLOR_FOR_TYPE[grid[row][col]];
      ctx.fillRect(col * size, row * size, size, size);
    }
  }
}

drawGrid();
