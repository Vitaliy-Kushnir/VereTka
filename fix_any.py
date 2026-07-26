import re

with open('App.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix prev
code = re.sub(r'\(prev\) =>', r'(prev: any) =>', code)
code = re.sub(r'prev =>', r'(prev: any) =>', code)
# Fix l
code = re.sub(r'\(l\) =>', r'(l: any) =>', code)
code = re.sub(r'\(l, ', r'(l: any, ', code)
# Fix s
code = re.sub(r'\(s\) =>', r'(s: any) =>', code)
code = re.sub(r'\(s, ', r'(s: any, ', code)
# Fix ps
code = re.sub(r'\(ps\) =>', r'(ps: any) =>', code)
code = re.sub(r'\(ps, ', r'(ps: any, ', code)
# Fix layer
code = re.sub(r'\(layer\) =>', r'(layer: any) =>', code)
code = re.sub(r'layer =>', r'(layer: any) =>', code)
# Fix id
code = re.sub(r'\(id\) =>', r'(id: string) =>', code)
code = re.sub(r'\(id, ', r'(id: string, ', code)
# Fix childId, child, sid
code = re.sub(r'\(childId\) =>', r'(childId: string) =>', code)
code = re.sub(r'childId =>', r'(childId: string) =>', code)
code = re.sub(r'\(child\) =>', r'(child: any) =>', code)
code = re.sub(r'child =>', r'(child: any) =>', code)
code = re.sub(r'\(sid\) =>', r'(sid: string) =>', code)
code = re.sub(r'sid =>', r'(sid: string) =>', code)
# Fix idx
code = re.sub(r'\(idx\) =>', r'(idx: number) =>', code)
code = re.sub(r'idx =>', r'(idx: number) =>', code)
code = re.sub(r'\(layer, idx\) =>', r'(layer: any, idx: number) =>', code)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
