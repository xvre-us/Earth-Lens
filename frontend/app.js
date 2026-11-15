(() => {
  "use strict";

  const state = {
    variable: "burned_area_km2",
    language: "en",
    theme: localStorage.getItem("earthlens-theme") || "dark",
    map: null,
    spatialLayer: null,
    regional: null,
    spatial: null,
    explanations: null,
    references: null,
    glossary: null
  };

  const VARIABLE_META = {
    burned_area_km2: {
      color: "#ff7f72",
      title: {
        en: "Detected burned area",
        es: "Superficie quemada detectada"
      }
    },

    soil: {
      color: "#63e6a3",
      title: {
        en: "Surface soil moisture",
        es: "Humedad superficial del suelo"
      }
    },

    rain: {
      color: "#6bb8ff",
      title: {
        en: "Precipitation",
        es: "Precipitación"
      }
    },

    temp: {
      color: "#f4b860",
      title: {
        en: "Air temperature",
        es: "Temperatura del aire"
      }
    }
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  /* =========================
     UTILITIES
  ========================== */

  function formatNumber(value, digits = 2) {
    if (!Number.isFinite(value)) return "—";

    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(value);
  }

  function formatP(value) {
    if (!Number.isFinite(value)) return "—";

    if (value < 0.00001) {
      return value.toExponential(2);
    }

    return value.toFixed(5);
  }

  function formatPercent(value, digits = 2) {
    if (!Number.isFinite(value)) return "—";
    return `${(value * 100).toFixed(digits)}%`;
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function statusLabel(status) {
    const labels = {
      increase: "INCREASE",
      decrease: "DECREASE",
      inconclusive: "INCONCLUSIVE",
      method_sensitive: "METHOD-SENSITIVE",
      unavailable: "UNAVAILABLE"
    };

    return labels[status] || status.toUpperCase();
  }

  function statusClass(status) {
    return status.replaceAll("_", "-");
  }

  /* =========================
     DATA
  ========================== */

  async function loadData() {
    const [
      regional,
      spatial,
      explanations,
      references,
      glossary
    ] = await Promise.all([
      fetch("./insights/regional_evidence.json").then(r => r.json()),
      fetch("./insights/spatial_evidence.json").then(r => r.json()),
      fetch("./insights/explanations.json").then(r => r.json()),
      fetch("./insights/references.json").then(r => r.json()),
      fetch("./insights/glossary.json").then(r => r.json())
    ]);

    state.regional = regional;
    state.spatial = spatial;
    state.explanations = explanations;
    state.references = references;
    state.glossary = glossary;
  }

  /* =========================
     THEME
  ========================== */

  function applyTheme() {
    document.body.classList.toggle("light", state.theme === "light");

    const icon = $("#themeIcon");

    if (icon) {
      icon.textContent = state.theme === "light" ? "☀" : "☾";
    }

    localStorage.setItem("earthlens-theme", state.theme);
  }

  function toggleTheme() {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme();
  }

  /* =========================
     LANGUAGE
  ========================== */

  function toggleLanguage() {
    state.language = state.language === "en" ? "es" : "en";

    const button = $("#languageToggle");

    if (button) {
      button.textContent = state.language.toUpperCase();
    }

    renderAll();
  }

  /* =========================
     INSIGHT RULES
  ========================== */

  function getInsight(variable) {
    if (!window.EarthLensInsights) {
      throw new Error("EarthLensInsights is not loaded.");
    }

    return window.EarthLensInsights.getInsight(
      {
        regional: state.regional,
        spatial: state.spatial,
        explanations: state.explanations,
        references: state.references,
        glossary: state.glossary
      },
      variable,
      state.language
    );
  }

  /* =========================
     VARIABLE CONTROLS
  ========================== */

  function bindVariableControls() {
    $$(".variable-button").forEach(button => {
      button.addEventListener("click", () => {
        const variable = button.dataset.variable;

        if (!variable || variable === state.variable) {
          return;
        }

        state.variable = variable;

        $$(".variable-button").forEach(item => {
          item.classList.toggle(
            "active",
            item.dataset.variable === state.variable
          );
        });

        renderAll();
      });
    });
  }

  /* =========================
     MAP
  ========================== */

  function spatialStatus(cell) {
    if (
      !cell ||
      cell.status !== "analyzed" ||
      !Number.isFinite(cell.p_hac) ||
      !Number.isFinite(cell.q_bh) ||
      !Number.isFinite(cell.q_by)
    ) {
      return "inconclusive";
    }

    if (cell.q_by < 0.05) {
      return "by_significant";
    }

    if (cell.q_bh < 0.05) {
      return "bh_only";
    }

    if (cell.p_hac < 0.05) {
      return "nominal_only";
    }

    return "inconclusive";
  }

  function spatialColor(cell) {
    const status = spatialStatus(cell);

    if (status === "by_significant") return "#ff6f61";
    if (status === "bh_only") return "#f4b860";
    if (status === "nominal_only") return "#6bb8ff";

    return state.theme === "light"
      ? "#81958b"
      : "#50665c";
  }

  function createMap() {
    if (!window.L || state.map) return;

    state.map = L.map("map", {
      zoomControl: true,
      attributionControl: true
    });

    state.map.setView([-1.75, 113.25], 6);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
      {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        maxZoom: 18
      }
    ).addTo(state.map);

    renderSpatialLayer();
  }

  function getCellBounds(cell) {
    const half = 0.25;

    return [
      [
        cell.latitude - half,
        cell.longitude - half
      ],
      [
        cell.latitude + half,
        cell.longitude + half
      ]
    ];
  }

  function renderSpatialLayer() {
    if (!state.map || !Array.isArray(state.spatial)) return;

    if (state.spatialLayer) {
      state.spatialLayer.clearLayers();
      state.spatialLayer.remove();
    }

    state.spatialLayer = L.layerGroup();

    state.spatial.forEach(cell => {
      const color = spatialColor(cell);

      const rectangle = L.rectangle(
        getCellBounds(cell),
        {
          color,
          weight: 1,
          opacity: 0.8,
          fillColor: color,
          fillOpacity: cell.status === "analyzed" ? 0.35 : 0.12
        }
      );

      const slope = Number.isFinite(cell.slope_decade)
        ? `${formatNumber(cell.slope_decade, 2)} km²/decade`
        : "Unavailable";

      const coverage = Number.isFinite(cell.mean_coverage)
        ? formatPercent(cell.mean_coverage)
        : "—";

      const p = Number.isFinite(cell.p_hac)
        ? formatP(cell.p_hac)
        : "—";

      const qBH = Number.isFinite(cell.q_bh)
        ? formatP(cell.q_bh)
        : "—";

      const qBY = Number.isFinite(cell.q_by)
        ? formatP(cell.q_by)
        : "—";

      rectangle.bindPopup(`
        <div class="map-popup">
          <strong>${escapeHTML(cell.cell_id)}</strong>

          <div class="map-popup-row">
            <span>Status</span>
            <b>${escapeHTML(spatialStatus(cell).replaceAll("_", " "))}</b>
          </div>

          <div class="map-popup-row">
            <span>Slope</span>
            <b>${escapeHTML(slope)}</b>
          </div>

          <div class="map-popup-row">
            <span>Coverage</span>
            <b>${escapeHTML(coverage)}</b>
          </div>

          <div class="map-popup-row">
            <span>HAC p</span>
            <b>${escapeHTML(p)}</b>
          </div>

          <div class="map-popup-row">
            <span>BH q</span>
            <b>${escapeHTML(qBH)}</b>
          </div>

          <div class="map-popup-row">
            <span>BY q</span>
            <b>${escapeHTML(qBY)}</b>
          </div>
        </div>
      `);

      rectangle.addTo(state.spatialLayer);
    });

    state.spatialLayer.addTo(state.map);
  }

  /* =========================
     REGIONAL SIGNAL
  ========================== */

  function renderRegionalSignal() {
    const insight = getInsight(state.variable);

    if (!insight) return;

    const trend = insight.trend;

    const status = insight.status;
    const meta = VARIABLE_META[state.variable];

    const title = $("#signalTitle");
    const value = $("#signalValue");
    const unit = $("#signalUnit");
    const badge = $("#statusBadge");
    const summary = $("#signalSummary");
    const direction = $("#signalDirection");

    if (title) {
      title.textContent =
        state.explanations[state.variable].title[state.language];
    }

    if (value) {
      value.textContent = Number.isFinite(trend?.slope_decade)
        ? `${trend.slope_decade < 0 ? "−" : "+"}${formatNumber(
            Math.abs(trend.slope_decade),
            state.variable === "temp" ? 3 : 0
          )}`
        : "—";
    }

    if (unit) {
      unit.textContent =
        state.explanations[state.variable].unit[state.language];
    }

    if (badge) {
      badge.textContent = statusLabel(status);
      badge.className = `status-badge ${statusClass(status)}`;
    }

    if (direction) {
      if (status === "increase") direction.textContent = "↑";
      else if (status === "decrease") direction.textContent = "↓";
      else if (status === "method_sensitive") direction.textContent = "↕";
      else direction.textContent = "•";
    }

    if (summary) {
      summary.textContent = buildSignalSummary(insight);
    }

    if (state.variable === "burned_area_km2") {
      updateQuality();
    }
  }

  function buildSignalSummary(insight) {
    const trend = insight.trend;

    if (!trend) {
      return "The available evidence is insufficient to classify this regional trend.";
    }

    if (insight.status === "increase") {
      return `The regional ${insight.title.toLowerCase()} trend is positive at approximately ${formatNumber(
        trend.slope_decade,
        3
      )} per decade. The HAC and multiple-testing evidence support an increasing trend.`;
    }

    if (insight.status === "decrease") {
      return `The regional ${insight.title.toLowerCase()} trend is negative at approximately ${formatNumber(
        trend.slope_decade,
        2
      )} per decade, with the available evidence supporting a decrease.`;
    }

    if (insight.status === "method_sensitive") {
      return `The regional trend is method-sensitive. HAC inference supports the direction, but OLS and/or Kendall inference do not agree at the same significance threshold.`;
    }

    return `The regional ${insight.title.toLowerCase()} trend is inconclusive under the project's statistical decision rules.`;
  }

  /* =========================
     QUALITY
  ========================== */

  function updateQuality() {
    if (!state.regional?.quality) return;

    const quality = state.regional.quality;

    const meanCoverage = quality.mean_coverage;
    const minCoverage = quality.min_coverage;

    const coverageValue = $("#coverageValue");
    const coverageBar = $("#coverageBar");
    const lowCoverageMonths = $("#lowCoverageMonths");
    const worstCoverage = $("#worstCoverage");

    if (coverageValue) {
      coverageValue.textContent = formatPercent(meanCoverage);
    }

    if (coverageBar) {
      coverageBar.style.width = `${Math.max(
        0,
        Math.min(100, meanCoverage * 100)
      )}%`;
    }

    if (lowCoverageMonths) {
      lowCoverageMonths.textContent =
        `${quality.below_90_percent} months below 90%`;
    }

    if (worstCoverage) {
      worstCoverage.textContent =
        `Min: ${formatPercent(minCoverage)}`;
    }
  }

  /* =========================
     SEASONAL ASSOCIATIONS
  ========================== */

  function getSeasonalAssociations(variable) {
    return state.regional.associations.filter(
      item =>
        item.variable === variable &&
        item.scope === "Jul-Oct"
    );
  }

  function renderAssociationSummary() {
    const mappings = {
      soil: "#soilRho",
      rain: "#rainRho",
      temp: "#tempRho"
    };

    Object.entries(mappings).forEach(([variable, selector]) => {
      const element = $(selector);

      if (!element) return;

      const association = getSeasonalAssociations(variable)[0];

      element.textContent = association
        ? `ρ ${association.rho < 0 ? "−" : "+"}${Math.abs(
            association.rho
          ).toFixed(3)}`
        : "ρ —";
    });
  }

  /* =========================
     INSIGHTS PANEL
  ========================== */

  function renderInsights() {
    const insight = getInsight(state.variable);

    if (!insight) return;

    const title = $("#insightTitle");
    const source = $("#insightSource");
    const status = $("#insightStatus");
    const period = $("#insightPeriod");
    const mechanism = $("#insightMechanism");
    const limit = $("#insightLimit");

    if (title) {
      title.textContent = insight.title;
    }

    if (source) {
      source.textContent = insight.source;
    }

    if (status) {
      status.textContent = statusLabel(insight.status);
      status.className =
        `large-status ${statusClass(insight.status)}`;
    }

    if (period) {
      period.textContent = insight.period;
    }

    if (mechanism) {
      mechanism.textContent = insight.mechanism;
    }

    if (limit) {
      limit.textContent = insight.limitations;
    }

    renderInsightStats(insight);
    renderInsightAssociations(insight);
    renderReferences(insight);
  }

  function renderInsightStats(insight) {
    const trend = insight.trend;

    const fields = {
      "#statHac": trend?.p_hac,
      "#statBh": trend?.q_hac_bh,
      "#statOls": trend?.p_ols,
      "#statKendall": trend?.kendall_p
    };

    Object.entries(fields).forEach(([selector, value]) => {
      const element = $(selector);

      if (!element) return;

      element.textContent = formatP(value);
    });
  }

  function renderInsightAssociations(insight) {
    const container = $("#associationList");

    if (!container) return;

    const associations = insight.associations || [];

    if (!associations.length) {
      container.innerHTML = `
        <div class="insight-association">
          <span>No Jul–Oct association available.</span>
        </div>
      `;
      return;
    }

    container.innerHTML = associations
      .map(item => `
        <div class="insight-association">
          <span>${escapeHTML(
            state.explanations[item.variable]?.title?.[state.language] ||
            item.variable
          )}</span>

          <strong>
            ρ ${item.rho < 0 ? "−" : "+"}${Math.abs(item.rho).toFixed(3)}
          </strong>

          <small>
            p ${formatP(item.p_nominal)}
          </small>
        </div>
      `)
      .join("");
  }

  function renderReferences(insight) {
    const container = $("#referenceList");

    if (!container) return;

    const references = insight.references || [];

    if (!references.length) {
      container.innerHTML = `
        <div class="reference-list-empty">
          No references available.
        </div>
      `;
      return;
    }

    container.innerHTML = references
      .filter(Boolean)
      .map(reference => `
        <a
          href="${escapeHTML(reference.url)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          ${escapeHTML(reference.title)}
        </a>
      `)
      .join("");
  }

  /* =========================
     GLOSSARY
  ========================== */

  function renderGlossary() {
    const container = $("#glossaryGrid");

    if (!container || !state.glossary) return;

    const entries = Object.entries(state.glossary);

    container.innerHTML = entries
      .map(([key, value]) => `
        <article class="glossary-item">
          <strong>${escapeHTML(key.replaceAll("_", " "))}</strong>

          <p>
            ${escapeHTML(value[state.language])}
          </p>
        </article>
      `)
      .join("");
  }

  /* =========================
     MAP LABEL
  ========================== */

  function updateMapTitle() {
    const element = $("#mapTitle");

    if (!element) return;

    element.textContent =
      state.explanations[state.variable]?.title?.[state.language] ||
      VARIABLE_META[state.variable].title[state.language];
  }

  /* =========================
     REVEAL ANIMATION
  ========================== */

  function initializeReveal() {
    const elements = $$(".reveal");

    if (!("IntersectionObserver" in window)) {
      elements.forEach(element => {
        element.classList.add("visible");
      });

      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08
      }
    );

    elements.forEach(element => observer.observe(element));
  }

  /* =========================
     RENDER
  ========================== */

  function renderAll() {
    renderRegionalSignal();
    renderAssociationSummary();
    renderInsights();
    renderGlossary();
    updateMapTitle();

    if (state.map) {
      renderSpatialLayer();
    }
  }

  /* =========================
     INIT
  ========================== */

  async function init() {
    try {
      applyTheme();

      const themeToggle = $("#themeToggle");
      const languageToggle = $("#languageToggle");

      if (themeToggle) {
        themeToggle.addEventListener("click", toggleTheme);
      }

      if (languageToggle) {
        languageToggle.addEventListener("click", toggleLanguage);
      }

      bindVariableControls();

      await loadData();

      createMap();
      renderAll();
      initializeReveal();

      window.addEventListener("resize", () => {
        if (state.map) {
          state.map.invalidateSize();
        }
      });

      setTimeout(() => {
        if (state.map) {
          state.map.invalidateSize();
        }
      }, 400);

    } catch (error) {
      console.error("Earth Lens initialization failed:", error);

      const map = $("#map");

      if (map) {
        map.innerHTML = `
          <div style="
            height:100%;
            display:grid;
            place-items:center;
            padding:30px;
            text-align:center;
            color:#8fa49a;
            font-family:Inter,sans-serif;
          ">
            <div>
              <strong style="display:block;color:#ff7f72;margin-bottom:8px;">
                Evidence layer unavailable
              </strong>

              <span style="font-size:.75rem;">
                Check that all files inside
                <code>frontend/insights/</code>
                are available through HTTP.
              </span>
            </div>
          </div>
        `;
      }
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
