import re

with open("components/Canvas.tsx", "r") as f:
    text = f.read()

s1 = """  const getTransform = (shape: Shape) => {
    if ('rotation' in shape && shape.rotation && shape.rotation !== 0) {
        const center = getShapeCenter(shape, shapes);
        if(center) return `rotate(${-shape.rotation} ${center.x} ${center.y})`;
    }
    return undefined;
  };"""
r1 = """  const getTransform = (shape: Shape) => {
    let transformStr = "";
    
    const isSpecialFlip = ['image', 'bitmap', 'text', 'arc'].includes(shape.type);
    const isFlippedH = isSpecialFlip && 'isFlippedHorizontally' in shape && (shape as any).isFlippedHorizontally;
    const isFlippedV = isSpecialFlip && 'isFlippedVertically' in shape && (shape as any).isFlippedVertically;
    const hasRotation = 'rotation' in shape && shape.rotation && shape.rotation !== 0;

    if (!isFlippedH && !isFlippedV && !hasRotation) return undefined;

    const center = getShapeCenter(shape, shapes);
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
    with open("components/Canvas.tsx", "w") as f:
        f.write(text)
else:
    print("Could not find getTransform in Canvas.tsx")

with open("components/PreviewModal.tsx", "r") as f:
    text2 = f.read()
    
s2 = """    const getTransform = (shape: Shape) => {
        if ('rotation' in shape && shape.rotation && shape.rotation !== 0) {
            const center = shape.type === 'text' ? {x: shape.x, y: shape.y} : getShapeCenter(shape);
            if(center) return `rotate(${-shape.rotation} ${center.x} ${center.y})`;
        }
        return undefined;
    };"""
r2 = """    const getTransform = (shape: Shape) => {
        let transformStr = "";
        
        const isSpecialFlip = ['image', 'bitmap', 'text', 'arc'].includes(shape.type);
        const isFlippedH = isSpecialFlip && 'isFlippedHorizontally' in shape && (shape as any).isFlippedHorizontally;
        const isFlippedV = isSpecialFlip && 'isFlippedVertically' in shape && (shape as any).isFlippedVertically;
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

if s2 in text2:
    text2 = text2.replace(s2, r2)
    with open("components/PreviewModal.tsx", "w") as f:
        f.write(text2)
else:
    print("Could not find getTransform in PreviewModal.tsx")
