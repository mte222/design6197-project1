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
