import re

with open("App.tsx", "r") as f:
    text = f.read()

# 1. Update MultiSelectHUD usage
old_hud_call = """                            {isMultiSelectMode && selectedShapeIds.length > 0 && (
                                <MultiSelectHUD
                                    selectedCount={selectedShapeIds.length}
                                    totalSelectableCount={shapes.length}
                                    onGroup={handleGroup}
                                    onUngroup={handleUngroup}
                                    onDelete={handleDelete}
                                    onDuplicate={handleDuplicate}
                                    onSelectAll={handleSelectAll}
                                    onOpenAlign={isMobile ? () => setMobileSheet('align') : undefined}
                                    onDeselectAll={() => {
                                        handleSelectShape(null);
                                        setIsMultiSelectMode(false);
                                    }}
                                    canGroup={selectedShapeIds.length >= 2}
                                    canUngroup={selectedShapeIds.some((id: string) => shapes.find((s: any) => s.id === id)?.type === 'group' || shapes.find((s: any) => s.id === id)?.groupId !== undefined)}
                                    isMobile={isMobile}
                                />
                            )}"""

new_hud_call = """                            {selectedShapeIds.length > 0 && !distributePathState && (
                                <MultiSelectHUD
                                    selectedCount={selectedShapeIds.length}
                                    totalSelectableCount={shapes.length}
                                    onGroup={handleGroup}
                                    onUngroup={handleUngroup}
                                    onDelete={handleDelete}
                                    onDuplicate={handleDuplicate}
                                    onSelectAll={handleSelectAll}
                                    onOpenAlign={isMobile ? () => setMobileSheet('align') : undefined}
                                    onFlipH={() => handleFlip('horizontal')}
                                    onFlipV={() => handleFlip('vertical')}
                                    onDeselectAll={() => {
                                        handleSelectShape(null);
                                        setIsMultiSelectMode(false);
                                    }}
                                    canGroup={selectedShapeIds.length >= 2}
                                    canUngroup={selectedShapeIds.some((id: string) => shapes.find((s: any) => s.id === id)?.type === 'group' || shapes.find((s: any) => s.id === id)?.groupId !== undefined)}
                                    isMobile={isMobile}
                                />
                            )}"""
text = text.replace(old_hud_call, "")

# Find where to put the new_hud_call (right above StatusBar)
status_bar = """                        <StatusBar 
                            zoomLevel={viewTransform.scale} """

text = text.replace(status_bar, new_hud_call + "\n" + status_bar)

with open("App.tsx", "w") as f:
    f.write(text)

