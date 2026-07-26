import re

with open("App.tsx", "r") as f:
    text = f.read()

text = text.replace(
    "<PropertyEditor onExtractFromGroup={handleExtractFromGroup}",
    "<PropertyEditor onExtractFromGroup={handleExtractFromGroup} handleFlip={handleFlip}"
)

with open("App.tsx", "w") as f:
    f.write(text)
