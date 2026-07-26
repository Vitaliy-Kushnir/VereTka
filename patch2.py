with open("components/Canvas.tsx", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "if (shape.state === 'hidden' && !isSelected) return null;" in line:
        lines[i] = "                const isHidden = shape.state === 'hidden';\n"
    if "const isHiddenAndSelected = shape.state === 'hidden' && isSelected;" in line:
        lines[i] = "                const isHiddenAndSelected = isHidden && isSelected;\n"
    if "opacity: shape.state === 'disabled' || isDuplicationPreview ? 0.5 : 1," in line:
        lines[i] = "                        opacity: shape.state === 'disabled' || isDuplicationPreview ? 0.5 : (isHidden ? 0.3 : 1),\n"
    if "pointerEvents: lockedShapeIds.has(shape.id) ? 'none' : (isDisabled ? 'none' : 'auto')," in line:
        lines[i] = "                        pointerEvents: lockedShapeIds.has(shape.id) || isHidden ? 'none' : (isDisabled ? 'none' : 'auto'),\n"

with open("components/Canvas.tsx", "w") as f:
    f.writelines(lines)
