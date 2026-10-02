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
const waterDisplay = document.getElementById("water-display");
const waterAmount = document.getElementById("water");

const COLOR_FOR_TYPE = {
  [BARE]: SETTINGS.COLORS.BARE,
  [GRASS]: SETTINGS.COLORS.GRASS,
  [SHRUB]: SETTINGS.COLORS.SHRUB,
  [TREE]: SETTINGS.COLORS.TREE,
  [SHRUB_FIRE]: SETTINGS.COLORS.FIRE, // all kinds of fire look the same
  [GRASS_FIRE]: SETTINGS.COLORS.FIRE,
  [TREE_FIRE]: SETTINGS.COLORS.FIRE,
  [BURNED]: SETTINGS.COLORS.BURNED,
};

// Names for the percentage readout, in the order shown. Each entry lists the
// cell types it adds up (all kinds of fire count together as "Fire").
const READOUT_LABELS = [
  [[BARE], "Bare"],
  [[GRASS], "Grass"],
  [[SHRUB], "Shrub"],
  [[TREE], "Tree"],
  [FIRE_TYPES, "Fire"],
  [[BURNED], "Burned"],
];

let grid = createStartingGrid(SETTINGS.GRID_SIZE);
let fuelAge = createStartingFuelAge(SETTINGS.GRID_SIZE); // Rule 13
let stepCount = 0;
let playing = false;
let timer = null;
let water = SETTINGS.WATER_TANK_SIZE; // Rule 12: the tank starts full

canvas.width = SETTINGS.GRID_SIZE * SETTINGS.CELL_SIZE;
canvas.height = SETTINGS.GRID_SIZE * SETTINGS.CELL_SIZE;

function drawGrid() {
  const size = SETTINGS.CELL_SIZE;
  const counts = {};
  let heavyFuel = 0;
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const type = grid[row][col];
      counts[type] = (counts[type] || 0) + 1;
      if ((type === SHRUB || type === TREE) && isHeavyFuel(type, fuelAge[row][col])) heavyFuel++;
      ctx.fillStyle = COLOR_FOR_TYPE[type];
      ctx.fillRect(col * size, row * size, size, size);
    }
  }
  stepCounter.textContent = stepCount;
  waterAmount.textContent = water;
  updateReadout(counts, heavyFuel);
}

// Shows what percentage of the map each cell type covers, plus how much of the
// map is heavy-fuel shrubs/trees (rule 13; these are also counted in Shrub and Tree).
function updateReadout(counts, heavyFuel) {
  const total = grid.length * grid[0].length;
  const entries = READOUT_LABELS.map(([types, name]) => {
    const count = types.reduce((sum, type) => sum + (counts[type] || 0), 0);
    const percent = (count / total * 100).toFixed(1);
    return `<span><span class="swatch" style="background:${COLOR_FOR_TYPE[types[0]]}"></span>${name} ${percent}%</span>`;
  });
  entries.push(`<span>Heavy fuel ${(heavyFuel / total * 100).toFixed(1)}%</span>`);
  readout.innerHTML = entries.join("");
}

function stepForward() {
  ({ grid, fuelAge } = runStep(grid, fuelAge));
  stepCount++;
  water = refillWater(water, stepCount);
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
  fuelAge = createStartingFuelAge(SETTINGS.GRID_SIZE);
  stepCount = 0;
  water = SETTINGS.WATER_TANK_SIZE;
  drawGrid();
});

speedSlider.addEventListener("input", () => {
  speedLabel.textContent = speedSlider.value;
});

// FIREFIGHTING BRUSH (Rule 12)
// Hold the mouse button and drag across the grid to put out fires. Only works
// while playing. The rule itself (putOutFires) is in rules.js.
let brushing = false;
let lastBrushCell = null;

// Which grid cell is under the mouse, as [row, col]. Accounts for the canvas
// being shrunk to fit a small window.
function cellUnderMouse(event) {
  const box = canvas.getBoundingClientRect();
  const col = Math.floor((event.clientX - box.left) / box.width * SETTINGS.GRID_SIZE);
  const row = Math.floor((event.clientY - box.top) / box.height * SETTINGS.GRID_SIZE);
  return [
    Math.min(Math.max(row, 0), SETTINGS.GRID_SIZE - 1),
    Math.min(Math.max(col, 0), SETTINGS.GRID_SIZE - 1),
  ];
}

// Brushes every cell along the line from the last mouse position to this one,
// so a fast drag doesn't skip over cells between mouse updates.
function brushTo(cell) {
  const [fromRow, fromCol] = lastBrushCell || cell;
  const [toRow, toCol] = cell;
  const steps = Math.max(Math.abs(toRow - fromRow), Math.abs(toCol - fromCol), 1);
  for (let i = 1; i <= steps && water > 0; i++) {
    const row = Math.round(fromRow + (toRow - fromRow) * i / steps);
    const col = Math.round(fromCol + (toCol - fromCol) * i / steps);
    water -= putOutFires(grid, row, col, water);
  }
  lastBrushCell = cell;
  drawGrid();
}

if (SETTINGS.FIREFIGHTING) {
  canvas.style.cursor = "crosshair";

  canvas.addEventListener("pointerdown", (event) => {
    brushing = true;
    lastBrushCell = null;
    canvas.setPointerCapture(event.pointerId);
    if (playing) brushTo(cellUnderMouse(event));
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!brushing) return;
    if (!playing) { lastBrushCell = null; return; }
    brushTo(cellUnderMouse(event));
  });

  const stopBrushing = () => { brushing = false; lastBrushCell = null; };
  canvas.addEventListener("pointerup", stopBrushing);
  canvas.addEventListener("pointercancel", stopBrushing);

  document.getElementById("water-max").textContent = SETTINGS.WATER_TANK_SIZE;
} else {
  waterDisplay.hidden = true;
}

drawGrid();
