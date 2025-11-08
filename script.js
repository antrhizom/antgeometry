const canvas = document.getElementById("geometry-canvas");
const ctx = canvas.getContext("2d");
const statusText = document.getElementById("status-text");
const pointList = document.getElementById("point-list");
const segmentList = document.getElementById("segment-list");
const pointModeBtn = document.getElementById("point-mode");
const segmentModeBtn = document.getElementById("segment-mode");
const clearBtn = document.getElementById("clear-canvas");

const GRID_SIZE = 50;

const state = {
  mode: "point",
  points: [],
  segments: [],
  selectedPointIndex: null,
  pointCounter: 0,
};

const labelSequence = (() => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  return () => {
    const n = state.pointCounter++;
    const baseIndex = n % letters.length;
    const cycle = Math.floor(n / letters.length);
    return cycle === 0 ? letters[baseIndex] : `${letters[baseIndex]}${cycle}`;
  };
})();

function setMode(mode) {
  state.mode = mode;
  state.selectedPointIndex = null;
  pointModeBtn.classList.toggle("active", mode === "point");
  segmentModeBtn.classList.toggle("active", mode === "segment");
  updateStatus(mode === "point" ? "Modus: Punkt setzen" : "Modus: Strecke messen");
  drawScene();
}

function updateStatus(message) {
  statusText.textContent = message;
}

function canvasToMath(x, y) {
  const centeredX = x - canvas.width / 2;
  const centeredY = canvas.height / 2 - y;
  return {
    x: +(centeredX / GRID_SIZE).toFixed(1),
    y: +(centeredY / GRID_SIZE).toFixed(1),
  };
}

function addPoint(x, y) {
  const math = canvasToMath(x, y);
  const label = labelSequence();
  state.points.push({ x, y, label, math });
  updateStatus(`Punkt ${label} bei (${math.x}; ${math.y}) gesetzt.`);
  updatePointList();
  drawScene();
}

function findPointNear(x, y, radius = 14) {
  for (let i = 0; i < state.points.length; i += 1) {
    const point = state.points[i];
    const dx = point.x - x;
    const dy = point.y - y;
    if (Math.sqrt(dx * dx + dy * dy) <= radius) {
      return i;
    }
  }
  return null;
}

function addSegment(startIndex, endIndex) {
  if (startIndex === endIndex) {
    updateStatus("Wähle zwei verschiedene Punkte.");
    return;
  }

  const start = state.points[startIndex];
  const end = state.points[endIndex];
  const dx = end.math.x - start.math.x;
  const dy = end.math.y - start.math.y;
  const length = Math.hypot(dx, dy);

  state.segments.push({
    startIndex,
    endIndex,
    label: `${start.label}${end.label}`,
    length,
  });

  updateStatus(
    `Strecke ${start.label}${end.label} hat eine Länge von ${length.toFixed(2)} Einheiten.`
  );
  updateSegmentList();
  drawScene();
}

function handleCanvasClick(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  if (state.mode === "point") {
    addPoint(x, y);
    return;
  }

  const pointIndex = findPointNear(x, y);
  if (pointIndex === null) {
    updateStatus("Bitte wähle einen vorhandenen Punkt.");
    return;
  }

  if (state.selectedPointIndex === null) {
    state.selectedPointIndex = pointIndex;
    updateStatus(`Erster Punkt: ${state.points[pointIndex].label}. Wähle einen zweiten Punkt.`);
  } else {
    addSegment(state.selectedPointIndex, pointIndex);
    state.selectedPointIndex = null;
  }

  drawScene();
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawAxes();
  drawSegments();
  drawPoints();
}

function drawAxes() {
  ctx.save();
  ctx.strokeStyle = "rgba(37, 99, 235, 0.4)";
  ctx.lineWidth = 1.5;

  // y-axis
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();

  // x-axis
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();

  ctx.restore();
}

function drawPoints() {
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.font = "14px Inter, system-ui, sans-serif";

  state.points.forEach((point, index) => {
    const isSelected = index === state.selectedPointIndex;

    ctx.beginPath();
    ctx.fillStyle = isSelected ? "#1e3a8a" : "#2563eb";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.arc(point.x, point.y, isSelected ? 8 : 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.fillText(`${point.label} (${point.math.x}; ${point.math.y})`, point.x + 10, point.y - 8);
  });

  ctx.restore();
}

function drawSegments() {
  ctx.save();
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 2;

  state.segments.forEach((segment) => {
    const start = state.points[segment.startIndex];
    const end = state.points[segment.endIndex];

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Label in der Mitte der Strecke platzieren
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    ctx.save();
    ctx.fillStyle = "#1f2937";
    ctx.font = "14px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${segment.label} = ${segment.length.toFixed(2)}`, midX, midY - 10);
    ctx.restore();
  });

  ctx.restore();
}

function updatePointList() {
  if (!state.points.length) {
    pointList.innerHTML = "<li>Noch keine Punkte.</li>";
    return;
  }

  pointList.innerHTML = state.points
    .map(
      (point) =>
        `<li><strong>${point.label}</strong> = (${point.math.x}; ${point.math.y})</li>`
    )
    .join("");
}

function updateSegmentList() {
  if (!state.segments.length) {
    segmentList.innerHTML = "<li>Noch keine Strecken.</li>";
    return;
  }

  segmentList.innerHTML = state.segments
    .map((segment) => `<li><strong>${segment.label}</strong> = ${segment.length.toFixed(2)}</li>`)
    .join("");
}

function clearCanvas() {
  state.points = [];
  state.segments = [];
  state.pointCounter = 0;
  state.selectedPointIndex = null;
  updatePointList();
  updateSegmentList();
  updateStatus("Alles zurückgesetzt. Modus: Punkt setzen");
  drawScene();
}

canvas.addEventListener("click", handleCanvasClick);
pointModeBtn.addEventListener("click", () => setMode("point"));
segmentModeBtn.addEventListener("click", () => {
  if (state.points.length < 2) {
    updateStatus("Lege mindestens zwei Punkte an, um eine Strecke zu messen.");
    return;
  }
  setMode("segment");
});
clearBtn.addEventListener("click", clearCanvas);

updatePointList();
updateSegmentList();
drawScene();
