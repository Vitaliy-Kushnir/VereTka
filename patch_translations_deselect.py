import re

with open("lib/translations.ts", "r") as f:
    text = f.read()

text = text.replace("'list.deselectAll': 'Зняти виділення'", "'list.deselectAll': 'Зняти всі виділення'")

with open("lib/translations.ts", "w") as f:
    f.write(text)
