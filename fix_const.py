import re

with open('lib/constants.ts', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("'bitmap': 'Bitmap',", "'bitmap': 'Bitmap',\n    'group': 'Група',")
code = code.replace("'Image [import]']", "'Image [import]', 'Group', 'Група']")

with open('lib/constants.ts', 'w', encoding='utf-8') as f:
    f.write(code)
