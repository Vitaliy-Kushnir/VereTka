import re

with open("App.tsx", "r") as f:
    text = f.read()

s_inst = r"(onDuplicate=\{handleDuplicate\}\n\s*isShapeSelected=\{selectedShapeIds\.length \> 0\}\n\s*onDelete=\{handleDelete\})"
r_inst = r"\1\n            onGroup={handleGroup}\n            onUngroup={handleUngroup}\n            onExtractFromGroup={handleExtractFromGroup}\n            onFlipH={() => handleFlip('horizontal')}\n            onFlipV={() => handleFlip('vertical')}"
text = re.sub(s_inst, r_inst, text)

with open("App.tsx", "w") as f:
    f.write(text)
