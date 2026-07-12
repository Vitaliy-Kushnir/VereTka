import base64

rotateSvg = "<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='filter: drop-shadow(0px 1px 1px rgba(255,255,255,0.9))'><path d='M23 4v6h-6'/><path d='M20.49 15a9 9 0 1 1-2.12-9.36L23 10'/></svg>"
adjustSvg = "<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='filter: drop-shadow(0px 1px 1px rgba(255,255,255,0.9))'><path d='M3 9 L21 9 L17 5'/><path d='M21 15 L3 15 L7 19'/></svg>"
duplicateSvg = "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' style='filter: drop-shadow(0px 1px 1px rgba(255,255,255,0.9))'><path d='M4.2 3.2l14 8-6 2-2 6-6-14z' fill='black' stroke-width='0'/><path d='M14 18h6m-3-3v6' stroke='black' stroke-width='2.5' stroke-linecap='round' fill='none'/></svg>"

def to_b64(svg):
    return "url(\"data:image/svg+xml;base64," + base64.b64encode(svg.encode('utf-8')).decode('utf-8') + "\")"

print(f"export const ROTATE_CURSOR_STYLE = `{to_b64(rotateSvg)} 10 10, auto`;")
print(f"export const ADJUST_CURSOR_STYLE = `{to_b64(adjustSvg)} 10 10, auto`;")
print(f"export const DUPLICATE_CURSOR_STYLE = `{to_b64(duplicateSvg)} 4 3, auto`;")
