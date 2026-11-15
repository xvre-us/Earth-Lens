from pathlib import Path
import pandas as pd, numpy as np, json
from scipy import stats
import statsmodels.api as sm
from statsmodels.stats.multitest import multipletests
P=Path(__file__).parent
b=pd.read_csv(P/'data/raw/Kalimantan_Burned_Area.csv',parse_dates=['date']).set_index('date')
for token,name in [('GPM','rain'),('M2TM','temp'),('GLDAS','soil')]:
 f=next((P/'data/raw').glob('g4*'+token+'*.csv')); d=pd.read_csv(f,skiprows=8,parse_dates=[0]); d.columns=['date',name]; b=b.join(d.set_index('date'),validate='one_to_one')
b['coverage']=b.valid_land_km2/b.land_area_km2
assert b.index.is_unique and len(b)==276
assert b.coverage.between(0,1.000001).all()
b.to_csv(P/'data/monthly.csv')
x=b.loc['2003':'2024'].copy(); assert len(x)==264 and x.notna().all().all()
agg={'rain':'sum','temp':'mean','soil':'mean','burned_area_km2':'sum','coverage':'min'}
a=x.groupby(x.index.year).agg(agg); s=x[x.index.month.isin([7,8,9,10])]; sa=s.groupby(s.index.year).agg(agg)
a.to_csv(P/'data/annual.csv',index_label='year'); sa.to_csv(P/'data/seasonal.csv',index_label='year')
tr=[]
for v in list(agg)[:4]:
 y=a[v].values; t=np.arange(len(y)); r=stats.linregress(t,y); fit=sm.OLS(y,sm.add_constant(t)).fit(cov_type='HAC',cov_kwds={'maxlags':2},use_t=True); sen=stats.theilslopes(y,t); residual=y-r.intercept-r.slope*t
 tr.append(dict(variable=v,n=len(y),slope_decade=r.slope*10,p_ols=r.pvalue,p_hac=fit.pvalues[1],hac_ci_low=fit.conf_int()[1,0]*10,hac_ci_high=fit.conf_int()[1,1]*10,sen_decade=sen.slope*10,kendall_p=stats.kendalltau(t,y).pvalue,residual_lag1=np.corrcoef(residual[:-1],residual[1:])[0,1]))
for row,q in zip(tr,multipletests([r['p_hac'] for r in tr],method='fdr_bh')[1]): row['q_hac_bh']=q
pd.DataFrame(tr).to_csv(P/'results/trends.csv',index=False)
cor=[]
for label,df in [('annual',a),('Jul-Oct',sa),('Jul-Oct coverage >= 90% every month',sa[sa.coverage>=.9]),('Jul-Oct coverage >= 80% every month',sa[sa.coverage>=.8])]:
 for v in ['rain','temp','soil']:
  r=stats.spearmanr(df[v],df.burned_area_km2); cor.append(dict(scope=label,variable=v,n=len(df),rho=r.statistic,p_nominal=r.pvalue))
pd.DataFrame(cor).to_csv(P/'results/associations.csv',index=False)
# monthly anomalies using calendar-month baseline, no imputation
for v in ['rain','temp','soil','burned_area_km2']:
 x[v+'_anomaly']=x[v]-x.groupby(x.index.month)[v].transform('mean')
x.to_csv(P/'data/monthly_anomalies.csv')
quality={'monthly_rows':len(b),'missing':b.isna().sum().to_dict(),'min_coverage':float(b.coverage.min()),'min_coverage_month':str(b.coverage.idxmin().date()),'mean_coverage':float(b.coverage.mean()),'fire_season_share':float(s.burned_area_km2.sum()/x.burned_area_km2.sum()),'below_90_percent':int((x.coverage<.9).sum())}
(P/'evidence.json').write_text(json.dumps({'region_bbox':[111,-3.5,115.5,0],'period':'2003-2024','quality':quality,'trends':tr,'associations':cor},indent=2))
print(json.dumps(quality,indent=2));print(pd.DataFrame(tr).to_string(index=False));print(pd.DataFrame(cor).to_string(index=False))
