import re

with open("components/ShapeList.tsx", "r") as f:
    text = f.read()

target1 = """                                        onClick={(e) => {
                                            if (e.shiftKey) {
                                                if (layer.shapeIds.length > 0) {
                                                    onSelectShape(layer.shapeIds, e.ctrlKey || e.metaKey, false, true);
                                                }
                                            } else {"""
replacement1 = """                                        onClick={(e) => {
                                            if (e.shiftKey) {
                                                if (layer.shapeIds.length > 0) {
                                                    const selectableIds = layer.shapeIds.filter(id => !lockedShapeIds.has(id));
                                                    if (selectableIds.length > 0) onSelectShape(selectableIds, e.ctrlKey || e.metaKey, false, true);
                                                }
                                            } else {"""

text = text.replace(target1, replacement1)

target2 = """                                            <button 
                                                className="p-1 rounded hover:bg-[var(--bg-app)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if (layer.shapeIds.length > 0) onSelectShape(layer.shapeIds, e.ctrlKey || e.metaKey, false, true); 
                                                }}
                                                title={t('list.selectAll')}
                                            >"""

replacement2 = """                                            <button 
                                                className="p-1 rounded hover:bg-[var(--bg-app)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    const selectableIds = layer.shapeIds.filter(id => !lockedShapeIds.has(id));
                                                    if (selectableIds.length > 0) onSelectShape(selectableIds, e.ctrlKey || e.metaKey, false, true); 
                                                }}
                                                title={t('list.selectAll')}
                                            >"""

text = text.replace(target2, replacement2)

with open("components/ShapeList.tsx", "w") as f:
    f.write(text)
