const fs = require('fs');
let code = fs.readFileSync('lib/geometry.ts', 'utf8');
code = code.replace(
`        case 'arc':
            // Approximate arc with line segments
            const { x, y, width, height, start, extent, style } = shape;
            const rx = width / 2;
            const ry = height / 2;
            const cx = x + rx;
            const cy = y + ry;
            const segments = 32;
            const angleStep = extent / segments;
            points = [];

            if (style === 'pieslice') {
                points.push({ x: cx, y: cy });
            }

            for (let i = 0; i <= segments; i++) {
                const angle = start + i * angleStep;
                const rad = (angle * Math.PI) / 180;
                points.push({
                    x: cx + rx * Math.cos(rad),
                    y: cy - ry * Math.sin(rad), // SVG Y-axis is inverted
                });
            }

            if (style === 'pieslice') {
                points.push({ x: cx, y: cy });
            }
            break;`,
`        case 'arc':
            // Approximate arc with line segments
            const { x, y, width, height, start, extent, style } = shape;
            const rx = width / 2;
            const ry = height / 2;
            const cx = x + rx;
            const cy = y + ry;
            const segments = 32;
            const angleStep = extent / segments;
            points = [];

            if (style === 'pieslice') {
                points.push({ x: cx, y: cy });
            }

            for (let i = 0; i <= segments; i++) {
                const angle = start + i * angleStep;
                const rad = (angle * Math.PI) / 180;
                let pointX = cx + rx * Math.cos(rad);
                let pointY = cy - ry * Math.sin(rad); // SVG Y-axis is inverted
                
                if (('isFlippedHorizontally' in shape) && (shape as any).isFlippedHorizontally) {
                    pointX = cx - (pointX - cx);
                }
                if (('isFlippedVertically' in shape) && (shape as any).isFlippedVertically) {
                    pointY = cy - (pointY - cy);
                }
                points.push({ x: pointX, y: pointY });
            }

            if (style === 'pieslice') {
                points.push({ x: cx, y: cy });
            }
            break;`
);
fs.writeFileSync('lib/geometry.ts', code);
