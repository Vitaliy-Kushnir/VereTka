import re
with open("components/Canvas.tsx", "r") as f:
    text = f.read()

text = text.replace("pointerEvents: 'stroke'", "pointerEvents: finalStaticProps.pointerEvents === 'none' ? 'none' : 'stroke'")

with open("components/Canvas.tsx", "w") as f:
    f.write(text)
