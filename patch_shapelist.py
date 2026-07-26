import re

with open("components/ShapeList.tsx", "r") as f:
    text = f.read()

text = text.replace("onLayerWarning?: (reason: 'hidden' | 'locked') => void;", "onLayerWarning?: (reason: 'hidden' | 'locked', layerId: string) => void;")

text = text.replace("if (onLayerWarning) onLayerWarning('locked');", "if (onLayerWarning) onLayerWarning('locked', layer.id);")

text = text.replace("""                                            if (draggedId) {
                                                onMoveToLayer(draggedId, layer.id);
                                            }""", """                                            if (!layer.visible) {
                                                if (onLayerWarning) onLayerWarning('hidden', layer.id);
                                                setDragOverId(null);
                                                setDraggedId(null);
                                                return;
                                            }
                                            if (draggedId) {
                                                onMoveToLayer(draggedId, layer.id);
                                            }""")

with open("components/ShapeList.tsx", "w") as f:
    f.write(text)
