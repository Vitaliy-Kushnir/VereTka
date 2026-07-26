import re

with open("components/PreviewModal.tsx", "r") as f:
    text = f.read()

s1 = """    const getTransform = (shape: Shape) => {
        if ('rotation' in shape && shape.rotation && shape.rotation !== 0) {
            const center = shape.type === 'text' ? {x: shape.x, y: shape.y} : getShapeCenter(shape);
            if(center) return `rotate(${-shape.rotation} ${center.x} ${center.y})`;
        }
        return undefined;
    };"""
r1 = """    const getTransform = (shape: Shape) => {
        let transformStr = "";
        const isFlippedH = 'isFlippedHorizontally' in shape && shape.isFlippedHorizontally;
        const isFlippedV = 'isFlippedVertically' in shape && shape.isFlippedVertically;
        const hasRotation = 'rotation' in shape && shape.rotation && shape.rotation !== 0;

        if (!isFlippedH && !isFlippedV && !hasRotation) return undefined;

        const center = shape.type === 'text' ? {x: shape.x, y: shape.y} : getShapeCenter(shape);
        if (!center) return undefined;

        if (center.x !== 0 || center.y !== 0) {
            transformStr += `translate(${center.x} ${center.y}) `;
        }

        if (hasRotation) {
            transformStr += `rotate(${-shape.rotation}) `;
        }

        if (isFlippedH || isFlippedV) {
            const sx = isFlippedH ? -1 : 1;
            const sy = isFlippedV ? -1 : 1;
            transformStr += `scale(${sx} ${sy}) `;
        }

        if (center.x !== 0 || center.y !== 0) {
            transformStr += `translate(${-center.x} ${-center.y})`;
        }

        return transformStr.trim() || undefined;
    };"""
if s1 in text:
    text = text.replace(s1, r1)
    with open("components/PreviewModal.tsx", "w") as f:
        f.write(text)
else:
    print("Could not find getTransform in PreviewModal.tsx")
