import React from 'react';
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
