import re

help_de = """import React from 'react';
import { HelpComponents } from './HelpContentUK';

export const HelpContentDE: React.FC<HelpComponents> = ({ SectionTitle, SubTitle, Para, Key, ListItem }) => {
    return (
        <>
            <section>
                <SectionTitle id="intro">1. Einführung</SectionTitle>
                <Para>
                    Willkommen bei <strong className="text-[var(--text-primary)]">Veretka</strong> – dem Editor für Vektorgrafiken.
                    Veretka wurde für das schnelle Prototyping und die Gestaltung präziser geometrischer Formen und Diagramme entwickelt.
                </Para>
            </section>
            
            <section>
                <SectionTitle id="hotkeys">8. Tastaturkürzel</SectionTitle>
                <Para>Verwenden Sie diese Tastenkombinationen, um Ihren Arbeitsablauf zu beschleunigen.</Para>
                
                <SubTitle>Datei & Verlauf</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Strg+S</Key> — Projekt speichern.</ListItem>
                    <ListItem><Key>Strg+Z</Key> — Letzte Aktion rückgängig machen.</ListItem>
                    <ListItem><Key>Strg+Y</Key> (oder <Key>Strg+Umschalt+Z</Key>) — Aktion wiederholen.</ListItem>
                </ul>

                <SubTitle>Werkzeuge & Auswahl</SubTitle> 
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>V</Key> — "Auswählen"-Werkzeug aktivieren.</ListItem>
                    <ListItem><Key>A</Key> — "Knoten bearbeiten"-Werkzeug aktivieren.</ListItem>
                    <ListItem><Key>Strg+G</Key> — Ausgewählte Objekte gruppieren.</ListItem>
                    <ListItem><Key>Strg+Umschalt+G</Key> — Gruppierung aufheben.</ListItem>
                    <ListItem><Key>Strg+D</Key> — Ausgewähltes Objekt duplizieren.</ListItem>
                    <ListItem><Key>Strg+H</Key> — Horizontal spiegeln.</ListItem>
                    <ListItem><Key>Strg+V</Key> — Vertikal spiegeln.</ListItem>
                    <ListItem><Key>Entf</Key> / <Key>Rücktaste</Key> — Ausgewähltes Objekt/Knoten löschen.</ListItem>
                </ul>
                
                <SubTitle>Bewegung (Nudging)</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                     <ListItem><Key>Pfeiltasten</Key> — Ausgewähltes Objekt um 1 Pixel bewegen.</ListItem>
                     <ListItem><Key>Umschalt + Pfeiltasten</Key> — Ausgewähltes Objekt um 10 Pixel bewegen.</ListItem>
                     <ListItem><Key>Alt + Pfeiltasten</Key> — Ohne Einrasten (Snapping) bewegen.</ListItem>
                </ul>
                
                <SubTitle>Navigation & Allgemeines</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <Key>?</Key> — Alle Tastenkombinationen anzeigen.
                    </ListItem>
                    <ListItem>
                        <Key>Mausrad</Key> — Leinwand zoomen.
                    </ListItem>
                    <ListItem>
                        <Key>Mittlere Maustaste</Key> — Leinwand verschieben (Pan).
                    </ListItem>
                     <ListItem>
                        <Key>F11</Key> — Vollbildmodus aktivieren / verlassen.
                    </ListItem>
                    <ListItem>
                        <Key>Escape (Esc)</Key> — Aktuelle Aktion (Zeichnen) abbrechen, Auswahl aufheben oder Modal schließen.
                    </ListItem>
                </ul>
            </section>
        </>
    );
};
"""

help_fr = """import React from 'react';
import { HelpComponents } from './HelpContentUK';

export const HelpContentFR: React.FC<HelpComponents> = ({ SectionTitle, SubTitle, Para, Key, ListItem }) => {
    return (
        <>
            <section>
                <SectionTitle id="intro">1. Introduction</SectionTitle>
                <Para>
                    Bienvenue dans <strong className="text-[var(--text-primary)]">Veretka</strong> – l'éditeur graphique vectoriel.
                    Veretka est conçu pour le prototypage rapide et la conception de formes géométriques et de diagrammes précis.
                </Para>
            </section>
            
            <section>
                <SectionTitle id="hotkeys">8. Raccourcis Clavier</SectionTitle>
                <Para>Utilisez ces combinaisons pour accélérer votre flux de travail.</Para>
                
                <SubTitle>Fichier & Historique</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Ctrl+S</Key> — Enregistrer le projet.</ListItem>
                    <ListItem><Key>Ctrl+Z</Key> — Annuler la dernière action.</ListItem>
                    <ListItem><Key>Ctrl+Y</Key> (or <Key>Ctrl+Maj+Z</Key>) — Refaire l'action.</ListItem>
                </ul>

                <SubTitle>Outils & Sélection</SubTitle> 
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>V</Key> — Activer l'outil "Sélectionner".</ListItem>
                    <ListItem><Key>A</Key> — Activer l'outil "Modifier les Noeuds".</ListItem>
                    <ListItem><Key>Ctrl+G</Key> — Grouper les objets sélectionnés.</ListItem>
                    <ListItem><Key>Ctrl+Maj+G</Key> — Dégrouper.</ListItem>
                    <ListItem><Key>Ctrl+D</Key> — Dupliquer l'objet sélectionné.</ListItem>
                    <ListItem><Key>Ctrl+H</Key> — Retourner Horizontalement.</ListItem>
                    <ListItem><Key>Ctrl+V</Key> — Retourner Verticalement.</ListItem>
                    <ListItem><Key>Suppr</Key> / <Key>Retour Arrière</Key> — Supprimer l'objet/noeud sélectionné.</ListItem>
                </ul>
                
                <SubTitle>Mouvement (Nudging)</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                     <ListItem><Key>Flèches</Key> — Déplacer l'objet sélectionné de 1 pixel.</ListItem>
                     <ListItem><Key>Maj + Flèches</Key> — Déplacer l'objet sélectionné de 10 pixels.</ListItem>
                     <ListItem><Key>Alt + Flèches</Key> — Déplacer sans magnétisme (snapping).</ListItem>
                </ul>
                
                <SubTitle>Navigation & Général</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <Key>?</Key> — Afficher tous les raccourcis.
                    </ListItem>
                    <ListItem>
                        <Key>Molette Souris</Key> — Zoomer la zone de travail.
                    </ListItem>
                    <ListItem>
                        <Key>Bouton Milieu Souris</Key> — Déplacer la zone de travail (Pan).
                    </ListItem>
                     <ListItem>
                        <Key>F11</Key> — Entrer / quitter le plein écran.
                    </ListItem>
                    <ListItem>
                        <Key>Échap (Esc)</Key> — Annuler l'action en cours (dessin), désélectionner ou fermer les fenêtres modales.
                    </ListItem>
                </ul>
            </section>
        </>
    );
};
"""

with open('components/help/HelpContentDE.tsx', 'w', encoding='utf-8') as f:
    f.write(help_de)

with open('components/help/HelpContentFR.tsx', 'w', encoding='utf-8') as f:
    f.write(help_fr)

with open('components/HelpModal.tsx', 'r', encoding='utf-8') as f:
    modal = f.read()

# Replace switch logic in HelpModal
old_switch = r"\{ \(\(\) => \{[\s\S]*?switch \(language\) \{[\s\S]*?\} \)\(\)\} *"
new_switch = """{(() => {
                            const helpProps = { SectionTitle, SubTitle, Para, Key, ListItem };
                            switch (language) {
                                case 'en':
                                    return <HelpContentEN {...helpProps} />;
                                case 'es':
                                    return <HelpContentES {...helpProps} />;
                                case 'it':
                                    return <HelpContentIT {...helpProps} />;
                                case 'de':
                                    return <HelpContentDE {...helpProps} />;
                                case 'fr':
                                    return <HelpContentFR {...helpProps} />;
                                default:
                                    return <HelpContentUK {...helpProps} />;
                            }
                        })()}"""

modal = re.sub(r"\{\(\(\) => \{[\s\S]*?switch \(language\) \{[\s\S]*?\}\n\s*\}\)\(\)\}", new_switch, modal)

with open('components/HelpModal.tsx', 'w', encoding='utf-8') as f:
    f.write(modal)

print("Help components updated successfully!")
