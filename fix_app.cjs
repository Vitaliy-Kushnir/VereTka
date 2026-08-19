const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  /setDrawMode\('rectangle'\); setActiveTool\('draw'\);/,
  "setActiveTool('rectangle');"
).replace(
  /drawMode === 'rectangle' && activeTool === 'draw'/,
  "activeTool === 'rectangle'"
).replace(
  /setDrawMode\('circle'\); setActiveTool\('draw'\);/,
  "setActiveTool('circle');"
).replace(
  /drawMode === 'circle' && activeTool === 'draw'/,
  "activeTool === 'circle'"
).replace(
  /setDrawMode\('ellipse'\); setActiveTool\('draw'\);/,
  "setActiveTool('ellipse');"
).replace(
  /drawMode === 'ellipse' && activeTool === 'draw'/,
  "activeTool === 'ellipse'"
).replace(
  /setDrawMode\('line'\); setActiveTool\('draw'\);/,
  "setActiveTool('line');"
).replace(
  /drawMode === 'line' && activeTool === 'draw'/,
  "activeTool === 'line'"
).replace(
  /setDrawMode\('polyline'\); setActiveTool\('draw'\);/,
  "setActiveTool('polyline');"
).replace(
  /drawMode === 'polyline' && activeTool === 'draw'/,
  "activeTool === 'polyline'"
).replace(
  /setDrawMode\('polygon'\); setActiveTool\('draw'\);/,
  "setActiveTool('polygon');"
).replace(
  /drawMode === 'polygon' && activeTool === 'draw'/,
  "activeTool === 'polygon'"
).replace(
  /setDrawMode\('path'\); setActiveTool\('draw'\);/,
  "setActiveTool('pencil');"
).replace(
  /drawMode === 'path' && activeTool === 'draw'/,
  "activeTool === 'pencil'"
).replace(
  /setDrawMode\('text'\); setActiveTool\('draw'\);/,
  "setActiveTool('text');"
).replace(
  /drawMode === 'text' && activeTool === 'draw'/,
  "activeTool === 'text'"
);

fs.writeFileSync('App.tsx', code);
