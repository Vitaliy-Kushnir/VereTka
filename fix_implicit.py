import re

with open('App.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

patterns = [
    (r'\bps =>', r'(ps: any) =>'),
    (r'\bs =>', r'(s: any) =>'),
    (r'\bl =>', r'(l: any) =>'),
    (r'\bid =>', r'(id: string) =>'),
    (r'\bidx =>', r'(idx: number) =>'),
    (r'\bp =>', r'(p: any) =>'),
    (r'\bt =>', r'(t: any) =>'),
]

for p, r in patterns:
    code = re.sub(p, r, code)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
