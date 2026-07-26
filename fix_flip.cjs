const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const oldHandleFlip = `
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
              
              const idsToFlip = getAffectedIds([topId]);
`;

const newHandleFlip = `          for (const topId of topLevelIds) {
              const rootShape = newShapes.find(s => s.id === topId);
              if (!rootShape) continue;

              const bbox = getVisualBoundingBox(rootShape, undefined, newShapes);
              if (!bbox) continue;

              const centerAxis = direction === 'horizontal' ? bbox.x + bbox.width / 2 : bbox.y + bbox.height / 2;

              const idsToFlip = getAffectedIds([topId]);`;

if (code.includes(oldHandleFlip.trim())) {
    console.log("Found old code, replacing...");
    code = code.replace(oldHandleFlip.trim(), newHandleFlip.trim());
    fs.writeFileSync('App.tsx', code);
} else {
    console.log("Could not find old code in App.tsx");
}
