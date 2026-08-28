import re

with open("components/MultiSelectHUD.tsx", "r") as f:
    text = f.read()

# Add DistributePathIcon import
text = text.replace("GroupIcon,", "GroupIcon,\n    DistributePathIcon,")

# Add to interface
text = text.replace("onOpenAlign?: () => void;", "onOpenAlign?: () => void;\n    onStartDistributePath?: () => void;")
text = text.replace("onOpenAlign,\n    onFlipH,", "onOpenAlign,\n    onStartDistributePath,\n    onFlipH,")

# Add button
align_button = """                {/* Align Action */}
                {onOpenAlign && selectedCount > 1 && (
                    <button
                        type="button"
                        onClick={onOpenAlign}
                        title={t('menu.tools.align') || 'Вирівняти'}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-secondary)] transition-colors shrink-0"
                    >
                        <AlignShapesCenterHIcon size={15} />
                        <span className="hidden sm:inline">{t('menu.tools.align') || 'Вирівняти'}</span>
                    </button>
                )}"""

distribute_button = """
                {/* Distribute along path action */}
                {onStartDistributePath && selectedCount > 1 && (
                    <button
                        type="button"
                        onClick={onStartDistributePath}
                        title={t('tool.distribute.path') || 'Розподілити за контуром'}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 text-xs font-medium border border-amber-500/30 transition-colors shrink-0"
                    >
                        <DistributePathIcon size={15} />
                        <span className="hidden sm:inline">{t('tool.distribute.path') || 'За шляхом'}</span>
                    </button>
                )}"""

text = text.replace(align_button, align_button + distribute_button)

with open("components/MultiSelectHUD.tsx", "w") as f:
    f.write(text)

