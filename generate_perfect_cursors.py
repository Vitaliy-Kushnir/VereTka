import re

rotate_svg = """<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'>
  <path d='M23 4v6h-6' fill='none' stroke='white' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/>
  <path d='M20.49 15a9 9 0 1 1-2.12-9.36L23 10' fill='none' stroke='white' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/>
  <path d='M23 4v6h-6' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>
  <path d='M20.49 15a9 9 0 1 1-2.12-9.36L23 10' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>
</svg>"""

adjust_svg = """<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'>
  <path d='M3 9 L21 9 L17 5' fill='none' stroke='white' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/>
  <path d='M21 15 L3 15 L7 19' fill='none' stroke='white' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/>
  <path d='M3 9 L21 9 L17 5' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>
  <path d='M21 15 L3 15 L7 19' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>
</svg>"""

duplicate_svg = """<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'>
  <!-- Bottom/Shadow cursor -->
  <path d='M8 8l14 8-6 2-2 6-6-14z' fill='white' stroke='black' stroke-width='1.5' stroke-linejoin='round'/>
  <!-- Top/Main cursor -->
  <path d='M3 3l14 8-6 2-2 6-6-14z' fill='black' stroke='white' stroke-width='1.5' stroke-linejoin='round'/>
</svg>"""

def clean(svg):
    return svg.replace('\n', '').replace('  ', '').replace('<', '%3C').replace('>', '%3E').replace(' ', '%20').replace('#', '%23')

rotate_cursor = f'`url("data:image/svg+xml,{clean(rotate_svg)}") 12 12, auto`'
adjust_cursor = f'`url("data:image/svg+xml,{clean(adjust_svg)}") 12 12, auto`'
duplicate_cursor = f'`url("data:image/svg+xml,{clean(duplicate_svg)}") 4 3, auto`'

with open('lib/constants.ts', 'r') as f:
    content = f.read()

content = re.sub(r'export const ROTATE_CURSOR_STYLE = `.*?`;', f'export const ROTATE_CURSOR_STYLE = {rotate_cursor};', content)
content = re.sub(r'export const ADJUST_CURSOR_STYLE = `.*?`;', f'export const ADJUST_CURSOR_STYLE = {adjust_cursor};', content)
content = re.sub(r'export const DUPLICATE_CURSOR_STYLE = `.*?`;', f'export const DUPLICATE_CURSOR_STYLE = {duplicate_cursor};', content)

with open('lib/constants.ts', 'w') as f:
    f.write(content)
print("SUCCESS")
