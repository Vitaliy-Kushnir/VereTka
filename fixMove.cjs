const fs = require('fs');

let code = fs.readFileSync('App.tsx', 'utf8');

const moveShapeBlock = `  const moveShape = useCallback((id: string, direction: 'up' | 'down') => {
    setHistoryState(prev => {
        let parentGroup = prev.shapes.find(s => s.type === 'group' && s.shapeIds?.includes(id));
        
        if (parentGroup) {
            // Moving a child INSIDE a group
            let newLayers = [...(prev.layers || [])];
            let layerChanged = false;
            let actualTargetId: string | null = null;
            
            newLayers = newLayers.map(layer => {
                if (!layer.shapeIds || !layer.shapeIds.includes(id)) return layer;
                
                const groupChildrenInLayer = layer.shapeIds.filter(sid => parentGroup!.shapeIds?.includes(sid));
                const childIdx = groupChildrenInLayer.indexOf(id);
                const targetChildIdx = direction === 'up' ? childIdx + 1 : childIdx - 1;
                
                if (targetChildIdx >= 0 && targetChildIdx < groupChildrenInLayer.length) {
                    actualTargetId = groupChildrenInLayer[targetChildIdx];
                    const index = layer.shapeIds.indexOf(id);
                    const targetIndex = layer.shapeIds.indexOf(actualTargetId);
                    
                    const newShapeIds = [...layer.shapeIds];
                    [newShapeIds[index], newShapeIds[targetIndex]] = [newShapeIds[targetIndex], newShapeIds[index]];
                    layerChanged = true;
                    return { ...layer, shapeIds: newShapeIds };
                }
                return layer;
            });
            
            if (!layerChanged) return prev;
            
            const newShapes = [...prev.shapes];
            if (actualTargetId) {
                const index = newShapes.findIndex(s => s.id === id);
                const targetIndex = newShapes.findIndex(s => s.id === actualTargetId!);
                if (index !== -1 && targetIndex !== -1) {
                    [newShapes[index], newShapes[targetIndex]] = [newShapes[targetIndex], newShapes[index]];
                }
                
                const groupIndex = newShapes.findIndex(s => s.id === parentGroup!.id);
                if (groupIndex !== -1) {
                    const newGroup = { ...newShapes[groupIndex] };
                    if (newGroup.shapeIds) {
                        const childIdx1 = newGroup.shapeIds.indexOf(id);
                        const childIdx2 = newGroup.shapeIds.indexOf(actualTargetId);
                        if (childIdx1 !== -1 && childIdx2 !== -1) {
                            const newGroupShapeIds = [...newGroup.shapeIds];
                            [newGroupShapeIds[childIdx1], newGroupShapeIds[childIdx2]] = [newGroupShapeIds[childIdx2], newGroupShapeIds[childIdx1]];
                            newGroup.shapeIds = newGroupShapeIds;
                            newShapes[groupIndex] = newGroup;
                        }
                    }
                }
            }
            
            return { ...prev, shapes: newShapes, layers: newLayers };
        } else {
            // Moving a top-level shape or group
            const getBlock = (shapes: Shape[], startId: string) => {
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

            let newShapes = [...prev.shapes];
            const myIndices = myBlockIds.map(bid => newShapes.findIndex(s => s.id === bid)).sort((a, b) => a - b);
            const myFirstIdx = myIndices[0];
            const myLastIdx = myIndices[myIndices.length - 1];

            let swapped = false;

            if (direction === 'up') {
                const nextIdx = myLastIdx + 1;
                if (nextIdx < newShapes.length) {
                    const targetBlockIds = getBlock(newShapes, newShapes[nextIdx].id);
                    const targetIndices = targetBlockIds.map(bid => newShapes.findIndex(s => s.id === bid)).sort((a, b) => a - b);
                    const targetFirstIdx = targetIndices[0];
                    const targetLastIdx = targetIndices[targetIndices.length - 1];
                    
                    if (targetFirstIdx === myLastIdx + 1) {
                        newShapes = [
                            ...newShapes.slice(0, myFirstIdx),
                            ...newShapes.slice(targetFirstIdx, targetLastIdx + 1),
                            ...newShapes.slice(myFirstIdx, myLastIdx + 1),
                            ...newShapes.slice(targetLastIdx + 1)
                        ];
                        swapped = true;
                    }
                }
            } else {
                const prevIdx = myFirstIdx - 1;
                if (prevIdx >= 0) {
                    const targetBlockIds = getBlock(newShapes, newShapes[prevIdx].id);
                    const targetIndices = targetBlockIds.map(bid => newShapes.findIndex(s => s.id === bid)).sort((a, b) => a - b);
                    const targetFirstIdx = targetIndices[0];
                    const targetLastIdx = targetIndices[targetIndices.length - 1];
                    
                    if (targetLastIdx === myFirstIdx - 1) {
                        newShapes = [
                            ...newShapes.slice(0, targetFirstIdx),
                            ...newShapes.slice(myFirstIdx, myLastIdx + 1),
                            ...newShapes.slice(targetFirstIdx, targetLastIdx + 1),
                            ...newShapes.slice(myLastIdx + 1)
                        ];
                        swapped = true;
                    }
                }
            }

            if (!swapped) return prev;

            let newLayers = (prev.layers || []).map(layer => {
                if (!layer.shapeIds || !layer.shapeIds.includes(id)) return layer;
                
                let layerShapeIds = [...layer.shapeIds];
                const myLayerIndices = myBlockIds.map(bid => layerShapeIds.indexOf(bid)).filter(idx => idx !== -1).sort((a, b) => a - b);
                if (myLayerIndices.length === 0) return layer;
                
                const myLFirst = myLayerIndices[0];
                const myLLast = myLayerIndices[myLayerIndices.length - 1];
                
                if (direction === 'up' && myLLast + 1 < layerShapeIds.length) {
                    const targetBlockIds = getBlock(prev.shapes, layerShapeIds[myLLast + 1]);
                    const targetLIndices = targetBlockIds.map(bid => layerShapeIds.indexOf(bid)).filter(idx => idx !== -1).sort((a, b) => a - b);
                    if (targetLIndices.length > 0 && targetLIndices[0] === myLLast + 1) {
                        const targetLFirst = targetLIndices[0];
                        const targetLLast = targetLIndices[targetLIndices.length - 1];
                        layerShapeIds = [
                            ...layerShapeIds.slice(0, myLFirst),
                            ...layerShapeIds.slice(targetLFirst, targetLLast + 1),
                            ...layerShapeIds.slice(myLFirst, myLLast + 1),
                            ...layerShapeIds.slice(targetLLast + 1)
                        ];
                    }
                } else if (direction === 'down' && myLFirst - 1 >= 0) {
                    const targetBlockIds = getBlock(prev.shapes, layerShapeIds[myLFirst - 1]);
                    const targetLIndices = targetBlockIds.map(bid => layerShapeIds.indexOf(bid)).filter(idx => idx !== -1).sort((a, b) => a - b);
                    if (targetLIndices.length > 0 && targetLIndices[targetLIndices.length - 1] === myLFirst - 1) {
                        const targetLFirst = targetLIndices[0];
                        const targetLLast = targetLIndices[targetLIndices.length - 1];
                        layerShapeIds = [
                            ...layerShapeIds.slice(0, targetLFirst),
                            ...layerShapeIds.slice(myLFirst, myLLast + 1),
                            ...layerShapeIds.slice(targetLFirst, targetLLast + 1),
                            ...layerShapeIds.slice(myLLast + 1)
                        ];
                    }
                }
                
                return { ...layer, shapeIds: layerShapeIds };
            });

            return { ...prev, shapes: newShapes, layers: newLayers };
        }
    });
  }, [setHistoryState]);`;

const startIndex = code.indexOf(`  const moveShape = useCallback((id: string, direction: 'up' | 'down') => {`);
const endIndex = code.indexOf(`  }, [setHistoryState]);`, startIndex) + 24;

if (startIndex !== -1 && endIndex !== -1) {
    code = code.substring(0, startIndex) + moveShapeBlock + code.substring(endIndex);
    fs.writeFileSync('App.tsx', code);
    console.log('moveShape replaced successfully');
} else {
    console.log('Failed to find moveShape block');
}
