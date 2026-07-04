const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const distTopComponent = `
const DistributePathTopControls: React.FC<{ distributePathState: DistributePathState, onDistributePathChange: (s: DistributePathState) => void }> = ({ distributePathState, onDistributePathChange }) => {
    const { t } = useLanguage();
    return (
        <div className="flex items-center gap-3">
             <PropertyControl label={t('prop.pathType') || 'Тип шляху'} htmlFor="dist-path-type">
                  <Select id="dist-path-type" className="w-24 py-1" value={distributePathState.type} onChange={(v) => {
                      const newType = v as 'circle' | 'line';
                      let newOrientationType = distributePathState.orientationType;
                      if (newType === 'circle' && (newOrientationType === 'parallel' || newOrientationType === 'perpendicular')) {
                          newOrientationType = newOrientationType === 'parallel' ? 'tangent' : 'radial';
                      } else if (newType === 'line' && (newOrientationType === 'tangent' || newOrientationType === 'radial')) {
                          newOrientationType = newOrientationType === 'tangent' ? 'parallel' : 'perpendicular';
                      }
                      onDistributePathChange({ ...distributePathState, type: newType, orientationType: newOrientationType });
                  }}>
                      <option value="circle">{t('tool.distribute.path.circle') || 'Коло'}</option>
                      <option value="line">{t('tool.distribute.path.line') || 'Лінія'}</option>
                  </Select>
             </PropertyControl>
             
             <PropertyControl label={t('prop.orientAlongPath') || 'Орієнтувати'} htmlFor="dist-orient-check">
                  <input type="checkbox" id="dist-orient-check" checked={!!distributePathState.orientAlongPath} onChange={(e) => onDistributePathChange({ ...distributePathState, orientAlongPath: e.target.checked })} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" />
             </PropertyControl>

             {distributePathState.orientAlongPath && (
                  <PropertyControl label="" htmlFor="dist-orient-type">
                      <Select id="dist-orient-type" className="w-28 py-1" value={distributePathState.orientationType} onChange={(v) => onDistributePathChange({ ...distributePathState, orientationType: v as any })}>
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
                  </PropertyControl>
             )}

             <PropertyControl label={t('prop.rotateAlongPath') || 'Обертати'} htmlFor="dist-rotate-check" className={distributePathState.orientAlongPath ? 'opacity-50 pointer-events-none' : ''}>
                  <input type="checkbox" id="dist-rotate-check" checked={!!distributePathState.rotateAlongPath} disabled={!!distributePathState.orientAlongPath} onChange={(e) => onDistributePathChange({ ...distributePathState, rotateAlongPath: e.target.checked })} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" />
             </PropertyControl>
        </div>
    );
};
`;

const insertPoint = `const TopToolbar: React.FC<{`;
if (code.includes(insertPoint)) {
    code = code.replace(insertPoint, distTopComponent + '\n' + insertPoint);
    fs.writeFileSync('App.tsx', code);
    console.log('injected DistributePathTopControls');
}
