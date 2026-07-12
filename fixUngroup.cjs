const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const ungroupMatch = `  const handleUngroup = useCallback(() => {
    if (distributePathState) return;
    if (selectedShapeIds.length === 0) return;
    
    // Find groups to unpack. A group could be selected directly, or via its children
    const groupIdsToClear = new Set<string>();
    shapes.forEach(s => {
        if (selectedShapeIds.includes(s.id)) {
            if (s.type === 'group') groupIdsToClear.add(s.id);
            else if (s.groupId) groupIdsToClear.add(s.groupId);
        }
    });

    if (groupIdsToClear.size === 0) return;

    setShapes(prev => {
        const remainingShapes = prev.filter(s => !groupIdsToClear.has(s.id)); // Remove GroupShapes
        return remainingShapes.map(s => (s.groupId && groupIdsToClear.has(s.groupId)) ? { ...s, groupId: undefined } : s);
    });

    // Select the newly ungrouped children
    const newlyUngroupedIds = shapes.filter(s => s.groupId && groupIdsToClear.has(s.groupId)).map(s => s.id);
    setSelectedShapeIds(newlyUngroupedIds);

    showNotification(t('menu.edit.ungroup') || 'Групу розформовано');
  }, [shapes, selectedShapeIds, setShapes, showNotification, t]);`;

const ungroupReplace = `  const handleUngroup = useCallback(() => {
    if (distributePathState) return;
    if (selectedShapeIds.length === 0) return;
    
    setHistoryState(prev => {
        const groupIdsToClear = new Set<string>();
        prev.shapes.forEach(s => {
            if (selectedShapeIds.includes(s.id)) {
                if (s.type === 'group') groupIdsToClear.add(s.id);
                else if (s.groupId) groupIdsToClear.add(s.groupId);
            }
        });

        if (groupIdsToClear.size === 0) return prev;

        const newShapes = prev.shapes
            .filter(s => !groupIdsToClear.has(s.id))
            .map(s => (s.groupId && groupIdsToClear.has(s.groupId)) ? { ...s, groupId: undefined } : s);
            
        let newLayers = (prev.layers || []).map(layer => {
            if (!layer.shapeIds) return layer;
            return {
                ...layer,
                shapeIds: layer.shapeIds.filter(id => !groupIdsToClear.has(id))
            };
        });

        const newlyUngroupedIds = prev.shapes.filter(s => s.groupId && groupIdsToClear.has(s.groupId)).map(s => s.id);
        setSelectedShapeIds(newlyUngroupedIds);
        showNotification(t('menu.edit.ungroup') || 'Групу розформовано');

        return { ...prev, shapes: newShapes, layers: newLayers };
    });
  }, [selectedShapeIds, distributePathState, setHistoryState, showNotification, t]);

  const handleExtractFromGroup = useCallback(() => {
    setExtractConfirmInfo(true);
  }, []);

  const confirmExtractFromGroup = useCallback(() => {
    setHistoryState(prev => {
        let newShapes = [...prev.shapes];
        let newLayers = [...(prev.layers || [])];
        
        const groupsToUpdate = new Set<string>();
        selectedShapeIds.forEach(id => {
            const shape = newShapes.find(s => s.id === id);
            if (shape && shape.groupId) {
                groupsToUpdate.add(shape.groupId);
                const sIdx = newShapes.findIndex(s => s.id === id);
                if (sIdx !== -1) {
                    newShapes[sIdx] = { ...shape, groupId: undefined };
                }
            }
        });
        
        groupsToUpdate.forEach(gid => {
            const gIdx = newShapes.findIndex(s => s.id === gid);
            if (gIdx !== -1) {
                const groupShape = { ...newShapes[gIdx] };
                groupShape.shapeIds = groupShape.shapeIds.filter(id => !selectedShapeIds.includes(id));
                if (groupShape.shapeIds.length === 0) {
                    newShapes.splice(gIdx, 1);
                    newLayers = newLayers.map(layer => ({
                        ...layer,
                        shapeIds: layer.shapeIds ? layer.shapeIds.filter(id => id !== gid) : []
                    }));
                } else {
                    newShapes[gIdx] = groupShape;
                }
            }
        });
        
        return { ...prev, shapes: newShapes, layers: newLayers };
    });
    setExtractConfirmInfo(false);
  }, [selectedShapeIds, setHistoryState]);`;

code = code.replace(ungroupMatch, ungroupReplace);
fs.writeFileSync('App.tsx', code);
console.log("ungroup and extract added.");
