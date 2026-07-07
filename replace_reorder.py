import sys

with open('App.tsx', 'r') as f:
    content = f.read()

target = """  const reorderShape = useCallback((draggedId: string, targetId: string, position: 'top' | 'bottom') => {
    setShapes(prevShapes => {
        const draggedIndex = prevShapes.findIndex(s => s.id === draggedId);
        const targetIndex = prevShapes.findIndex(s => s.id === targetId);
        if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
            return prevShapes;
        }
        const newShapes = [...prevShapes];
        const [draggedItem] = newShapes.splice(draggedIndex, 1);
        
        const newTargetIndex = newShapes.findIndex(s => s.id === targetId);
        const insertionIndex = position === 'top' ? newTargetIndex + 1 : newTargetIndex;
        
        newShapes.splice(insertionIndex, 0, draggedItem);
        return newShapes;
    });
  }, [setShapes]);"""

replacement = """  const reorderShape = useCallback((draggedId: string, targetId: string, position: 'top' | 'bottom') => {
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
            }
        }
        return { ...prev, shapes: newShapes, layers: newLayers };
    });
  }, [setHistoryState]);"""

if target in content:
    content = content.replace(target, replacement)
    with open('App.tsx', 'w') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Target not found")
