import re

with open("components/PropertyEditor.tsx", "r") as f:
    text = f.read()

s = """              <div className="flex items-center gap-1">
                 {selectedShapes.some(s => s.groupId) && onExtractFromGroup && (<button onClick={onExtractFromGroup} title={t('menu.edit.extractFromGroup') || 'Вилучити із групи'} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><UngroupIcon size={18}/></button>)}
              </div>"""

r = """              <div className="flex items-center gap-1">
                 {handleFlip && (
                     <>
                         <button onClick={() => handleFlip('horizontal')} title={t('menu.edit.flipH') || 'Віддзеркалити по горизонталі (Shift+H)'} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><FlipHorizontalIcon size={18}/></button>
                         <button onClick={() => handleFlip('vertical')} title={t('menu.edit.flipV') || 'Віддзеркалити по вертикалі (Shift+V)'} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><FlipVerticalIcon size={18}/></button>
                     </>
                 )}
                 {selectedShapes.some(s => s.groupId) && onExtractFromGroup && (<button onClick={onExtractFromGroup} title={t('menu.edit.extractFromGroup') || 'Вилучити із групи'} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><UngroupIcon size={18}/></button>)}
              </div>"""

if s in text:
    text = text.replace(s, r)
    with open("components/PropertyEditor.tsx", "w") as f:
        f.write(text)
else:
    print("Could not find string")

