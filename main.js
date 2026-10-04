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
const firefightingButton = document.getElementById("firefighting");
const historyChart = document.getElementById("history-chart");
const historyTree = document.getElementById("history-tree");
const historyHeavy = document.getElementById("history-heavy");

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
let firefightingOn = false; // Rule 12: the Firefighting button starts off
let firefighters = [];      // Rule 12: empty while the button is off
let history = [];        // Measurement: tree and heavy fuel % for every step since Reset
let latestPercents = {}; // Measurement: tree and heavy fuel % on the map right now

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
  // Rule 12: firefighters are drawn on top of the cells.
  ctx.fillStyle = SETTINGS.COLORS.FIREFIGHTER;
  for (const { row, col } of firefighters) {
    ctx.fillRect(col * size, row * size, size, size);
  }
  stepCounter.textContent = stepCount;
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
  latestPercents = { tree: (counts[TREE] || 0) / total * 100, heavyFuel: heavyFuel / total * 100 };
}

// Measurement: adds this step's tree and heavy fuel % to the history and redraws the graph.
function recordHistory() {
  history.push(latestPercents);
  historyTree.textContent = latestPercents.tree.toFixed(1) + "%";
  historyHeavy.textContent = latestPercents.heavyFuel.toFixed(1) + "%";
  drawHistoryChart(historyChart, history);
}

function stepForward() {
  ({ grid, fuelAge } = runStep(grid, fuelAge));
  runFirefighters(grid, firefighters); // Rule 12: after all the other rules
  stepCount++;
  drawGrid();
  recordHistory();
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
  history = [];
  setFirefighting(false); // Rule 12: Reset turns firefighting off
  drawGrid();
  recordHistory();
});

speedSlider.addEventListener("input", () => {
  speedLabel.textContent = speedSlider.value;
});

// FIREFIGHTING BUTTON (Rule 12)
// On: a new crew appears on the edges of the grid. Off: the crew is removed.
// The firefighters themselves (runFirefighters) are in rules.js.
function setFirefighting(on) {
  firefightingOn = on;
  firefighters = on ? createFirefighters(SETTINGS.GRID_SIZE) : [];
  firefightingButton.setAttribute("aria-pressed", on);
}

firefightingButton.addEventListener("click", () => {
  setFirefighting(!firefightingOn);
  drawGrid();
});

drawGrid();
recordHistory();

// Measurement: redraw the graph to fit when the window is resized.
window.addEventListener("resize", () => drawHistoryChart(historyChart, history));
