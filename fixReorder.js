const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const match = `  const reorderShape = useCallback((draggedId: string, targetId: string, position: 'top' | 'bottom') => {
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

if (code.includes(match)) {
    console.log("Match found");
} else {
    console.log("Match not found");
}
