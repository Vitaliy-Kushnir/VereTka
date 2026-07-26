import re

with open("lib/geometry.ts", "r") as f:
    text = f.read()

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
text = text.replace(s5, r5)

with open("lib/geometry.ts", "w") as f:
    f.write(text)
