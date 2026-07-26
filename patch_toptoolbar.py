import re

with open("App.tsx", "r") as f:
    text = f.read()

# Add to TopToolbar props
s = r"    onGroup: \(\) => void; onUngroup: \(\) => void;"
r_new = r"    onGroup: () => void; onUngroup: () => void;\n    onFlipH: () => void; onFlipV: () => void;"
text = re.sub(s, r_new, text)

# Add to TopToolbar destructuring
s_destruct = r"isGenerating, hasShapes, onUndo, onRedo, canUndo, canRedo, onDuplicate, onGroup, onUngroup, onAlignShapes, isShapeSelected, onOpenMobileLeft, onOpenMobileRight,"
r_destruct = r"isGenerating, hasShapes, onUndo, onRedo, canUndo, canRedo, onDuplicate, onGroup, onUngroup, onFlipH, onFlipV, onAlignShapes, isShapeSelected, onOpenMobileLeft, onOpenMobileRight,"
text = re.sub(s_destruct, r_destruct, text)

# Add to the Tools Menu in TopToolbar
s_menu = r"(<div className=\"w-full h-px bg-\[var\(--border-secondary\)\] my-1\"\>\<\/div\>\n\s*\<div className=\"relative\"\>)"
r_menu = r"<div className=\"w-full h-px bg-[var(--border-secondary)] my-1\"></div>\n                        <button \n                          onClick={() => { onFlipH(); setIsToolsMenuOpen(false); }} \n                          disabled={!isShapeSelected || isDistributingPath}\n                          className=\"flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text-primary)]\"\n                        >\n                          {t('menu.object.flipHorizontal') || 'Віддзеркалити по горизонталі'}\n                        </button>\n                        <button \n                          onClick={() => { onFlipV(); setIsToolsMenuOpen(false); }} \n                          disabled={!isShapeSelected || isDistributingPath}\n                          className=\"flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text-primary)]\"\n                        >\n                          {t('menu.object.flipVertical') || 'Віддзеркалити по вертикалі'}\n                        </button>\n                        \1"
text = re.sub(s_menu, r_menu, text)

# Add to the JSX instantiation of TopToolbar
s_inst = r"(onGroup=\{handleGroup\}\n\s*onUngroup=\{handleUngroup\})"
r_inst = r"\1\n              onFlipH={() => handleFlip('horizontal')}\n              onFlipV={() => handleFlip('vertical')}"
text = re.sub(s_inst, r_inst, text)

with open("App.tsx", "w") as f:
    f.write(text)
