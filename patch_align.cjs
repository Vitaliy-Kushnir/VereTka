const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const targetStr = `const handleAlignShapes = useCallback((alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom' | 'distribute-h' | 'distribute-v' | 'distribute-path', relativeTo: 'selection' | 'canvas', distributeOptions?: { orientAlongPath: boolean, orientationType: 'radial' | 'tangent' | 'parallel' | 'perpendicular' | 'custom', orientationAngle: number, rotateAlongPath: boolean }) => {`;

const insertStr = `
      if (distributePathState) {
          if (relativeTo !== 'canvas') return;
          if (alignment === 'distribute-h' || alignment === 'distribute-v' || alignment === 'distribute-path') return;
          
          const distributedShapes = applyDistributePathToShapes(shapes, distributePathState);
          const entityIds = new Set(distributePathState.entities.flatMap(e => e.ids));
          const shapesToAlign = distributedShapes.filter(s => entityIds.has(s.id));
          
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          
          shapesToAlign.forEach(shape => {
              const bbox = getVisualBoundingBox(shape, undefined, distributedShapes);
              if (bbox) {
                  minX = Math.min(minX, bbox.x);
                  minY = Math.min(minY, bbox.y);
                  maxX = Math.max(maxX, bbox.x + bbox.width);
                  maxY = Math.max(maxY, bbox.y + bbox.height);
              }
          });
          
          if (minX === Infinity) return;
          
          const width = maxX - minX;
          const height = maxY - minY;
          let dx = 0;
          let dy = 0;

          if (alignment === 'left') dx = 0 - minX;
          else if (alignment === 'right') dx = canvasWidth - maxX;
          else if (alignment === 'center-h') dx = (canvasWidth / 2) - (minX + width / 2);
          else if (alignment === 'top') dy = 0 - minY;
          else if (alignment === 'bottom') dy = canvasHeight - maxY;
          else if (alignment === 'center-v') dy = (canvasHeight / 2) - (minY + height / 2);

          const newState = { ...distributePathState };
          if (distributePathState.type === 'circle') {
              newState.circleParams = { ...newState.circleParams, cx: newState.circleParams.cx + dx, cy: newState.circleParams.cy + dy };
          } else {
              newState.lineParams = { ...newState.lineParams, x1: newState.lineParams.x1 + dx, y1: newState.lineParams.y1 + dy, x2: newState.lineParams.x2 + dx, y2: newState.lineParams.y2 + dy };
          }
          setDistributePathState(newState);
          return;
      }
`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, targetStr + insertStr);
  fs.writeFileSync('App.tsx', code);
  console.log('patched handleAlignShapes');
} else {
  console.log('not found');
}
