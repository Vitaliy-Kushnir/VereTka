import re

with open("components/Canvas.tsx", "r") as f:
    text = f.read()

s1 = """  const getTransform = (shape: Shape) => {
    let transformStr = "";
    const isFlippedH = 'isFlippedHorizontally' in shape && shape.isFlippedHorizontally;
    const isFlippedV = 'isFlippedVertically' in shape && shape.isFlippedVertically;
    const hasRotation = 'rotation' in shape && shape.rotation && shape.rotation !== 0;"""

r1 = """  const getTransform = (shape: Shape) => {
    let transformStr = "";
    const isSpecialFlip = ['image', 'bitmap', 'text', 'arc'].includes(shape.type);
    const isFlippedH = isSpecialFlip && 'isFlippedHorizontally' in shape && (shape as any).isFlippedHorizontally;
    const isFlippedV = isSpecialFlip && 'isFlippedVertically' in shape && (shape as any).isFlippedVertically;
    const hasRotation = 'rotation' in shape && shape.rotation && shape.rotation !== 0;"""

if s1 in text:
    text = text.replace(s1, r1)
    with open("components/Canvas.tsx", "w") as f:
        f.write(text)
else:
    print("Could not find getTransform in Canvas")

with open("components/PreviewModal.tsx", "r") as f:
    text2 = f.read()
if s1 in text2:
    text2 = text2.replace(s1, r1)
    with open("components/PreviewModal.tsx", "w") as f:
        f.write(text2)
else:
    print("Could not find getTransform in PreviewModal")

with open("lib/exportUtils.ts", "r") as f:
    text3 = f.read()
if s1 in text3:
    text3 = text3.replace(s1, r1)
    with open("lib/exportUtils.ts", "w") as f:
        f.write(text3)
else:
    print("Could not find getTransform in exportUtils")

