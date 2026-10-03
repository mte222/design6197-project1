// STATS
// Measurement tools: fire size tracking and the history graph (see "Measurement
// tools" in CLAUDE.md). These only watch the map. They never change it, and no
// rule depends on them.

// FIRE SIZE TRACKING
// Every separate fire gets an id number. The tracker keeps a grid saying which fire
// each burning cell belongs to (0 = not burning), and for each fire, the set of
// cells it has burned. When two fires touch, one id is joined into the other.
function createFireTracker(size) {
  return {
    labels: emptyLabels(size), // which fire each burning cell belongs to
    nextId: 1,
    joinedInto: new Map(),     // fire id -> the id it was joined into (itself if not joined)
    burnedCells: new Map(),    // fire id -> set of cells it burned (only for fires still burning)
    fires: 0,                  // fires that are completely out
    totalBurned: 0,            // cells burned by those fires, added up
    biggest: 0,                // cells burned by the biggest of those fires
  };
}

function emptyLabels(size) {
  return Array.from({ length: size }, () => new Array(size).fill(0));
}

// The id a fire ended up as, after any merges.
function currentId(tracker, id) {
  while (tracker.joinedInto.get(id) !== id) id = tracker.joinedInto.get(id);
  return id;
}

function startFire(tracker) {
  const id = tracker.nextId++;
  tracker.joinedInto.set(id, id);
  tracker.burnedCells.set(id, new Set());
  return id;
}

// Two fires touched: they become one fire, with their burned cells added together.
function joinFires(tracker, a, b) {
  a = currentId(tracker, a);
  b = currentId(tracker, b);
  if (a === b) return a;
  const [keep, gone] = tracker.burnedCells.get(a).size >= tracker.burnedCells.get(b).size ? [a, b] : [b, a];
  for (const cell of tracker.burnedCells.get(gone)) tracker.burnedCells.get(keep).add(cell);
  tracker.burnedCells.delete(gone);
  tracker.joinedInto.set(gone, keep);
  return keep;
}

// Call right after the rules run (before firefighters), so it sees every cell
// that caught fire this step, even ones a firefighter is about to put out.
function trackFiresCaught(tracker, grid) {
  const size = grid.length;
  const labels = emptyLabels(size);
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!isFire(grid[row][col])) continue;
      // Still burning from last step: same fire as before.
      let id = tracker.labels[row][col] ? currentId(tracker, tracker.labels[row][col]) : 0;
      // Just caught: joins any fire that was burning next to it last step.
      if (!id) {
        for (const [dRow, dCol] of NEIGHBOR_DIRECTIONS) {
          const spot = neighborAt(grid, row, col, dRow, dCol);
          if (!spot || !tracker.labels[spot[0]][spot[1]]) continue;
          const neighborFire = tracker.labels[spot[0]][spot[1]];
          id = id ? joinFires(tracker, id, neighborFire) : currentId(tracker, neighborFire);
        }
      }
      // No burning neighbor: a new fire.
      if (!id) id = startFire(tracker);
      tracker.burnedCells.get(id).add(row * size + col);
      labels[row][col] = id;
    }
  }
  // Burning cells that touch each other are the same fire.
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!labels[row][col]) continue;
      for (const [dRow, dCol] of NEIGHBOR_DIRECTIONS) {
        const spot = neighborAt(grid, row, col, dRow, dCol);
        if (spot && labels[spot[0]][spot[1]]) joinFires(tracker, labels[row][col], labels[spot[0]][spot[1]]);
      }
    }
  }
  tracker.labels = labels;
}

// Call at the end of each step (after firefighters). Forgets cells that are no
// longer burning, and counts any fire with no burning cells left as finished.
function trackFiresOut(tracker, grid) {
  const stillBurning = new Set();
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid.length; col++) {
      if (!tracker.labels[row][col]) continue;
      if (isFire(grid[row][col])) stillBurning.add(currentId(tracker, tracker.labels[row][col]));
      else tracker.labels[row][col] = 0;
    }
  }
  for (const [id, cells] of tracker.burnedCells) {
    if (stillBurning.has(id)) continue;
    tracker.fires++;
    tracker.totalBurned += cells.size;
    tracker.biggest = Math.max(tracker.biggest, cells.size);
    tracker.burnedCells.delete(id);
  }
}

// HISTORY GRAPH
// One entry per step since Reset: { tree, heavyFuel }, each a percentage of the map.
// The chart always shows the whole run, squeezing older history as the run grows.
const HISTORY_LINES = [
  { key: "tree", color: "#2f7d3a" },      // green
  { key: "heavyFuel", color: "#8a55d6" }, // purple
];

function drawHistoryChart(chartCanvas, history) {
  // Draw at the screen's full sharpness (e.g. 2x on high-resolution screens).
  const width = chartCanvas.clientWidth;
  const height = chartCanvas.clientHeight;
  const scale = window.devicePixelRatio || 1;
  if (chartCanvas.width !== width * scale) {
    chartCanvas.width = width * scale;
    chartCanvas.height = height * scale;
  }
  const g = chartCanvas.getContext("2d");
  g.setTransform(scale, 0, 0, scale, 0, 0);
  g.clearRect(0, 0, width, height);

  const left = 38, right = 10, top = 8, bottom = 22;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  // The scale goes from 0% up to the highest value so far, rounded up to a
  // multiple of 10% (at least 10%), so small numbers like heavy fuel stay readable.
  let highest = 0;
  for (const entry of history) highest = Math.max(highest, entry.tree, entry.heavyFuel);
  const yMax = Math.min(100, Math.max(10, Math.ceil(highest / 10) * 10));
  const yFor = (percent) => top + plotHeight * (1 - percent / yMax);

  // Gridlines and the % labels on the left.
  g.font = "11px system-ui, sans-serif";
  g.fillStyle = "#666";
  g.strokeStyle = "#ddd8cc";
  g.lineWidth = 1;
  g.textAlign = "right";
  g.textBaseline = "middle";
  for (let i = 0; i <= 4; i++) {
    const percent = yMax * i / 4;
    const y = Math.round(yFor(percent)) + 0.5;
    g.beginPath();
    g.moveTo(left, y);
    g.lineTo(left + plotWidth, y);
    g.stroke();
    g.fillText(Number.isInteger(percent) ? percent + "%" : percent.toFixed(1) + "%", left - 6, y);
  }

  // Step labels along the bottom: 0 on the left, the current step on the right.
  const lastStep = Math.max(history.length - 1, 0);
  g.textBaseline = "top";
  g.textAlign = "left";
  g.fillText("0", left, top + plotHeight + 6);
  g.textAlign = "right";
  g.fillText("step " + lastStep, left + plotWidth, top + plotHeight + 6);

  if (history.length < 2) return;

  // The lines. With more steps than pixels, each pixel column shows one step.
  const points = Math.min(history.length, Math.floor(plotWidth) + 1);
  g.lineWidth = 2;
  g.lineJoin = "round";
  for (const { key, color } of HISTORY_LINES) {
    g.strokeStyle = color;
    g.beginPath();
    for (let i = 0; i < points; i++) {
      const step = Math.round(i / (points - 1) * lastStep);
      const x = left + plotWidth * step / lastStep;
      const y = yFor(history[step][key]);
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  }
}
