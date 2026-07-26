import re
with open('lib/translations.ts', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        # We are looking for lines like: 'some.key': '"Something"',
        # where the value starts with " and ends with "
        # or has label="
        if 'label="' in line or re.search(r":\s*['`\"]\"(.*?)\"['`\"]", line):
            print(f"{i+1}: {line.strip()}")
