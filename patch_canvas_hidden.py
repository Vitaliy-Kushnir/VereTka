with open("components/Canvas.tsx", "r") as f:
    text = f.read()

target = """            {itemsToRender.filter(Boolean).map(shape => {
                const isSelected = selectedShapeIds.includes(shape.id);
                const isHidden = shape.state === 'hidden';

                const isHiddenAndSelected = isHidden && isSelected;"""

replacement = """            {itemsToRender.filter(Boolean).map(shape => {
                const isSelected = selectedShapeIds.includes(shape.id);
                const isHidden = shape.state === 'hidden';
                
                // User requirement: In hidden mode, display shapes (semi-transparently) ONLY if they are selected.
                if (isHidden && !isSelected) return null;

                const isHiddenAndSelected = isHidden && isSelected;"""

text = text.replace(target, replacement)

with open("components/Canvas.tsx", "w") as f:
    f.write(text)
