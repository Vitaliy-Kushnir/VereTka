const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const reorderMatch = `  const reorderShape = useCallback((draggedId: string, targetId: string, position: 'top' | 'bottom') => {
    setHistoryState(prev => {
        let newLayers = [...(prev.layers || [])];
        let draggedLayerIndex = -1;
        let draggedItemIndex = -1;
        for (let i = 0; i < newLayers.length; i++) {
            const ids = newLayers[i].shapeIds || [];
            const index = ids.indexOf(draggedId);
            if (index !== -1) { draggedLayerIndex = i; draggedItemIndex = index; break; }
        }
        if (draggedLayerIndex === -1) return prev;
        
        newLayers[draggedLayerIndex] = {
            ...newLayers[draggedLayerIndex],
            shapeIds: newLayers[draggedLayerIndex].shapeIds.filter(id => id !== draggedId)
        };
        
        let targetLayerIndex = -1;
        let targetItemIndex = -1;
        for (let i = 0; i < newLayers.length; i++) {
            const ids = newLayers[i].shapeIds || [];
            const index = ids.indexOf(targetId);
            if (index !== -1) { targetLayerIndex = i; targetItemIndex = index; break; }
        }
        if (targetLayerIndex === -1) return prev;
        
        const targetLayerIds = [...newLayers[targetLayerIndex].shapeIds];
        if (draggedLayerIndex === targetLayerIndex && draggedItemIndex < targetItemIndex) {
            targetItemIndex--; 
        }
        const insertionIndex = position === 'top' ? targetItemIndex + 1 : targetItemIndex;
        targetLayerIds.splice(insertionIndex, 0, draggedId);
        newLayers[targetLayerIndex] = { ...newLayers[targetLayerIndex], shapeIds: targetLayerIds };
        
        const newShapes = [...prev.shapes];
        const draggedShapesIndex = newShapes.findIndex(s => s.id === draggedId);
        if (draggedShapesIndex !== -1) {
            const [draggedShape] = newShapes.splice(draggedShapesIndex, 1);
            const targetShapesIndex = newShapes.findIndex(s => s.id === targetId);
            if (targetShapesIndex !== -1) {
                const shapeInsertionIndex = position === 'top' ? targetShapesIndex + 1 : targetShapesIndex;
                newShapes.splice(shapeInsertionIndex, 0, draggedShape);
            } else {
                newShapes.push(draggedShape);
            }
        }
        
        return { ...prev, shapes: newShapes, layers: newLayers };
    });
  }, [setHistoryState]);`;

const reorderReplace = `  const executeReorderShape = useCallback((draggedId: string, targetId: string, position: 'top' | 'bottom', newAction?: 'add' | 'remove') => {
    setHistoryState(prev => {
        let newLayers = [...(prev.layers || [])];
        let newShapes = [...prev.shapes];

        const draggedShapeIdx = newShapes.findIndex(s => s.id === draggedId);
        const targetShapeIdx = newShapes.findIndex(s => s.id === targetId);
        if (draggedShapeIdx === -1 || targetShapeIdx === -1) return prev;
        
        let draggedShape = { ...newShapes[draggedShapeIdx] };
        const targetShape = newShapes[targetShapeIdx];
        
        const oldGroupId = draggedShape.groupId;
        let finalGroupId = draggedShape.groupId;

        if (newAction === 'add') {
            finalGroupId = targetShape.type === 'group' ? targetShape.id : targetShape.groupId;
        } else if (newAction === 'remove') {
            finalGroupId = undefined;
        }

        // Update group structures if necessary
        if (oldGroupId !== finalGroupId) {
            draggedShape.groupId = finalGroupId;
            
            if (oldGroupId) {
                const oldGroupIdx = newShapes.findIndex(s => s.id === oldGroupId);
                if (oldGroupIdx !== -1) {
                    const oldGroup = { ...newShapes[oldGroupIdx] };
                    oldGroup.shapeIds = oldGroup.shapeIds.filter(id => id !== draggedId);
                    if (oldGroup.shapeIds.length === 0) {
                        newShapes.splice(oldGroupIdx, 1);
                        newLayers = newLayers.map(layer => ({
                            ...layer,
                            shapeIds: layer.shapeIds ? layer.shapeIds.filter(id => id !== oldGroupId) : []
                        }));
                    } else {
                        newShapes[oldGroupIdx] = oldGroup;
                    }
                }
            }
            if (finalGroupId) {
                const newGroupIdx = newShapes.findIndex(s => s.id === finalGroupId);
                if (newGroupIdx !== -1) {
                    const newGroup = { ...newShapes[newGroupIdx] };
                    newGroup.shapeIds = [...newGroup.shapeIds, draggedId];
                    newShapes[newGroupIdx] = newGroup;
                }
            }
        }

        // Apply physical reorder
        let draggedLayerIndex = -1;
        let draggedItemIndex = -1;
        for (let i = 0; i < newLayers.length; i++) {
            const ids = newLayers[i].shapeIds || [];
            const index = ids.indexOf(draggedId);
            if (index !== -1) { draggedLayerIndex = i; draggedItemIndex = index; break; }
        }
        if (draggedLayerIndex !== -1) {
            newLayers[draggedLayerIndex] = {
                ...newLayers[draggedLayerIndex],
                shapeIds: newLayers[draggedLayerIndex].shapeIds.filter(id => id !== draggedId)
            };
        }
        
        let targetLayerIndex = -1;
        let targetItemIndex = -1;
        for (let i = 0; i < newLayers.length; i++) {
            const ids = newLayers[i].shapeIds || [];
            const index = ids.indexOf(targetId);
            if (index !== -1) { targetLayerIndex = i; targetItemIndex = index; break; }
        }
        
        if (targetLayerIndex !== -1) {
            const targetLayerIds = [...newLayers[targetLayerIndex].shapeIds];
            if (draggedLayerIndex === targetLayerIndex && draggedItemIndex !== -1 && draggedItemIndex < targetItemIndex) {
                targetItemIndex--; 
            }
            const insertionIndex = position === 'top' ? targetItemIndex + 1 : targetItemIndex;
            targetLayerIds.splice(insertionIndex, 0, draggedId);
            newLayers[targetLayerIndex] = { ...newLayers[targetLayerIndex], shapeIds: targetLayerIds };
        }
        
        const finalDraggedIdx = newShapes.findIndex(s => s.id === draggedId);
        if (finalDraggedIdx !== -1) {
            newShapes.splice(finalDraggedIdx, 1);
            const targetShapesIndex = newShapes.findIndex(s => s.id === targetId);
            if (targetShapesIndex !== -1) {
                const shapeInsertionIndex = position === 'top' ? targetShapesIndex + 1 : targetShapesIndex;
                newShapes.splice(shapeInsertionIndex, 0, draggedShape);
            } else {
                newShapes.push(draggedShape);
            }
        }
        
        return { ...prev, shapes: newShapes, layers: newLayers };
    });
  }, [setHistoryState]);

  const reorderShape = useCallback((draggedId: string, targetId: string, position: 'top' | 'bottom') => {
      const draggedShape = shapes.find(s => s.id === draggedId);
      const targetShape = shapes.find(s => s.id === targetId);
      
      if (!draggedShape || !targetShape) return;
      if (draggedShape.type === 'group') {
          // Do not allow dragging groups into other groups right now
          executeReorderShape(draggedId, targetId, position);
          return;
      }
      
      const targetGroupId = targetShape.type === 'group' ? targetShape.id : targetShape.groupId;

      if (draggedShape.groupId !== targetGroupId) {
          if (targetGroupId) {
              setReorderConfirmInfo({ draggedId, targetId, position, action: 'add', groupId: targetGroupId });
              return;
          } else if (draggedShape.groupId) {
              setReorderConfirmInfo({ draggedId, targetId, position, action: 'remove', groupId: draggedShape.groupId });
              return;
          }
      }
      
      executeReorderShape(draggedId, targetId, position);
  }, [shapes, executeReorderShape]);`;

code = code.replace(reorderMatch, reorderReplace);
fs.writeFileSync('App.tsx', code);
console.log("reorder added.");
