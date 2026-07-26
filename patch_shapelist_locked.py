import re

with open("components/ShapeList.tsx", "r") as f:
    text = f.read()

# Add onLayerWarning to props
props_target = """  showTkinterNames: boolean;
}"""
props_replacement = """  showTkinterNames: boolean;
  onLayerWarning?: (reason: 'hidden' | 'locked') => void;
}"""
if props_target in text:
    text = text.replace(props_target, props_replacement)

# Destructure onLayerWarning
destruct_target = """onReorderShape, onMoveToLayer, onSetActiveLayer, showTkinterNames }) => {"""
destruct_replacement = """onReorderShape, onMoveToLayer, onSetActiveLayer, showTkinterNames, onLayerWarning }) => {"""
if destruct_target in text:
    text = text.replace(destruct_target, destruct_replacement)
else:
    print("Could not destructure onLayerWarning")
    
# Change handleDrop for shapes
handleDrop_target = """    const handleDrop = (e: React.DragEvent<HTMLLIElement>, targetId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedId && draggedId !== targetId && dropPosition) {
            onReorderShape(draggedId, targetId, dropPosition);
        }
        setDraggedId(null);
        setDragOverId(null);
        setDropPosition(null);
    };"""

handleDrop_replacement = """    const handleDrop = (e: React.DragEvent<HTMLLIElement>, targetId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (lockedShapeIds.has(targetId)) {
            if (onLayerWarning) onLayerWarning('locked');
            setDraggedId(null);
            setDragOverId(null);
            setDropPosition(null);
            return;
        }
        if (draggedId && draggedId !== targetId && dropPosition) {
            onReorderShape(draggedId, targetId, dropPosition);
        }
        setDraggedId(null);
        setDragOverId(null);
        setDropPosition(null);
    };"""
if handleDrop_target in text:
    text = text.replace(handleDrop_target, handleDrop_replacement)
else:
    print("Could not patch handleDrop")

# Change onDrop for layers
layer_drop_target = """                                        onDrop={(e) => {
                                            e.preventDefault();
                                            if (draggedId) {
                                                onMoveToLayer(draggedId, layer.id);
                                            }
                                            setDragOverId(null);
                                            setDraggedId(null);
                                        }}"""

layer_drop_replacement = """                                        onDrop={(e) => {
                                            e.preventDefault();
                                            if (layer.locked) {
                                                if (onLayerWarning) onLayerWarning('locked');
                                                setDragOverId(null);
                                                setDraggedId(null);
                                                return;
                                            }
                                            if (draggedId) {
                                                onMoveToLayer(draggedId, layer.id);
                                            }
                                            setDragOverId(null);
                                            setDraggedId(null);
                                        }}"""
if layer_drop_target in text:
    text = text.replace(layer_drop_target, layer_drop_replacement)
else:
    print("Could not patch layer onDrop")


# Make buttons inactive and apply opacity for locked shapes
shape_buttons_target = """                    <div className="flex items-center gap-2 overflow-hidden flex-1 relative z-10">
                        {shape.type === 'group' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCollapsedGroups(prev => {
                                        const next = new Set(prev);
                                        if (next.has(shape.id)) next.delete(shape.id);
                                        else next.add(shape.id);
                                        return next;
                                    });
                                }}
                                className="flex-shrink-0 p-0.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                {collapsedGroups.has(shape.id) ? <ChevronRightIcon size={12} /> : <ChevronDownIcon size={12} />}
                            </button>
                        )}
                        <button onClick={(e) => handleToggleVisibility(e, shape)} title={shape.state === 'hidden' ? t('list.visibility.show') : t('list.visibility.hide')} className="flex-shrink-0 p-0.5 rounded hover:bg-[var(--bg-hover)]">
                            {shape.state === 'hidden' ? <EyeOffIcon size={12} /> : <EyeIcon size={12} />}
                        </button>"""

shape_buttons_replacement = """                    <div className={`flex items-center gap-2 overflow-hidden flex-1 relative z-10 ${isLocked ? 'pointer-events-none' : ''}`}>
                        {shape.type === 'group' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCollapsedGroups(prev => {
                                        const next = new Set(prev);
                                        if (next.has(shape.id)) next.delete(shape.id);
                                        else next.add(shape.id);
                                        return next;
                                    });
                                }}
                                className="flex-shrink-0 p-0.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                                style={{ pointerEvents: 'auto' }}
                            >
                                {collapsedGroups.has(shape.id) ? <ChevronRightIcon size={12} /> : <ChevronDownIcon size={12} />}
                            </button>
                        )}
                        <button onClick={(e) => handleToggleVisibility(e, shape)} disabled={isLocked} title={shape.state === 'hidden' ? t('list.visibility.show') : t('list.visibility.hide')} className="flex-shrink-0 p-0.5 rounded hover:bg-[var(--bg-hover)] disabled:opacity-50">
                            {shape.state === 'hidden' ? <EyeOffIcon size={12} /> : <EyeIcon size={12} />}
                        </button>"""
if shape_buttons_target in text:
    text = text.replace(shape_buttons_target, shape_buttons_replacement)
else:
    print("Could not patch shape buttons")

shape_buttons_action_target = """                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0">
                        <div className="flex flex-col">
                            <button onClick={(e) => handleMoveShape(e, shape.id, 'up')} disabled={!canMoveUp} className="p-[2px] hover:bg-[var(--bg-app)] rounded-t-sm disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title={t('list.moveUp')}>
                                <ChevronDownIcon size={12} className="rotate-180" />
                            </button>
                            <button onClick={(e) => handleMoveShape(e, shape.id, 'down')} disabled={!canMoveDown} className="p-[2px] hover:bg-[var(--bg-app)] rounded-b-sm disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title={t('list.moveDown')}>
                                <ChevronDownIcon size={12} />
                            </button>
                        </div>
                        <button onClick={(e) => handleDeleteShape(e, shape.id)} className="p-1.5 ml-0.5 hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-500 rounded transition-colors" title={t('list.delete')}>
                            <TrashIcon size={14} />
                        </button>
                    </div>"""

shape_buttons_action_replacement = """                    <div className={`flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0 ${isLocked ? 'hidden' : ''}`}>
                        <div className="flex flex-col">
                            <button onClick={(e) => handleMoveShape(e, shape.id, 'up')} disabled={!canMoveUp || isLocked} className="p-[2px] hover:bg-[var(--bg-app)] rounded-t-sm disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title={t('list.moveUp')}>
                                <ChevronDownIcon size={12} className="rotate-180" />
                            </button>
                            <button onClick={(e) => handleMoveShape(e, shape.id, 'down')} disabled={!canMoveDown || isLocked} className="p-[2px] hover:bg-[var(--bg-app)] rounded-b-sm disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title={t('list.moveDown')}>
                                <ChevronDownIcon size={12} />
                            </button>
                        </div>
                        <button onClick={(e) => handleDeleteShape(e, shape.id)} disabled={isLocked} className="p-1.5 ml-0.5 hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-500 rounded transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[var(--text-secondary)]" title={t('list.delete')}>
                            <TrashIcon size={14} />
                        </button>
                    </div>"""
if shape_buttons_action_target in text:
    text = text.replace(shape_buttons_action_target, shape_buttons_action_replacement)
else:
    print("Could not patch shape buttons action")

with open("components/ShapeList.tsx", "w") as f:
    f.write(text)
