import re

with open('App.tsx', 'r') as f:
    content = f.read()

start_idx = content.find("  const moveShape = useCallback((id: string, direction: 'up' | 'down') => {")
if start_idx == -1:
    print("start not found")
    exit()

reorder_start = content.find("  const reorderShape = useCallback((draggedId: string, targetId: string, position: 'top' | 'bottom') => {", start_idx)
if reorder_start == -1:
    print("reorder not found")
    exit()

end_idx = content.find("  }, [setHistoryState]);", reorder_start)
if end_idx == -1:
    print("end not found")
    exit()

end_idx += len("  }, [setHistoryState]);")

new_code = """  const executeReorderShape = useCallback((draggedId: string, targetId: string, position: 'top' | 'bottom', newAction?: 'add' | 'remove') => {
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

        const targetBlockIds = getBlock(newShapes, targetId);

        newLayers[myLayerIndex] = {
            ...newLayers[myLayerIndex],
            shapeIds: layerShapeIds.filter(sid => !myBlockIds.includes(sid))
        };

        const newLayerShapeIds = [...newLayers[myLayerIndex].shapeIds];
        const targetIndices = targetBlockIds.map(bid => newLayerShapeIds.indexOf(bid)).filter(idx => idx !== -1).sort((a,b) => a - b);
        if (targetIndices.length > 0) {
            const insertIdx = position === 'top' ? targetIndices[targetIndices.length - 1] + 1 : targetIndices[0];
            newLayerShapeIds.splice(insertIdx, 0, ...myBlockIds);
            newLayers[myLayerIndex].shapeIds = newLayerShapeIds;
        }

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
  }, [setHistoryState]);"""

content = content[:start_idx] + new_code + content[end_idx:]

with open('App.tsx', 'w') as f:
    f.write(content)
print("SUCCESS")
