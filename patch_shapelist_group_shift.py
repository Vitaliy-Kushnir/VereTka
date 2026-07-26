with open("components/ShapeList.tsx", "r") as f:
    text = f.read()

target = """                    if (shape.type === 'group' && e.shiftKey) {
                        // User specifically requested: selecting all child shapes in a group by clicking in the list on the row with the group name with the SHIFT key pressed.
                        if (shape.shapeIds && shape.shapeIds.length > 0) {
                            onSelectShape(shape.shapeIds, e.ctrlKey || e.metaKey, false, true);
                        }
                        return;
                    }"""

text = text.replace(target, "")

with open("components/ShapeList.tsx", "w") as f:
    f.write(text)
