import re

with open("lib/geometry.ts", "r") as f:
    text = f.read()

s3 = """export const getTrapezoidPoints = (shape: TrapezoidShape): {x: number, y: number}[] => {
    const { x, y, width, height, topLeftOffsetRatio, topRightOffsetRatio, isFlippedVertically } = shape;
    
    const topW = width * (1 - topLeftOffsetRatio - topRightOffsetRatio);
    if (isFlippedVertically) {
         return [
            { x: x, y: y },
            { x: x + width, y: y },
            { x: x + width - (width * topRightOffsetRatio), y: y + height },
            { x: x + (width * topLeftOffsetRatio), y: y + height }
        ];
    }
    
    return [
        { x: x + (width * topLeftOffsetRatio), y: y },
        { x: x + width - (width * topRightOffsetRatio), y: y },
        { x: x + width, y: y + height },
        { x: x, y: y + height }
    ];
};"""
r3 = """export const getTrapezoidPoints = (shape: TrapezoidShape): {x: number, y: number}[] => {
    const { x, y, width, height, topLeftOffsetRatio, topRightOffsetRatio } = shape;
    
    const topW = width * (1 - topLeftOffsetRatio - topRightOffsetRatio);
    return [
        { x: x + (width * topLeftOffsetRatio), y: y },
        { x: x + width - (width * topRightOffsetRatio), y: y },
        { x: x + width, y: y + height },
        { x: x, y: y + height }
    ];
};"""
text = text.replace(s3, r3)


s4 = """export const getParallelogramPoints = (shape: ParallelogramShape): {x: number, y: number}[] => {
    const { x, y, width: visualWidth, height, angle, isFlippedVertically } = shape;
    
    // Calculate the horizontal offset based on the angle
    // angle is usually between 1 and 179. If angle is 90, it's a rectangle.
    // We treat 'angle' as the angle at the bottom-left corner.
    const radians = (angle * Math.PI) / 180;
    
    // The actual width of the top/bottom edges depends on the offset.
    // Tan(angle) = height / offset => offset = height / tan(angle)
    let offset = height / Math.tan(radians);
    
    // To ensure it fits in bounding box, if offset is positive, bottom left is at x, top left is at x + offset.
    // If offset is negative, bottom left is at x - offset (so it's further right), top left is at x.
    // Wait, the visualWidth is the total width.
    // The top edge width = visualWidth - Math.abs(offset).
    const topWidth = visualWidth - Math.abs(offset);

    if (isFlippedVertically) {
        if (offset > 0) {
            return [
                { x: x, y: y },
                { x: x + topWidth, y: y },
                { x: x + visualWidth, y: y + height },
                { x: x + offset, y: y + height }
            ];
        } else {
            return [
                { x: x - offset, y: y },
                { x: x + visualWidth, y: y },
                { x: x + topWidth, y: y + height },
                { x: x, y: y + height }
            ];
        }
    }

    if (offset > 0) {
        return [
            { x: x + offset, y: y },
            { x: x + visualWidth, y: y },
            { x: x + topWidth, y: y + height },
            { x: x, y: y + height }
        ];
    } else {
        return [
            { x: x, y: y },
            { x: x + topWidth, y: y },
            { x: x + visualWidth, y: y + height },
            { x: x - offset, y: y + height }
        ];
    }
};"""
r4 = """export const getParallelogramPoints = (shape: ParallelogramShape): {x: number, y: number}[] => {
    const { x, y, width: visualWidth, height, angle } = shape;
    
    const radians = (angle * Math.PI) / 180;
    let offset = height / Math.tan(radians);
    const topWidth = visualWidth - Math.abs(offset);

    if (offset > 0) {
        return [
            { x: x + offset, y: y },
            { x: x + visualWidth, y: y },
            { x: x + topWidth, y: y + height },
            { x: x, y: y + height }
        ];
    } else {
        return [
            { x: x, y: y },
            { x: x + topWidth, y: y },
            { x: x + visualWidth, y: y + height },
            { x: x - offset, y: y + height }
        ];
    }
};"""
text = text.replace(s4, r4)

with open("lib/geometry.ts", "w") as f:
    f.write(text)
