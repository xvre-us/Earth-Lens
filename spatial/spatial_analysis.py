"""Analyze real MODIS grid exports. No imputation; neighbor comparisons descriptive."""
import argparse, json
from pathlib import Path
import numpy as np
import pandas as pd
from scipy.stats import theilslopes, kendalltau
import statsmodels.api as sm
from statsmodels.stats.multitest import multipletests

def fit(y):
    x=y.index.to_numpy(dtype=float); v=y.to_numpy(dtype=float)
    if len(y)<15 or len(np.unique(v))<2: return {}
    # HAC lag assumes contiguous annual observations; do not compress gaps.
    if not np.all(np.diff(x)==1): return {}
    m=sm.OLS(v,sm.add_constant(x-x.min())).fit(cov_type='HAC',cov_kwds={'maxlags':2,'use_correction':True},use_t=True)
    ci=m.conf_int()[1]*10
    return dict(slope_decade=float(m.params[1]*10),p_hac=float(m.pvalues[1]),ci_low=float(ci[0]),ci_high=float(ci[1]),sen_decade=float(theilslopes(v,x).slope*10),p_kendall=float(kendalltau(x,v).pvalue))

def analyze(path,out):
    d=pd.read_csv(path); d['date']=pd.to_datetime(d.date,errors='raise').dt.to_period('M')
    d=d[d.date.between(pd.Period('2003-01'),pd.Period('2024-12'))].copy()
    if d.duplicated(['cell_id','date']).any(): raise ValueError('Duplicate cell-month records')
    for k in ['burned_area_km2','valid_land_km2','land_area_km2','full_period_km2']:
        d[k]=pd.to_numeric(d[k],errors='coerce')
    for r in d.itertuples():
        if not (0<=r.row<7 and 0<=r.col<9 and r.cell_id==f'R{int(r.row)}_C{int(r.col)}'): raise ValueError('Invalid grid ID')
    d['coverage']=d.valid_land_km2/d.land_area_km2.where(d.land_area_km2>0)
    d['full_coverage']=d.full_period_km2/d.land_area_km2.where(d.land_area_km2>0)
    d['ok']=d.land_area_km2.ge(100)&d.valid_land_km2.gt(0)&d.burned_area_km2.ge(0)&d.burned_area_km2.le(d.valid_land_km2+0.01)&d.coverage.between(.9,1.00001)&d.full_coverage.between(0,1.00001)
    d['year']=d.date.dt.year
    d['burn_pct']=100*d.burned_area_km2/d.land_area_km2.where(d.land_area_km2>0)
    rows=[]; annual=[]
    for r in range(7):
      for c in range(9):
        cell=f'R{r}_C{c}'; g=d[d.cell_id.eq(cell)]
        record=dict(cell_id=cell,row=r,col=c,longitude=111+c*.5+.25,latitude=-3.5+r*.5+.25,n_months=len(g),mean_coverage=g.coverage.mean(),mean_full_coverage=g.full_coverage.mean())
        vals={}; allvals={}
        for yr,h in g.groupby('year'):
            # Annual sum of monthly burned fraction, not unique footprint.
            physical=h.land_area_km2.ge(100)&h.valid_land_km2.gt(0)&h.burned_area_km2.ge(0)&h.burned_area_km2.le(h.valid_land_km2+0.01)&h.coverage.between(0,1.00001)
            if len(h)==12 and physical.all(): allvals[yr]=h.burn_pct.sum()
            if len(h)==12 and h.ok.all(): vals[yr]=h.burn_pct.sum()
            annual.append(dict(cell_id=cell,year=yr,annual_burn_pct=allvals.get(yr),quality_filtered_burn_pct=vals.get(yr)))
        a=pd.Series(allvals,dtype=float).sort_index(); b=pd.Series(vals,dtype=float).sort_index()
        record.update(n_years=len(a),n_quality_years=len(b)); record.update(fit(a))
        # Sensitivity slope can use actual year coordinates even if years have gaps; no HAC p for gapped sample.
        record['quality_sen_decade']=float(theilslopes(b.values,b.index).slope*10) if len(b)>=15 else np.nan
        record['status']='analyzed' if 'p_hac' in record else 'insufficient_or_constant'
        rows.append(record)
    t=pd.DataFrame(rows)
    for col in ['slope_decade','p_hac','sen_decade','ci_low','ci_high','p_kendall']:
        if col not in t: t[col]=np.nan
    good=t.p_hac.notna()&np.isfinite(t.p_hac)
    t['q_bh']=np.nan; t['q_by']=np.nan
    if good.any():
        for method,col in [('fdr_bh','q_bh'),('fdr_by','q_by')]: t.loc[good,col]=multipletests(t.loc[good,'p_hac'],method=method)[1]
    for i,a in t.iterrows():
        n=t[(t.row-a.row).abs().le(1)&(t.col-a.col).abs().le(1)&t.cell_id.ne(a.cell_id)].sen_decade.dropna()
        t.loc[i,'neighbor_count']=len(n)
        if len(n)>=3 and pd.notna(a.sen_decade):
            t.loc[i,'neighbor_median_sen']=n.median(); t.loc[i,'neighbor_difference']=a.sen_decade-n.median()
            t.loc[i,'neighbor_sign_agreement']=(np.sign(n)==np.sign(a.sen_decade)).mean()
    out=Path(out); out.mkdir(parents=True,exist_ok=True)
    t.to_csv(out/'cell_trends.csv',index=False); pd.DataFrame(annual).to_csv(out/'cell_annual.csv',index=False)
    (out/'spatial_evidence.json').write_text(t.to_json(orient='records',indent=2))
    print(f'{len(d)} cell-month records; {good.sum()} fitted cells; outputs: {out}')
if __name__=='__main__':
    p=argparse.ArgumentParser(); p.add_argument('csv'); p.add_argument('--out',default='results'); a=p.parse_args(); analyze(a.csv,a.out)
