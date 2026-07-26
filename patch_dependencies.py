import re

with open("App.tsx", "r") as f:
    text = f.read()

deps_search = "undo, redo, canUndo, canRedo, handleSaveProject, handleSetActiveTool, shapes, updateShape, inlineEditingShapeId, handleToggleFullscreen, isFullscreen]);"
deps_replace = "undo, redo, canUndo, canRedo, handleSaveProject, handleSetActiveTool, shapes, updateShape, inlineEditingShapeId, handleToggleFullscreen, isFullscreen, handleGroup, handleUngroup]);"

text = text.replace(deps_search, deps_replace)

with open("App.tsx", "w") as f:
    f.write(text)
