import re

with open("components/ShapeList.tsx", "r") as f:
    text = f.read()

text = text.replace("onLayerWarning?: (reason: 'hidden' | 'locked', layerId: string) => void;", "onLayerWarning?: (reason: 'hidden' | 'locked', layerId: string) => void;\n  ignoreHiddenWarningForLayer?: string | null;")

text = text.replace("const ShapeList: React.FC<ShapeListProps> = ({ distributePathState, shapes, layers, activeLayerId, lockedShapeIds, selectedShapeIds, onSelectShape, onDeleteShape, onMoveShape, onUpdateShape, onReorderShape, onMoveToLayer, onSetActiveLayer, showTkinterNames, onLayerWarning }) => {", "const ShapeList: React.FC<ShapeListProps> = ({ distributePathState, shapes, layers, activeLayerId, lockedShapeIds, selectedShapeIds, onSelectShape, onDeleteShape, onMoveShape, onUpdateShape, onReorderShape, onMoveToLayer, onSetActiveLayer, showTkinterNames, onLayerWarning, ignoreHiddenWarningForLayer }) => {")

text = text.replace("""                                            if (!layer.visible) {
                                                if (onLayerWarning) onLayerWarning('hidden', layer.id);
                                                setDragOverId(null);
                                                setDraggedId(null);
                                                return;
                                            }""", """                                            if (!layer.visible && ignoreHiddenWarningForLayer !== layer.id) {
                                                if (onLayerWarning) onLayerWarning('hidden', layer.id);
                                                setDragOverId(null);
                                                setDraggedId(null);
                                                return;
                                            }""")

with open("components/ShapeList.tsx", "w") as f:
    f.write(text)

with open("App.tsx", "r") as f:
    app_text = f.read()

app_text = app_text.replace("onLayerWarning={(reason, layerId) => setDrawingWarningModal({ show: true, reason, layerId })}", "onLayerWarning={(reason, layerId) => setDrawingWarningModal({ show: true, reason, layerId })}\n                                ignoreHiddenWarningForLayer={ignoreHiddenWarningForLayer}")

with open("App.tsx", "w") as f:
    f.write(app_text)
