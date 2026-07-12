const fs = require('fs');
let code = fs.readFileSync('components/PropertyEditor.tsx', 'utf8');

code = code.replace(/duplicateShape: \(id: string\) => void;/g, `duplicateShape: (id: string) => void;\n  onExtractFromGroup?: () => void;`);

code = code.replace(/import \{ DuplicateIcon, TrashIcon, LockIcon/g, `import { DuplicateIcon, TrashIcon, LockIcon, UngroupIcon`);

const buttonMatch = `<button onClick={() => duplicateShape(selectedShape.id)} title={t('menu.edit.duplicate')} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><DuplicateIcon size={18}/></button>`;
const buttonReplace = `<button onClick={() => duplicateShape(selectedShape.id)} title={t('menu.edit.duplicate')} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><DuplicateIcon size={18}/></button>
                {selectedShapes.some(s => s.groupId) && onExtractFromGroup && (
                    <button onClick={onExtractFromGroup} title={t('menu.edit.ungroup') || 'Вилучити з групи'} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><UngroupIcon size={18}/></button>
                )}`;
code = code.replace(buttonMatch, buttonReplace);

fs.writeFileSync('components/PropertyEditor.tsx', code);
console.log("PropertyEditor patched.");
