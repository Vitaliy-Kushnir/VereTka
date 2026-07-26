import re

with open("lib/exportUtils.ts", "r") as f:
    text = f.read()

s1 = """    const getTransform = (s: Shape): string => {
        if ('rotation' in s && s.rotation && s.rotation !== 0) {
            const center = s.type === 'text' ? {x: s.x, y: s.y} : getShapeCenter(s);
            if (center) return `transform="rotate(${-s.rotation} ${center.x} ${center.y})"`;
        }
        return '';
    };"""
r1 = """    const getTransform = (s: Shape): string => {
        let transformStr = "";
        const isFlippedH = 'isFlippedHorizontally' in s && s.isFlippedHorizontally;
        const isFlippedV = 'isFlippedVertically' in s && s.isFlippedVertically;
        const hasRotation = 'rotation' in s && s.rotation && s.rotation !== 0;

        if (!isFlippedH && !isFlippedV && !hasRotation) return '';

        const center = s.type === 'text' ? {x: s.x, y: s.y} : getShapeCenter(s);
        if (!center) return '';

        if (center.x !== 0 || center.y !== 0) {
            transformStr += `translate(${center.x} ${center.y}) `;
        }

        if (hasRotation) {
            transformStr += `rotate(${-s.rotation}) `;
        }

        if (isFlippedH || isFlippedV) {
            const sx = isFlippedH ? -1 : 1;
            const sy = isFlippedV ? -1 : 1;
            transformStr += `scale(${sx} ${sy}) `;
        }

        if (center.x !== 0 || center.y !== 0) {
            transformStr += `translate(${-center.x} ${-center.y})`;
        }

        const t = transformStr.trim();
        return t ? `transform="${t}"` : '';
    };"""
if s1 in text:
    text = text.replace(s1, r1)
    with open("lib/exportUtils.ts", "w") as f:
        f.write(text)
else:
    print("Could not find getTransform in exportUtils.ts")
