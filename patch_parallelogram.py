import re

with open("App.tsx", "r") as f:
    text = f.read()

s = r"                      if \(direction === 'horizontal' && newS\.type === 'triangle'\) \{\n                          newS\.topVertexOffset = -\(newS\.topVertexOffset \|\| 0\);\n                      \}"
r_new = r"""                      if (direction === 'horizontal' && newS.type === 'triangle') {
                          newS.topVertexOffset = -(newS.topVertexOffset || 0);
                      }
                      if (direction === 'horizontal' && newS.type === 'parallelogram') {
                          newS.angle = 180 - (newS.angle || 90);
                      }"""

text = re.sub(s, r_new, text)

with open("App.tsx", "w") as f:
    f.write(text)
