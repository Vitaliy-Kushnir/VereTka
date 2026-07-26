with open("components/Canvas.tsx", "r") as f:
    text = f.read()

target = """            {itemsToRender.filter(Boolean).map(shape => {
                const isSelected = selectedShapeIds.includes(shape.id);"""

replacement = """            {itemsToRender.filter(Boolean).map(shape => {
                const isSelected = selectedShapeIds.includes(shape.id) || (!!shape.groupId && selectedShapeIds.includes(shape.groupId));"""

text = text.replace(target, replacement)

with open("components/Canvas.tsx", "w") as f:
    f.write(text)
