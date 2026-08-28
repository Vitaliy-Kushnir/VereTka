import re

with open("components/MultiSelectHUD.tsx", "r") as f:
    text = f.read()

# Make it support flip H and flip V
text = text.replace("import { \n    GroupIcon,", "import { \n    GroupIcon,\n    FlipHorizontalIcon,\n    FlipVerticalIcon,")
text = text.replace("onOpenAlign?: () => void;\n    onDeselectAll: () => void;", "onOpenAlign?: () => void;\n    onFlipH?: () => void;\n    onFlipV?: () => void;\n    onDeselectAll: () => void;")
text = text.replace("onOpenAlign,\n    onDeselectAll,", "onOpenAlign,\n    onFlipH,\n    onFlipV,\n    onDeselectAll,")

# Change the outer div className
old_div = """        <div 
            className={`fixed ${isMobile ? 'bottom-20 left-1/2 -translate-x-1/2 max-w-[94vw]' : 'top-16 left-1/2 -translate-x-1/2 max-w-xl'} z-[110] transition-all duration-200 animate-in fade-in slide-in-from-top-2 pointer-events-auto`}
            role="toolbar"
            aria-label="Панель мультивибору"
        >
            <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-[var(--bg-primary)]/95 text-[var(--text-primary)] rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.25)] border border-[var(--border-secondary)] backdrop-blur-md">"""

new_div = """        <div 
            className="w-full bg-[var(--bg-secondary)] border-t border-[var(--border-secondary)] z-[100] transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 pointer-events-auto"
            role="toolbar"
            aria-label="Панель вибору"
        >
            <div className="flex items-center px-2 py-2 overflow-x-auto hide-scrollbar gap-1 sm:gap-2 w-full">"""

text = text.replace(old_div, new_div)

# Change the Flip buttons (insert before Duplicate)
flip_buttons = """                {/* Align Action */}"""
flip_buttons_new = """                {/* Flip Actions */}
                {onFlipH && (
                    <button
                        type="button"
                        onClick={onFlipH}
                        title={t('menu.object.flipHorizontal') || 'Віддзеркалити по горизонталі'}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-secondary)] transition-colors shrink-0"
                    >
                        <FlipHorizontalIcon size={16} />
                    </button>
                )}
                {onFlipV && (
                    <button
                        type="button"
                        onClick={onFlipV}
                        title={t('menu.object.flipVertical') || 'Віддзеркалити по вертикалі'}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-secondary)] transition-colors shrink-0"
                    >
                        <FlipVerticalIcon size={16} />
                    </button>
                )}

                {/* Align Action */}"""
text = text.replace(flip_buttons, flip_buttons_new)

# Make other buttons match the new style (rounded-lg, slightly larger padding, shrink-0)
# Group:
text = text.replace('className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-medium transition-colors"', 'className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-secondary)] transition-colors shrink-0"')

# Select All
text = text.replace('className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-colors ${', 'className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors shrink-0 ${')
text = text.replace("? 'bg-[var(--accent-primary)] text-[var(--accent-text)]'", "? 'bg-[var(--accent-primary)] text-[var(--accent-text)] border-[var(--accent-primary)]'")
text = text.replace(": 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'", ": 'bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-secondary)]'")

# Delete Action
text = text.replace('className="flex items-center gap-1 px-2 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-semibold transition-colors"', 'className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 text-xs font-semibold transition-colors shrink-0"')

# Done Button
text = text.replace('className="p-1 sm:px-2.5 sm:py-1 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--border-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1 transition-colors"', 'className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"')


with open("components/MultiSelectHUD.tsx", "w") as f:
    f.write(text)

