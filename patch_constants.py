with open('lib/constants.ts', 'r') as f:
    content = f.read()

import re
content = re.sub(r'export const ROTATE_CURSOR_STYLE = `.*?`;', 'export const ROTATE_CURSOR_STYLE = `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMCcgaGVpZ2h0PScyMCcgdmlld0JveD0nMCAwIDI0IDI0JyBmaWxsPSdub25lJyBzdHJva2U9J2JsYWNrJyBzdHJva2Utd2lkdGg9JzInIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcgc3Ryb2tlLWxpbmVqb2luPSdyb3VuZCcgc3R5bGU9J2ZpbHRlcjogZHJvcC1zaGFkb3coMHB4IDFweCAxcHggcmdiYSgyNTUsMjU1LDI1NSwwLjkpKSc+PHBhdGggZD0nTTIzIDR2NmgtNicvPjxwYXRoIGQ9J00yMC40OSAxNWE5IDkgMCAxIDEtMi4xMi05LjM2TDIzIDEwJy8+PC9zdmc+") 10 10, auto`;', content)
content = re.sub(r'export const ADJUST_CURSOR_STYLE = `.*?`;', 'export const ADJUST_CURSOR_STYLE = `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMCcgaGVpZ2h0PScyMCcgdmlld0JveD0nMCAwIDI0IDI0JyBmaWxsPSdub25lJyBzdHJva2U9J2JsYWNrJyBzdHJva2Utd2lkdGg9JzInIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcgc3Ryb2tlLWxpbmVqb2luPSdyb3VuZCcgc3R5bGU9J2ZpbHRlcjogZHJvcC1zaGFkb3coMHB4IDFweCAxcHggcmdiYSgyNTUsMjU1LDI1NSwwLjkpKSc+PHBhdGggZD0nTTMgOSBMMjEgOSBMMTcgNScvPjxwYXRoIGQ9J00yMSAxNSBMMyAxNSBMNyAxOScvPjwvc3ZnPg==") 10 10, auto`;', content)
content = re.sub(r'export const DUPLICATE_CURSOR_STYLE = `.*?`;', 'export const DUPLICATE_CURSOR_STYLE = `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyNCcgaGVpZ2h0PScyNCcgc3R5bGU9J2ZpbHRlcjogZHJvcC1zaGFkb3coMHB4IDFweCAxcHggcmdiYSgyNTUsMjU1LDI1NSwwLjkpKSc+PHBhdGggZD0nTTQuMiAzLjJsMTQgOC02IDItMiA2LTYtMTR6JyBmaWxsPSdibGFjaycgc3Ryb2tlLXdpZHRoPScwJy8+PHBhdGggZD0nTTE0IDE4aDZtLTMtM3Y2JyBzdHJva2U9J2JsYWNrJyBzdHJva2Utd2lkdGg9JzIuNScgc3Ryb2tlLWxpbmVjYXA9J3JvdW5kJyBmaWxsPSdub25lJy8+PC9zdmc+") 4 3, auto`;', content)

with open('lib/constants.ts', 'w') as f:
    f.write(content)
print("SUCCESS")
