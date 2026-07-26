import re

with open("components/ShapeList.tsx", "r") as f:
    text = f.read()

target = """                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0">
                        <div className="flex flex-col">
                            <button onClick={(e) => handleMoveShape(e, shape.id, 'up')} disabled={!canMoveUp} className="p-[2px] hover:bg-[var(--bg-app)] rounded-t-sm disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title={t('list.moveUp')}>
                                <ArrowUpIcon size={12} />
                            </button>
                            <button onClick={(e) => handleMoveShape(e, shape.id, 'down')} disabled={!canMoveDown} className="p-[2px] hover:bg-[var(--bg-app)] rounded-b-sm disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title={t('list.moveDown')}>
                                <ArrowDownIcon size={12} />
                            </button>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteShape(shape.id); }} disabled={!!distributePathState} className="p-1 ml-1 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-colors opacity-70 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-red-500" title={t('list.delete')}>
                            <TrashIcon size={14} />
                        </button>
                    </div>"""

replacement = """                    <div className={`flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0 ${isLocked ? 'hidden' : ''}`}>
                        <div className="flex flex-col">
                            <button onClick={(e) => handleMoveShape(e, shape.id, 'up')} disabled={!canMoveUp || isLocked} className="p-[2px] hover:bg-[var(--bg-app)] rounded-t-sm disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title={t('list.moveUp')}>
                                <ArrowUpIcon size={12} />
                            </button>
                            <button onClick={(e) => handleMoveShape(e, shape.id, 'down')} disabled={!canMoveDown || isLocked} className="p-[2px] hover:bg-[var(--bg-app)] rounded-b-sm disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title={t('list.moveDown')}>
                                <ArrowDownIcon size={12} />
                            </button>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteShape(shape.id); }} disabled={!!distributePathState || isLocked} className="p-1 ml-1 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-colors opacity-70 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-red-500" title={t('list.delete')}>
                            <TrashIcon size={14} />
                        </button>
                    </div>"""

if target in text:
    text = text.replace(target, replacement)
else:
    print("TARGET NOT FOUND in ShapeList.tsx")

with open("components/ShapeList.tsx", "w") as f:
    f.write(text)
