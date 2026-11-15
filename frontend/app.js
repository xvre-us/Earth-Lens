const DATA = {
  burned_area: {
    title: "Burned area",
    metric: "97.25%",
    metricLabel: "of detected burned area occurred Jul–Oct",
    relationship: "−0.939",
    relationshipLabel: "seasonal Spearman correlation with soil moisture",
    interpretation:
      "Lower seasonal soil moisture is strongly associated with higher detected burned area in this case study.",
    values: [12, 18, 21, 29, 43, 68, 74, 91, 88, 64, 32, 18]
  },

  soil_moisture: {
    title: "Soil moisture",
    metric: "−0.939",
    metricLabel: "Spearman correlation with burned area",
    relationship: "Strong negative",
    relationshipLabel: "seasonal relationship",
    interpretation:
      "The case study shows a strong inverse seasonal relationship between soil moisture and detected burned area.",
    values: [72, 68, 64, 59, 54, 49, 42, 37, 39, 48, 61, 69]
  },

  precipitation: {
    title: "Precipitation",
    metric: "−0.935",
    metricLabel: "Spearman correlation with burned area",
    relationship: "Strong negative",
    relationshipLabel: "seasonal relationship",
    interpretation:
      "Lower seasonal precipitation is strongly associated with higher detected burned area in this case study.",
    values: [280, 245, 220, 190, 155, 110, 80, 55, 72, 125, 205, 265]
  },

  temperature: {
    title: "Air temperature",
    metric: "Warming",
    metricLabel: "significant annual warming trend",
    relationship: "Not significant",
    relationshipLabel: "annual association with burned area",
    interpretation:
      "Annual temperature shows a significant warming trend, but its direct annual association with burned area was not statistically significant.",
    values: [26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 26.5, 26.7, 26.8, 26.9, 27.0, 27.1]
  }
};

const labels = [
  "Jan", "Feb", "Mar", "Apr",
  "May", "Jun", "Jul", "Aug",
  "Sep", "Oct", "Nov", "Dec"
];

const variableSelect = document.getElementById("variableSelect");
const metricValue = document.getElementById("metricValue");
const metricLabel = document.getElementById("metricLabel");
const correlationValue = document.getElementById("correlationValue");
const correlationLabel = document.getElementById("correlationLabel");
const interpretationText =
  document.getElementById("interpretationText");
const mapTitle = document.getElementById("mapTitle");

let chart;

function initMap() {
  if (typeof L === "undefined") return;

  const map = L.map("map", {
    zoomControl: false
  }).setView([-1.5, 113.5], 5);

  L.control.zoom({
    position: "bottomright"
  }).addTo(map);

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: "© OpenStreetMap contributors"
    }
  ).addTo(map);

  const points = [
    [-0.6, 114.0],
    [-1.7, 110.2],
    [-2.4, 113.8],
    [-1.0, 116.0],
    [-3.1, 115.1],
    [-0.2, 111.2]
  ];

  points.forEach((point, index) => {
    L.circle(point, {
      radius: 35000 + (index % 3) * 18000,
      fillOpacity: 0.18,
      weight: 1
    }).addTo(map);
  });
}

function renderChart(key) {
  if (typeof Chart === "undefined") return;

  const item = DATA[key];
  const canvas = document.getElementById("trendChart");

  if (!canvas) return;

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(canvas, {
    type: "line",

    data: {
      labels,

      datasets: [
        {
          label: item.title,
          data: item.values,
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.35,
          fill: false
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          labels: {
            color: "#9fb2b9",
            font: {
              size: 11
            }
          }
        }
      },

      scales: {
        x: {
          grid: {
            color: "rgba(142,164,173,.08)"
          },

          ticks: {
            color: "#71878e"
          }
        },

        y: {
          grid: {
            color: "rgba(142,164,173,.08)"
          },

          ticks: {
            color: "#71878e"
          }
        }
      }
    }
  });
}

function updateDashboard(key) {
  const item = DATA[key];

  metricValue.textContent = item.metric;
  metricLabel.textContent = item.metricLabel;

  correlationValue.textContent = item.relationship;
  correlationLabel.textContent = item.relationshipLabel;

  interpretationText.textContent = item.interpretation;
  mapTitle.textContent = item.title;

  renderChart(key);
}

function init() {
  initMap();

  if (variableSelect) {
    variableSelect.addEventListener("change", (event) => {
      updateDashboard(event.target.value);
    });
  }

  updateDashboard("burned_area");
}

document.addEventListener("DOMContentLoaded", init);
