with open("components/Canvas.tsx", "r") as f:
    text = f.read()

target = """                if (shape.state === 'hidden' && !isSelected) return null;

                const isHiddenAndSelected = shape.state === 'hidden' && isSelected;
                const isDisabled = shape.state === 'disabled';
                const isDrawing = activeTool !== 'select';
                const isDuplicationPreview = action?.type === 'duplicating' && shape.id.endsWith('-preview');
                const shapeCursor = (isDisabled || isHiddenAndSelected) ? 'default' : (isDrawing ? 'inherit' : 'move');
                const hitboxStrokeWidth = Math.max(shape.strokeWidth, 20 / viewTransform.scale);
                
                let transform = getTransform(shape);
                const isThisShapeBeingPointEdited = action?.type === 'point-editing' && shape.id === (action as any).initialShape.id;
                // FIX: Complete the variable name from `isThisShapeBeing` to `isThisShapeBeingPointEdited`.
                if (isThisShapeBeingPointEdited) {
                    transform = undefined;
                }

                // FIX: Removed explicit type React.SVGProps<any> to allow the 'data-id' attribute,
                // which was causing a TypeScript error. Type inference correctly handles validation on spread.
                const staticProps = {
                    'data-id': shape.id,
                    stroke: shape.stroke,
                    strokeWidth: shape.strokeWidth,
                    style: { 
                        opacity: shape.state === 'disabled' || isDuplicationPreview ? 0.5 : 1,
                        cursor: shapeCursor,
                        pointerEvents: lockedShapeIds.has(shape.id) ? 'none' : (isDisabled ? 'none' : 'auto'), 
                    } as React.CSSProperties,"""

replacement = """                const isSelected = selectedShapeIds.includes(shape.id);
                const isHidden = shape.state === 'hidden';
                const isHiddenAndSelected = isHidden && isSelected;
                const isDisabled = shape.state === 'disabled';
                const isDrawing = activeTool !== 'select';
                const isDuplicationPreview = action?.type === 'duplicating' && shape.id.endsWith('-preview');
                const shapeCursor = (isDisabled || isHiddenAndSelected) ? 'default' : (isDrawing ? 'inherit' : 'move');
                const hitboxStrokeWidth = Math.max(shape.strokeWidth, 20 / viewTransform.scale);
                
                let transform = getTransform(shape);
                const isThisShapeBeingPointEdited = action?.type === 'point-editing' && shape.id === (action as any).initialShape.id;
                // FIX: Complete the variable name from `isThisShapeBeing` to `isThisShapeBeingPointEdited`.
                if (isThisShapeBeingPointEdited) {
                    transform = undefined;
                }

                // FIX: Removed explicit type React.SVGProps<any> to allow the 'data-id' attribute,
                // which was causing a TypeScript error. Type inference correctly handles validation on spread.
                const staticProps = {
                    'data-id': shape.id,
                    stroke: shape.stroke,
                    strokeWidth: shape.strokeWidth,
                    style: { 
                        opacity: shape.state === 'disabled' || isDuplicationPreview ? 0.5 : (isHidden ? 0.3 : 1),
                        cursor: shapeCursor,
                        pointerEvents: lockedShapeIds.has(shape.id) || isHidden ? 'none' : (isDisabled ? 'none' : 'auto'), 
                    } as React.CSSProperties,"""

text = text.replace(target, replacement)
with open("components/Canvas.tsx", "w") as f:
    f.write(text)
