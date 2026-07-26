import re
with open('App.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# I need to find the block of logic I added in setShapes and updateShapesWithoutHistory
# and remove it.

target = r"""        let changedCenter = false;
        const shapesCopy = \[\.\.\.newShapes\];
        for \(let pass = 0; pass < 2; pass\+\+\) \{
            for \(let i = 0; i < shapesCopy\.length; i\+\+\) \{
                if \(shapesCopy\[i\]\.type === 'group'\) \{
                    const groupShape = shapesCopy\[i\];
                    const tempGroup = \{ \.\.\.groupShape, rotationCenter: undefined \};
                    const newCenter = getShapeCenter\(tempGroup as any, shapesCopy\);
                    const currentCenter = \(groupShape as any\)\.rotationCenter;
                    if \(newCenter\) \{
                        if \(!currentCenter \|\| Math\.abs\(currentCenter\.x - newCenter\.x\) > 0\.01 \|\| Math\.abs\(currentCenter\.y - newCenter\.y\) > 0\.01\) \{
                            shapesCopy\[i\] = \{ \.\.\.groupShape, rotationCenter: newCenter \} as any;
                            changedCenter = true;
                        \}
                    \}
                \}
            \}
        \}
        let finalShapes = changedCenter \? shapesCopy : newShapes;"""

code = re.sub(target, "", code)

# replace finalShapes with newShapes
code = code.replace("const addedShapes = finalShapes.filter", "const addedShapes = newShapes.filter")
code = code.replace("!finalShapes.some", "!newShapes.some")
code = code.replace("shapes: finalShapes", "shapes: newShapes")

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
