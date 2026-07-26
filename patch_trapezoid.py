import re

with open("App.tsx", "r") as f:
    text = f.read()

s = r"                      if \(direction === 'horizontal' && newS\.type === 'parallelogram'\) \{\n                          newS\.angle = 180 - \(newS\.angle \|\| 90\);\n                      \}"
r_new = r"""                      if (direction === 'horizontal' && newS.type === 'parallelogram') {
                          newS.angle = 180 - (newS.angle || 90);
                      }
                      if (direction === 'horizontal' && newS.type === 'trapezoid') {
                          const temp = newS.topLeftOffsetRatio;
                          newS.topLeftOffsetRatio = newS.topRightOffsetRatio;
                          newS.topRightOffsetRatio = temp;
                      }"""

text = re.sub(s, r_new, text)

with open("App.tsx", "w") as f:
    f.write(text)
