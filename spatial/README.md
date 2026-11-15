# EarthLens — Spatial Reliability Engine

Regional prototype for NASA Space Apps. Real NASA MODIS MCD64A1.061 monthly burned-area observations, 2003–2024, rectangular Kalimantan study area (111–115.5°E, 3.5°S–0°). This is not the administrative boundary of Central Kalimantan.

## Reproduce
Install `pip install -r requirements.txt`, then run from this folder:

```
python spatial_analysis.py data/Kalimantan_Spatial_Burned_Area.csv --out results
python make_assets.py
```

`extract_grid.js` is the Earth Engine extraction script. `data/Kalimantan_Grid.geojson` is reconstructed from the verified row/column centers and documented 0.5° cell bounds, not an uploaded Earth Engine GeoJSON export. `results/cell_trends.geojson` joins these polygons to computed metrics for map integration. Missing statistics are JSON nulls.

## Results and validation
- 16,632 unique cell-month rows, 63 cells, 264 months; no missing CSV fields or duplicate cell-month pairs. 62 fitted cells; R0_C0 excluded by the 100 km² minimum land threshold.
- 61 negative and 1 positive HAC linear slope. 19 nominal p < .05; 2 BH q < .05; 0 BY q < .05. Thus mapped decreases are descriptive, not confirmed field-wide significant trends under the more conservative dependence-robust BY adjustment.
- BH candidates R2_C0 and R1_C7; BY q = .181 and .185 respectively. The latter has only 14 high-coverage years, below the sensitivity minimum of 15. The former has 20 high-coverage years, with a much smaller negative Sen slope (-.038 percentage points/decade vs -.081 without filtering).
- 703 cell-months below 90% valid coverage. October 2015, R4_C5: 0.143% valid coverage (4.39 of 3071.55 km²), with zero detected area; this is not evidence of no fires.
- 45 cells have at least 15 quality-filtered annual observations; 41 retain the same Sen slope sign. 40 of 62 fitted cells show at least 75% sign agreement with neighbors (descriptive only).
- Regional cross-check: sum of cell-level monthly burned area = 59,930.658 km²; original regional total over matching months = 59,932.601 km². Difference 1.943 km² (0.00324%); maximum absolute monthly difference 0.353 km². Small discrepancies may reflect boundary weighting in regional versus per-cell reduction; exact cause not established.

## Methods and limits
Primary metric: annual sum of monthly detected burned area divided by each month's identified land area, expressed in percentage points; repeated burns can count more than once. Cells with <100 km² land are excluded from annual analyses (analyst-selected threshold). All 12 months must be present and physically valid. Sensitivity requires >=90% valid land coverage in every month and at least 15 years; full-period coverage is reported separately. Neither coverage is detection accuracy. HAC lag 2 applies only to contiguous annual observations, minimum 15; Sen and Kendall are complementary nominal statistics. BH and more conservative BY adjustments across fitted cells are exploratory; validity depends on the underlying p-values. Neighbor median slope and sign agreement are descriptive, not independent corroboration or formal anomaly tests. With 22 annual observations, inference is sensitive to method, coverage, episodic fires, and temporal dependence. Do not infer causality or global results. No precipitation/temperature/moisture spatial trends are included in this module. Maps are gridded results without administrative or coast outlines.

Source: NASA MODIS MCD64A1.061 https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MCD64A1 . AI assistance was used to draft code, documentation and visual layout; numerical results and maps are generated deterministically from the supplied NASA-derived CSVs. Review before submission.
