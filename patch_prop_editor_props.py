import re

with open("components/PropertyEditor.tsx", "r") as f:
    text = f.read()

# 1. Import the icons
if "FlipHorizontalIcon" not in text:
    text = text.replace("import { DuplicateIcon", "import { DuplicateIcon, FlipHorizontalIcon, FlipVerticalIcon")

# 2. Add handleFlip to Props
if "handleFlip?: (direction: 'horizontal' | 'vertical') => void;" not in text:
    text = text.replace("onExtractFromGroup?: () => void;", "onExtractFromGroup?: () => void;\n  handleFlip?: (direction: 'horizontal' | 'vertical') => void;")

# 3. Add handleFlip to component args
text = text.replace(
    "onExtractFromGroup }) => {",
    "onExtractFromGroup, handleFlip }) => {"
)

# 4. Add the buttons to the header
header_r = """        <div className="flex justify-between items-center p-2 px-3 bg-[var(--bg-app)]/50 rounded-t-lg border-b border-[var(--border-primary)] flex-shrink-0">
            <h2 className="font-semibold text-[var(--text-primary)] text-sm">{t('props.title')}</h2>
            <div className="flex items-center gap-1">
                {handleFlip && (
                    <>
                        <button onClick={() => handleFlip('horizontal')} title={t('menu.edit.flipH') || 'Віддзеркалити по горизонталі (Shift+H)'} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><FlipHorizontalIcon size={18}/></button>
                        <button onClick={() => handleFlip('vertical')} title={t('menu.edit.flipV') || 'Віддзеркалити по вертикалі (Shift+V)'} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><FlipVerticalIcon size={18}/></button>
                    </>
                )}"""
if "FlipHorizontalIcon size={18}" not in text:
    text = text.replace("""        <div className="flex justify-between items-center p-2 px-3 bg-[var(--bg-app)]/50 rounded-t-lg border-b border-[var(--border-primary)] flex-shrink-0">
            <h2 className="font-semibold text-[var(--text-primary)] text-sm">{t('props.title')}</h2>
            <div className="flex items-center gap-1">""", header_r)
            
# Also add it to MultiSelection header
multi_header_r = """        <div className="flex flex-col h-full bg-[var(--bg-surface)]">
            <div className="flex justify-between items-center p-2 px-3 bg-[var(--bg-app)]/50 rounded-t-lg border-b border-[var(--border-primary)] flex-shrink-0">
                <h2 className="font-semibold text-[var(--text-primary)] text-sm">{t('props.multiTitle')} ({selectedShapes.length})</h2>
                <div className="flex items-center gap-1">
                    {handleFlip && (
                        <>
                            <button onClick={() => handleFlip('horizontal')} title={t('menu.edit.flipH') || 'Віддзеркалити по горизонталі (Shift+H)'} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><FlipHorizontalIcon size={18}/></button>
                            <button onClick={() => handleFlip('vertical')} title={t('menu.edit.flipV') || 'Віддзеркалити по вертикалі (Shift+V)'} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><FlipVerticalIcon size={18}/></button>
                        </>
                    )}"""
if "FlipVerticalIcon size={18}" not in multi_header_r:
    text = text.replace("""        <div className="flex flex-col h-full bg-[var(--bg-surface)]">
            <div className="flex justify-between items-center p-2 px-3 bg-[var(--bg-app)]/50 rounded-t-lg border-b border-[var(--border-primary)] flex-shrink-0">
                <h2 className="font-semibold text-[var(--text-primary)] text-sm">{t('props.multiTitle')} ({selectedShapes.length})</h2>
                <div className="flex items-center gap-1">""", multi_header_r)

with open("components/PropertyEditor.tsx", "w") as f:
    f.write(text)
