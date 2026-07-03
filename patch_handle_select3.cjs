const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const targetSelect = `  const handleSelectShape = useCallback((id: string | string[] | null, isShiftPressed: boolean = false) => {
    if (distributePathState) return;
    if (Array.isArray(id)) {
        setSelectedShapeIds(id);
        return;
    }

    setSelectedShapeIds((prev) => {
      if (!id) return [];
      
      const targetShape = shapes.find(s => s.id === id);
      const targetGroupId = targetShape?.groupId;
      
      // Get all shapes that should be selected together (if grouped)
      const idsToToggle = targetGroupId 
        ? shapes.filter(s => s.groupId === targetGroupId).map(s => s.id)
        : [id];

      if (isShiftPressed) {
        const isAlreadySelected = prev.includes(id);
        if (isAlreadySelected) {
            // Remove group
            return prev.filter(p => !idsToToggle.includes(p));
        } else {
            // Add group
            return [...prev, ...idsToToggle];
        }
      }
      return idsToToggle;
    });

    setIsDrawingPolyline(false);
    setPolylinePoints([]);
    setIsDrawingBezier(false);
    setBezierPoints([]);
  }, [shapes, distributePathState]);`;

code = code.replace(/  const handleSelectShape = useCallback\(\(id: string \| string\[\] \| null, isShiftPressed: boolean = false\) => \{[\s\S]*?\}, \[shapes, distributePathState\]\);/, `  const lastSelectedShapeIdRef = useRef<string | null>(null);

  const handleSelectShape = useCallback((id: string | string[] | null, isCtrlPressed: boolean = false, isShiftPressed: boolean = false) => {
    if (distributePathState) return;
    if (Array.isArray(id)) {
        setSelectedShapeIds(id);
        if (id.length > 0) lastSelectedShapeIdRef.current = id[id.length - 1];
        return;
    }

    setSelectedShapeIds((prev) => {
      if (!id) {
          lastSelectedShapeIdRef.current = null;
          return [];
      }
      
      const targetShape = shapes.find(s => s.id === id);
      const targetGroupId = targetShape?.groupId;
      
      const idsToToggle = targetGroupId 
        ? shapes.filter(s => s.groupId === targetGroupId).map(s => s.id)
        : [id];

      if (isShiftPressed && lastSelectedShapeIdRef.current) {
          const startIndex = shapes.findIndex(s => s.id === lastSelectedShapeIdRef.current);
          const endIndex = shapes.findIndex(s => s.id === id);
          
          if (startIndex !== -1 && endIndex !== -1) {
              const minIndex = Math.min(startIndex, endIndex);
              const maxIndex = Math.max(startIndex, endIndex);
              
              const rangeIds = new Set<string>();
              for (let i = minIndex; i <= maxIndex; i++) {
                  const s = shapes[i];
                  if (s.groupId) {
                      shapes.filter(gs => gs.groupId === s.groupId).forEach(gs => rangeIds.add(gs.id));
                  } else {
                      rangeIds.add(s.id);
                  }
              }
              
              if (isCtrlPressed) {
                  return Array.from(new Set([...prev, ...rangeIds]));
              } else {
                  return Array.from(rangeIds);
              }
          }
      }

      lastSelectedShapeIdRef.current = id;

      if (isCtrlPressed) {
        const isAlreadySelected = prev.includes(id);
        if (isAlreadySelected) {
            return prev.filter(p => !idsToToggle.includes(p));
        } else {
            return [...prev, ...idsToToggle];
        }
      }
      return idsToToggle;
    });

    setIsDrawingPolyline(false);
    setPolylinePoints([]);
    setIsDrawingBezier(false);
    setBezierPoints([]);
  }, [shapes, distributePathState]);`);

fs.writeFileSync('App.tsx', code);
console.log('patched handleSelectShape successfully');
