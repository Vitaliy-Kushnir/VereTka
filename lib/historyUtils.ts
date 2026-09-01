import { Shape, Layer, DistributePathState } from '../types';
import { HistoryEntry } from '../hooks/useHistoryState';

export interface AppHistoryState {
    shapes: Shape[];
    distributePathState: DistributePathState | null;
    layers: Layer[];
    activeLayerId: string | null;
}

export interface FormattedHistoryStep {
    index: number;
    id: string;
    timestamp: number;
    formattedTime: string;
    title: string;
    subtitle?: string;
    actionType: 'init' | 'add' | 'delete' | 'move' | 'style' | 'transform' | 'group' | 'ungroup' | 'layer' | 'distribute' | 'edit';
    shapeType?: string;
    shapesCount: number;
    layersCount: number;
    isCurrent: boolean;
    stepOffset: number;
}

function getShapeTypeName(type: string, t?: (key: string) => string): string {
    if (t) {
        const translated = t(`shape.${type}`) || t(`tool.${type}`);
        if (translated && translated !== `shape.${type}` && translated !== `tool.${type}`) {
            return translated;
        }
    }
    const map: Record<string, string> = {
        'rectangle': 'Прямокутник',
        'square': 'Квадрат',
        'circle': 'Коло',
        'ellipse': 'Еліпс',
        'line': 'Лінія',
        'polyline': 'Ламана',
        'bezier': 'Крива Безьє',
        'polygon': 'Багатокутник',
        'pencil': 'Олівець',
        'triangle': 'Трикутник',
        'right-triangle': 'Прямокутний трикутник',
        'star': 'Зірка',
        'rhombus': 'Ромб',
        'trapezoid': 'Трапеція',
        'parallelogram': 'Паралелограм',
        'arc': 'Дуга',
        'pieslice': 'Сектор',
        'chord': 'Сегмент',
        'text': 'Текст',
        'image': 'Зображення',
        'bitmap': 'Бітмап',
        'group': 'Група'
    };
    return map[type] || type;
}

function getShapeDisplayName(shape: Shape, t?: (key: string) => string): string {
    if (shape.type === 'text' && (shape as any).text) {
        const txt = (shape as any).text.trim();
        return txt.length > 15 ? `"${txt.slice(0, 15)}..."` : `"${txt}"`;
    }
    return getShapeTypeName(shape.type, t);
}

export function describeHistoryStep(
    prevState: AppHistoryState | null,
    currentState: AppHistoryState,
    descriptionOverride?: string,
    t?: (key: string) => string
): { title: string; actionType: FormattedHistoryStep['actionType']; shapeType?: string } {
    if (descriptionOverride) {
        return {
            title: descriptionOverride,
            actionType: 'edit'
        };
    }

    if (!prevState) {
        return {
            title: (t && t('history.initialState')) || 'Початковий стан проєкту',
            actionType: 'init'
        };
    }

    const prevShapes = prevState.shapes || [];
    const currShapes = currentState.shapes || [];

    // Added shapes
    if (currShapes.length > prevShapes.length) {
        const added = currShapes.filter(s => s && !prevShapes.some(p => p && p.id === s.id));
        if (added.length === 1 && added[0]) {
            const name = getShapeDisplayName(added[0], t);
            const template = (t && t('history.addedShape')) || 'Додано: {name}';
            return {
                title: template.replace('{name}', name),
                actionType: 'add',
                shapeType: added[0].type
            };
        }
        const countTemplate = (t && t('history.addedShapesCount')) || 'Додано {count} фігур';
        return {
            title: countTemplate.replace('{count}', String(added.length)),
            actionType: 'add'
        };
    }

    // Deleted shapes
    if (currShapes.length < prevShapes.length) {
        const removed = prevShapes.filter(p => p && !currShapes.some(s => s && s.id === p.id));
        if (removed.length === 1 && removed[0]) {
            const name = getShapeDisplayName(removed[0], t);
            const template = (t && t('history.removedShape')) || 'Видалено: {name}';
            return {
                title: template.replace('{name}', name),
                actionType: 'delete',
                shapeType: removed[0].type
            };
        }
        const countTemplate = (t && t('history.removedShapesCount')) || 'Видалено {count} фігур';
        return {
            title: countTemplate.replace('{count}', String(removed.length)),
            actionType: 'delete'
        };
    }

    // Check grouping
    const prevGroups = new Set(prevShapes.map(s => s.groupId).filter(Boolean));
    const currGroups = new Set(currShapes.map(s => s.groupId).filter(Boolean));
    if (currGroups.size > prevGroups.size) {
        return { 
            title: (t && t('history.grouped')) || 'Згруповано фігури', 
            actionType: 'group' 
        };
    }
    if (currGroups.size < prevGroups.size) {
        return { 
            title: (t && t('history.ungrouped')) || 'Розгруповано фігури', 
            actionType: 'ungroup' 
        };
    }

    // Check layer changes
    const prevLayers = prevState.layers || [];
    const currLayers = currentState.layers || [];
    if (currLayers.length > prevLayers.length) {
        const addedLayer = currLayers.find(l => !prevLayers.some(p => p.id === l.id));
        const layerName = addedLayer?.name || (t && t('history.newLayer')) || 'Новий шар';
        const template = (t && t('history.createdLayer')) || 'Створено шар: {name}';
        return {
            title: template.replace('{name}', layerName),
            actionType: 'layer'
        };
    }
    if (currLayers.length < prevLayers.length) {
        return { 
            title: (t && t('history.deletedLayer')) || 'Видалено шар', 
            actionType: 'layer' 
        };
    }

    // Check layer visibility or lock
    for (let i = 0; i < currLayers.length; i++) {
        const prevL = prevLayers[i];
        const currL = currLayers[i];
        if (prevL && currL && prevL.id === currL.id) {
            if (prevL.locked !== currL.locked) {
                const template = currL.locked 
                    ? ((t && t('history.lockedLayer')) || 'Заблоковано шар: {name}')
                    : ((t && t('history.unlockedLayer')) || 'Розблоковано шар: {name}');
                return {
                    title: template.replace('{name}', currL.name),
                    actionType: 'layer'
                };
            }
            if (prevL.visible !== currL.visible) {
                const template = currL.visible 
                    ? ((t && t('history.showLayer')) || 'Показано шар: {name}')
                    : ((t && t('history.hideLayer')) || 'Приховано шар: {name}');
                return {
                    title: template.replace('{name}', currL.name),
                    actionType: 'layer'
                };
            }
        }
    }

    // Check distribute along path
    if (currentState.distributePathState && !prevState.distributePathState) {
        return { 
            title: (t && t('history.distributePath')) || 'Розподіл по контуру', 
            actionType: 'distribute' 
        };
    }

    // Check modified shape
    const changedShapes: { prev: Shape; curr: Shape }[] = [];
    for (let i = 0; i < currShapes.length; i++) {
        const cs = currShapes[i];
        const ps = prevShapes.find(p => p.id === cs.id);
        if (ps && JSON.stringify(ps) !== JSON.stringify(cs)) {
            changedShapes.push({ prev: ps, curr: cs });
        }
    }

    if (changedShapes.length === 1) {
        const { prev: ps, curr: cs } = changedShapes[0];
        const name = getShapeDisplayName(cs, t);

        if (cs.type === 'text' && (cs as any).text !== (ps as any).text) {
            const shortText = (cs as any).text?.slice(0, 15) || '';
            const template = (t && t('history.changeText')) || 'Зміна тексту: "{text}"';
            return { 
                title: template.replace('{text}', shortText), 
                actionType: 'edit', 
                shapeType: cs.type 
            };
        }
        if (cs.fill !== ps.fill || cs.stroke !== ps.stroke || cs.strokeWidth !== ps.strokeWidth || cs.stipple !== ps.stipple) {
            const template = (t && t('history.changeStyle')) || 'Зміна стилю: {name}';
            return { 
                title: template.replace('{name}', name), 
                actionType: 'style', 
                shapeType: cs.type 
            };
        }
        if (cs.rotation !== ps.rotation) {
            const template = (t && t('history.rotateShape')) || 'Обертання: {name}';
            return { 
                title: template.replace('{name}', name), 
                actionType: 'transform', 
                shapeType: cs.type 
            };
        }
        if (
            (cs as any).x !== (ps as any).x ||
            (cs as any).y !== (ps as any).y ||
            (cs as any).cx !== (ps as any).cx ||
            (cs as any).cy !== (ps as any).cy
        ) {
            const template = (t && t('history.moveShape')) || 'Переміщення: {name}';
            return { 
                title: template.replace('{name}', name), 
                actionType: 'move', 
                shapeType: cs.type 
            };
        }
        const template = (t && t('history.editShape')) || 'Редагування: {name}';
        return { 
            title: template.replace('{name}', name), 
            actionType: 'transform', 
            shapeType: cs.type 
        };
    }

    if (changedShapes.length > 1) {
        const template = (t && t('history.changeMultiple')) || 'Зміна {count} об\'єктів';
        return { 
            title: template.replace('{count}', String(changedShapes.length)), 
            actionType: 'transform' 
        };
    }

    return {
        title: (t && t('history.projectChange')) || 'Зміна проєкту',
        actionType: 'edit'
    };
}

export function formatHistoryEntries(
    entries: HistoryEntry<AppHistoryState>[],
    currentIndex: number,
    t?: (key: string) => string
): FormattedHistoryStep[] {
    return entries.map((entry, index) => {
        const prevState = index > 0 ? entries[index - 1].state : null;
        const { title, actionType, shapeType } = describeHistoryStep(prevState, entry.state, entry.description, t);

        const date = new Date(entry.timestamp);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const formattedTime = `${hours}:${minutes}:${seconds}`;

        return {
            index,
            id: entry.id,
            timestamp: entry.timestamp,
            formattedTime,
            title,
            actionType,
            shapeType,
            shapesCount: (entry.state.shapes || []).length,
            layersCount: (entry.state.layers || []).length,
            isCurrent: index === currentIndex,
            stepOffset: index - currentIndex,
        };
    });
}
