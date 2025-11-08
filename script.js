const figureButtons = document.querySelectorAll(".figure-button");
const controlsContainer = document.getElementById("controls");
const resultsContainer = document.getElementById("results");
const diagramContainer = document.getElementById("diagram");

const formatNumber = (value) => {
  const numericValue = Number.parseFloat(value);
  if (Number.isNaN(numericValue)) {
    return "-";
  }
  return numericValue.toFixed(2).replace(".", ",");
};
const formatInput = (value) => {
  const numericValue = Number.parseFloat(value);
  if (Number.isNaN(numericValue)) {
    return "-";
  }
  const isWhole = Number.isInteger(numericValue);
  return numericValue.toLocaleString("de-DE", {
    minimumFractionDigits: isWhole ? 0 : 1,
    maximumFractionDigits: 2,
  });
};

const figures = {
  rectangle: {
    name: "Rechteck",
    parameters: [
      { key: "width", label: "Breite a", min: 1, max: 20, step: 0.5, unit: "cm", default: 6 },
      { key: "height", label: "Höhe b", min: 1, max: 20, step: 0.5, unit: "cm", default: 4 },
    ],
    compute: ({ width, height }) => {
      const area = width * height;
      const perimeter = 2 * (width + height);
      return {
        area,
        perimeter,
        steps: [
          `A = a · b = ${formatInput(width)} · ${formatInput(height)} = ${formatNumber(area)} cm²`,
          `U = 2 · (a + b) = 2 · (${formatInput(width)} + ${formatInput(height)}) = ${formatNumber(perimeter)} cm`,
        ],
      };
    },
    diagram: ({ width, height }) => {
      const availableWidth = 160;
      const availableHeight = 120;
      const scale = Math.min(availableWidth / width, availableHeight / height);
      const drawWidth = width * scale;
      const drawHeight = height * scale;
      return `
        <svg viewBox="0 0 240 180" role="img" aria-label="Rechteck mit Seiten a und b">
          <rect x="40" y="40" width="${drawWidth}" height="${drawHeight}" rx="8" ry="8" fill="#dbeafe" stroke="#2563eb" stroke-width="3" />
          <text x="${40 + drawWidth / 2}" y="${32}" text-anchor="middle">a = ${formatInput(width)} cm</text>
          <text x="${40 + drawWidth + 12}" y="${40 + drawHeight / 2}" transform="rotate(90 ${40 + drawWidth + 12}, ${40 + drawHeight / 2})" text-anchor="middle">b = ${formatInput(height)} cm</text>
        </svg>
      `;
    },
  },
  triangle: {
    name: "Rechtwinkliges Dreieck",
    parameters: [
      { key: "base", label: "Grundseite a", min: 1, max: 20, step: 0.5, unit: "cm", default: 6 },
      { key: "height", label: "Höhe h", min: 1, max: 20, step: 0.5, unit: "cm", default: 3 },
    ],
    compute: ({ base, height }) => {
      const hypotenuse = Math.hypot(base, height);
      const area = (base * height) / 2;
      const perimeter = base + height + hypotenuse;
      return {
        area,
        perimeter,
        hypotenuse,
        steps: [
          `c = √(a² + h²) = √(${formatInput(base)}² + ${formatInput(height)}²) = ${formatNumber(hypotenuse)} cm`,
          `A = (a · h) / 2 = (${formatInput(base)} · ${formatInput(height)}) / 2 = ${formatNumber(area)} cm²`,
          `U = a + h + c = ${formatInput(base)} + ${formatInput(height)} + ${formatNumber(hypotenuse)} = ${formatNumber(perimeter)} cm`,
        ],
      };
    },
    diagram: ({ base, height }) => {
      const maxWidth = 160;
      const maxHeight = 120;
      const scale = Math.min(maxWidth / base, maxHeight / height);
      const baseLength = base * scale;
      const heightLength = height * scale;
      const points = `40 ${40 + heightLength} ${40 + baseLength} ${40 + heightLength} 40 40`;
      return `
        <svg viewBox="0 0 260 220" role="img" aria-label="Rechtwinkliges Dreieck mit Grundseite a und Höhe h">
          <polygon points="${points}" fill="#fee2e2" stroke="#dc2626" stroke-width="3" />
          <polyline points="40 ${40 + heightLength - 20} 60 ${40 + heightLength - 20} 60 ${40 + heightLength}"
            fill="none" stroke="#b91c1c" stroke-width="3" />
          <text x="${40 + baseLength / 2}" y="${40 + heightLength + 24}" text-anchor="middle">a = ${formatInput(base)} cm</text>
          <text x="${24}" y="${40 + heightLength / 2}" transform="rotate(-90 24, ${40 + heightLength / 2})" text-anchor="middle">h = ${formatInput(height)} cm</text>
        </svg>
      `;
    },
  },
  circle: {
    name: "Kreis",
    parameters: [
      { key: "radius", label: "Radius r", min: 1, max: 15, step: 0.5, unit: "cm", default: 5 },
    ],
    compute: ({ radius }) => {
      const area = Math.PI * radius ** 2;
      const circumference = 2 * Math.PI * radius;
      return {
        area,
        perimeter: circumference,
        steps: [
          `A = π · r² = π · ${formatInput(radius)}² = ${formatNumber(area)} cm²`,
          `U = 2 · π · r = 2 · π · ${formatInput(radius)} = ${formatNumber(circumference)} cm`,
        ],
      };
    },
    diagram: ({ radius }) => {
      const scale = Math.min(90 / radius, 18);
      const scaledRadius = radius * scale;
      return `
        <svg viewBox="0 0 240 240" role="img" aria-label="Kreis mit Radius r">
          <circle cx="120" cy="120" r="${scaledRadius}" fill="#dcfce7" stroke="#16a34a" stroke-width="3" />
          <line x1="120" y1="120" x2="${120 + scaledRadius}" y2="120" stroke="#15803d" stroke-width="3" />
          <text x="${120 + scaledRadius / 2}" y="108" text-anchor="middle">r = ${formatInput(radius)} cm</text>
        </svg>
      `;
    },
  },
};

let activeFigureKey = "rectangle";
const state = {};

function getParameterConfig(key) {
  const { parameters } = figures[activeFigureKey];
  return parameters.find((parameter) => parameter.key === key);
}

function createControl(parameter) {
  const wrapper = document.createElement("label");
  wrapper.className = "control";
  wrapper.innerHTML = `
    <span>${parameter.label}</span>
    <div class="input-group">
      <input type="range" min="${parameter.min}" max="${parameter.max}" step="${parameter.step}" value="${parameter.default}" data-key="${parameter.key}" />
      <input type="number" min="${parameter.min}" max="${parameter.max}" step="${parameter.step}" value="${parameter.default}" data-key="${parameter.key}" aria-label="${parameter.label}" />
      <span class="unit">${parameter.unit}</span>
    </div>
  `;
  return wrapper;
}

function syncInputValues(key, value) {
  const inputs = controlsContainer.querySelectorAll(`[data-key="${key}"]`);
  inputs.forEach((input) => {
    input.value = value;
  });
  state[key] = Number.parseFloat(value);
}

function renderControls() {
  controlsContainer.innerHTML = "";
  Object.keys(state).forEach((key) => {
    delete state[key];
  });
  const { parameters } = figures[activeFigureKey];
  parameters.forEach((parameter) => {
    const control = createControl(parameter);
    controlsContainer.appendChild(control);
    state[parameter.key] = parameter.default;
  });
}

function renderDiagramAndResults() {
  const figure = figures[activeFigureKey];
  const computation = figure.compute(state);

  diagramContainer.innerHTML = figure.diagram(state);

  resultsContainer.innerHTML = `
    <h2>${figure.name}</h2>
    <ul class="formula-list">
      ${computation.steps.map((step) => `<li>${step}</li>`).join("")}
    </ul>
    <div class="totals">
      <p><strong>Fläche:</strong> ${formatNumber(computation.area)} cm²</p>
      <p><strong>Umfang:</strong> ${formatNumber(computation.perimeter)} cm</p>
    </div>
  `;
}

function handleInputChange(event) {
  const { key } = event.target.dataset;
  if (!key) return;

  const rawValue = Number.parseFloat(event.target.value);
  const parameter = getParameterConfig(key);
  if (!parameter) return;

  const validValue = Number.isNaN(rawValue)
    ? parameter.min
    : Math.min(parameter.max, Math.max(parameter.min, rawValue));

  syncInputValues(key, validValue);
  renderDiagramAndResults();
}

function handleFigureChange(event) {
  const button = event.currentTarget;
  activeFigureKey = button.dataset.figure;
  figureButtons.forEach((btn) => btn.classList.toggle("active", btn === button));
  renderControls();
  renderDiagramAndResults();
}

figureButtons.forEach((button) => {
  button.addEventListener("click", handleFigureChange);
});

controlsContainer.addEventListener("input", handleInputChange);

renderControls();
renderDiagramAndResults();
