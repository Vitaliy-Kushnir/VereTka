import re

with open("components/ShapeList.tsx", "r") as f:
    text = f.read()

target = """                                        onClick={() => onSetActiveLayer(layer.id)}"""

replacement = """                                        onClick={(e) => {
                                            if (e.shiftKey) {
                                                if (layer.shapeIds.length > 0) {
                                                    onSelectShape(layer.shapeIds, e.ctrlKey || e.metaKey, false, true);
                                                }
                                            } else {
                                                onSetActiveLayer(layer.id);
                                            }
                                        }}"""

text = text.replace(target, replacement)

target2 = """                                        {activeLayerId === layer.id && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] flex-shrink-0"></span>}
                                    </div>"""

replacement2 = """                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                className="p-1 rounded hover:bg-[var(--bg-app)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if (layer.shapeIds.length > 0) onSelectShape(layer.shapeIds, e.ctrlKey || e.metaKey, false, true); 
                                                }}
                                                title={t('list.selectAll')}
                                            >
                                                <SelectIcon size={12} />
                                            </button>
                                            <button 
                                                className="p-1 rounded hover:bg-[var(--bg-app)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    const newSelection = selectedShapeIds.filter(id => !layer.shapeIds.includes(id));
                                                    onSelectShape(newSelection.length > 0 ? newSelection : null, false, false, true); 
                                                }}
                                                title={t('list.deselectAll')}
                                            >
                                                <SquareIcon size={12} />
                                            </button>
                                        </div>
                                        {activeLayerId === layer.id && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] flex-shrink-0"></span>}
                                    </div>"""

text = text.replace(target2, replacement2)

target3 = """className={`px-2 py-1 flex items-center justify-between text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider rounded cursor-pointer transition-colors ${activeLayerId === layer.id ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'hover:bg-[var(--bg-hover)]'} ${isDragOverLayer ? 'bg-[var(--accent-primary)]/20 outline outline-1 outline-[var(--accent-primary)]' : ''}`}"""
replacement3 = """className={`group px-2 py-1 flex items-center justify-between text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider rounded cursor-pointer transition-colors ${activeLayerId === layer.id ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'hover:bg-[var(--bg-hover)]'} ${isDragOverLayer ? 'bg-[var(--accent-primary)]/20 outline outline-1 outline-[var(--accent-primary)]' : ''}`}"""
text = text.replace(target3, replacement3)

with open("components/ShapeList.tsx", "w") as f:
    f.write(text)
