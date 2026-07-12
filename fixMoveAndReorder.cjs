const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// We replace the entire moveShape and reorderShape functions.
const startMove = code.indexOf(`  const moveShape = useCallback((id: string, direction: 'up' | 'down') => {`);
const endReorder = code.indexOf(`  }, [shapes, executeReorderShape]);`);

if (startMove !== -1 && endReorder !== -1) {
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
            const targetIndices = tBlockIds.map(bid => newShapes.findIndex(s => s.id === bid)).filter(idx => idx !== -1).sort((a,b) => a - b);
            
            const shapeInsertionIndex = position === 'top' ? targetIndices[targetIndices.length - 1] + 1 : targetIndices[0];
            newShapes.splice(shapeInsertionIndex, 0, ...myShapes);
        } else {
            newShapes.push(...myShapes);
        }
        
        // Update the draggedShape back into newShapes (because we might have updated its groupId)
        const finalDraggedIdx = newShapes.findIndex(s => s.id === draggedId);
        if (finalDraggedIdx !== -1) {
            newShapes[finalDraggedIdx] = draggedShape;
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
  }, [shapes, executeReorderShape]);

  const moveShape = useCallback((id: string, direction: 'up' | 'down') => {
    setHistoryState(prev => {
        const getBlock = (shapes, startId) => {
            const shape = shapes.find(s => s.id === startId);
            if (!shape) return [];
            if (shape.type === 'group' || shape.groupId) {
                const gid = shape.type === 'group' ? shape.id : shape.groupId;
                return shapes.filter(s => s.id === gid || s.groupId === gid).map(s => s.id);
            }
            return [shape.id];
        };

        const myBlockIds = getBlock(prev.shapes, id);
        if (myBlockIds.length === 0) return prev;

        let newLayers = [...(prev.layers || [])];
        let newShapes = [...prev.shapes];

        // Let's find out if this shape is in a layer
        let myLayerIndex = -1;
        for (let i = 0; i < newLayers.length; i++) {
            if (newLayers[i].shapeIds && newLayers[i].shapeIds.includes(id)) {
                myLayerIndex = i;
                break;
            }
        }

        if (myLayerIndex === -1) return prev;

        const layerShapeIds = newLayers[myLayerIndex].shapeIds || [];
        
        const myLayerIndices = myBlockIds.map(bid => layerShapeIds.indexOf(bid)).filter(idx => idx !== -1).sort((a,b) => a - b);
        if (myLayerIndices.length === 0) return prev;

        const myFirstIdx = myLayerIndices[0];
        const myLastIdx = myLayerIndices[myLayerIndices.length - 1];

        let targetId = null;
        let position = null;

        if (direction === 'up' && myLastIdx + 1 < layerShapeIds.length) {
            targetId = layerShapeIds[myLastIdx + 1];
            position = 'top';
        } else if (direction === 'down' && myFirstIdx - 1 >= 0) {
            targetId = layerShapeIds[myFirstIdx - 1];
            position = 'bottom';
        }

        if (!targetId || !position) return prev;

        // Perform the swap logic similar to reorder
        const targetBlockIds = getBlock(newShapes, targetId);

        // Remove my block from layer
        newLayers[myLayerIndex] = {
            ...newLayers[myLayerIndex],
            shapeIds: layerShapeIds.filter(sid => !myBlockIds.includes(sid))
        };

        // Find insertion point
        const newLayerShapeIds = [...newLayers[myLayerIndex].shapeIds];
        const targetIndices = targetBlockIds.map(bid => newLayerShapeIds.indexOf(bid)).filter(idx => idx !== -1).sort((a,b) => a - b);
        if (targetIndices.length > 0) {
            const insertIdx = position === 'top' ? targetIndices[targetIndices.length - 1] + 1 : targetIndices[0];
            newLayerShapeIds.splice(insertIdx, 0, ...myBlockIds);
            newLayers[myLayerIndex].shapeIds = newLayerShapeIds;
        }

        // Now do the same for newShapes
        const myShapes = newShapes.filter(s => myBlockIds.includes(s.id));
        newShapes = newShapes.filter(s => !myBlockIds.includes(s.id));

        const targetShapeIndices = targetBlockIds.map(bid => newShapes.findIndex(s => s.id === bid)).filter(idx => idx !== -1).sort((a,b) => a - b);
        if (targetShapeIndices.length > 0) {
            const insertShapeIdx = position === 'top' ? targetShapeIndices[targetShapeIndices.length - 1] + 1 : targetShapeIndices[0];
            newShapes.splice(insertShapeIdx, 0, ...myShapes);
        } else {
            newShapes.push(...myShapes);
        }

        return { ...prev, shapes: newShapes, layers: newLayers };
    });
  }, [setHistoryState]);`;

    code = code.substring(0, startMove) + executeReorderShapeStr + code.substring(endReorder + 36);
    fs.writeFileSync('App.tsx', code);
    console.log("Functions updated successfully.");
} else {
    console.log("Failed to find startMove or endReorder");
}
