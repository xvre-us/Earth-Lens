# EarthLens Insights — Environmental Explainability Engine

Bilingual, framework-independent interpretation module for the regional Kalimantan case study (111–115.5°E, 3.5°S–0°, 2003–2024). This is a standalone demo, not an integration into the team's deployed website.

## Run
Open `index.html` in a browser with the other files in the same folder. No server, API key or installation is necessary. Select a variable and language. Internet is only needed to follow reference links.

## Integrate
- `explanations.json`: educational mechanisms, units, product IDs, caveats and reference IDs.
- `references.json`: source links; `glossary.json`: bilingual definitions.
- `evidence_rules.js`: CommonJS or browser global `EarthLensInsights`; `getInsight(data,key,lang)` returns the structured explanation, original metrics and references. `trendStatus`, `coverageStatus`, `spatialStatus` expose deterministic classifications.
- `regional_evidence.json` and `spatial_evidence.json`: exact snapshots of `science/evidence.json` and `spatial/results/spatial_evidence.json`. Prefer the upstream files for production to prevent drift. `demo-data.js` embeds the same snapshots for offline file:// demo use.
- `test_rules.cjs`: run `node test_rules.cjs` from this directory; no external dependencies.

Example: `getInsight({regional,explanations,references}, 'temp', 'es')`. Supported keys: `rain`, `temp`, `soil`, `burned_area_km2`. Render the result alongside the relevant graph, not as a causal diagnosis. Use the actual upstream metrics for the selected region and time range. The fixed explanatory content is specific to Kalimantan; do not reuse it as evidence for other locations.

## Interpretation safeguards
Alpha 0.05; a regional BH-adjusted HAC result is classified as method-sensitive when conventional OLS or Kendall does not agree. These are descriptive decision rules, not new statistical tests. Coverage threshold 90% is a team-selected screening rule, not a NASA standard or accuracy guarantee. Spatial results distinguish nominal, BH and BY evidence and preserve missing statistics. Seasonal Spearman p-values are nominal; no causal claims, forecasts or independent neighbor evidence. The 2015 El Niño discussion is external NASA context, not an attribution result from EarthLens. No NDVI or global dynamic retrieval is implemented.
