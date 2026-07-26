import re

with open("App.tsx", "r") as f:
    text = f.read()

s = r"                if \(sIdx \!\= \-1\) \{\n                    newShapes\[sIdx\] \= \{ \.\.\.shape, groupId: undefined \};\n                \}"

r_new = """                if (sIdx !== -1) {
                    let newS = { ...shape, groupId: undefined };
                    if (newS.rotationCenter) {
                        const C1 = newS.rotationCenter;
                        const C2 = getShapeCenter({ ...newS, rotationCenter: undefined }, prev.shapes);
                        if (C2) {
                            const C2_new = rotatePoint(C2, C1, newS.rotation || 0);
                            const dx = C2_new.x - C2.x;
                            const dy = C2_new.y - C2.y;
                            switch (newS.type) {
                                case 'rectangle': case 'triangle': case 'right-triangle': case 'rhombus': case 'trapezoid': case 'parallelogram': case 'arc': case 'text': case 'image': case 'bitmap':
                                    newS.x += dx; newS.y += dy; break;
                                case 'ellipse': case 'polygon': case 'star':
                                    newS.cx += dx; newS.cy += dy; break;
                                case 'line': case 'bezier': case 'pencil': case 'polyline':
                                    newS.points = newS.points.map((p: any) => ({ x: p.x + dx, y: p.y + dy })); break;
                            }
                        }
                        delete newS.rotationCenter;
                    }
                    newShapes[sIdx] = newS;
                }"""

text = re.sub(s, r_new, text)

with open("App.tsx", "w") as f:
    f.write(text)
