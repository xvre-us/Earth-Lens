"""Create map-ready geometry from the documented rectangular grid and plot observed results."""
from pathlib import Path
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.colors import TwoSlopeNorm
from matplotlib.patches import Rectangle
root=Path(__file__).resolve().parent
t=pd.read_csv(root/'results/cell_trends.csv'); d=pd.read_csv(root/'data/Kalimantan_Spatial_Burned_Area.csv')
features=[]
for r in t.itertuples():
    x=111+r.col*.5; y=-3.5+r.row*.5
    props={'cell_id':r.cell_id,'row':r.row,'col':r.col,'longitude':r.longitude,'latitude':r.latitude}
    features.append({'type':'Feature','geometry':{'type':'Polygon','coordinates':[[[x,y],[x+.5,y],[x+.5,y+.5],[x,y+.5],[x,y]]]},'properties':props})
(root/'data/Kalimantan_Grid.geojson').write_text(json.dumps({'type':'FeatureCollection','features':features},indent=2))
# Join scientific metrics for interactive clients; JSON null for unavailable values.
metrics={r['cell_id']:r for r in json.loads(t.to_json(orient='records'))}
for f in features:f['properties'].update(metrics[f['properties']['cell_id']])
(root/'results/cell_trends.geojson').write_text(json.dumps({'type':'FeatureCollection','features':features},indent=2,allow_nan=False))
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11,'axes.spines.top':False,'axes.spines.right':False})
def mapplot(field,title,subtitle,filename,cmap,norm,label,fmt,mark=False):
    fig,ax=plt.subplots(figsize=(10,8)); fig.subplots_adjust(left=.12,right=.85,top=.82,bottom=.17)
    cm=plt.get_cmap(cmap)
    for r in t.itertuples():
        val=getattr(r,field); x=111+r.col*.5; y=-3.5+r.row*.5
        face=cm(norm(val)) if np.isfinite(val) else '#dedede'
        ax.add_patch(Rectangle((x,y),.5,.5,facecolor=face,edgecolor='white',linewidth=1.2))
        if np.isfinite(val):
            lum=sum(a*b for a,b in zip(face[:3],[.299,.587,.114])); txt=fmt(val)+('*' if mark and r.q_bh<.05 else '')
            ax.text(x+.25,y+.25,txt,ha='center',va='center',fontsize=9,color='white' if lum<.48 else '#17212b')
        else:ax.text(x+.25,y+.25,'N/A',ha='center',va='center',fontsize=9)
    ax.set(xlim=(111,115.5),ylim=(-3.5,0),xlabel='Longitude (°E)',ylabel='Latitude (°)',aspect='equal');ax.set_xticks(np.arange(111,115.6,1));ax.set_yticks(np.arange(-3.5,.1,.5))
    fig.text(.12,.94,title,fontsize=22,weight='bold');fig.text(.12,.885,subtitle,fontsize=11)
    sm=plt.cm.ScalarMappable(norm=norm,cmap=cm);cb=fig.colorbar(sm,ax=ax,fraction=.05,pad=.035);cb.set_label(label)
    fig.text(.12,.075,'NASA MODIS MCD64A1.061 | 2003–2024 | 0.5° grid',fontsize=10)
    fig.text(.12,.045,'* BH q < 0.05; no cells pass BY q < 0.05. N/A: excluded.' if mark else 'Descriptive agreement, not independent evidence. N/A: excluded.',fontsize=10)
    fig.savefig(root/'figures'/filename,dpi=200,bbox_inches='tight');plt.close(fig)
from matplotlib.colors import Normalize
v=max(abs(t.slope_decade.dropna())); mapplot('slope_decade','Where detected burned area changed','Annual burned fraction trend · HAC regression · percentage points per decade','01_trend_map.png','RdBu_r',TwoSlopeNorm(vmin=-v,vcenter=0,vmax=v),'Percentage points / decade',lambda x:f'{x:.1f}',True)
mapplot('neighbor_sign_agreement','Spatial consistency of trends','Share of nearby fitted cells with the same Sen slope sign','02_spatial_consistency.png','viridis',Normalize(0,1),'Agreement fraction',lambda x:f'{x:.0%}')
# October 2015 coverage map
q=d[d.date=='2015-10'].set_index('cell_id'); t['oct2015_coverage']=t.cell_id.map(q.valid_land_km2/q.land_area_km2)
mapplot('oct2015_coverage','October 2015: observation gaps','Valid land coverage varies dramatically across the study area','03_oct2015_coverage.png','viridis',Normalize(0,1),'Valid land fraction',lambda x:f'{x:.0%}')
