import React, { useState, useEffect, useMemo } from 'react';
import { 
    AlignShapesLeftIcon, 
    AlignShapesCenterHIcon, 
    AlignShapesRightIcon, 
    AlignShapesTopIcon, 
    AlignShapesCenterVIcon, 
    AlignShapesBottomIcon, 
    DistributeHorizontalIcon, 
    DistributeVerticalIcon,
    DistributePathIcon,
    CheckIcon,
    XIcon
} from '../icons';
import { Shape, DistributePathState, PolygonShape } from '../../types';
import { isShapeClosed } from '../../lib/geometry';
import { useLanguage } from '../LanguageContext';

export interface MobileAlignSheetProps {
    selectedShapes: Shape[];
    allShapes?: Shape[];
    canvasWidth: number;
    canvasHeight: number;
    onAlignShapes: (
        alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom' | 'center-both' | 'distribute-h' | 'distribute-v' | 'distribute-path', 
        relativeTo: 'selection' | 'canvas',
        distributeOptions?: {
            orientAlongPath: boolean;
            orientationType: 'radial' | 'tangent' | 'parallel' | 'perpendicular' | 'custom';
            orientationAngle: number;
            rotateAlongPath: boolean;
        }
    ) => void;
    distributePathState?: DistributePathState | null;
    onDistributePathChange?: (state: DistributePathState) => void;
    onConfirmDistributePath?: () => void;
    onCancelDistributePath?: () => void;
    onClose?: () => void;
}

export const MobileAlignSheet: React.FC<MobileAlignSheetProps> = ({
    selectedShapes,
    allShapes = [],
    canvasWidth,
    canvasHeight,
    onAlignShapes,
    distributePathState,
    onDistributePathChange,
    onConfirmDistributePath,
    onCancelDistributePath
}) => {
    const { t } = useLanguage();
    const count = selectedShapes.length;

    // Default to 'canvas' if 1 shape, or 'selection' if 2+ shapes
    const [alignRelativeTo, setAlignRelativeTo] = useState<'selection' | 'canvas'>(
        count >= 2 && !distributePathState ? 'selection' : 'canvas'
    );

    // Distribute path settings
    const [orientAlongPath, setOrientAlongPath] = useState(distributePathState?.orientAlongPath ?? false);
    const [orientationType, setOrientationType] = useState<'radial' | 'tangent' | 'parallel' | 'perpendicular' | 'custom'>(
        distributePathState?.orientationType ?? 'radial'
    );
    const [orientationAngle, setOrientationAngle] = useState(distributePathState?.orientationAngle ?? 0);
    const [rotateAlongPath, setRotateAlongPath] = useState(distributePathState?.rotateAlongPath ?? false);

    useEffect(() => {
        if (distributePathState) {
            setAlignRelativeTo('canvas');
            setOrientAlongPath(distributePathState.orientAlongPath ?? false);
            setOrientationType(distributePathState.orientationType ?? 'radial');
            setOrientationAngle(distributePathState.orientationAngle ?? 0);
            setRotateAlongPath(distributePathState.rotateAlongPath ?? false);
        } else if (count === 1) {
            setAlignRelativeTo('canvas');
        }
    }, [distributePathState, count]);

    const isDistributingPath = !!distributePathState;

    // Filter candidate shapes for "Фігура (контур)"
    const candidatePathShapes = useMemo(() => {
        if (!distributePathState) return [];
        const entityIds = new Set(distributePathState.entities.flatMap(e => e.ids));
        return allShapes.filter(s => 
            !entityIds.has(s.id) &&
            s.type !== 'text' &&
            s.type !== 'group' &&
            !s.groupId
        );
    }, [allShapes, distributePathState]);

    // Center both axes to canvas helper
    const handleCenterOnCanvas = () => {
        onAlignShapes('center-both', 'canvas');
    };

    const handleStartPathDistribute = () => {
        onAlignShapes('distribute-path', alignRelativeTo, {
            orientAlongPath,
            orientationType,
            orientationAngle,
            rotateAlongPath
        });
    };

    // Validation rules
    const canAlignSelection = count >= 2;
    const canDistributeHSelection = count >= 3;
    const canDistributeVSelection = count >= 3;
    const canDistributeHCanvas = count >= 2;
    const canDistributeVCanvas = count >= 2;
    const canDistributePath = count >= 2;

    return (
        <div className="flex flex-col w-full space-y-4 pb-6">
                {/* Active Path Distribution Mode Banner */}
                {isDistributingPath && distributePathState && onDistributePathChange && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <DistributePathIcon size={18} className="text-amber-500 animate-spin-slow" />
                                <span className="text-xs font-bold text-amber-500 uppercase tracking-wide">
                                    {t('tool.distributePath.title') || 'Режим розподілу за шляхом'}
                                </span>
                            </div>
                            <span className="text-[11px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-medium">
                                {t('mobile.align.active') || 'Активно'}
                            </span>
                        </div>

                        {/* Path Type Selector - 3 Types: Circle, Line, Shape */}
                        <div className="space-y-1">
                            <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">
                                {t('tool.distributePath.type') || 'Тип шляху'}:
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        let newOrientation = distributePathState.orientationType;
                                        if (newOrientation === 'parallel' || newOrientation === 'perpendicular') {
                                            newOrientation = newOrientation === 'parallel' ? 'tangent' : 'radial';
                                        }
                                        onDistributePathChange({
                                            ...distributePathState,
                                            type: 'circle',
                                            orientationType: newOrientation
                                        });
                                    }}
                                    className={`py-2 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 transition-all ${
                                        distributePathState.type === 'circle'
                                            ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] border-transparent font-bold shadow-xs'
                                            : 'bg-[var(--bg-primary)] border-[var(--border-secondary)] text-[var(--text-secondary)]'
                                    }`}
                                >
                                    <span>{t('tool.distribute.path.circle') || 'Коло'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        let newOrientation = distributePathState.orientationType;
                                        if (newOrientation === 'radial' || newOrientation === 'tangent') {
                                            newOrientation = newOrientation === 'radial' ? 'perpendicular' : 'parallel';
                                        }
                                        onDistributePathChange({
                                            ...distributePathState,
                                            type: 'line',
                                            orientationType: newOrientation
                                        });
                                    }}
                                    className={`py-2 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 transition-all ${
                                        distributePathState.type === 'line'
                                            ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] border-transparent font-bold shadow-xs'
                                            : 'bg-[var(--bg-primary)] border-[var(--border-secondary)] text-[var(--text-secondary)]'
                                    }`}
                                >
                                    <span>{t('tool.distribute.path.line') || 'Пряма'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        let newOrientation = distributePathState.orientationType;
                                        if (newOrientation === 'radial' || newOrientation === 'tangent') {
                                            newOrientation = newOrientation === 'radial' ? 'perpendicular' : 'parallel';
                                        }
                                        const updated: DistributePathState = {
                                            ...distributePathState,
                                            type: 'shape',
                                            orientationType: newOrientation
                                        };
                                        if (!updated.shapePathParams) {
                                            // Automatically select first candidate shape if available
                                            const firstCandidate = candidatePathShapes[0];
                                            updated.shapePathParams = {
                                                shapeId: firstCandidate?.id,
                                                pathShape: firstCandidate ? { ...firstCandidate } : undefined,
                                                keepShape: true,
                                                isExisting: !!firstCandidate
                                            };
                                        }
                                        onDistributePathChange(updated);
                                    }}
                                    className={`py-2 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 transition-all ${
                                        distributePathState.type === 'shape'
                                            ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] border-transparent font-bold shadow-xs'
                                            : 'bg-[var(--bg-primary)] border-[var(--border-secondary)] text-[var(--text-secondary)]'
                                    }`}
                                >
                                    <span>{t('tool.distribute.path.shape') || 'Фігура'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Shape Path Controls */}
                        {distributePathState.type === 'shape' && (
                            <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-secondary)] space-y-2.5">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                                        <span className="font-semibold">{t('tool.distribute.path.shape') || 'Фігура-шлях'}:</span>
                                        {distributePathState.shapePathParams?.pathShape && (
                                            <span className="text-[11px] text-amber-500 font-medium">
                                                {distributePathState.shapePathParams.pathShape.name || distributePathState.shapePathParams.pathShape.type}
                                            </span>
                                        )}
                                    </div>

                                    {/* Shape Selector Dropdown */}
                                    <select
                                        value={distributePathState.shapePathParams?.shapeId || ''}
                                        onChange={(e) => {
                                            const shapeId = e.target.value;
                                            const foundShape = candidatePathShapes.find(s => s.id === shapeId);
                                            onDistributePathChange({
                                                ...distributePathState,
                                                shapePathParams: {
                                                    ...distributePathState.shapePathParams,
                                                    shapeId: shapeId || undefined,
                                                    pathShape: foundShape ? { ...foundShape } : undefined,
                                                    keepShape: distributePathState.shapePathParams?.keepShape ?? true,
                                                    isExisting: !!foundShape
                                                }
                                            });
                                        }}
                                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] font-medium"
                                    >
                                        <option value="">
                                            {candidatePathShapes.length === 0 
                                                ? t('mobile.align.noShapes') || 'Немає доступних фігур (намалюйте на полотні)' 
                                                : t('mobile.align.selectShapeContour') || '-- Оберіть фігуру як контур --'}
                                        </option>
                                        {candidatePathShapes.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name || s.type} (#{s.id.slice(0, 4)})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Keep Shape Checkbox */}
                                <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                                    <input
                                        type="checkbox"
                                        checked={distributePathState.shapePathParams?.keepShape ?? true}
                                        onChange={(e) => {
                                            onDistributePathChange({
                                                ...distributePathState,
                                                shapePathParams: {
                                                    ...distributePathState.shapePathParams,
                                                    keepShape: e.target.checked
                                                }
                                            });
                                        }}
                                        className="w-4 h-4 rounded accent-[var(--accent-primary)]"
                                    />
                                    <span className="text-xs font-medium text-[var(--text-primary)]">
                                        {t('tool.distribute.path.keepShape') || 'Залишити фігуру-шлях на полотні'}
                                    </span>
                                </label>

                                {/* Polygon / Star Sides */}
                                {distributePathState.shapePathParams?.pathShape && 
                                 (distributePathState.shapePathParams.pathShape.type === 'polygon' || distributePathState.shapePathParams.pathShape.type === 'star') && (
                                    <div className="space-y-1 pt-1 border-t border-[var(--border-secondary)]/60">
                                        <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                                            <span>{t('prop.sides') || 'Кількість сторін/променів'}:</span>
                                            <strong className="text-[var(--text-primary)]">{(distributePathState.shapePathParams.pathShape as PolygonShape).sides}</strong>
                                        </div>
                                        <input
                                            type="range"
                                            min="3"
                                            max="24"
                                            value={(distributePathState.shapePathParams.pathShape as PolygonShape).sides || 5}
                                            onChange={(e) => {
                                                onDistributePathChange({
                                                    ...distributePathState,
                                                    shapePathParams: {
                                                        ...distributePathState.shapePathParams,
                                                        pathShape: {
                                                            ...distributePathState.shapePathParams!.pathShape!,
                                                            sides: Number(e.target.value)
                                                        } as any
                                                    }
                                                });
                                            }}
                                            className="w-full accent-[var(--accent-primary)]"
                                        />
                                    </div>
                                )}

                                {/* Star Inner Radius */}
                                {distributePathState.shapePathParams?.pathShape && distributePathState.shapePathParams.pathShape.type === 'star' && (
                                    <div className="space-y-1 pt-1">
                                        <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                                            <span>{t('prop.innerRadius') || 'Внутрішній радіус'}:</span>
                                            <strong className="text-[var(--text-primary)]">
                                                {Math.round((distributePathState.shapePathParams.pathShape as PolygonShape).innerRadius ?? ((distributePathState.shapePathParams.pathShape as PolygonShape).radius / 2))} px
                                            </strong>
                                        </div>
                                        <input
                                            type="range"
                                            min="5"
                                            max={Math.round((distributePathState.shapePathParams.pathShape as PolygonShape).radius || 100)}
                                            value={Math.round((distributePathState.shapePathParams.pathShape as PolygonShape).innerRadius ?? ((distributePathState.shapePathParams.pathShape as PolygonShape).radius / 2))}
                                            onChange={(e) => {
                                                onDistributePathChange({
                                                    ...distributePathState,
                                                    shapePathParams: {
                                                        ...distributePathState.shapePathParams,
                                                        pathShape: {
                                                            ...distributePathState.shapePathParams!.pathShape!,
                                                            innerRadius: Number(e.target.value)
                                                        } as any
                                                    }
                                                });
                                            }}
                                            className="w-full accent-[var(--accent-primary)]"
                                        />
                                    </div>
                                )}

                                {/* Closed Shape Contour Shift */}
                                {distributePathState.shapePathParams?.pathShape && isShapeClosed(distributePathState.shapePathParams.pathShape) && (
                                    <div className="space-y-1 pt-1 border-t border-[var(--border-secondary)]/60">
                                        <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                                            <span>{t('tool.distribute.path.contourShift') || 'Зсув вздовж шляху'}:</span>
                                            <strong className="text-[var(--text-primary)]">{Math.round(distributePathState.shapePathParams?.contourShift || 0)}%</strong>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={Math.round(distributePathState.shapePathParams?.contourShift || 0)}
                                            onChange={(e) => {
                                                onDistributePathChange({
                                                    ...distributePathState,
                                                    shapePathParams: {
                                                        ...distributePathState.shapePathParams,
                                                        contourShift: Number(e.target.value)
                                                    }
                                                });
                                            }}
                                            className="w-full accent-[var(--accent-primary)]"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Circle Radius Slider */}
                        {distributePathState.type === 'circle' && (
                            <div className="space-y-1.5 pt-1">
                                <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                                    <span>{t('prop.radius') || 'Радіус кола'}:</span>
                                    <strong className="text-[var(--text-primary)]">{Math.round(distributePathState.circleParams?.radius ?? 100)} px</strong>
                                </div>
                                <input
                                    type="range"
                                    min="30"
                                    max={Math.max(300, Math.min(canvasWidth, canvasHeight) / 2)}
                                    value={Math.round(distributePathState.circleParams?.radius ?? 100)}
                                    onChange={(e) => {
                                        onDistributePathChange({
                                            ...distributePathState,
                                            circleParams: {
                                                ...distributePathState.circleParams,
                                                radius: Number(e.target.value)
                                            }
                                        });
                                    }}
                                    className="w-full accent-[var(--accent-primary)]"
                                />
                            </div>
                        )}

                        {/* Orientation options */}
                        <div className="space-y-2 pt-2 border-t border-amber-500/20 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={!!distributePathState.orientAlongPath}
                                    onChange={(e) => {
                                        onDistributePathChange({
                                            ...distributePathState,
                                            orientAlongPath: e.target.checked
                                        });
                                    }}
                                    className="w-4 h-4 rounded accent-[var(--accent-primary)]"
                                />
                                <span className="font-medium text-[var(--text-primary)]">
                                    {t('tool.distribute.path.orient') || 'Орієнтувати вздовж шляху'}
                                </span>
                            </label>

                            {distributePathState.orientAlongPath && (
                                <div className="pl-6 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[var(--text-secondary)] text-xs">{t('mobile.align.orientationType') || 'Тип орієнтації:'}</span>
                                        <select
                                            value={distributePathState.orientationType}
                                            onChange={(e) => {
                                                onDistributePathChange({
                                                    ...distributePathState,
                                                    orientationType: e.target.value as any
                                                });
                                            }}
                                            className="bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-lg px-2 py-1 text-xs text-[var(--text-primary)]"
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
                                        </select>
                                    </div>

                                    {distributePathState.orientationType === 'custom' && (
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                                                <span>{t('mobile.align.orientationAngle') || 'Кут орієнтації:'}</span>
                                                <strong className="text-[var(--text-primary)]">{distributePathState.orientationAngle ?? 0}°</strong>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="360"
                                                value={distributePathState.orientationAngle ?? 0}
                                                onChange={(e) => {
                                                    onDistributePathChange({
                                                        ...distributePathState,
                                                        orientationAngle: Number(e.target.value)
                                                    });
                                                }}
                                                className="w-full accent-[var(--accent-primary)]"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={!!distributePathState.rotateAlongPath}
                                    disabled={!!distributePathState.orientAlongPath}
                                    onChange={(e) => {
                                        onDistributePathChange({
                                            ...distributePathState,
                                            rotateAlongPath: e.target.checked
                                        });
                                    }}
                                    className="w-4 h-4 rounded accent-[var(--accent-primary)] disabled:opacity-40"
                                />
                                <span className={`font-medium ${distributePathState.orientAlongPath ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'}`}>
                                    {t('tool.distribute.path.rotate') || 'Обертати фігури за кутом'}
                                </span>
                            </label>
                        </div>

                        {/* Confirmation & Cancellation Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-500/20">
                            {onConfirmDistributePath && (
                                <button
                                    type="button"
                                    onClick={onConfirmDistributePath}
                                    className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                                >
                                    <CheckIcon size={16} />
                                    <span>{t('button.apply') || 'Застосувати'}</span>
                                </button>
                            )}
                            {onCancelDistributePath && (
                                <button
                                    type="button"
                                    onClick={onCancelDistributePath}
                                    className="py-2.5 px-3 rounded-lg bg-[var(--bg-primary)] hover:bg-red-500/10 text-red-400 border border-red-500/30 font-medium text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                                >
                                    <XIcon size={16} />
                                    <span>{t('button.cancel') || 'Скасувати'}</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Target Mode: Selection vs Canvas Selector */}
                <div className="bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-secondary)] space-y-2.5">
                    <div className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                        {t('mobile.align.base') || 'База вирівнювання (Відносно чого):'}
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--border-secondary)]">
                        {/* Relative to Selection */}
                        <button
                            type="button"
                            onClick={() => setAlignRelativeTo('selection')}
                            disabled={isDistributingPath || count < 2}
                            className={`py-2.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                                alignRelativeTo === 'selection' && !isDistributingPath
                                    ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-sm'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:hover:text-[var(--text-secondary)]'
                            }`}
                        >
                            <span className="font-bold">{t('tool.align.selection') || 'Відносно виділення'}</span>
                            <span className="text-[10px] opacity-80">
                                {count < 2 ? (t('mobile.align.need2Plus') || '(потрібно 2+ фігури)') : (t('mobile.align.selectedCount') || '({count} виділено)').replace('{count}', String(count))}
                            </span>
                        </button>

                        {/* Relative to Canvas */}
                        <button
                            type="button"
                            onClick={() => setAlignRelativeTo('canvas')}
                            className={`py-2.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                                alignRelativeTo === 'canvas'
                                    ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-sm'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <span className="font-bold">{t('tool.align.canvas') || 'Відносно полотна'}</span>
                            <span className="text-[10px] opacity-80">
                                {canvasWidth} × {canvasHeight} px
                            </span>
                        </button>
                    </div>

                    {/* Helper description badge */}
                    <div className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg-primary)]/70 p-2 rounded-lg border border-[var(--border-secondary)]/50">
                        {alignRelativeTo === 'canvas' ? (
                            <span>
                                {(t('mobile.align.canvasDesc') || 'ℹ️ Полотно: Обʼєкти вирівнюються за межами або центром робочого полотна ({w}×{h}px). Працює для 1 або більше фігур.')
                                    .replace('{w}', String(canvasWidth))
                                    .replace('{h}', String(canvasHeight))}
                            </span>
                        ) : (
                            <span>
                                {t('mobile.align.selectionDesc') || 'ℹ️ Виділення: Фігури вирівнюються одна відносно одної за крайніми координатами спільної рамки виділення.'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Alignment Grid (6 Positions + Quick Center Canvas) */}
                <div className="bg-[var(--bg-secondary)] p-3.5 rounded-xl border border-[var(--border-secondary)] space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                            {t('mobile.align.sideAlign') || 'Вирівнювання сторін:'}
                        </div>
                        {alignRelativeTo === 'canvas' && (
                            <button
                                type="button"
                                onClick={handleCenterOnCanvas}
                                disabled={count < 1}
                                className="text-[11px] font-bold text-[var(--accent-primary)] hover:underline flex items-center gap-1 bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded"
                            >
                                🎯 {t('tool.align.centerBothCanvas') || 'В центр полотна'}
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {/* Align Left */}
                        <button
                            type="button"
                            onClick={() => onAlignShapes('left', alignRelativeTo)}
                            disabled={(alignRelativeTo === 'selection' && !canAlignSelection) || count === 0}
                            className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] hover:bg-[var(--bg-hover)] active:scale-95 text-xs text-[var(--text-primary)] disabled:opacity-40 transition-all"
                        >
                            <AlignShapesLeftIcon size={20} className="text-[var(--accent-primary)]" />
                            <span className="font-semibold text-[11px] leading-tight">{t('mobile.align.left') || 'Зліва'}</span>
                        </button>

                        {/* Align Center H */}
                        <button
                            type="button"
                            onClick={() => onAlignShapes('center-h', alignRelativeTo)}
                            disabled={(alignRelativeTo === 'selection' && !canAlignSelection) || count === 0}
                            className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] hover:bg-[var(--bg-hover)] active:scale-95 text-xs text-[var(--text-primary)] disabled:opacity-40 transition-all"
                        >
                            <AlignShapesCenterHIcon size={20} className="text-[var(--accent-primary)]" />
                            <span className="font-semibold text-[11px] leading-tight">{t('mobile.align.centerX') || 'Центр X'}</span>
                        </button>

                        {/* Align Right */}
                        <button
                            type="button"
                            onClick={() => onAlignShapes('right', alignRelativeTo)}
                            disabled={(alignRelativeTo === 'selection' && !canAlignSelection) || count === 0}
                            className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] hover:bg-[var(--bg-hover)] active:scale-95 text-xs text-[var(--text-primary)] disabled:opacity-40 transition-all"
                        >
                            <AlignShapesRightIcon size={20} className="text-[var(--accent-primary)]" />
                            <span className="font-semibold text-[11px] leading-tight">{t('mobile.align.right') || 'Справа'}</span>
                        </button>

                        {/* Align Top */}
                        <button
                            type="button"
                            onClick={() => onAlignShapes('top', alignRelativeTo)}
                            disabled={(alignRelativeTo === 'selection' && !canAlignSelection) || count === 0}
                            className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] hover:bg-[var(--bg-hover)] active:scale-95 text-xs text-[var(--text-primary)] disabled:opacity-40 transition-all"
                        >
                            <AlignShapesTopIcon size={20} className="text-[var(--accent-primary)]" />
                            <span className="font-semibold text-[11px] leading-tight">{t('mobile.align.top') || 'Зверху'}</span>
                        </button>

                        {/* Align Center V */}
                        <button
                            type="button"
                            onClick={() => onAlignShapes('center-v', alignRelativeTo)}
                            disabled={(alignRelativeTo === 'selection' && !canAlignSelection) || count === 0}
                            className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] hover:bg-[var(--bg-hover)] active:scale-95 text-xs text-[var(--text-primary)] disabled:opacity-40 transition-all"
                        >
                            <AlignShapesCenterVIcon size={20} className="text-[var(--accent-primary)]" />
                            <span className="font-semibold text-[11px] leading-tight">{t('mobile.align.centerY') || 'Центр Y'}</span>
                        </button>

                        {/* Align Bottom */}
                        <button
                            type="button"
                            onClick={() => onAlignShapes('bottom', alignRelativeTo)}
                            disabled={(alignRelativeTo === 'selection' && !canAlignSelection) || count === 0}
                            className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] hover:bg-[var(--bg-hover)] active:scale-95 text-xs text-[var(--text-primary)] disabled:opacity-40 transition-all"
                        >
                            <AlignShapesBottomIcon size={20} className="text-[var(--accent-primary)]" />
                            <span className="font-semibold text-[11px] leading-tight">{t('mobile.align.bottom') || 'Знизу'}</span>
                        </button>
                    </div>
                </div>

                {/* Spacing & Distribution Section */}
                <div className="bg-[var(--bg-secondary)] p-3.5 rounded-xl border border-[var(--border-secondary)] space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                            {t('mobile.align.distributeSection') || 'Рівномірний розподіл інтервалів:'}
                        </div>
                        <span className="text-[10px] text-[var(--text-tertiary)]">
                            {alignRelativeTo === 'canvas' ? (t('mobile.align.min2Objects') || 'Мін. 2 обʼєкти') : (t('mobile.align.min3Objects') || 'Мін. 3 обʼєкти')}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {/* Distribute Horizontally */}
                        <button
                            type="button"
                            onClick={() => onAlignShapes('distribute-h', alignRelativeTo)}
                            disabled={
                                isDistributingPath ||
                                (alignRelativeTo === 'selection' && !canDistributeHSelection) ||
                                (alignRelativeTo === 'canvas' && !canDistributeHCanvas)
                            }
                            className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] hover:bg-[var(--bg-hover)] active:scale-95 text-xs font-semibold text-[var(--text-primary)] disabled:opacity-40 transition-all text-center"
                        >
                            <DistributeHorizontalIcon size={20} className="text-cyan-400 shrink-0" />
                            <span className="truncate">{t('mobile.align.distributeH') || 'Горизонтально'}</span>
                        </button>

                        {/* Distribute Vertically */}
                        <button
                            type="button"
                            onClick={() => onAlignShapes('distribute-v', alignRelativeTo)}
                            disabled={
                                isDistributingPath ||
                                (alignRelativeTo === 'selection' && !canDistributeVSelection) ||
                                (alignRelativeTo === 'canvas' && !canDistributeVCanvas)
                            }
                            className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] hover:bg-[var(--bg-hover)] active:scale-95 text-xs font-semibold text-[var(--text-primary)] disabled:opacity-40 transition-all text-center"
                        >
                            <DistributeVerticalIcon size={20} className="text-cyan-400 shrink-0" />
                            <span className="truncate">{t('mobile.align.distributeV') || 'Вертикально'}</span>
                        </button>

                        {/* Distribute by Path */}
                        <button
                            type="button"
                            onClick={handleStartPathDistribute}
                            disabled={isDistributingPath || !canDistributePath}
                            className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] hover:bg-[var(--bg-hover)] active:scale-95 text-xs font-semibold text-[var(--text-primary)] disabled:opacity-40 transition-all text-center"
                        >
                            <DistributePathIcon size={20} className="text-cyan-400 shrink-0" />
                            <span className="truncate">{t('tool.distribute.path') || 'За шляхом'}</span>
                        </button>
                    </div>
                </div>

        </div>
    );
};

export default MobileAlignSheet;
