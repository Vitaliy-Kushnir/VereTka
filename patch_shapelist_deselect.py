import re

with open("components/ShapeList.tsx", "r") as f:
    text = f.read()

text = text.replace("SelectIcon, EditPointsIcon", "SelectIcon, SelectOffIcon, EditPointsIcon")
text = text.replace("<SquareIcon size={12} />", "<SelectOffIcon size={12} />")

with open("components/ShapeList.tsx", "w") as f:
    f.write(text)
