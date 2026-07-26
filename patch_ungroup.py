import re

with open("App.tsx", "r") as f:
    text = f.read()

s = r"        const newShapes = prev\.shapes\n            \.filter\(\(s: any\) => \!groupIdsToClear\.has\(s\.id\)\)\n            \.map\(\(s: any\) => \(s\.groupId && groupIdsToClear\.has\(s\.groupId\)\) \? \{ \.\.\.s, groupId: undefined \} : s\);"

r_new = """        const newShapes = prev.shapes
            .filter((s: any) => !groupIdsToClear.has(s.id))
            .map((s: any) => {
                if (s.groupId && groupIdsToClear.has(s.groupId)) {
                    let newS = { ...s, groupId: undefined };
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
                    return newS;
                }
                return s;
            });"""

text = re.sub(s, r_new, text)

with open("App.tsx", "w") as f:
    f.write(text)
