(function(root){
  'use strict';
  const finite = x => typeof x === 'number' && Number.isFinite(x);
  const prob = x => finite(x) && x >= 0 && x <= 1;
  const alpha = 0.05;
  function trendStatus(t){
    if(!t || !finite(t.slope_decade) || ![t.p_hac,t.q_hac_bh,t.p_ols,t.kendall_p].every(prob)) return 'unavailable';
    if(t.q_hac_bh >= alpha) return 'inconclusive';
    if(t.p_ols >= alpha || t.kendall_p >= alpha) return 'method_sensitive';
    return t.slope_decade > 0 ? 'increase' : t.slope_decade < 0 ? 'decrease' : 'inconclusive';
  }
  function coverageStatus(c){return !prob(c) ? 'unavailable' : c < .9 ? 'low_coverage' : 'passes_filter';}
  function spatialStatus(c){
    if(!c || c.status !== 'analyzed' || ![c.p_hac,c.q_bh,c.q_by].every(prob)) return 'unavailable';
    if(c.q_by < alpha) return 'by_significant';
    if(c.q_bh < alpha) return 'bh_only';
    if(c.p_hac < alpha) return 'nominal_only';
    return 'inconclusive';
  }
  function getInsight(data,key,lang='en'){
    if(!['en','es'].includes(lang)) throw Error('Unsupported language');
    if(!Object.hasOwn(data.explanations,key)) return null;
    const meta=data.explanations[key], trend=data.regional.trends.find(t=>t.variable===key)||null;
    const assoc=data.regional.associations.filter(a=>a.variable===key && a.scope.startsWith('Jul-Oct'));
    return {key,title:meta.title[lang],unit:meta.unit[lang],source:meta.source,period:data.regional.period,region_bbox:data.regional.region_bbox,trend,status:trendStatus(trend),mechanism:meta.mechanism[lang],limitations:meta.limit[lang],associations:assoc,references:meta.refs.map(id=>data.references[id]),quality:key==='burned_area_km2'?data.regional.quality:null};
  }
  const api={trendStatus,coverageStatus,spatialStatus,getInsight};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else root.EarthLensInsights=api;
})(globalThis);
