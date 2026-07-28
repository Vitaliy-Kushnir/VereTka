import re

# We want to patch WelcomeScreen.tsx and SettingsModal.tsx

def patch_welcome(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update selected button display
    selected_logic = """
                        {language === 'uk' ? (
                            <svg viewBox="0 0 24 16" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                <rect width="24" height="8" fill="#0057B7"/>
                                <rect y="8" width="24" height="8" fill="#FFDD00"/>
                            </svg>
                        ) : language === 'en' ? (
                            <svg viewBox="0 0 60 30" width="18" height="12" className="rounded-[1px] flex-shrink-0 bg-[#012169]" preserveAspectRatio="none">
                                <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFF" strokeWidth="6"/>
                                <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
                                <path d="M30,0 L30,30 M0,15 L60,15" stroke="#FFF" strokeWidth="10"/>
                                <path d="M30,0 L30,30 M0,15 L60,15" stroke="#C8102E" strokeWidth="6"/>
                            </svg>
                        ) : language === 'de' ? (
                            <svg viewBox="0 0 3 3" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                <rect width="3" height="1" fill="#000000"/>
                                <rect y="1" width="3" height="1" fill="#DD0000"/>
                                <rect y="2" width="3" height="1" fill="#FFCE00"/>
                            </svg>
                        ) : language === 'fr' ? (
                            <svg viewBox="0 0 3 2" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                <rect width="1" height="2" fill="#002395"/>
                                <rect x="1" width="1" height="2" fill="#FFFFFF"/>
                                <rect x="2" width="1" height="2" fill="#ED2939"/>
                            </svg>
                        ) : language === 'it' ? (
                            <svg viewBox="0 0 3 2" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                <rect width="1" height="2" fill="#009246"/>
                                <rect x="1" width="1" height="2" fill="#F1F2F1"/>
                                <rect x="2" width="1" height="2" fill="#CE2B37"/>
                            </svg>
                        ) : (
                            <svg viewBox="0 0 3 2" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                <rect width="3" height="2" fill="#AA151B"/>
                                <rect y="0.5" width="3" height="1" fill="#F1BF00"/>
                            </svg>
                        )}
                        {language === 'uk' ? 'Укр' : language === 'en' ? 'Eng' : language === 'de' ? 'Deu' : language === 'fr' ? 'Fra' : language === 'it' ? 'Ita' : 'Esp'}
"""
    
    # regex replace the old block
    content = re.sub(
        r"\{language === 'uk' \? \([\s\S]*?(?=<div className=\"pointer-events-none)",
        selected_logic.strip() + "\n                        ",
        content
    )

    dropdown_logic = """
                            <button
                                onClick={() => { setLanguage('uk'); setIsLanguageOpen(false); }}
                                className="w-full text-right py-1.5 px-3 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center justify-end gap-2 transition-colors"
                            >
                                <span className="flex-grow text-left">Українська</span>
                                <svg viewBox="0 0 24 16" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                    <rect width="24" height="8" fill="#0057B7"/>
                                    <rect y="8" width="24" height="8" fill="#FFDD00"/>
                                </svg>
                            </button>
                            <button
                                onClick={() => { setLanguage('en'); setIsLanguageOpen(false); }}
                                className="w-full text-right py-1.5 px-3 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center justify-end gap-2 transition-colors"
                            >
                                <span className="flex-grow text-left">English</span>
                                <svg viewBox="0 0 60 30" width="18" height="12" className="rounded-[1px] flex-shrink-0 bg-[#012169]" preserveAspectRatio="none">
                                    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFF" strokeWidth="6"/>
                                    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
                                    <path d="M30,0 L30,30 M0,15 L60,15" stroke="#FFF" strokeWidth="10"/>
                                    <path d="M30,0 L30,30 M0,15 L60,15" stroke="#C8102E" strokeWidth="6"/>
                                </svg>
                            </button>
                            <button
                                onClick={() => { setLanguage('de'); setIsLanguageOpen(false); }}
                                className="w-full text-right py-1.5 px-3 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center justify-end gap-2 transition-colors"
                            >
                                <span className="flex-grow text-left">Deutsch</span>
                                <svg viewBox="0 0 3 3" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                    <rect width="3" height="1" fill="#000000"/>
                                    <rect y="1" width="3" height="1" fill="#DD0000"/>
                                    <rect y="2" width="3" height="1" fill="#FFCE00"/>
                                </svg>
                            </button>
                            <button
                                onClick={() => { setLanguage('fr'); setIsLanguageOpen(false); }}
                                className="w-full text-right py-1.5 px-3 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center justify-end gap-2 transition-colors"
                            >
                                <span className="flex-grow text-left">Français</span>
                                <svg viewBox="0 0 3 2" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                    <rect width="1" height="2" fill="#002395"/>
                                    <rect x="1" width="1" height="2" fill="#FFFFFF"/>
                                    <rect x="2" width="1" height="2" fill="#ED2939"/>
                                </svg>
                            </button>
                            <button
                                onClick={() => { setLanguage('it'); setIsLanguageOpen(false); }}
                                className="w-full text-right py-1.5 px-3 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center justify-end gap-2 transition-colors"
                            >
                                <span className="flex-grow text-left">Italiano</span>
                                <svg viewBox="0 0 3 2" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                    <rect width="1" height="2" fill="#009246"/>
                                    <rect x="1" width="1" height="2" fill="#F1F2F1"/>
                                    <rect x="2" width="1" height="2" fill="#CE2B37"/>
                                </svg>
                            </button>
                            <button
                                onClick={() => { setLanguage('es'); setIsLanguageOpen(false); }}
                                className="w-full text-right py-1.5 px-3 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center justify-end gap-2 transition-colors"
                            >
                                <span className="flex-grow text-left">Español</span>
                                <svg viewBox="0 0 3 2" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                    <rect width="3" height="2" fill="#AA151B"/>
                                    <rect y="0.5" width="3" height="1" fill="#F1BF00"/>
                                </svg>
                            </button>
"""
    content = re.sub(
        r'<button[\s\S]*?Español[\s\S]*?</button>',
        dropdown_logic.strip(),
        content
    )

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

def patch_settings(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    selected_logic = """
                                            {language === 'uk' ? (
                                                <svg viewBox="0 0 24 16" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                                    <rect width="24" height="8" fill="#0057B7"/>
                                                    <rect y="8" width="24" height="8" fill="#FFDD00"/>
                                                </svg>
                                            ) : language === 'en' ? (
                                                <svg viewBox="0 0 60 30" width="18" height="12" className="rounded-[1px] flex-shrink-0 bg-[#012169]" preserveAspectRatio="none">
                                                    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFF" strokeWidth="6"/>
                                                    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
                                                    <path d="M30,0 L30,30 M0,15 L60,15" stroke="#FFF" strokeWidth="10"/>
                                                    <path d="M30,0 L30,30 M0,15 L60,15" stroke="#C8102E" strokeWidth="6"/>
                                                </svg>
                                            ) : language === 'de' ? (
                                                <svg viewBox="0 0 3 3" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                                    <rect width="3" height="1" fill="#000000"/>
                                                    <rect y="1" width="3" height="1" fill="#DD0000"/>
                                                    <rect y="2" width="3" height="1" fill="#FFCE00"/>
                                                </svg>
                                            ) : language === 'fr' ? (
                                                <svg viewBox="0 0 3 2" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                                    <rect width="1" height="2" fill="#002395"/>
                                                    <rect x="1" width="1" height="2" fill="#FFFFFF"/>
                                                    <rect x="2" width="1" height="2" fill="#ED2939"/>
                                                </svg>
                                            ) : language === 'it' ? (
                                                <svg viewBox="0 0 3 2" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                                    <rect width="1" height="2" fill="#009246"/>
                                                    <rect x="1" width="1" height="2" fill="#F1F2F1"/>
                                                    <rect x="2" width="1" height="2" fill="#CE2B37"/>
                                                </svg>
                                            ) : (
                                                <svg viewBox="0 0 3 2" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                                    <rect width="3" height="2" fill="#AA151B"/>
                                                    <rect y="0.5" width="3" height="1" fill="#F1BF00"/>
                                                </svg>
                                            )}
                                            {language === 'uk' ? 'Українська' : language === 'en' ? 'English' : language === 'de' ? 'Deutsch' : language === 'fr' ? 'Français' : language === 'it' ? 'Italiano' : 'Español'}
"""

    content = re.sub(
        r"\{language === 'uk' \? \([\s\S]*?(?=<div className=\"pointer-events-none)",
        selected_logic.strip() + "\n                                            ",
        content
    )

    dropdown_logic = """
                                                <button
                                                    onClick={() => { setLanguage('uk'); setIsLanguageOpen(false); }}
                                                    className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"
                                                >
                                                    <svg viewBox="0 0 24 16" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                                        <rect width="24" height="8" fill="#0057B7"/>
                                                        <rect y="8" width="24" height="8" fill="#FFDD00"/>
                                                    </svg>
                                                    Українська
                                                </button>
                                                <button
                                                    onClick={() => { setLanguage('en'); setIsLanguageOpen(false); }}
                                                    className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"
                                                >
                                                    <svg viewBox="0 0 60 30" width="18" height="12" className="rounded-[1px] flex-shrink-0 bg-[#012169]" preserveAspectRatio="none">
                                                        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFF" strokeWidth="6"/>
                                                        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
                                                        <path d="M30,0 L30,30 M0,15 L60,15" stroke="#FFF" strokeWidth="10"/>
                                                        <path d="M30,0 L30,30 M0,15 L60,15" stroke="#C8102E" strokeWidth="6"/>
                                                    </svg>
                                                    English
                                                </button>
                                                <button
                                                    onClick={() => { setLanguage('de'); setIsLanguageOpen(false); }}
                                                    className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"
                                                >
                                                    <svg viewBox="0 0 3 3" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                                        <rect width="3" height="1" fill="#000000"/>
                                                        <rect y="1" width="3" height="1" fill="#DD0000"/>
                                                        <rect y="2" width="3" height="1" fill="#FFCE00"/>
                                                    </svg>
                                                    Deutsch
                                                </button>
                                                <button
                                                    onClick={() => { setLanguage('fr'); setIsLanguageOpen(false); }}
                                                    className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"
                                                >
                                                    <svg viewBox="0 0 3 2" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                                        <rect width="1" height="2" fill="#002395"/>
                                                        <rect x="1" width="1" height="2" fill="#FFFFFF"/>
                                                        <rect x="2" width="1" height="2" fill="#ED2939"/>
                                                    </svg>
                                                    Français
                                                </button>
                                                <button
                                                    onClick={() => { setLanguage('it'); setIsLanguageOpen(false); }}
                                                    className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"
                                                >
                                                    <svg viewBox="0 0 3 2" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                                        <rect width="1" height="2" fill="#009246"/>
                                                        <rect x="1" width="1" height="2" fill="#F1F2F1"/>
                                                        <rect x="2" width="1" height="2" fill="#CE2B37"/>
                                                    </svg>
                                                    Italiano
                                                </button>
                                                <button
                                                    onClick={() => { setLanguage('es'); setIsLanguageOpen(false); }}
                                                    className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"
                                                >
                                                    <svg viewBox="0 0 3 2" width="18" height="12" className="rounded-[1px] flex-shrink-0" preserveAspectRatio="none">
                                                        <rect width="3" height="2" fill="#AA151B"/>
                                                        <rect y="0.5" width="3" height="1" fill="#F1BF00"/>
                                                    </svg>
                                                    Español
                                                </button>
"""
    
    content = re.sub(
        r'<button[\s\S]*?Español[\s\S]*?</button>',
        dropdown_logic.strip(),
        content
    )

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

patch_welcome('components/WelcomeScreen.tsx')
patch_settings('components/SettingsModal.tsx')
