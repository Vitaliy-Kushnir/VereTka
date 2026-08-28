import re

with open("components/FloatingModeControls.tsx", "r") as f:
    text = f.read()

# 1. Remove "isMultiSelecting" logic
# It occurs in:
# const isMultiSelecting = selectedShapeIds.length >= 2 && !isDistributing;
text = text.replace("const isMultiSelecting = selectedShapeIds.length >= 2 && !isDistributing;", "const isMultiSelecting = false; // Disabled since HUD is unified at the bottom")

# The block itself:
s = text.find("{/* 5. MULTI-SELECTION MODE (when not distributing) */}")
if s != -1:
    e = text.find("{/* 6. PLACING IMAGE MODE */}")
    if e != -1:
        text = text[:s] + text[e:]

with open("components/FloatingModeControls.tsx", "w") as f:
    f.write(text)

