// MAIN
// Draws the grid on the canvas and runs the controls.

const canvas = document.getElementById("grid");
const ctx = canvas.getContext("2d");
const playButton = document.getElementById("play");
const stepButton = document.getElementById("step");
const resetButton = document.getElementById("reset");
const speedSlider = document.getElementById("speed");
const speedLabel = document.getElementById("speed-label");
const stepCounter = document.getElementById("step-count");

const COLOR_FOR_TYPE = {
  [BARE]: SETTINGS.COLORS.BARE,
  [GRASS]: SETTINGS.COLORS.GRASS,
  [SHRUB]: SETTINGS.COLORS.SHRUB,
  [TREE]: SETTINGS.COLORS.TREE,
};

let grid = createStartingGrid(SETTINGS.GRID_SIZE);
let stepCount = 0;
let playing = false;
let timer = null;

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
  stepCounter.textContent = stepCount;
}

function stepForward() {
  grid = runStep(grid);
  stepCount++;
  drawGrid();
}

// While playing, take one step, then wait based on the speed slider, then repeat.
function tick() {
  stepForward();
  timer = setTimeout(tick, 1000 / Number(speedSlider.value));
}

function setPlaying(shouldPlay) {
  playing = shouldPlay;
  playButton.textContent = playing ? "Pause" : "Play";
  clearTimeout(timer);
  if (playing) tick();
}

playButton.addEventListener("click", () => setPlaying(!playing));

stepButton.addEventListener("click", () => {
  setPlaying(false);
  stepForward();
});

resetButton.addEventListener("click", () => {
  setPlaying(false);
  grid = createStartingGrid(SETTINGS.GRID_SIZE);
  stepCount = 0;
  drawGrid();
});

speedSlider.addEventListener("input", () => {
  speedLabel.textContent = speedSlider.value;
});

drawGrid();
