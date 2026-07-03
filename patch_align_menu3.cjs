const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const targetImport = `import { SquareIcon, CodeIcon, XIcon, AxesIcon, FitToScreenIcon, SelectIcon, EditPointsIcon, RectangleIcon, EllipseIcon, CircleIcon, LineIcon, PolylineIcon, BezierIcon, PolygonIcon, PencilIcon, TriangleIcon, RightTriangleIcon, RhombusIcon, TrapezoidIcon, ParallelogramIcon, PiesliceIcon, ChordIcon, ArcIcon, StarIcon, TextIcon, ImageIcon, BitmapIcon, UndoIcon, RedoIcon, DuplicateIcon, GroupIcon, UngroupIcon, ToolsIcon, TrashIcon, GridIcon, SettingsIcon, DrawFromCornerIcon, DrawFromCenterIcon, CheckIcon, MenuIcon, SunIcon, MoonIcon, HomeIcon, BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, SadMonitorIcon, FullscreenIcon, ExitFullscreenIcon, AlignShapesLeftIcon, AlignShapesCenterHIcon, AlignShapesRightIcon, AlignShapesTopIcon, AlignShapesCenterVIcon, AlignShapesBottomIcon, DistributeHorizontalIcon, DistributeVerticalIcon, ChevronDownIcon, ChevronRightIcon } from './components/icons';`;
const insertImport = `import { SquareIcon, CodeIcon, XIcon, AxesIcon, FitToScreenIcon, SelectIcon, EditPointsIcon, RectangleIcon, EllipseIcon, CircleIcon, LineIcon, PolylineIcon, BezierIcon, PolygonIcon, PencilIcon, TriangleIcon, RightTriangleIcon, RhombusIcon, TrapezoidIcon, ParallelogramIcon, PiesliceIcon, ChordIcon, ArcIcon, StarIcon, TextIcon, ImageIcon, BitmapIcon, UndoIcon, RedoIcon, DuplicateIcon, GroupIcon, UngroupIcon, ToolsIcon, TrashIcon, GridIcon, SettingsIcon, DrawFromCornerIcon, DrawFromCenterIcon, CheckIcon, MenuIcon, SunIcon, MoonIcon, HomeIcon, BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, SadMonitorIcon, FullscreenIcon, ExitFullscreenIcon, AlignShapesLeftIcon, AlignShapesCenterHIcon, AlignShapesRightIcon, AlignShapesTopIcon, AlignShapesCenterVIcon, AlignShapesBottomIcon, DistributeHorizontalIcon, DistributeVerticalIcon, ChevronDownIcon, ChevronRightIcon, DistributePathIcon } from './components/icons';`;

const targetMenu = `                                    <div className="w-full h-px bg-[var(--border-secondary)] my-2"></div>
                                    <div className="grid grid-cols-2 gap-1 px-2 pb-1">
                                        <button title={t('tool.distribute.h') || 'Розподілити горизонтально'} onClick={() => onAlignShapes('distribute-h', alignRelativeTo)} disabled={isDistributingPath || (alignRelativeTo === 'selection' && selectedShapes.length < 3) || (alignRelativeTo === 'canvas' && selectedShapes.length < 2)} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50 flex justify-center"><DistributeHorizontalIcon /></button>
                                        <button title={t('tool.distribute.v') || 'Розподілити вертикально'} onClick={() => onAlignShapes('distribute-v', alignRelativeTo)} disabled={isDistributingPath || (alignRelativeTo === 'selection' && selectedShapes.length < 3) || (alignRelativeTo === 'canvas' && selectedShapes.length < 2)} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50 flex justify-center"><DistributeVerticalIcon /></button>
                                    </div>
                                    <div className="w-full h-px bg-[var(--border-secondary)] my-2"></div>
                                    <div className="grid grid-cols-1 gap-1 px-2 pb-1 mt-1">
                                        <button title={t('tool.distribute.path') || 'Розподілити за шляхом'} onClick={() => onAlignShapes('distribute-path', alignRelativeTo, { orientAlongPath: false, orientationType: 'radial', orientationAngle: 0, rotateAlongPath: false })} disabled={isDistributingPath || selectedShapes.length < 2} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50 flex justify-center items-center gap-2">
                                            <CircleIcon /> {t('tool.distribute.path') || 'Розподілити за шляхом'}
                                        </button>
                                    </div>`;

const insertMenu = `                                    <div className="w-full h-px bg-[var(--border-secondary)] my-2"></div>
                                    <div className="grid grid-cols-3 gap-1 px-2 pb-1">
                                        <button title={t('tool.distribute.h') || 'Розподілити горизонтально'} onClick={() => onAlignShapes('distribute-h', alignRelativeTo)} disabled={isDistributingPath || (alignRelativeTo === 'selection' && selectedShapes.length < 3) || (alignRelativeTo === 'canvas' && selectedShapes.length < 2)} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50 flex justify-center"><DistributeHorizontalIcon /></button>
                                        <button title={t('tool.distribute.v') || 'Розподілити вертикально'} onClick={() => onAlignShapes('distribute-v', alignRelativeTo)} disabled={isDistributingPath || (alignRelativeTo === 'selection' && selectedShapes.length < 3) || (alignRelativeTo === 'canvas' && selectedShapes.length < 2)} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50 flex justify-center"><DistributeVerticalIcon /></button>
                                        <button title={t('tool.distribute.path') || 'Розподілити за шляхом'} onClick={() => onAlignShapes('distribute-path', alignRelativeTo, { orientAlongPath: false, orientationType: 'radial', orientationAngle: 0, rotateAlongPath: false })} disabled={isDistributingPath || selectedShapes.length < 2} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50 flex justify-center"><DistributePathIcon /></button>
                                    </div>`;

if (code.includes(targetImport) && code.includes(targetMenu)) {
    code = code.replace(targetImport, insertImport);
    code = code.replace(targetMenu, insertMenu);
    fs.writeFileSync('App.tsx', code);
    console.log('patched align menu successfully');
} else {
    console.log('Targets not found in App.tsx!');
}
