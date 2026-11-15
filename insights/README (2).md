# EarthLens Insights — frontend integration contract

**Scope:** Kalimantan study rectangle (111–115.5°E, 3.5°S–0°), annual trend analysis 2003–2024. Framework-independent browser JavaScript; no Python, npm, API keys or AI service required at runtime. This contract preserves the existing scientific logic in `evidence_rules.js`. The frontend owns presentation, not statistical interpretation.

## 1. Production files and exact paths

Keep the existing root `insights/` folder intact. For a self-contained `frontend/` deployment, copy these files into `frontend/insights/` (do not move the originals). Paths are relative to the repository root.

| Canonical source | Destination | Runtime purpose |
|---|---|---|
| `insights/evidence_rules.js` | `frontend/insights/evidence_rules.js` | Required engine; exposes `window.EarthLensInsights` |
| `insights/explanations.json` | `frontend/insights/explanations.json` | Required bilingual mechanisms, caveats and metadata |
| `insights/references.json` | `frontend/insights/references.json` | Required source lookup |
| `science/evidence.json` | `frontend/insights/regional_evidence.json` | Required regional evidence |
| `spatial/results/spatial_evidence.json` | `frontend/insights/spatial_evidence.json` | Required for the spatial panel below; not required by `getInsight` |
| `insights/glossary.json` | `frontend/insights/glossary.json` | Required for the glossary below; not required by `getInsight` |

The existing `insights/regional_evidence.json` and `insights/spatial_evidence.json` are snapshots for standalone use. Refresh the production copies from the canonical science/spatial paths whenever results change. Do not edit metrics by hand or maintain divergent copies.

```text
frontend/
  index.html          # existing team page
  app.js              # existing team logic + integration below
  insights/
    evidence_rules.js
    explanations.json
    references.json
    regional_evidence.json
    spatial_evidence.json
    glossary.json
```

**Do not integrate** `insights/index.html` (standalone demo with global styles), `demo-data.js` (offline embedded snapshots), `test_rules.cjs` (Node tests), `.gitkeep` or this README as runtime assets. Keep them in the original module. No external CSS or HTML library is required. Maps and time-series charts remain the responsibility of the existing frontend; this module returns interpretation, not chart geometry.

## 2. `frontend/index.html`

Insert this section wherever the existing dashboard should show scientific context. The select controls are optional if the existing dashboard already has controls; the section and output containers are required by the example renderer.

```html
<section id="earthlens-insights" aria-labelledby="eli-heading">
  <h2 id="eli-heading">EarthLens Insights</h2>
  <label for="eli-variable">Environmental variable</label>
  <select id="eli-variable">
    <option value="rain">Precipitation</option>
    <option value="temp" selected>Air temperature</option>
    <option value="soil">Soil moisture</option>
    <option value="burned_area_km2">Detected burned area</option>
  </select>
  <label for="eli-language">Language / Idioma</label>
  <select id="eli-language">
    <option value="en">English</option><option value="es">Español</option>
  </select>
  <div id="eli-output" aria-live="polite"></div>
  <div id="eli-glossary"></div>
</section>
```

Load the engine before the existing app script. Do not add a second app.js tag; modify the existing script order. The engine is a classic script, not an ES module; the existing app may be classic or `type="module"` and should use `window.EarthLensInsights`.

```html
<script defer src="./insights/evidence_rules.js"></script>
<script defer src="./app.js"></script>
```

If app.js already uses `type="module"`, keep that attribute instead of replacing it. Ensure the engine is loaded before initialization. Use HTTP(S), not `file://`, for JSON fetches. These relative paths assume the frontend page is served from `frontend/` (or that directory is the deployment root). Avoid leading `/`, which breaks GitHub Pages project subpaths. If the published URL still shows the repository README, configure the host to serve the actual frontend entry point; merging alone does not deploy it.

## 3. `frontend/app.js` — paste-ready integration

Append the following isolated block to the existing app.js. It loads the six production assets (one script above and five JSON files below), caches the data, delegates every classification to the engine, renders bilingual output and exposes `window.renderEarthLensInsight(key, lang)` for existing dashboard controls. No scientific formulas are reimplemented. This example uses DOM text nodes, not untrusted HTML.

```js
(() => {
  const start = () => {
    const root = document.getElementById('earthlens-insights');
    if (!root) return;
    const output = root.querySelector('#eli-output');
    const glossary = root.querySelector('#eli-glossary');
    const variable = root.querySelector('#eli-variable');
    const language = root.querySelector('#eli-language');
    const api = window.EarthLensInsights;
    const base = new URL('./insights/', document.baseURI);
    const load = async file => {
      const response = await fetch(new URL(file, base));
      if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
      return response.json();
    };
    const dataPromise = Promise.all([
      load('regional_evidence.json'), load('spatial_evidence.json'),
      load('explanations.json'), load('references.json'), load('glossary.json')
    ]).then(([regional, spatial, explanations, references, glossary]) =>
      ({regional, spatial, explanations, references, glossary}));
    let request = 0;
    const el = (tag, text, cls) => {
      const node = document.createElement(tag);
      if (text !== undefined) node.textContent = text;
      if (cls) node.className = cls;
      return node;
    };
    const card = (title, ...children) => {
      const node = el('section', undefined, 'eli-card');
      node.append(el('h3', title), ...children);
      return node;
    };
    window.renderEarthLensInsight = async (key = 'temp', lang = 'en') => {
      const token = ++request;
      const tr = (en, es) => lang === 'es' ? es : en;
      const num = (v, digits = 3) => typeof v === 'number' && Number.isFinite(v)
        ? v.toLocaleString(lang === 'es' ? 'es-MX' : 'en-US', {maximumFractionDigits: digits}) : '—';
      const pct = v => typeof v === 'number' && Number.isFinite(v) ? `${num(v * 100, 2)}%` : '—';
      output.textContent = tr('Loading scientific evidence…', 'Cargando evidencia científica…');
      glossary.replaceChildren();
      try {
        if (!api) throw new Error('EarthLensInsights script not loaded');
        const data = await dataPromise;
        if (token !== request) return;
        const i = api.getInsight(data, key, lang);
        if (!i) { output.textContent = tr('No evidence for this variable.', 'No hay evidencia para esta variable.'); return; }
        if (variable) variable.value = key;
        if (language) language.value = lang;
        const t = i.trend;
        const statuses = {
          increase: tr('Evidence of an increase', 'Evidencia de aumento'),
          decrease: tr('Evidence of a decrease', 'Evidencia de disminución'),
          inconclusive: tr('Inconclusive trend', 'Tendencia no concluyente'),
          method_sensitive: tr('Method-dependent trend', 'Tendencia dependiente del método'),
          unavailable: tr('Insufficient evidence', 'Evidencia insuficiente')
        };
        output.replaceChildren(
          el('p', `${i.title} · Kalimantan · ${i.period}`),
          card(tr('What changed?', '¿Qué cambió?'),
            el('p', statuses[i.status]),
            el('p', t ? `${num(t.slope_decade)} ${i.unit}` : '—', 'eli-metric')),
          card(tr('Why might it happen?', '¿Por qué podría ocurrir?'), el('p', i.mechanism)),
          card(tr('Limitations', 'Limitaciones'), el('p', i.limitations)),
          card('Evidence Passport', el('p', i.source),
            el('p', `n: ${num(t?.n)} · HAC p: ${num(t?.p_hac, 5)} · BH q: ${num(t?.q_hac_bh, 5)}`),
            el('p', `OLS p: ${num(t?.p_ols, 5)} · Kendall p: ${num(t?.kendall_p, 5)}`),
            el('p', `${tr('95% HAC interval', 'Intervalo HAC 95%')}: ${num(t?.hac_ci_low)} – ${num(t?.hac_ci_high)} ${i.unit}`),
            el('p', tr('Exploratory inference; not causal attribution.', 'Inferencia exploratoria; no atribución causal.')))
        );
        // getInsight returns associations for the selected predictor only.
        // For burned area, show its relationships with all three predictors.
        const associations = (key === 'burned_area_km2' ? data.regional.associations : i.associations)
          .filter(a => a.scope === 'Jul-Oct' || a.scope === 'Jul-Oct coverage >= 90% every month');
        if (associations.length) {
          const rows = associations.map(a => el('p', `${data.explanations[a.variable].title[lang]} · ${a.scope} · n=${a.n} · ρ=${num(a.rho)}`));
          output.append(card(tr('Environmental relationships', 'Relaciones ambientales'), ...rows,
            el('p', tr('Spearman association does not establish causation.', 'La asociación Spearman no demuestra causalidad.'))));
        }
        if (i.quality) {
          const q = i.quality;
          const status = api.coverageStatus(q.min_coverage);
          output.append(card(tr('Data quality', 'Calidad de datos'),
            el('p', `${q.min_coverage_month}: ${pct(q.min_coverage)} · ${status === 'low_coverage' ? tr('Low coverage', 'Cobertura baja') : status === 'passes_filter' ? tr('Passes coverage screen', 'Supera filtro de cobertura') : tr('Unavailable', 'No disponible')}`),
            el('p', tr('Low coverage can hide burned area; coverage is not accuracy.', 'La cobertura baja puede ocultar superficie quemada; cobertura no equivale a exactitud.')),
            el('p', `${tr('July–October share of detected area', 'Proporción del área detectada julio–octubre')}: ${pct(q.fire_season_share)}`)));
          const counts = data.spatial.reduce((acc, cell) => {
            const s = api.spatialStatus(cell);
            acc[s] = (acc[s] || 0) + 1;
            return acc;
          }, {});
          const nominal = (counts.nominal_only || 0) + (counts.bh_only || 0) + (counts.by_significant || 0);
          const bh = (counts.bh_only || 0) + (counts.by_significant || 0);
          output.append(card(tr('Spatial evidence', 'Evidencia espacial'),
            el('p', `${tr('Cells', 'Celdas')}: ${data.spatial.length} · ${tr('Nominal', 'Nominal')}: ${nominal} · BH: ${bh} · BY: ${counts.by_significant || 0}`),
            el('p', tr('Nearby cells are not independent.', 'Las celdas vecinas no son independientes.'))));
        }
        const links = el('ul');
        i.references.forEach(ref => {
          const li = el('li'); const a = el('a', ref.title);
          a.href = ref.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
          li.append(a); links.append(li);
        });
        output.append(card(tr('Scientific sources', 'Fuentes científicas'), links));
        glossary.replaceChildren(el('h3', tr('Scientific glossary', 'Glosario científico')));
        Object.entries(data.glossary).forEach(([term, text]) => {
          const d = el('details'); d.append(el('summary', term.replaceAll('_', ' ')), el('p', text[lang])); glossary.append(d);
        });
        return i;
      } catch (error) {
        if (token !== request) return;
        console.error('EarthLens Insights:', error);
        output.textContent = tr('Scientific evidence could not be loaded.', 'No se pudo cargar la evidencia científica.');
      }
    };
    const update = () => window.renderEarthLensInsight(variable?.value || 'temp', language?.value || 'en');
    variable?.addEventListener('change', update);
    language?.addEventListener('change', update);
    update();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();
})();
```

Existing dashboard handlers can call `await window.renderEarthLensInsight('soil', 'en')` once initialized. Map your own variable identifiers to the exact keys below. If the user selects a different geography or time period, hide/disable this fixed regional panel or explicitly label it as the unchanged Kalimantan reference case. Do not pass arbitrary dates or coordinates to this API: it does not recalculate evidence.

## 4. Minimal CSS (append to existing stylesheet)

All selectors are scoped; no global resets or dependencies. Adapt colors to the existing design.

```css
#earthlens-insights { display: grid; gap: .75rem; min-width: 0; }
#earthlens-insights .eli-card { border: 1px solid currentColor; border-radius: .75rem; padding: 1rem; margin-block: .75rem; overflow-wrap: anywhere; }
#earthlens-insights .eli-card h3 { margin-top: 0; }
#earthlens-insights .eli-metric { font-size: 1.5rem; font-weight: 700; }
#earthlens-insights select { max-width: 100%; font: inherit; }
#earthlens-insights details { margin-block: .5rem; }
#earthlens-insights summary { cursor: pointer; }
```

## 5. Public API and input/output contract

Browser global: `window.EarthLensInsights`. CommonJS: `require('./evidence_rules.js')`. All four functions are synchronous and do not mutate input data or fetch files.

```js
const insight = EarthLensInsights.getInsight({ regional, explanations, references }, 'temp', 'en');
```

`key`: `rain`, `temp`, `soil`, `burned_area_km2`. `lang`: `en` (default) or `es`; unsupported languages throw. Unknown keys return `null`. The caller must load well-formed JSON before calling; missing top-level objects or arrays are not handled by the engine. `spatial` and `glossary` are separate UI data, not used by `getInsight`.

### Runtime JSON schemas

- `regional_evidence.json`: object with `region_bbox` `[west,south,east,north]`, `period` string, `trends` array, `associations` array and `quality` object. Each trend contains `variable`, `n`, `slope_decade`, `p_ols`, `p_hac`, `hac_ci_low`, `hac_ci_high`, `sen_decade`, `kendall_p`, `residual_lag1`, `q_hac_bh`. Association rows contain `scope`, `variable`, `n`, `rho`, `p_nominal`. Quality contains `monthly_rows`, `missing`, `min_coverage`, `min_coverage_month`, `mean_coverage`, `fire_season_share`, `below_90_percent`. Quality summary covers the source monthly dataset (276 rows, 2003–2025); trend and fire-season share use 2003–2024. Do not confuse these periods.
- `explanations.json`: object keyed by variable, each with `title`, `unit`, `mechanism`, `limit` (each `{en,es}`), `source` string, `refs` array of reference IDs.
- `references.json`: object keyed by reference ID; values `{title,url}`.
- `glossary.json`: object keyed by term, values `{en,es}`.
- `spatial_evidence.json`: array of cell objects. Core fields: `cell_id`, `row`, `col`, `longitude`, `latitude`, `status`, `slope_decade`, `p_hac`, `q_bh`, `q_by`, `mean_coverage`, `mean_full_coverage`, `sen_decade`, `neighbor_sign_agreement`. Additional original fields are preserved. Nullable statistics must remain null. This file is not GeoJSON; for map geometry use `spatial/results/cell_trends.geojson` separately.

### `getInsight` output

| Field | Type / meaning |
|---|---|
| `key`, `title`, `unit`, `source` | strings; localized title/unit, dataset identifier |
| `period`, `region_bbox` | original regional scope |
| `trend` | original trend object or null |
| `status` | `increase`, `decrease`, `inconclusive`, `method_sensitive`, `unavailable` |
| `mechanism`, `limitations` | localized text; possible mechanisms, not demonstrated causes |
| `associations` | original rows for selected variable with scope starting `Jul-Oct`; includes sensitivity subsets; empty for burned area itself |
| `references` | array of resolved `{title,url}` |
| `quality` | original regional quality object for `burned_area_km2` only; otherwise null |

Other methods:
- `trendStatus(trend)`: same regional statuses above. Requires finite slope and valid HAC p, BH q, OLS p and Kendall p. BH q ≥ 0.05 is inconclusive; BH q < 0.05 but OLS or Kendall p ≥ 0.05 is method-sensitive; otherwise direction from slope.
- `coverageStatus(fraction)`: `unavailable`, `low_coverage` (<0.90), `passes_filter` (≥0.90). Input is a fraction 0–1, not percent.
- `spatialStatus(cell)`: `unavailable`, `by_significant`, `bh_only`, `nominal_only`, `inconclusive`. Requires `status === 'analyzed'` and valid p/q values. BY, BH and nominal use strict <0.05; categories are mutually exclusive, cumulative counts must include stronger categories.

## 6. Scientific safeguards and acceptance checks

Alpha 0.05; HAC lag 2 for regional trends; inference is exploratory. Coverage threshold 90% is a team-selected screen, not a NASA accuracy standard. Seasonal Spearman p-values are nominal; correlation does not imply causation. Neighbor agreement is descriptive, not independent confirmation. The 2015 El Niño narrative is external NASA context, not an attribution result. No NDVI, forecasts, global retrieval or arbitrary region/time recomputation is implemented.

Run `node insights/test_rules.cjs` from repository root (12 assertions). Then serve the frontend over HTTP and confirm all six production assets load with HTTP 200, no console errors, four variables and two languages work, references open and the following results agree:

| Check | Expected |
|---|---|
| rain | `inconclusive` |
| temp | `increase`, slope about +0.262 °C/decade |
| soil | `inconclusive` |
| burned_area_km2 | `method_sensitive` |
| spatial cells | 63 total; 19 nominal, 2 BH, 0 BY |
| October 2015 coverage | about 46.60%, low coverage warning |
| July–October detected area share | about 97.25% |

Original standalone demo: open `insights/index.html` directly with its sibling files; it uses `demo-data.js` and is not the production frontend. This contract is based on the existing module API; integration with the team's actual frontend and deployed site must still be smoke-tested after applying it.

## AI disclosure

AI assistance was used for code drafting, explanations, translations and documentation. Numerical evidence is taken from deterministic analyses of NASA-derived datasets. Review the content and disclose AI assistance in the final submission. The standalone interface is HTML/CSS, not an AI-generated image.
