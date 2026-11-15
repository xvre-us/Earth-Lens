// EarthLens | Kalimantan spatial burned-area extraction
var region = ee.Geometry.Rectangle([111,-3.5,115.5,0], null, false);
var cells = [];
for (var r=0;r<7;r++) {
  for (var c=0;c<9;c++) {
    var x=111+c*0.5, y=-3.5+r*0.5;
    cells.push(ee.Feature(ee.Geometry.Rectangle([x,y,x+0.5,y+0.5],null,false), {
      cell_id:'R'+r+'_C'+c, row:r, col:c, longitude:x+0.25, latitude:y+0.25
    }));
  }
}
var grid=ee.FeatureCollection(cells);
var dataset=ee.ImageCollection('MODIS/061/MCD64A1').filterDate('2003-01-01','2025-01-01').filterBounds(region).sort('system:time_start');
var projection=ee.Image(dataset.first()).select('BurnDate').projection();
Map.centerObject(region,7);
Map.addLayer(grid.style({color:'FFFF00',fillColor:'00000000',width:1}),{},'EarthLens grid');
print('Grid cells:',grid.size());
print('Monthly images:',dataset.size());
function processMonth(item) {
  var image=ee.Image(item), qa=image.select('QA'), burn=image.select('BurnDate');
  var land=qa.bitwiseAnd(1).neq(0);
  var valid=land.and(qa.bitwiseAnd(2).neq(0));
  var full=valid.and(qa.bitwiseAnd(4).eq(0));
  var area=ee.Image.pixelArea().divide(1e6);
  var bands=area.multiply(burn.gt(0)).updateMask(valid).rename('burned_area_km2')
    .addBands(area.updateMask(valid).rename('valid_land_km2'))
    .addBands(area.updateMask(land).rename('land_area_km2'))
    .addBands(area.multiply(full).updateMask(land).rename('full_period_km2'));
  return bands.reduceRegions({collection:grid,reducer:ee.Reducer.sum(),crs:projection,scale:projection.nominalScale(),tileScale:4})
    .map(function(f){return ee.Feature(f).set({date:image.date().format('YYYY-MM')});});
}
var results=ee.FeatureCollection(dataset.toList(dataset.size()).map(processMonth)).flatten();
Export.table.toDrive({collection:grid,description:'EarthLens_Grid_GeoJSON',folder:'EarthLens',fileNamePrefix:'Kalimantan_Grid',fileFormat:'GeoJSON'});
Export.table.toDrive({collection:results,description:'EarthLens_Spatial_Burned_Area',folder:'EarthLens',fileNamePrefix:'Kalimantan_Spatial_Burned_Area',fileFormat:'CSV',selectors:['cell_id','row','col','longitude','latitude','date','burned_area_km2','valid_land_km2','land_area_km2','full_period_km2']});
