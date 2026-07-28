import re

with open('components/HelpModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

imports = """
import { HelpContentUK } from './help/HelpContentUK';
import { HelpContentEN } from './help/HelpContentEN';
import { HelpContentIT } from './help/HelpContentIT';
import { HelpContentES } from './help/HelpContentES';
import { HelpContentDE } from './help/HelpContentDE';
import { HelpContentFR } from './help/HelpContentFR';
"""

content = re.sub(
    r"import \{ HelpContentUK \}[\s\S]*?import \{ HelpContentES \}[^\n]*\n",
    imports.strip() + "\n",
    content
)

switch_logic = """
                            switch (language) {
                                case 'en':
                                    return <HelpContentEN />;
                                case 'es':
                                    return <HelpContentES />;
                                case 'it':
                                    return <HelpContentIT />;
                                case 'de':
                                    return <HelpContentDE />;
                                case 'fr':
                                    return <HelpContentFR />;
                                default:
                                    return <HelpContentUK />;
                            }
"""
content = re.sub(
    r"switch \(language\) \{[\s\S]*?default:[\s\S]*?\}\n",
    switch_logic.strip() + "\n",
    content
)

with open('components/HelpModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
