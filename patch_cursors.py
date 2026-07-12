import re
with open('lib/constants.ts', 'r') as f:
    content = f.read()

rotate = '`url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M23 4v6h-6\'/%3E%3Cpath d=\'M20.49 15a9 9 0 1 1-2.12-9.36L23 10\'/%3E%3C/svg%3E") 12 12, auto`'
adjust = '`url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M3 9 L21 9 L17 5\'/%3E%3Cpath d=\'M21 15 L3 15 L7 19\'/%3E%3C/svg%3E") 12 12, auto`'
duplicate = '`url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M4.2 3.2l14 8-6 2-2 6-6-14z\' fill=\'white\'/%3E%3Cpath d=\'M14 18h6m-3-3v6\' stroke=\'white\' stroke-width=\'2.5\' stroke-linecap=\'round\' fill=\'none\'/%3E%3C/svg%3E") 4 3, auto`'

content = re.sub(r'export const ROTATE_CURSOR_STYLE = `.*?`;', f'export const ROTATE_CURSOR_STYLE = {rotate};', content)
content = re.sub(r'export const ADJUST_CURSOR_STYLE = `.*?`;', f'export const ADJUST_CURSOR_STYLE = {adjust};', content)
content = re.sub(r'export const DUPLICATE_CURSOR_STYLE = `.*?`;', f'export const DUPLICATE_CURSOR_STYLE = {duplicate};', content)

with open('lib/constants.ts', 'w') as f:
    f.write(content)
print("SUCCESS")
