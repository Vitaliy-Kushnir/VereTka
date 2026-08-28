import re

with open("components/mobile/MobileBottomBar.tsx", "r") as f:
    text = f.read()

# Remove the bottom section in MobileBottomBar
# Wait, it's safer to just search for the comment and remove until the next section
s = text.find("{/* Bottom Section: Contextual Selection Actions when shapes are selected */}")
if s != -1:
    e = text.find("{/* Main Mobile Navigation Tabs (Portrait) */}")
    if e != -1:
        text = text[:s] + text[e:]

with open("components/mobile/MobileBottomBar.tsx", "w") as f:
    f.write(text)

