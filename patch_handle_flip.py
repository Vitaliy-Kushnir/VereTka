import re

with open("App.tsx", "r") as f:
    text = f.read()

flip_logic = """
  const handleFlip = useCallback((direction: 'horizontal' | 'vertical') => {
      if (selectedShapeIds.length === 0) return;

      setShapes(prevShapes => {
          let hasChanges = false;
          let newShapes = [...prevShapes];
          
          const getAffectedIds = (ids: string[]): string[] => {
              let affected: string[] = [];
              const addId = (id: string) => {
                  if (!affected.includes(id)) affected.push(id);
                  const s = newShapes.find(sh => sh.id === id);
                  if (s?.type === 'group' && s.shapeIds) {
                      s.shapeIds.forEach(addId);
                  }
              };
              ids.forEach(addId);
              return affected;
          };
          
          const topLevelIds = selectedShapeIds;
          
          for (const topId of topLevelIds) {
              const rootShape = newShapes.find(s => s.id === topId);
              if (!rootShape) continue;

              const bbox = getVisualBoundingBox(rootShape, undefined, newShapes);
              if (!bbox) continue;
              const centerAxis = direction === 'horizontal' ? bbox.x + bbox.width / 2 : bbox.y + bbox.height / 2;

              const idsToFlip = getAffectedIds([topId]);
              
              for (let i = 0; i < newShapes.length; i++) {
                  if (idsToFlip.includes(newShapes[i].id)) {
                      hasChanges = true;
                      let newS = { ...newShapes[i] } as any;

                      if ('rotation' in newS && typeof newS.rotation === 'number') {
                          newS.rotation = (360 - newS.rotation) % 360;
                      }

                      if (direction === 'horizontal') {
                          if ('x' in newS && 'width' in newS) {
                              newS.x = 2 * centerAxis - newS.x - newS.width;
                          } else if ('cx' in newS) {
                              newS.cx = 2 * centerAxis - newS.cx;
                          } else if (['line', 'polyline', 'bezier', 'pencil'].includes(newS.type)) {
                              newS.points = newS.points.map((p: any) => ({ x: 2 * centerAxis - p.x, y: p.y }));
                          }
                      } else {
                          if ('y' in newS && 'height' in newS) {
                              newS.y = 2 * centerAxis - newS.y - newS.height;
                          } else if ('cy' in newS) {
                              newS.cy = 2 * centerAxis - newS.cy;
                          } else if (['line', 'polyline', 'bezier', 'pencil'].includes(newS.type)) {
                              newS.points = newS.points.map((p: any) => ({ x: p.x, y: 2 * centerAxis - p.y }));
                          }
                      }

                      if (newS.type === 'group' && newS.rotationCenter) {
                          if (direction === 'horizontal') {
                              newS.rotationCenter = { x: 2 * centerAxis - newS.rotationCenter.x, y: newS.rotationCenter.y };
                          } else {
                              newS.rotationCenter = { x: newS.rotationCenter.x, y: 2 * centerAxis - newS.rotationCenter.y };
                          }
                      }

                      if (['polygon', 'star', 'triangle', 'right-triangle', 'trapezoid', 'parallelogram', 'image', 'bitmap', 'text', 'arc'].includes(newS.type)) {
                          if (direction === 'horizontal') {
                              newS.isFlippedHorizontally = !newS.isFlippedHorizontally;
                          } else {
                              newS.isFlippedVertically = !newS.isFlippedVertically;
                          }
                      }

                      newShapes[i] = newS;
                  }
              }
          }
          
          return hasChanges ? newShapes : prevShapes;
      });
  }, [selectedShapeIds]);

  const handleKeyDown = (e: KeyboardEvent) => {
"""

if "const handleKeyDown = (e: KeyboardEvent) => {" in text:
    text = text.replace("  const handleKeyDown = (e: KeyboardEvent) => {", flip_logic)
else:
    print("handleKeyDown not found")

hotkey_logic = """        if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
            switch (e.code) {
                case 'KeyH':
                    handleFlip('horizontal');
                    e.preventDefault();
                    return;
                case 'KeyV':
                    handleFlip('vertical');
                    e.preventDefault();
                    return;
            }
        }

        // Modifier shortcuts"""

if "        // Modifier shortcuts" in text:
    text = text.replace("        // Modifier shortcuts", hotkey_logic)
else:
    print("Modifier shortcuts not found")

with open("App.tsx", "w") as f:
    f.write(text)
