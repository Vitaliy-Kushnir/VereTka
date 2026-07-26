const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const regex = /const topLevelIds = selectedShapeIds;[\s\S]*?const idsToFlip = getAffectedIds\(\[topId\]\);/;

const replacement = `const topLevelIds = selectedShapeIds;
          
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (const topId of topLevelIds) {
              const rootShape = newShapes.find(s => s.id === topId);
              if (!rootShape) continue;
              const bbox = getVisualBoundingBox(rootShape, undefined, newShapes);
              if (bbox) {
                  minX = Math.min(minX, bbox.x);
                  minY = Math.min(minY, bbox.y);
                  maxX = Math.max(maxX, bbox.x + bbox.width);
                  maxY = Math.max(maxY, bbox.y + bbox.height);
              }
          }
          if (minX === Infinity) return;
          const selectionBbox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
          const centerAxis = direction === 'horizontal' ? selectionBbox.x + selectionBbox.width / 2 : selectionBbox.y + selectionBbox.height / 2;
          
          for (const topId of topLevelIds) {
              const rootShape = newShapes.find(s => s.id === topId);
              if (!rootShape) continue;
              
              const idsToFlip = getAffectedIds([topId]);`;

code = code.replace(regex, replacement);
fs.writeFileSync('App.tsx', code);
