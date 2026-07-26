import re

with open("lib/translations.ts", "r") as f:
    lines = f.readlines()

out_lines = []
seen_keys = set()
current_lang = None

for line in lines:
    # Check if this line starts a new language block
    match_lang = re.match(r'^\s*([a-zA-Z_]+):\s*\{', line)
    if match_lang:
        current_lang = match_lang.group(1)
        seen_keys = set()
        out_lines.append(line)
        continue
    
    # Check if this line is a key-value pair
    match_kv = re.match(r'^\s*(?:\'|")?([a-zA-Z0-9_\-\.]+)(?:\'|")?\s*:', line)
    if match_kv and current_lang:
        key = match_kv.group(1)
        if key in seen_keys:
            # Duplicate key, skip it
            continue
        seen_keys.add(key)
    
    out_lines.append(line)

with open("lib/translations.ts", "w") as f:
    f.writelines(out_lines)
