with open("components/mobile/MobileBottomBar.tsx", "r") as f:
    text = f.read()

# Insert the missing middle part
# Wait, I need to know exactly where the deletion happened.
s = text.find("{/* Main Mobile Navigation Tabs (Portrait) */}")
# Let's insert the missing `</aside>` and portrait setup right before this comment
missing = """            </aside>
        );
    }

    // -------------------------------------------------------------
    // PORTRAIT MODE: Horizontal Bottom Bar
    // -------------------------------------------------------------
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[var(--bg-primary)] border-t border-[var(--border-primary)] pb-[env(safe-area-inset-bottom)] z-[120] shadow-[0_-8px_25px_rgba(0,0,0,0.35)]">
            
            """

text = text[:s] + missing + text[s:]

with open("components/mobile/MobileBottomBar.tsx", "w") as f:
    f.write(text)

