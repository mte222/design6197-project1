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
const readout = document.getElementById("readout");

const COLOR_FOR_TYPE = {
  [BARE]: SETTINGS.COLORS.BARE,
  [GRASS]: SETTINGS.COLORS.GRASS,
  [SHRUB]: SETTINGS.COLORS.SHRUB,
  [TREE]: SETTINGS.COLORS.TREE,
  [FIRE]: SETTINGS.COLORS.FIRE,
  [BURNED]: SETTINGS.COLORS.BURNED,
};

// Names for the percentage readout, in the order shown.
const READOUT_LABELS = [
  [BARE, "Bare"],
  [GRASS, "Grass"],
  [SHRUB, "Shrub"],
  [TREE, "Tree"],
  [FIRE, "Fire"],
  [BURNED, "Burned"],
];

let grid = createStartingGrid(SETTINGS.GRID_SIZE);
let stepCount = 0;
let playing = false;
let timer = null;

canvas.width = SETTINGS.GRID_SIZE * SETTINGS.CELL_SIZE;
canvas.height = SETTINGS.GRID_SIZE * SETTINGS.CELL_SIZE;

function drawGrid() {
  const size = SETTINGS.CELL_SIZE;
  const counts = {};
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const type = grid[row][col];
      counts[type] = (counts[type] || 0) + 1;
      ctx.fillStyle = COLOR_FOR_TYPE[type];
      ctx.fillRect(col * size, row * size, size, size);
    }
  }
  stepCounter.textContent = stepCount;
  updateReadout(counts);
}

// Shows what percentage of the map each cell type covers.
function updateReadout(counts) {
  const total = grid.length * grid[0].length;
  readout.innerHTML = READOUT_LABELS.map(([type, name]) => {
    const percent = ((counts[type] || 0) / total * 100).toFixed(1);
    return `<span><span class="swatch" style="background:${COLOR_FOR_TYPE[type]}"></span>${name} ${percent}%</span>`;
  }).join("");
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
