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
                <SectionTitle id="cloud-storage">8. Cloud-Speicher und Galerie</SectionTitle>
                <SubTitle>Funktionsübersicht</SubTitle>
                <Para>
                    Der <strong className="text-[var(--text-primary)]">Cloud-Speicher und Galerie</strong> ist ein integrierter Online-Dienst, mit dem Sie Ihre Projekte online speichern, von jedem Gerät darauf zugreifen, sie in der öffentlichen Galerie teilen und in Gruppenräumen (Zellen/Gruppen) zusammenarbeiten können.
                </Para>
                <Para>
                    Sie können den Cloud-Speicher auf verschiedene Arten öffnen:
                </Para>
                <ul className="list-disc list-inside space-y-1 pl-2">
                    <ListItem>Hauptmenü: <Key>Datei</Key> → <Key>In der Cloud veröffentlichen...</Key></ListItem>
                    <ListItem>Schaltfläche <Key>Galerie & Speicher</Key> in der oberen Symbolleiste.</ListItem>
                    <ListItem>Schaltfläche <Key>Cloud-Galerie</Key> auf dem Willkommensbildschirm.</ListItem>
                </ul>

                <SubTitle>Persönliche Truhe (Persönlicher Bereich)</SubTitle>
                <Para>
                    Ihre <strong className="text-[var(--text-primary)]">Truhe</strong> ist Ihr privater Speicherplatz. In Ihrer Truhe gespeicherte Projekte sind nur für Sie sichtbar.
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Zugang & Schutz:</strong> Melden Sie sich mit Ihrem Benutzernamen und Passwort oder über Ihr Google-Konto an.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Speichern & Öffnen:</strong> Speichern Sie Vektorgrafiken unter einem beliebigen Namen. Vorschaukarten zeigen Erstellungsdatum und Objektanzahl. Klicken Sie auf eine Karte, um das Projekt direkt im Editor zu öffnen.
                    </ListItem>
                </ul>

                <SubTitle>Öffentliche Galerie</SubTitle>
                <Para>
                    Die <strong className="text-[var(--text-primary)]">Öffentliche Galerie</strong> ist ein gemeinsamer Katalog, der für alle Veretka-Benutzer zugänglich ist. Öffnen Sie fremde Projekte zur Ansicht oder Veröffentlichung eigener Arbeiten!
                </Para>

                <SubTitle>Zellen und Gruppen (Bildung & Teams)</SubTitle>
                <Para>
                    <strong className="text-[var(--text-primary)]">Zellen / Gruppen</strong> sind dedicated Räume für Schulklassen, Kurse, Designteams oder Arbeitsgruppen. Erstellen Sie eine Gruppe mit Passwort oder treten Sie über den Gruppennamen bei!
                </Para>
            </section>

                        <section>
                <SectionTitle id="hotkeys">9. Tastaturkürzel</SectionTitle>
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
