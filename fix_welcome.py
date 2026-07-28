import re

with open('components/WelcomeScreen.tsx', 'r') as f:
    content = f.read()

# I need to wrap the buttons in the missing structure.
# The current file has:
#                    <button
#                                onClick={() => { setLanguage('uk'); setIsLanguageOpen(false); }}

broken_start = r'                    <button\s+onClick=\{\(\) => \{ setLanguage\(\'uk\'\); setIsLanguageOpen\(false\); \}\}'

replacement = """                    <button
                        onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                        className="text-[var(--text-primary)] pl-2 pr-6 py-1 opacity-70 hover:opacity-100 text-xs focus:outline-none flex items-center gap-1.5 cursor-pointer transition-colors bg-transparent border-0"
                        title={t('menu.edit.language') || 'Language'}
                    >
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
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1 text-[var(--text-secondary)]">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </button>
                    {isLanguageOpen && (
                        <div className="absolute right-0 top-full mt-1 w-32 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-md shadow-lg py-1 z-50 flex flex-col">
                            <button
                                onClick={() => { setLanguage('uk'); setIsLanguageOpen(false); }}"""

content = re.sub(broken_start, replacement, content)

# I also need to close the div and conditionally rendered block after Español button.
# Let's see what is after the dropdown buttons
broken_end = r'                                                    Español\n                                                </button>'

replacement_end = """                                                    Español
                                                </button>
                        </div>
                    )}"""

content = re.sub(broken_end, replacement_end, content)

with open('components/WelcomeScreen.tsx', 'w') as f:
    f.write(content)
