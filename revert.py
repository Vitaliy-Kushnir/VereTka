import re

with open("lib/geometry.ts", "r") as f:
    text = f.read()

# 1. getIsoscelesTrianglePoints
r1 = """export const getIsoscelesTrianglePoints = (shape: IsoscelesTriangleShape): {x: number, y: number}[] => {
    const { x, y, width, height, topVertexOffset = 0 } = shape;
    const centerBasedX = x + width / 2;
    const topVertexX = centerBasedX + (topVertexOffset * width);

    return [
        { x: topVertexX, y: y },
        { x: x + width, y: y + height },
        { x: x, y: y + height }
    ];
};"""
s1 = """export const getIsoscelesTrianglePoints = (shape: IsoscelesTriangleShape): {x: number, y: number}[] => {
    const { x, y, width, height, topVertexOffset = 0, isFlippedVertically } = shape;
    const centerBasedX = x + width / 2;
    const topVertexX = centerBasedX + (topVertexOffset * width);

    if (isFlippedVertically) {
        return [
            { x: topVertexX, y: y + height }, // "Top" vertex is at the bottom
            { x: x + width, y: y },         // Base is at the top
            { x: x, y: y }                  // Base is at the top
        ];
    }

    return [
        { x: topVertexX, y: y },
        { x: x + width, y: y + height },
        { x: x, y: y + height }
    ];
};"""
text = text.replace(r1, s1)

# 2. getRightTrianglePoints
r2 = """export const getRightTrianglePoints = (shape: RightTriangleShape): {x: number, y: number}[] => {
    const { x, y, width, height } = shape;
    
    // Default shape: right angle at bottom-left of the bounding box
    let points = [
        { x: x, y: y + height },         // Bottom-left (right angle)
        { x: x, y: y },                  // Top-left
        { x: x + width, y: y + height }, // Bottom-right
    ];
    return points;
};"""
s2 = """export const getRightTrianglePoints = (shape: RightTriangleShape): {x: number, y: number}[] => {
    const { x, y, width, height, isFlippedHorizontally, isFlippedVertically } = shape;
    
    // Default shape: right angle at bottom-left of the bounding box
    let points = [
        { x: x, y: y + height },         // Bottom-left (right angle)
        { x: x, y: y },                  // Top-left
        { x: x + width, y: y + height }, // Bottom-right
    ];

    if (isFlippedHorizontally) {
        // Flip around vertical center line of the bounding box
        const centerX = x + width / 2;
        points = points.map(p => ({ x: centerX - (p.x - centerX), y: p.y }));
    }
    if (isFlippedVertically) {
        // Flip around horizontal center line of the bounding box
        const centerY = y + height / 2;
        points = points.map(p => ({ x: p.x, y: centerY - (p.y - centerY) }));
    }
    
    return points;
};"""
text = text.replace(r2, s2)

# 3. Trapezoid
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
text = text.replace(r3, s3)

# 4. Parallelogram
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
text = text.replace(r4, s4)

# 5. Polygon
r5 = """export const getPolygonPointsAsArray = (shape: PolygonShape): {x: number, y: number}[] => {
    const points = [];
    const { cx, cy, radius, sides, innerRadius } = shape;
    const angleStep = (Math.PI * 2) / sides;
    const rotationRad = -Math.PI / 2; // Start from top, rotation is handled by getFinalPoints

    const isStar = innerRadius !== undefined;
    const totalPoints = isStar ? sides * 2 : sides;

    for (let i = 0; i < totalPoints; i++) {
        const currentRadius = isStar ? (i % 2 === 0 ? radius : innerRadius) : radius;
        const angle = (i * angleStep / (isStar ? 2 : 1)) + rotationRad;
        
        let pointX = cx + Math.cos(angle) * currentRadius;
        let pointY = cy + Math.sin(angle) * currentRadius;
        
        points.push({ x: pointX, y: pointY });
    }
    return points;
};"""
s5 = """export const getPolygonPointsAsArray = (shape: PolygonShape): {x: number, y: number}[] => {
    const points = [];
    const { cx, cy, radius, sides, innerRadius, isFlippedHorizontally, isFlippedVertically } = shape;
    const angleStep = (Math.PI * 2) / sides;
    const rotationRad = -Math.PI / 2; // Start from top, rotation is handled by getFinalPoints

    const isStar = innerRadius !== undefined;
    const totalPoints = isStar ? sides * 2 : sides;

    for (let i = 0; i < totalPoints; i++) {
        const currentRadius = isStar ? (i % 2 === 0 ? radius : innerRadius) : radius;
        const angle = (i * angleStep / (isStar ? 2 : 1)) + rotationRad;
        
        let pointX = cx + Math.cos(angle) * currentRadius;
        let pointY = cy + Math.sin(angle) * currentRadius;
        
        if (isFlippedHorizontally) {
            pointX = cx - (pointX - cx);
        }
        if (isFlippedVertically) {
            pointY = cy - (pointY - cy);
        }

        points.push({ x: pointX, y: pointY });
    }
    return points;
};"""
text = text.replace(r5, s5)

with open("lib/geometry.ts", "w") as f:
    f.write(text)
