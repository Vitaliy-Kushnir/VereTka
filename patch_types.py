import re

with open("types.ts", "r") as f:
    text = f.read()

s1 = """    // Fix: Add _previousStroke to store stroke color when stroke is toggled off.
    _previousStroke?: string;
}"""
r1 = """    // Fix: Add _previousStroke to store stroke color when stroke is toggled off.
    _previousStroke?: string;
    isFlippedHorizontally?: boolean;
    isFlippedVertically?: boolean;
}"""
text = text.replace(s1, r1)

with open("types.ts", "w") as f:
    f.write(text)
