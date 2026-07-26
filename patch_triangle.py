import re

with open("App.tsx", "r") as f:
    text = f.read()

s = r"                      if \(\['polygon', 'star', 'triangle', 'right-triangle', 'trapezoid', 'parallelogram', 'image', 'bitmap', 'text', 'arc'\]\.includes\(newS\.type\)\) \{"
r_new = r"""                      if (direction === 'horizontal' && newS.type === 'triangle') {
                          newS.topVertexOffset = -(newS.topVertexOffset || 0);
                      }
                      if (['polygon', 'star', 'triangle', 'right-triangle', 'trapezoid', 'parallelogram', 'image', 'bitmap', 'text', 'arc'].includes(newS.type)) {"""

text = re.sub(s, r_new, text)

with open("App.tsx", "w") as f:
    f.write(text)
