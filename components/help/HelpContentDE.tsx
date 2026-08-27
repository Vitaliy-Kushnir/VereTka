import React from 'react';
import { HelpComponents } from './HelpContentUK';

export const HelpContentDE: React.FC<HelpComponents> = ({ SectionTitle, SubTitle, Para, Key, ListItem }) => {
    return (
        <>
            {/* 1. EINFÜHRUNG */}
            <section>
                <SectionTitle id="intro">1. Einführung</SectionTitle>
                <Para>
                    <strong className="text-[var(--text-primary)]">Veretka</strong> ist ein leistungsstarker und intuitiver webbasierter Vektorgrafik-Editor, der speziell für visuelles UI-Design, Vektorillustrationen und die automatische Generierung von sauberem Python-Code für die <Key>Tkinter</Key>-Bibliothek entwickelt wurde.
                </Para>
                <Para>
                    Der Editor verbindet Grafikdesign und Programmierung: Während Sie Formen auf der interaktiven Leinwand zeichnen, erzeugt die Anwendung sofort ein optimiertes, eigenständiges Python-Skript, das lokal oder in Online-Python-Umgebungen ausgeführt werden kann.
                </Para>
                <Para>
                    Dieses Handbuch beschreibt alle Funktionen von Veretka: von grundlegenden Vektorformen über Touchscreen- & Tablet-Gesten, Präzisionslupe und Joystick-Steuerung bis hin zur Zusammenarbeit in der Cloud.
                </Para>
            </section>

            {/* 2. SCHNITTSTELLENÜBERSICHT */}
            <section>
                <SectionTitle id="interface">2. Schnittstellenübersicht</SectionTitle>
                <Para>Die Benutzeroberfläche ist sowohl für Desktop-Arbeitsplätze als auch für mobile Touch-Geräte optimiert:</Para>
                <ul className="list-decimal list-inside space-y-3 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Hauptmenü (Obere Leiste):</strong> Zugriff auf alle globalen Befehle:
                        <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                            <li><Key>Datei</Key> — Neue Projekte erstellen, öffnen, speichern, Bilder exportieren (PNG, JPEG, SVG), in der Cloud veröffentlichen und Referenzbilder importieren.</li>
                            <li><Key>Bearbeiten</Key> — Rückgängig (<Key>Strg+Z</Key>) und Wiederholen (<Key>Strg+Y</Key>), Ausschneiden, Kopieren, Einfügen, Alles auswählen und Verlaufs-Zeitleiste.</li>
                            <li><Key>Objekt</Key> — Gruppieren, Gruppierung aufheben, Ebenenreihenfolge, Spiegeln, Ausrichten und Entlang Pfad verteilen.</li>
                            <li><Key>Ansicht</Key> — Lineale, Raster, Fanghilfen (Snapping), Laser-Nivellierer und Vollbildmodus umschalten.</li>
                            <li><Key>Hilfe</Key> — Dieses Handbuch, Tastaturkürzel-Übersicht und Feedback-Formular öffnen.</li>
                        </ul>
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Werkzeugleiste (Links / Unten auf Mobilgeräten):</strong> Auswahlwerkzeug (<Key>V</Key>), Knotenbearbeitung (<Key>A</Key>), Grundformen (Rechteck, Kreis/Ellipse, Dreieck, Stern, Polygon), Linien, Bézier-Kurven, Text und Pipette.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Dynamische Eigenschaftsleiste (Oben):</strong> Zeigt automatisch Einstellungen für das aktive Werkzeug oder ausgewählte Objekt: Füllfarbe, Konturfarbe, Konturstärke, Strichmuster, Eckenradius und Zeichenmodus (von Ecke oder Zentrum).
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Arbeitsleinwand (Canvas):</strong> Der zentrale Zeichenbereich mit flüssigem Zoom, Verschiebung und intelligenter Ausrichtung. Bei einem Zoom über 1000% wird automatisch ein 1-Pixel-Mikroraster aktiviert.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Tkinter-Code-Panel:</strong> Unter der linken Werkzeugleiste (oder als Schublade auf Tablets). Zeigt formatierten Python-Code in Echtzeit mit Syntaxhervorhebung, Kopieren, Dateiexport und 1-Klick-Ausführung in Online-Interpretern.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Ebenen- & Objektbaum (Rechts):</strong> Baumansicht zum einfachen Neuanordnen per Drag & Drop, Umbenennen, Sperren gegen versehentliche Änderungen und Ausblenden.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Statusleiste (Unten):</strong> Zeigt Zoomstufe, Mauszeiger-Koordinaten, HUD-Umschalter für schwebende Koordinaten und Fokus-Schaltfläche.
                    </ListItem>
                </ul>

                <SubTitle>Vollbildmodus</SubTitle>
                <Para>
                    Aktivieren Sie den Vollbildmodus über <Key>Ansicht</Key> → <Key>Vollbild</Key> oder mit <Key>F11</Key>, um ungestört zu arbeiten. Drücken Sie <Key>F11</Key> erneut zum Verlassen.
                </Para>
            </section>

            {/* 3. MIT PROJEKTEN ARBEITEN */}
            <section>
                <SectionTitle id="projects">3. Mit Projekten arbeiten</SectionTitle>
                <SubTitle>Neues Projekt erstellen</SubTitle>
                <Para>
                    Starten Sie ein Projekt über <Key>Datei</Key> → <Key>Neues Projekt...</Key> oder vom Startbildschirm. Legen Sie Titel, Abmessungen in Pixeln, Hintergrundfarbe und den Variablennamen des Canvas fest.
                </Para>
                <SubTitle>Speichern und Öffnen (.vec.json)</SubTitle>
                <Para>
                    Das native Format <Key>.vec.json</Key> ist eine strukturierte JSON-Datei, die alle Formen, Ebenen, Rastereinstellungen und eingebetteten Referenzbilder enthält.
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Speichern</Key> (<Key>Strg+S</Key>) — Speichert den aktuellen Stand in der Projektdatei.</ListItem>
                    <ListItem><Key>Speichern unter...</Key> — Erstellt eine neue Datei unter anderem Namen.</ListItem>
                    <ListItem><Key>Projekt öffnen...</Key> — Lädt eine gespeicherte <Key>.vec.json</Key>-Datei.</ListItem>
                </ul>
                <SubTitle>Automatisches Speichern und Wiederherstellung</SubTitle>
                <Para>
                    Veretka schützt vor Datenverlust durch mehrstufige Sicherheitsmechanismen:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Hintergrund-Autosave:</strong> Alle 2 Minuten wird der Stand im Browser-<Key>localStorage</Key> gesichert. Nach versehentlichem Schließen erscheint beim nächsten Besuch ein Banner zur 1-Klick-Wiederherstellung.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">„Zurück zum Projekt“ auf dem Startbildschirm:</strong> Wenn Sie ins Hauptmenü oder in die Galerie wechseln, bleibt Ihre Arbeit aktiv.
                    </ListItem>
                </ul>
            </section>

            {/* 4. ARBEITEN MIT VORLAGEN */}
            <section>
                <SectionTitle id="templates">4. Arbeiten mit Vorlagen</SectionTitle>
                <SubTitle>Zweck von Vorlagen</SubTitle>
                <Para>
                    Vorlagen speichern Leinwandgrößen, Farbpaletten, Hilfslinien und Ausgangsformen (wie UI-Rahmen, Koordinatengitter oder Logos).
                </Para>
                <SubTitle>Vorlagen erstellen und anwenden</SubTitle>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                    <ListItem>
                        Erstellen Sie Ihr Grundlayout und wählen Sie <Key>Datei</Key> → <Key>Als Vorlage speichern...</Key>.
                    </ListItem>
                    <ListItem>
                        Geben Sie einen Namen ein (z. B. „Spielfeld 800x600“ oder „Produktkarte“).
                    </ListItem>
                    <ListItem>
                        Wählen Sie bei zukünftigen Projekten die Vorlage aus der Liste „Aus Vorlage erstellen“.
                    </ListItem>
                </ol>
                <Para>
                    Verwalten Sie gespeicherte Vorlagen unter <Key>Einstellungen</Key> auf der Registerkarte <Key>Vorlagen</Key>.
                </Para>
            </section>

            {/* 5. MIT FORMEN ARBEITEN */}
            <section>
                <SectionTitle id="shapes">5. Mit Formen arbeiten</SectionTitle>
                <SubTitle>Zeichnen und Auswählen</SubTitle>
                <Para>
                    Wählen Sie ein Werkzeug und ziehen Sie mit gedrückter Maustaste auf der Leinwand.
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>Halten Sie <Key>Umschalt</Key> beim Zeichnen von Rechtecken/Ellipsen, um ein 1:1-Verhältnis (Quadrat/Kreis) zu erzwingen.</ListItem>
                    <ListItem>Halten Sie <Key>Alt</Key>, um Formen vom Mittelpunkt aus zu erstellen.</ListItem>
                    <ListItem>Das Werkzeug <Key>Auswählen</Key> (<Key>V</Key>) blendet Transformationsgriffe für Skalierung und Drehung ein.</ListItem>
                </ul>

                <SubTitle>Knotenbearbeitung (Vektorpfade)</SubTitle>
                <Para>
                    Das Werkzeug <Key>Knoten bearbeiten</Key> (<Key>A</Key>) ermöglicht die präzise Steuerung von Bézier-Kurven, Linien und Polygonen: Verschieben von Knotenpunkten, Einstellen von Tangentengriffen, Hinzufügen von Knoten per Klick und Löschen mit <Key>Entf</Key>.
                </Para>

                <SubTitle>Entlang Pfad verteilen (Distribute along Path)</SubTitle>
                <Para>
                    Verteilen Sie beliebige Objekte gleichmäßig entlang der Kontur einer Leitlinie oder Form:
                </Para>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                    <ListItem>Wählen Sie die zu verteilenden Objekte und die Leitform aus.</ListItem>
                    <ListItem>Wählen Sie im Menü <Key>Objekt</Key> den Punkt <Key>Entlang Pfad verteilen</Key>.</ListItem>
                    <ListItem>Wählen Sie die Ausrichtung: <strong>Radial</strong> (vom Zentrum nach außen), <strong>Tangential</strong> (entlang der Kurvenrichtung) oder <strong>Parallel</strong> (fester Winkel).</ListItem>
                </ol>

                <SubTitle>Gruppieren, Ausrichten und Spiegeln</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Strg+G</Key> — Ausgewählte Objekte gruppieren (Doppelklick zum Bearbeiten innerhalb der Gruppe).</ListItem>
                    <ListItem><Key>Strg+Umschalt+G</Key> — Gruppierung aufheben.</ListItem>
                    <ListItem><Key>Strg+H</Key> / <Key>Strg+V</Key> — Horizontal oder vertikal spiegeln.</ListItem>
                    <ListItem>Ausrichten-Schaltflächen in der oberen Leiste richten Objekte an Kanten, Mitten oder gleichmäßig verteilt aus.</ListItem>
                </ul>

                <SubTitle>Tkinter-Farbpalette & Farbbibliothek</SubTitle>
                <Para>
                    Unterstützt HEX-Farbcodes, RGB und einen Katalog von über 700 offiziellen Tkinter-Farbnamen. Spezifische Farbnamen werden automatisch synchronisiert für exakte Übereinstimmung zwischen Web-Vorschau und Tkinter-Fenster.
                </Para>

                <SubTitle>Bildimport für Vektor-Tracing</SubTitle>
                <Para>
                    Über <Key>Datei</Key> → <Key>Bild importieren...</Key> können Sie PNG/JPEG-Skizzen als Hintergrundreferenz zum manuellen Nachzeichnen laden.
                </Para>
            </section>

            {/* 6. TOUCHSCREENS, LUPE UND JOYSTICK */}
            <section>
                <SectionTitle id="touch-mobile">6. Touchscreens, Lupe und Joystick</SectionTitle>
                <Para>
                    Veretka ist vollständig für mobile Geräte, Tablets mit Eingabestiften (iPad Apple Pencil, Android-Tablets) und Touchscreens optimiert. Spezielle Touch-Modi und Präzisions-Assistenten erleichtern das Zeichnen auf jeder Bildschirmgröße.
                </Para>

                <SubTitle>Multi-Touch-Gesten auf der Leinwand</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Pinch-to-Zoom (Zwei-Finger-Zoom):</strong> Ziehen Sie zwei Finger zusammen oder auseinander, um stufenlos von 10% bis 3000% zu zoomen.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Zwei-Finger-Pan (Verschieben):</strong> Verschieben Sie die Leinwand mit zwei Fingern in jede Richtung, ohne versehentlich Formen zu zeichnen oder zu verschieben.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Einzelfinger (Tippen & Ziehen):</strong> Formen auswählen, neue Vektorformen zeichnen oder Elemente bewegen.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Langes Drücken (Long-Press):</strong> Halten Sie den Finger auf einem Objekt gedrückt, um das Kontextmenü zu öffnen (Kopieren, Löschen, In den Vordergrund, Spiegeln).
                    </ListItem>
                </ul>

                <SubTitle>Mobile Symbolleiste und Auszieh-Schubladen</SubTitle>
                <Para>
                    Auf Smartphones passt sich die Benutzeroberfläche für eine komfortable Daumenbedienung an:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><strong className="text-[var(--text-primary)]">Untere mobile Leiste:</strong> Schneller Zugriff auf Werkzeuge, Farbpalette, Rückgängig/Wiederholen und Präzisions-Widgets.</ListItem>
                    <ListItem><strong className="text-[var(--text-primary)]">Ausziehbare Schubladen (Drawers):</strong> Ebenenbaum, Objekteigenschaften und Tkinter-Code öffnen sich in kompakten Schubladen von unten oder der Seite.</ListItem>
                </ul>

                <SubTitle>Präzisionslupe (Touch-Vergrößerungsglas)</SubTitle>
                <Para>
                    Beim Zeichnen mit dem Finger verdeckt die Hand oft den Kontaktpunkt. Die Veretka-Präzisionslupe löst dieses Problem:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Touch-Versatz (Offset):</strong> Die Lupe projiziert eine vergrößerte Ansicht 60–90 Pixel oberhalb des Berührungspunkts.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Fadenkreuz & Pixel-HUD:</strong> Zeigt ein kontrastreiches Fadenkreuz mit aktuellen X/Y-Pixelkoordinaten des aktiven Punktes.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Lupe anheften (Pin):</strong> Fixieren Sie die Lupe in einer Bildschirmecke für dauerhafte Detailüberwachung.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Standbild (Freeze):</strong> Halten Sie die Vergrößerung an, um komplexe Knotenpunkte in Ruhe zu analysieren.
                    </ListItem>
                </ul>

                <SubTitle>Virtueller Präzisions-Joystick (Nudge-Steuerung)</SubTitle>
                <Para>
                    Für pixelgenaue Feinjustierung von Objekten und Knotenpunkten auf Touchscreens:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Analoger Touch-Stick:</strong> Bewegen Sie ausgewählte Objekte sanft in jede Richtung. Die Geschwindigkeit passt sich dem Stick-Ausschlag an.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Schritt-Tasten (1px und 10px):</strong> Präzise Richtungstasten zum Verschieben um exakt 1 Pixel (Mikroschritt) oder 10 Pixel (Großschritt).
                    </ListItem>
                </ul>

                <SubTitle>Verlaufs-Zeitleiste (History Popover)</SubTitle>
                <Para>
                    Durch langes Drücken auf <Key>Rückgängig</Key> oder <Key>Wiederholen</Key> öffnet sich eine chronologische Verlaufsliste. Sie können jeden früheren Arbeitsschritt mit Zeitstempel einsehen und mit einem Fingertipp ansteuern.
                </Para>
            </section>

            {/* 7. CODE UND EXPORT */}
            <section>
                <SectionTitle id="code-export">7. Code und Export</SectionTitle>
                <SubTitle>Python Tkinter Code-Generierung</SubTitle>
                <Para>
                    Der Editor wandelt jedes Grafikobjekt automatisch in die entsprechenden Tkinter Canvas-Befehle um (<Key>create_rectangle</Key>, <Key>create_oval</Key>, <Key>create_polygon</Key>, <Key>create_line</Key>, <Key>create_text</Key> etc.).
                </Para>
                <Para>
                    Der ausgegebene Code ist ein vollständiges Python-Programm inklusive Fensterinitialisierung (<Key>tk.Tk()</Key>), Canvas-Erstellung und Hauptschleife (<Key>mainloop()</Key>).
                </Para>
                <SubTitle>Online im Web-Interpreter testen</SubTitle>
                <Para>
                    Klicken Sie auf <Key>In ЄPython ausführen</Key> im Code-Panel, um Ihr Skript direkt im Browser ohne lokale Installation zu starten.
                </Para>
                <Para>
                    Bei sehr vielen Objekten kopiert die App den vollständigen Code automatisch in die Zwischenablage und öffnet den Runner zum bequemen Einfügen (<Key>Strg+V</Key>).
                </Para>
                <SubTitle>Dateispeicherung und Bildexport</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><strong className="text-[var(--text-primary)]">Skript speichern:</strong> Download als ausführbare <Key>.py</Key>-Datei oder formatierte <Key>.txt</Key>-Datei mit Zeilennummern.</ListItem>
                    <ListItem><strong className="text-[var(--text-primary)]">Vektor-SVG:</strong> Sauberer SVG-Export für Vektorgrafik-Software.</ListItem>
                    <ListItem><strong className="text-[var(--text-primary)]">Raster PNG / JPEG:</strong> Hochauflösender Bildexport mit Skalierungsfaktoren (1x, 2x, 4x Retina) und Qualitätsregler.</ListItem>
                </ul>
            </section>

            {/* 8. CLOUD-SPEICHER UND GALERIE */}
            <section>
                <SectionTitle id="cloud-storage">8. Cloud-Speicher und Galerie</SectionTitle>
                <SubTitle>Cloud-Plattform Übersicht</SubTitle>
                <Para>
                    Speichern Sie Projekte sicher in der Cloud, greifen Sie von beliebigen Geräten darauf zu, teilen Sie Kunstwerke in der Öffentlichen Galerie und arbeiten Sie in Gruppenräumen zusammen.
                </Para>
                <SubTitle>Persönliche Truhe (Privater Bereich)</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><strong>Anmeldung:</strong> Login mit Benutzername und Passwort oder mit 1 Klick über Ihr Google-Konto.</ListItem>
                    <ListItem><strong>Privatsphäre:</strong> Ihre Truhe ist absolut privat. Projektkarten zeigen Datum, Elementanzahl und Miniaturansicht.</ListItem>
                    <ListItem><strong>Versionierung:</strong> Möglichkeit, bestehende Projekte zu aktualisieren oder neue Versionen anzulegen.</ListItem>
                </ul>

                <SubTitle>Öffentliche Community-Galerie</SubTitle>
                <Para>
                    Entdecken Sie Arbeiten anderer Benutzer, suchen Sie nach Titeln oder Autoren, öffnen Sie Projekte im Editor und veröffentlichen Sie eigene Designs.
                </Para>

                <SubTitle>Zellen und Gruppen (Für Schulen, Kurse & Teams)</SubTitle>
                <Para>
                    Entwickelt für Informatikunterricht, Grafikworkshops und Design-Teams:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><strong>Gruppe erstellen:</strong> Lehrkräfte erstellen eine Zelle mit Namen und Gruppenpasswort.</ListItem>
                    <ListItem><strong>Einfache Kontrolle:</strong> Schüler reichen Zeichnungen ein; Lehrkräfte können diese direkt im Editor öffnen und den Code begutachten.</ListItem>
                </ul>
            </section>

            {/* 9. RÜCKMELDUNG */}
            <section>
                <SectionTitle id="feedback">9. Rückmeldung</SectionTitle>
                <Para>
                    Wir verbessern Veretka kontinuierlich und freuen uns über Ihr Feedback! Senden Sie Funktionswünsche oder Fehlerberichte über <Key>Hilfe</Key> → <Key>Feedback senden</Key>.
                </Para>
                <Para>
                    Zur schnelleren Fehlerbehebung fügt das Formular automatisch technische Umgebungsdaten bei (Editor-Version, Betriebssystem und Browserversion). Es werden keine vertraulichen oder persönlichen Dateien übermittelt.
                </Para>
            </section>

            {/* 10. HOTKEYS */}
            <section>
                <SectionTitle id="hotkeys">10. Hotkeys</SectionTitle>
                <Para>Nutzen Sie diese Tastenkombinationen auf Desktop-Computern für schnelles Arbeiten:</Para>

                <SubTitle>Datei & Verlauf</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Strg+S</Key> — Projekt speichern.</ListItem>
                    <ListItem><Key>Strg+Z</Key> — Letzte Aktion rückgängig machen.</ListItem>
                    <ListItem><Key>Strg+Y</Key> oder <Key>Strg+Umschalt+Z</Key> — Aktion wiederholen.</ListItem>
                </ul>

                <SubTitle>Werkzeuge & Bearbeitung</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>V</Key> — Werkzeug „Auswählen“.</ListItem>
                    <ListItem><Key>A</Key> — Werkzeug „Knoten bearbeiten“.</ListItem>
                    <ListItem><Key>Strg+G</Key> — Ausgewählte Objekte gruppieren.</ListItem>
                    <ListItem><Key>Strg+Umschalt+G</Key> — Gruppierung aufheben.</ListItem>
                    <ListItem><Key>Strg+D</Key> — Objekt duplizieren.</ListItem>
                    <ListItem><Key>Strg+H</Key> — Horizontal spiegeln.</ListItem>
                    <ListItem><Key>Strg+V</Key> — Vertikal spiegeln.</ListItem>
                    <ListItem><Key>Entf</Key> / <Key>Rücktaste</Key> — Ausgewähltes Objekt oder Knoten löschen.</ListItem>
                </ul>

                <SubTitle>Tastatur-Nudging (Verschiebung)</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Pfeiltasten</Key> — Ausgewähltes Objekt um exakt 1 Pixel bewegen.</ListItem>
                    <ListItem><Key>Umschalt + Pfeiltasten</Key> — Objekt um 10 Pixel bewegen.</ListItem>
                    <ListItem><Key>Alt + Pfeiltasten</Key> — Ohne Einrasten (Snapping) bewegen.</ListItem>
                </ul>

                <SubTitle>Navigation & Leinwandsteuerung</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Mausrad</Key> — Leinwand an Cursor-Position zoomen.</ListItem>
                    <ListItem><Key>Mittlere Maustaste (oder Leertaste + Linksklick)</Key> — Leinwand verschieben.</ListItem>
                    <ListItem><Key>F11</Key> — Vollbildmodus aktivieren / beenden.</ListItem>
                    <ListItem><Key>Escape (Esc)</Key> — Aktuelle Aktion abbrechen, Auswahl aufheben oder Dialoge schließen.</ListItem>
                    <ListItem><Key>?</Key> — Schnellübersicht aller Tastenkürzel öffnen.</ListItem>
                </ul>
            </section>
        </>
    );
};
