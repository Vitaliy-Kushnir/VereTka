const fs = require('fs');
let code = fs.readFileSync('components/PropertyEditor.tsx', 'utf-8');

const targetSection = `  if (distributePathState && onDistributePathChange && onConfirmDistributePath && onCancelDistributePath) {
      return (
          <div className="bg-[var(--bg-primary)] p-4 rounded-lg shadow-lg h-full flex flex-col border border-[var(--border-primary)]">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border-secondary)]">
                  <h2 className="font-semibold text-[var(--text-primary)] text-sm flex items-center gap-2">
                      <CircleIcon size={16} /> {t('tool.distribute.path') || 'Розподіл за шляхом'}
                  </h2>
                  <div className="flex gap-2">
                      <button onClick={onConfirmDistributePath} className="p-1 rounded-md text-green-500 hover:bg-green-500/10" title={t('action.apply') || 'Застосувати'}><CheckIcon size={18} /></button>
                      <button onClick={onCancelDistributePath} className="p-1 rounded-md text-red-500 hover:bg-red-500/10" title={t('action.cancel') || 'Скасувати'}><XIcon size={18} /></button>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar text-sm">
                  {/* Type */}
                  <PropertyControl label={t('prop.pathType') || 'Тип шляху'} htmlFor="dist-type">
                      <Select 
                          id="dist-type"
                          value={distributePathState.type}
                          onChange={v => {
                              const newType = v as 'circle' | 'line';
                              let newOrientationType = distributePathState.orientationType;
                              if (newType === 'circle' && (newOrientationType === 'parallel' || newOrientationType === 'perpendicular')) {
                                  newOrientationType = newOrientationType === 'parallel' ? 'tangent' : 'radial';
                              } else if (newType === 'line' && (newOrientationType === 'tangent' || newOrientationType === 'radial')) {
                                  newOrientationType = newOrientationType === 'tangent' ? 'parallel' : 'perpendicular';
                              }
                              onDistributePathChange({ ...distributePathState, type: newType, orientationType: newOrientationType });
                          }}
                      >
                          <option value="circle">{t('tool.distribute.path.circle') || 'Коло'}</option>
                          <option value="line">{t('tool.distribute.path.line') || 'Лінія'}</option>
                      </Select>
                  </PropertyControl>

                  {/* Offset Angle */}
                  <PropertyControl label={t('prop.angleOffset') || 'Початковий кут'} htmlFor="dist-offset">
                      <div className="flex-1 flex gap-2 items-center">
                          <RangeInput min={-180} max={180} step={1} value={distributePathState.angleOffset || 0} onChange={v => onDistributePathChange({ ...distributePathState, angleOffset: v })} />
                          <div className="w-16">
                              <NumberInput value={Math.round(distributePathState.angleOffset || 0)} onChange={v => onDistributePathChange({ ...distributePathState, angleOffset: v })} />
                          </div>
                      </div>
                  </PropertyControl>

                  {/* Orient along path */}
                  <div className="flex items-center gap-2">
                      <input type="checkbox" id="dist-orient-check" 
                          checked={!!distributePathState.orientAlongPath}
                          onChange={(e) => onDistributePathChange({ ...distributePathState, orientAlongPath: e.target.checked })}
                          className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] bg-[var(--bg-primary)] border-[var(--border-primary)]"
                      />
                      <Label htmlFor="dist-orient-check" className="mb-0 cursor-pointer">{t('prop.orientAlongPath') || 'Орієнтувати за шляхом'}</Label>
                  </div>

                  {distributePathState.orientAlongPath && (
                      <div className="pl-6 space-y-3">
                          <Select 
                              value={distributePathState.orientationType}
                              onChange={(v) => onDistributePathChange({ ...distributePathState, orientationType: v as any })}
                          >
                              {distributePathState.type === 'circle' ? (
                                  <>
                                      <option value="radial">{t('tool.distribute.path.radial') || 'Радіально'}</option>
                                      <option value="tangent">{t('tool.distribute.path.tangent') || 'Дотично'}</option>
                                      <option value="custom">{t('tool.distribute.path.customAngle') || 'Власний кут'}</option>
                                  </>
                              ) : (
                                  <>
                                      <option value="parallel">{t('tool.distribute.path.parallel') || 'Паралельно'}</option>
                                      <option value="perpendicular">{t('tool.distribute.path.perpendicular') || 'Перпендикулярно'}</option>
                                      <option value="custom">{t('tool.distribute.path.customAngle') || 'Власний кут'}</option>
                                  </>
                              )}
                          </Select>
                          
                          {distributePathState.orientationType === 'custom' && (
                              <div className="flex-1 flex gap-2 items-center">
                                  <NumberInput 
                                      value={Number.isNaN(distributePathState.orientationAngle) ? '' : distributePathState.orientationAngle} 
                                      onChange={v => onDistributePathChange({ ...distributePathState, orientationAngle: v })} 
                                      placeholder="Кут"
                                  />
                                  <span className="text-xs text-[var(--text-secondary)]">°</span>
                              </div>
                          )}
                      </div>
                  )}

                  {/* Rotate along path */}
                  <div className="flex items-center gap-2 mt-4">
                      <input type="checkbox" id="dist-rotate-check" 
                          checked={!!distributePathState.rotateAlongPath}
                          disabled={!!distributePathState.orientAlongPath}
                          onChange={(e) => onDistributePathChange({ ...distributePathState, rotateAlongPath: e.target.checked })}
                          className={\`rounded border-[var(--border-primary)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] bg-[var(--bg-primary)] \${distributePathState.orientAlongPath ? 'opacity-50 cursor-not-allowed' : ''}\`}
                      />
                      <Label htmlFor="dist-rotate-check" className={\`mb-0 \${distributePathState.orientAlongPath ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}\`}>
                          {t('prop.rotateAlongPath') || 'Обертати фігури'}
                      </Label>
                  </div>

                  <hr className="border-[var(--border-secondary)] my-4" />
                  
                  {/* Path geometry parameters */}
                  {distributePathState.type === 'circle' && (
                      <div className="space-y-3">
                          <Label className="font-semibold text-[var(--text-primary)]">{t('prop.circleParams') || 'Параметри кола'}</Label>
                          <PropertyControl label="CX" htmlFor="cx">
                              <NumberInput value={Math.round(distributePathState.circleParams.cx)} onChange={v => onDistributePathChange({ ...distributePathState, circleParams: { ...distributePathState.circleParams, cx: v } })} />
                          </PropertyControl>
                          <PropertyControl label="CY" htmlFor="cy">
                              <NumberInput value={Math.round(distributePathState.circleParams.cy)} onChange={v => onDistributePathChange({ ...distributePathState, circleParams: { ...distributePathState.circleParams, cy: v } })} />
                          </PropertyControl>
                          <PropertyControl label="Radius" htmlFor="r">
                              <NumberInput value={Math.round(distributePathState.circleParams.radius)} onChange={v => onDistributePathChange({ ...distributePathState, circleParams: { ...distributePathState.circleParams, radius: Math.max(10, v) } })} />
                          </PropertyControl>
                      </div>
                  )}
                  {distributePathState.type === 'line' && (
                      <div className="space-y-3">
                          <Label className="font-semibold text-[var(--text-primary)]">{t('prop.lineParams') || 'Параметри лінії'}</Label>
                          <PropertyControl label="X1" htmlFor="x1">
                              <NumberInput value={Math.round(distributePathState.lineParams.x1)} onChange={v => onDistributePathChange({ ...distributePathState, lineParams: { ...distributePathState.lineParams, x1: v } })} />
                          </PropertyControl>
                          <PropertyControl label="Y1" htmlFor="y1">
                              <NumberInput value={Math.round(distributePathState.lineParams.y1)} onChange={v => onDistributePathChange({ ...distributePathState, lineParams: { ...distributePathState.lineParams, y1: v } })} />
                          </PropertyControl>
                          <PropertyControl label="X2" htmlFor="x2">
                              <NumberInput value={Math.round(distributePathState.lineParams.x2)} onChange={v => onDistributePathChange({ ...distributePathState, lineParams: { ...distributePathState.lineParams, x2: v } })} />
                          </PropertyControl>
                          <PropertyControl label="Y2" htmlFor="y2">
                              <NumberInput value={Math.round(distributePathState.lineParams.y2)} onChange={v => onDistributePathChange({ ...distributePathState, lineParams: { ...distributePathState.lineParams, y2: v } })} />
                          </PropertyControl>
                      </div>
                  )}

              </div>
          </div>
      );
  }`;

const insertSection = `  if (distributePathState && onDistributePathChange && onConfirmDistributePath && onCancelDistributePath) {
      return (
          <div className="bg-[var(--bg-primary)] p-4 rounded-lg shadow-lg h-full flex flex-col border border-[var(--border-primary)]">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border-secondary)]">
                  <h2 className="font-semibold text-[var(--text-primary)] text-sm flex items-center gap-2">
                      <CircleIcon size={16} /> {t('tool.distribute.path') || 'Розподіл за шляхом'}
                  </h2>
                  <div className="flex gap-2">
                      <button onClick={onConfirmDistributePath} className="p-1 rounded-md text-green-500 hover:bg-green-500/10" title={t('action.apply') || 'Застосувати'}><CheckIcon size={18} /></button>
                      <button onClick={onCancelDistributePath} className="p-1 rounded-md text-red-500 hover:bg-red-500/10" title={t('action.cancel') || 'Скасувати'}><XIcon size={18} /></button>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar text-sm">
                  
                  {/* Offset Angle */}
                  <PropertyControl label={t('prop.angleOffset') || 'Початковий кут'} htmlFor="dist-offset">
                      <div className="flex-1 flex gap-2 items-center">
                          <RangeInput min={-180} max={180} step={1} value={distributePathState.angleOffset || 0} onChange={v => onDistributePathChange({ ...distributePathState, angleOffset: v })} />
                          <div className="w-16">
                              <NumberInput value={Math.round(distributePathState.angleOffset || 0)} onChange={v => onDistributePathChange({ ...distributePathState, angleOffset: v })} />
                          </div>
                      </div>
                  </PropertyControl>
                  
                  {distributePathState.orientAlongPath && distributePathState.orientationType === 'custom' && (
                      <PropertyControl label={t('prop.orientationAngle') || 'Кут орієнтації'} htmlFor="dist-orient-angle">
                          <div className="flex-1 flex gap-2 items-center">
                              <NumberInput 
                                  value={Number.isNaN(distributePathState.orientationAngle) ? '' : distributePathState.orientationAngle} 
                                  onChange={v => onDistributePathChange({ ...distributePathState, orientationAngle: v })} 
                                  placeholder="Кут"
                              />
                              <span className="text-xs text-[var(--text-secondary)]">°</span>
                          </div>
                      </PropertyControl>
                  )}

                  <hr className="border-[var(--border-secondary)] my-4" />
                  
                  {/* Path geometry parameters */}
                  {distributePathState.type === 'circle' && (
                      <div className="space-y-3">
                          <Label className="font-semibold text-[var(--text-primary)]">{t('prop.circleParams') || 'Параметри кола'}</Label>
                          <PropertyControl label="CX" htmlFor="cx">
                              <NumberInput value={Math.round(distributePathState.circleParams.cx)} onChange={v => onDistributePathChange({ ...distributePathState, circleParams: { ...distributePathState.circleParams, cx: v } })} />
                          </PropertyControl>
                          <PropertyControl label="CY" htmlFor="cy">
                              <NumberInput value={Math.round(distributePathState.circleParams.cy)} onChange={v => onDistributePathChange({ ...distributePathState, circleParams: { ...distributePathState.circleParams, cy: v } })} />
                          </PropertyControl>
                          <PropertyControl label="Radius" htmlFor="r">
                              <NumberInput value={Math.round(distributePathState.circleParams.radius)} onChange={v => onDistributePathChange({ ...distributePathState, circleParams: { ...distributePathState.circleParams, radius: Math.max(10, v) } })} />
                          </PropertyControl>
                      </div>
                  )}
                  {distributePathState.type === 'line' && (
                      <div className="space-y-3">
                          <Label className="font-semibold text-[var(--text-primary)]">{t('prop.lineParams') || 'Параметри лінії'}</Label>
                          <PropertyControl label="X1" htmlFor="x1">
                              <NumberInput value={Math.round(distributePathState.lineParams.x1)} onChange={v => onDistributePathChange({ ...distributePathState, lineParams: { ...distributePathState.lineParams, x1: v } })} />
                          </PropertyControl>
                          <PropertyControl label="Y1" htmlFor="y1">
                              <NumberInput value={Math.round(distributePathState.lineParams.y1)} onChange={v => onDistributePathChange({ ...distributePathState, lineParams: { ...distributePathState.lineParams, y1: v } })} />
                          </PropertyControl>
                          <PropertyControl label="X2" htmlFor="x2">
                              <NumberInput value={Math.round(distributePathState.lineParams.x2)} onChange={v => onDistributePathChange({ ...distributePathState, lineParams: { ...distributePathState.lineParams, x2: v } })} />
                          </PropertyControl>
                          <PropertyControl label="Y2" htmlFor="y2">
                              <NumberInput value={Math.round(distributePathState.lineParams.y2)} onChange={v => onDistributePathChange({ ...distributePathState, lineParams: { ...distributePathState.lineParams, y2: v } })} />
                          </PropertyControl>
                      </div>
                  )}

              </div>
          </div>
      );
  }`;

if (code.includes(targetSection)) {
    code = code.replace(targetSection, insertSection);
    fs.writeFileSync('components/PropertyEditor.tsx', code);
    console.log('patched PropertyEditor successfully');
} else {
    console.log('Target section not found in PropertyEditor.tsx!');
}
