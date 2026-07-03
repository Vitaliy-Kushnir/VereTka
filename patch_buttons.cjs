const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const targetDup = `<button title={\`\${t('menu.edit.duplicate')} (Ctrl+D)\`} onClick={onDuplicate} disabled={!isShapeSelected}`;
const insertDup = `<button title={\`\${t('menu.edit.duplicate')} (Ctrl+D)\`} onClick={onDuplicate} disabled={!isShapeSelected || isDistributingPath}`;
code = code.replace(targetDup, insertDup);

const targetGrp = `onClick={() => { onGroup(); setIsToolsMenuOpen(false); }}
                          disabled={!isShapeSelected}`;
const insertGrp = `onClick={() => { onGroup(); setIsToolsMenuOpen(false); }}
                          disabled={!isShapeSelected || isDistributingPath}`;
code = code.replace(targetGrp, insertGrp);

const targetUgrp = `onClick={() => { onUngroup(); setIsToolsMenuOpen(false); }}
                          disabled={!isShapeSelected}`;
const insertUgrp = `onClick={() => { onUngroup(); setIsToolsMenuOpen(false); }}
                          disabled={!isShapeSelected || isDistributingPath}`;
code = code.replace(targetUgrp, insertUgrp);

const targetRelToSel = `<input type="radio" name="alignRelativeTo" checked={alignRelativeTo === 'selection'} onChange={() => setAlignRelativeTo('selection')} />`;
const insertRelToSel = `<input type="radio" name="alignRelativeTo" checked={alignRelativeTo === 'selection' && !isDistributingPath} disabled={isDistributingPath} onChange={() => setAlignRelativeTo('selection')} />`;
code = code.replace(targetRelToSel, insertRelToSel);

// When rendering the radio label, let's also dim it out if disabled.
const targetRelToSelLabel = `<label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)]">
                                            <input type="radio" name="alignRelativeTo" checked={alignRelativeTo === 'selection' && !isDistributingPath} disabled={isDistributingPath} onChange={() => setAlignRelativeTo('selection')} />`;
const insertRelToSelLabel = `<label className={\`flex items-center gap-2 text-xs text-[var(--text-secondary)] \${isDistributingPath ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:text-[var(--text-primary)]'}\`}>
                                            <input type="radio" name="alignRelativeTo" checked={alignRelativeTo === 'selection' && !isDistributingPath} disabled={isDistributingPath} onChange={() => setAlignRelativeTo('selection')} />`;
code = code.replace(targetRelToSelLabel, insertRelToSelLabel);

const targetDistH = `<button title={t('tool.distribute.h') || 'Розподілити горизонтально'} onClick={() => onAlignShapes('distribute-h', alignRelativeTo)} disabled={(alignRelativeTo === 'selection' && selectedShapes.length < 3) || (alignRelativeTo === 'canvas' && selectedShapes.length < 2)}`;
const insertDistH = `<button title={t('tool.distribute.h') || 'Розподілити горизонтально'} onClick={() => onAlignShapes('distribute-h', alignRelativeTo)} disabled={isDistributingPath || (alignRelativeTo === 'selection' && selectedShapes.length < 3) || (alignRelativeTo === 'canvas' && selectedShapes.length < 2)}`;
code = code.replace(targetDistH, insertDistH);

const targetDistV = `<button title={t('tool.distribute.v') || 'Розподілити вертикально'} onClick={() => onAlignShapes('distribute-v', alignRelativeTo)} disabled={(alignRelativeTo === 'selection' && selectedShapes.length < 3) || (alignRelativeTo === 'canvas' && selectedShapes.length < 2)}`;
const insertDistV = `<button title={t('tool.distribute.v') || 'Розподілити вертикально'} onClick={() => onAlignShapes('distribute-v', alignRelativeTo)} disabled={isDistributingPath || (alignRelativeTo === 'selection' && selectedShapes.length < 3) || (alignRelativeTo === 'canvas' && selectedShapes.length < 2)}`;
code = code.replace(targetDistV, insertDistV);

const targetDistPath = `<button title={t('tool.distribute.path') || 'Розподілити за шляхом'} onClick={() => onAlignShapes('distribute-path', alignRelativeTo, { orientAlongPath, orientationType, orientationAngle, rotateAlongPath })} disabled={selectedShapes.length < 2}`;
const insertDistPath = `<button title={t('tool.distribute.path') || 'Розподілити за шляхом'} onClick={() => onAlignShapes('distribute-path', alignRelativeTo, { orientAlongPath, orientationType, orientationAngle, rotateAlongPath })} disabled={isDistributingPath || selectedShapes.length < 2}`;
code = code.replace(targetDistPath, insertDistPath);

fs.writeFileSync('App.tsx', code);
console.log('patched TopToolbar buttons');
