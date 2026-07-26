import re

with open("App.tsx", "r") as f:
    text = f.read()

flip_logic = """
  const handleFlip = useCallback((direction: 'horizontal' | 'vertical') => {
      if (selectedShapeIds.length === 0) return;
      
      const recursivelyFlip = (shapesList: Shape[], idsToFlip: string[]): Shape[] => {
          let hasChanges = false;
          const newShapes = shapesList.map(shape => {
              if (idsToFlip.includes(shape.id)) {
                  hasChanges = true;
                  let newS = { ...shape } as any;
                  
                  // Flip rotation
                  if ('rotation' in newS && newS.rotation) {
                      newS.rotation = (360 - newS.rotation) % 360;
                  }

                  // Flip position and properties
                  if (['rectangle', 'ellipse', 'rhombus', 'arc', 'text', 'image', 'bitmap'].includes(newS.type)) {
                      // Symmetric visual flip via scale in Canvas for some, just rotation for others
                      if (['image', 'bitmap', 'text', 'arc'].includes(newS.type)) {
                          if (direction === 'horizontal') {
                              newS.isFlippedHorizontally = !newS.isFlippedHorizontally;
                          } else {
                              newS.isFlippedVertically = !newS.isFlippedVertically;
                          }
                      }
                  } else if (['polygon', 'star', 'triangle', 'right-triangle', 'trapezoid', 'parallelogram'].includes(newS.type)) {
                      // These shapes have native flip support in geometry.ts
                      if (direction === 'horizontal') {
                          newS.isFlippedHorizontally = !newS.isFlippedHorizontally;
                      } else {
                          newS.isFlippedVertically = !newS.isFlippedVertically;
                      }
                  } else if (['line', 'polyline', 'bezier', 'pencil'].includes(newS.type)) {
                      // Flip points around their geometric center
                      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                      newS.points.forEach((p: any) => {
                          minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
                          maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
                      });
                      const cx = minX + (maxX - minX) / 2;
                      const cy = minY + (maxY - minY) / 2;
                      
                      newS.points = newS.points.map((p: any) => ({
                          x: direction === 'horizontal' ? cx - (p.x - cx) : p.x,
                          y: direction === 'vertical' ? cy - (p.y - cy) : p.y
                      }));
                  } else if (newS.type === 'group') {
                      // For groups, we flip the group's rotation, then recursively flip its children.
                      // Wait! If we flip a group horizontally, we negate its rotation, and then flip all its children horizontally 
                      // around the group's center?
                      // Wait, if we flip the children around the group's center, we would need to know the group's center.
                  }
                  
                  return newS;
              }
              return shape;
          });
          return hasChanges ? newShapes : shapesList;
      };

      setShapes(prev => {
          // A better approach for groups is to flip the WHOLE object around its visual bounding box center.
          let hasChanges = false;
          
          const newShapes = prev.map(shape => {
              if (selectedShapeIds.includes(shape.id)) {
                  hasChanges = true;
                  let newS = { ...shape } as any;
                  // For now, let's just do individual shape flipping. Groups will be handled differently.
              }
              return shape;
          });
          return prev;
      });
  }, [selectedShapeIds, setShapes]);
"""

# Wait, if we flip a group, we can just flip its rotation! Because children's geometry relative to the group center does NOT need to change if we flip the group's CSS transform!
# But wait, group's children are rendered individually, and group doesn't have a CSS transform!
# Ah! Group children are rendered globally! So if we flip a group, we MUST physically flip the children around the group's center!
