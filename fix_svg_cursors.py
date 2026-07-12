import urllib.parse

def make_cursor(svg, x, y):
    encoded = urllib.parse.quote(svg).replace('%20', ' ')
    return f'`url("data:image/svg+xml,{encoded}") {x} {y}, auto`'

rotate_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>"""

adjust_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9 L21 9 L17 5"/><path d="M21 15 L3 15 L7 19"/></svg>"""

duplicate_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M4.2 3.2l14 8-6 2-2 6-6-14z" fill="black"/><path d="M14 18h6m-3-3v6" stroke="black" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>"""

print(f"export const ROTATE_CURSOR_STYLE = {make_cursor(rotate_svg, 12, 12)};")
print(f"export const ADJUST_CURSOR_STYLE = {make_cursor(adjust_svg, 12, 12)};")
print(f"export const DUPLICATE_CURSOR_STYLE = {make_cursor(duplicate_svg, 4, 3)};")
