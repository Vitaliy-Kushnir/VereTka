import re

with open('App.tsx', 'r') as f:
    content = f.read()

pattern = re.compile(r"  const reorderShape = useCallback\(\(draggedId: string, targetId: string, position: 'top' \| 'bottom'\) => \{.*?  \}, \[setShapes\]\);", re.DOTALL)

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

if pattern.search(content):
    content = pattern.sub(replacement, content, count=1)
    with open('App.tsx', 'w') as f:
        f.write(content)
    print("Replaced reorderShape successfully")
else:
    print("reorderShape Target not found")
