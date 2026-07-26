import re

with open("lib/geometry.ts", "r") as f:
    text = f.read()

# 1. getIsoscelesTrianglePoints
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
text = text.replace(s1, r1)

# 2. getRightTrianglePoints
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
text = text.replace(s2, r2)

with open("lib/geometry.ts", "w") as f:
    f.write(text)
