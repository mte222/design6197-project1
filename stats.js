// STATS
// Measurement tool: the history graph (see "Measurement tools" in CLAUDE.md).
// It only watches the map. It never changes it, and no rule depends on it.

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
