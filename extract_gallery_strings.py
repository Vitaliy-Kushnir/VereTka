import re
import os

with open('./components/CloudGalleryModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to find all strings with Cyrillic characters.
# This might be tricky because there are JSX text nodes, string literals, and template strings.

def extract_strings(text):
    # simple heuristic: find strings that contain Cyrillic
    pattern = r'["\'>]([^"\'<>]*[А-Яа-яІіЇїЄєҐґ][^"\'<>]*)["\'<]'
    matches = re.finditer(pattern, text)
    found = []
    for m in matches:
        found.append(m.group(1).strip())
    return list(set(found))

strings = extract_strings(content)
for s in strings:
    print(s)

