import re

def fix(filename):
    try:
        with open(filename, "r") as f:
            text = f.read()
            
        text = text.replace(
            "const isFlippedH = 'isFlippedHorizontally' in shape && shape.isFlippedHorizontally;",
            "const isSpecialFlip = ['image', 'bitmap', 'text', 'arc'].includes(shape.type);\n    const isFlippedH = isSpecialFlip && 'isFlippedHorizontally' in shape && (shape as any).isFlippedHorizontally;"
        )
        text = text.replace(
            "const isFlippedV = 'isFlippedVertically' in shape && shape.isFlippedVertically;",
            "const isFlippedV = isSpecialFlip && 'isFlippedVertically' in shape && (shape as any).isFlippedVertically;"
        )
        
        text = text.replace(
            "const isFlippedH = 'isFlippedHorizontally' in s && s.isFlippedHorizontally;",
            "const isSpecialFlip = ['image', 'bitmap', 'text', 'arc'].includes(s.type);\n        const isFlippedH = isSpecialFlip && 'isFlippedHorizontally' in s && (s as any).isFlippedHorizontally;"
        )
        text = text.replace(
            "const isFlippedV = 'isFlippedVertically' in s && s.isFlippedVertically;",
            "const isFlippedV = isSpecialFlip && 'isFlippedVertically' in s && (s as any).isFlippedVertically;"
        )

        with open(filename, "w") as f:
            f.write(text)
    except Exception as e:
        print(f"Error {filename}: {e}")

fix("components/PreviewModal.tsx")
fix("lib/exportUtils.ts")

