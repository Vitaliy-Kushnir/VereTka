const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const targetStr = `<div className="px-3 py-1 flex flex-col gap-2">
                                        <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)]">
                                            <input type="checkbox" checked={orientAlongPath} onChange={(e) => setOrientAlongPath(e.target.checked)} />
                                            {t('tool.distribute.path.orient') || 'Орієнтувати вздовж шляху'}
                                        </label>
                                        {orientAlongPath && (
                                            <div className="flex flex-col gap-1 pl-5">
                                                <select
                                                     className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-[var(--text-primary)] text-xs rounded px-1 py-0.5 outline-none"
                                                    value={orientationType}
                                                    onChange={(e) => setOrientationType(e.target.value as any)}
                                                >
                                                    <option value="radial">{t('tool.distribute.path.orient.radial') || 'Радіально'}</option>
                                                    <option value="tangent">{t('tool.distribute.path.orient.tangent') || 'Дотично'}</option>
                                                    <option value="parallel">{t('tool.distribute.path.orient.parallel') || 'Вздовж лінії'}</option>
                                                    <option value="perpendicular">{t('tool.distribute.path.orient.perpendicular') || 'Перпендикулярно'}</option>
                                                    <option value="custom">{t('tool.distribute.path.orient.custom') || 'Під кутом'}</option>
                                                </select>
                                                {orientationType === 'custom' && (
                                                    <input
                                                         type="number"
                                                         className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-[var(--text-primary)] text-xs rounded px-1 py-0.5 w-16 outline-none"
                                                        value={Number.isNaN(orientationAngle) ? '' : orientationAngle}
                                                        onChange={(e) => setOrientationAngle(e.target.value === '' ? 0 : Number(e.target.value))}
                                                        min="-360" max="360"
                                                    />
                                                )}
                                            </div>
                                        )}
                                        <label className={\`flex items-center gap-2 text-xs cursor-pointer \${orientAlongPath ? 'text-[var(--text-tertiary)] cursor-not-allowed' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}\`}>
                                            <input type="checkbox" checked={rotateAlongPath} disabled={orientAlongPath} onChange={(e) => setRotateAlongPath(e.target.checked)} />
                                            {t('tool.distribute.path.rotate') || 'Обертати вздовж шляху'}
                                        </label>
                                    </div>`;

code = code.replace(targetStr, '');

// update onAlignShapes call to pass default values
const callTarget = `onClick={() => onAlignShapes('distribute-path', alignRelativeTo, { orientAlongPath, orientationType, orientationAngle, rotateAlongPath })}`;
const callInsert = `onClick={() => onAlignShapes('distribute-path', alignRelativeTo, { orientAlongPath: false, orientationType: 'radial', orientationAngle: 0, rotateAlongPath: false })}`;
code = code.replace(callTarget, callInsert);

fs.writeFileSync('App.tsx', code);
console.log('patched align menu');
