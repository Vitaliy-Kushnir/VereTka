import re
import json

with open('./components/CloudGalleryModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# We'll use a regex to find Cyrillic strings inside quotes or JSX text.
# To be safe, we will find exact strings and replace them.

def get_key(idx):
    return f"cloud.gallery.{idx:03d}"

translations = {}
idx = 1

# 1. JSX text (between > and <)
# Wait, this might match code. We need to be careful.
jsx_text_pattern = re.compile(r'>\s*([^{}<>]*[А-Яа-яІіЇїЄєҐґ][^{}<>]*)\s*<')

# Let's just find them and do a safe string replacement.
found = set()
for m in jsx_text_pattern.finditer(content):
    text = m.group(1).strip()
    if text:
        found.add(text)

# 2. Inside quotes (single, double, backticks)
# e.g. placeholder="...", title="..."
attr_pattern = re.compile(r'(?:title|placeholder|label|text|message|confirmText|cancelText|searchPlaceholder|name|subject|body)\s*=\s*(["\'`])(.*?)\1', re.IGNORECASE)
for m in attr_pattern.finditer(content):
    text = m.group(2).strip()
    if re.search(r'[А-Яа-яІіЇїЄєҐґ]', text):
        found.add(text)

# Strings in ternary operators or general quotes
general_quotes = re.compile(r'(["\'`])([^"\'`\\]*[А-Яа-яІіЇїЄєҐґ][^"\'`\\]*)\1')
for m in general_quotes.finditer(content):
    text = m.group(2).strip()
    if text and text not in found:
        found.add(text)

# sort by length descending to replace longer strings first to avoid partial replacements
sorted_texts = sorted(list(found), key=len, reverse=True)

with open('extracted_texts.json', 'w', encoding='utf-8') as f:
    json.dump(sorted_texts, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(sorted_texts)} strings.")
