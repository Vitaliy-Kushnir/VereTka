const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const startIndex = code.indexOf(`  const reorderShape = useCallback((draggedId: string, targetId: string, position: 'top' | 'bottom') => {`);
const endIndex = code.indexOf(`  }, [shapes, executeReorderShape]);`, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const executeReorderShapeStr = `  const executeReorderShape = useCallback((draggedId: string, targetId: string, position: 'top' | 'bottom', newAction?: 'add' | 'remove') => {
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

        const getBlock = (shapes, startId) => {
            const shape = shapes.find(s => s.id === startId);
            if (!shape) return [];
            if (shape.type === 'group' || shape.groupId) {
                const gid = shape.type === 'group' ? shape.id : shape.groupId;
                return shapes.filter(s => s.id === gid || s.groupId === gid).map(s => s.id);
            }
            return [shape.id];
        };

        const myBlockIds = getBlock(newShapes, draggedId);
        const targetBlockIds = getBlock(newShapes, targetId);

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
                shapeIds: newLayers[draggedLayerIndex].shapeIds.filter(id => !myBlockIds.includes(id))
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
            
            const insertIdx = position === 'top' ? targetItemIndex + 1 : targetItemIndex;
            targetLayerIds.splice(insertIdx, 0, ...myBlockIds);
            newLayers[targetLayerIndex] = { ...newLayers[targetLayerIndex], shapeIds: targetLayerIds };
        }
        
        const myShapes = newShapes.filter(s => myBlockIds.includes(s.id));
        newShapes = newShapes.filter(s => !myBlockIds.includes(s.id));
        
        const targetShapesIndex = newShapes.findIndex(s => s.id === targetId);
        if (targetShapesIndex !== -1) {
            const tBlockIds = getBlock(newShapes, targetId);
            const targetIndices = tBlockIds.map(bid => newShapes.findIndex(s => s.id === bid)).sort((a,b) => a - b);
            
            const shapeInsertionIndex = position === 'top' ? targetIndices[targetIndices.length - 1] + 1 : targetIndices[0];
            newShapes.splice(shapeInsertionIndex, 0, ...myShapes);
        } else {
            newShapes.push(...myShapes);
        }
        
        return { ...prev, shapes: newShapes, layers: newLayers };
    });
  }, [setHistoryState]);

  const reorderShape = useCallback((draggedId: string, targetId: string, position: 'top' | 'bottom') => {
      const draggedShape = shapes.find(s => s.id === draggedId);
      const targetShape = shapes.find(s => s.id === targetId);
      
      if (!draggedShape || !targetShape) return;
      if (draggedShape.type === 'group' || draggedShape.groupId) {
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
  
    code = code.substring(0, code.indexOf(`  const executeReorderShape = useCallback((draggedId: string, targetId: string, position: 'top' | 'bottom', newAction?: 'add' | 'remove') => {`)) + executeReorderShapeStr + code.substring(endIndex + 36);
    fs.writeFileSync('App.tsx', code);
    console.log("reorderShape replaced successfully");
} else {
    console.log("Failed to find reorderShape");
}
