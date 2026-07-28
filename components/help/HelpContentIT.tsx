import React from 'react';
import { HelpComponents } from './HelpContentUK';

export const HelpContentIT: React.FC<HelpComponents> = ({ SectionTitle, SubTitle, Para, Key, ListItem }) => {
    return (
        <>
            <section>
                <SectionTitle id="intro">1. Introduzione</SectionTitle>
                <Para>
                    <strong className="text-[var(--text-primary)]">VereTka</strong> è uno strumento web semplice progettato per la creazione visiva di elementi grafici e la generazione automatica di codice per la libreria Tkinter in Python. L'editor funge da ponte tra design e sviluppo, consentendo di prototipare rapidamente, creare scene complesse e ottenere codice pulito e pronto all'uso.
                </Para>
                <Para>
                    Questa guida ti aiuterà a padroneggiare tutte le funzionalità dell'editor, dalle operazioni di base alle tecniche avanzate.
                </Para>
            </section>

            <section>
                <SectionTitle id="interface">2. Panoramica dell'interfaccia</SectionTitle>
                <Para>L'interfaccia dell'editor è suddivisa logicamente in zone funzionali per la massima comodità:</Para>
                <ul className="list-decimal list-inside space-y-3 pl-2">
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Menu principale:</strong> Situato in alto, fornisce accesso alle operazioni globali: gestione dei file (<Key>File</Key>), cronologia modifiche e appunti (<Key>Modifica</Key>), operazioni sugli oggetti (<Key>Oggetto</Key>), impostazioni di visibilità (<Key>Visualizza</Key>) e informazioni di aiuto (<Key>Aiuto</Key>). Sul lato destro del menu ci sono pulsanti per il cambio rapido del tema, la modalità schermo intero e l'apertura delle impostazioni.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Barre degli strumenti:</strong>
                        <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                            <li><strong>Pannello superiore:</strong> Un pannello dinamico che mostra le impostazioni per lo strumento attivo (es. colore di riempimento) o le proprietà dell'oggetto selezionato.</li>
                            <li><strong>Pannello sinistro:</strong> Il set principale di strumenti per creare forme. Raggruppati per tipo: primitive, linee, poligoni, ecc.</li>
                        </ul>
                    </ListItem>
                     <ListItem>
                        <strong className="text-[var(--text-primary)]">Area di lavoro (Canvas):</strong> L'area centrale per disegnare e modificare. Il canvas ha dimensioni e colore di sfondo personalizzabili. I righelli possono essere visualizzati. A uno zoom superiore al 1000%, appare una griglia per l'allineamento ultra-preciso.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Pannello Codice Tkinter:</strong> Situato a sinistra. Mostra in tempo reale il codice Python (quando si usa il generatore locale). Contiene pulsanti per copiare, visualizzare in anteprima o aggiornare il codice.
                    </ListItem>
                     <ListItem>
                        <strong className="text-[var(--text-primary)]">Pannelli di destra (Oggetti e Proprietà):</strong>
                        <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                            <li><strong>Lista Oggetti:</strong> Un elenco gerarchico di tutte le forme. Qui puoi cambiarne l'ordine (livelli), rinominarle, nasconderle e bloccarle.</li>
                            <li><strong>Editor di Proprietà:</strong> Un pannello dettagliato per configurare i parametri dell'oggetto selezionato: coordinate, dimensioni, colori, spessore del tratto, attributi e nodi.</li>
                        </ul>
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Barra di stato:</strong> Il pannello inferiore che mostra il livello di zoom e le coordinate del cursore. A sinistra c'è una casella di controllo per attivare le coordinate visibili accanto al mouse. Clicca sulla percentuale di zoom per inserire un valore esatto.
                    </ListItem>
                    <ListItem>
                        <strong className="text-[var(--text-primary)]">Finestra di Aiuto:</strong> Ha propri controlli: un campo di ricerca o uno slider di zoom per la dimensione dei caratteri. Cliccando sulla percentuale ripristini rapidamente lo zoom.
                    </ListItem>
                </ul>
                <SubTitle>Modalità a Schermo Intero</SubTitle>
                <Para>
                    Per la massima immersione, puoi attivare la modalità a schermo intero tramite <Key>Visualizza</Key> → <Key>Schermo intero</Key> o premendo <Key>F11</Key>. 
                </Para>
            </section>

            <section>
                <SectionTitle id="projects">3. Progetti</SectionTitle>
                <SubTitle>Creare un Nuovo Progetto</SubTitle>
                <Para>
                    Crea un nuovo progetto tramite <Key>File</Key> → <Key>Nuovo Progetto...</Key>. Imposta nome, dimensioni, sfondo e nome della variabile Canvas.
                </Para>
                <SubTitle>Salvataggio e Caricamento</SubTitle>
                <Para>
                    I progetti vengono salvati in formato <Key>.vec.json</Key>.
                </Para>
                 <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Salva</Key> (<Key>Ctrl+S</Key>): Salva le modifiche al file aperto.</ListItem>
                    <ListItem><Key>Salva come...</Key>: Salva il progetto in un nuovo file.</ListItem>
                     <ListItem><Key>Carica Progetto...</Key>: Apre un file <Key>.vec.json</Key> esistente.</ListItem>
                </ul>
                <SubTitle>Ritorno al Progetto Attivo</SubTitle>
                <Para>
                    Se torni alla schermata iniziale senza salvare, puoi usare il pulsante <strong className="text-[var(--text-primary)]">Ritorna</strong> per riprendere dal tuo lavoro.
                </Para>
                <SubTitle>Salvataggio Automatico (Autosave)</SubTitle>
                <Para>
                    L'editor salva automaticamente ogni 2 minuti, conservando un backup locale, per evitare la perdita di dati.
                </Para>
            </section>

            <section>
                <SectionTitle id="templates">4. Modelli (Templates)</SectionTitle>
                <SubTitle>Scopo e Vantaggi</SubTitle>
                <Para>
                    I modelli salvano lo stato completo di un progetto: dimensioni, sfondo, griglia e forme. Utili per partire da basi preconfigurate.
                </Para>
                <SubTitle>Creazione e Utilizzo</SubTitle>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                    <ListItem><strong className="text-[var(--text-primary)]">Creazione:</strong> Modifica dal <Key>File</Key> → <Key>Salva come Modello...</Key>.</ListItem>
                    <ListItem><strong className="text-[var(--text-primary)]">Utilizzo:</strong> Durante la creazione di un progetto, selezionalo dal menu "Crea da:".</ListItem>
                </ol>
                <SubTitle>Gestione dei Modelli</SubTitle>
                <Para>
                    Gestiscili nelle <Key>Impostazioni</Key> nella scheda <Key>Modelli</Key>. Sono salvati nel tuo browser (localStorage). <strong className="text-[var(--destructive-text)]">Attenzione:</strong> La pulizia della cache del browser eliminerà i modelli.
                </Para>
            </section>

            <section>
                <SectionTitle id="shapes">5. Oggetti</SectionTitle>
                <SubTitle>Creare Oggetti</SubTitle>
                <Para>
                    Seleziona uno strumento e clicca sul canvas. Trascina per ridimensionare. Tieni premuto <Key>Shift</Key> per disegnare in modo proporzionale.
                </Para>
                <SubTitle>Selezione e Trasformazione</SubTitle>
                <Para>
                    Usa <Key>Seleziona</Key>. Comparirà un riquadro con le maniglie.
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>Trascina i bordi per ridimensionare. Tieni <Key>Shift</Key> per mantenere la proporzione.</ListItem>
                    <ListItem>Passa con il mouse vicino agli angoli per ruotare.</ListItem>
                    <ListItem><Key>Shift + Clic</Key> seleziona elementi multipli.</ListItem>
                </ul>
                <SubTitle>Modificare Nodi</SubTitle>
                <Para>
                    Usa lo strumento <Key>Modifica Punti</Key> per alterare i vertici individuali e visualizzare i punti di controllo Bezier. Usa la lista laterale per eliminare punti specifici o cambiarne le coordinate col mouse.
                </Para>
            
                <SubTitle>Raggruppamento di Oggetti</SubTitle>
                <Para>
                    È possibile combinare più forme in un <strong>Gruppo</strong> per spostare, ridimensionare e ruotare più facilmente come una singola unità.
                    Per raggruppare gli oggetti, selezionali, fai clic destro e scegli <Key>Raggruppa</Key> (o usa il pulsante della barra degli strumenti o <Key>Ctrl+G</Key>).
                    Per separare, seleziona il gruppo e scegli <Key>Separa</Key> (<Key>Ctrl+Shift+G</Key>).
                    Facendo doppio clic su un gruppo puoi inserirlo per modificare singoli elementi.
                </Para>
                <SubTitle>Allineamento e Distribuzione</SubTitle>
                <Para>
                    La barra degli strumenti superiore fornisce funzioni per allineare gli oggetti selezionati (bordo sinistro/destro, centro, ecc.). Puoi allineare gli oggetti <strong>rispetto alla selezione</strong> o <strong>rispetto alla tela</strong>.
                    <br/><br/>
                    <strong>Distribuzione:</strong> È possibile distribuire uniformemente gli oggetti selezionati orizzontalmente o verticalmente. È disponibile anche la <strong>Distribuzione su percorso</strong>: una funzione unica per posizionare gli oggetti lungo un altro contorno selezionato (linea, curva o qualsiasi forma).
                    Durante la distribuzione del percorso, è possibile regolare l'orientamento (radiale, tangente, parallelo) e l'angolo di rotazione degli oggetti.
                </Para>
                <SubTitle>Elenco Oggetti e Livelli</SubTitle>
                <Para>
                    Il pannello di destra contiene un elenco di tutte le forme sulla tela. Puoi rinominare le forme (doppio clic sul nome), bloccarle (per evitare modifiche accidentali) o nasconderle.
                    <br/><br/>
                    L'ordine nell'elenco corrisponde all'<strong>ordine z (livelli)</strong>: un oggetto più in alto nell'elenco verrà disegnato sopra quelli sotto di esso. Cambie l'ordine trascinando le forme nell'elenco.
                </Para>
                <SubTitle>Specchiatura (Capovolgi)</SubTitle>
                <Para>
                    Gli oggetti selezionati possono essere capovolti orizzontalmente o verticalmente utilizzando i pulsanti nel pannello delle proprietà o nel menu contestuale. Ciò ti consente di creare facilmente disegni simmetrici.
                </Para>
</section>

            <section>
                <SectionTitle id="code-export">6. Codice ed Esportazione</SectionTitle>
                <SubTitle>Generazione del Codice</SubTitle>
                <Para>
                    Il codice Tkinter viene generato istantaneamente dal Generatore Locale per velocizzare lo sviluppo. L'API Gemini è opzionale per casi spinti dall'IA.
                </Para>
                <SubTitle>Opzioni di Esportazione</SubTitle>
                <Para>
                    Tramite <Key>File</Key> → <Key>Esporta come...</Key>:
                </Para>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Immagine PNG</Key> ad alta risoluzione con sfondo trasparente.</ListItem>
                    <ListItem><Key>Vettore SVG</Key> per ridimensionare al massimo livello.</ListItem>
                    <ListItem><Key>Codice Python (.py)</Key> contenente la programmazione Tkinter.</ListItem>
                </ul>
            </section>

            <section>
                <SectionTitle id="feedback">7. Feedback</SectionTitle>
                <Para>
                    Aiuta a migliorare VereTka! Se trovi un bug, usa <Key>Aiuto</Key> → <Key>Invia feedback</Key>.
                </Para>
            </section>

            <section>
                <SectionTitle id="hotkeys">8. Scorciatoie da Tastiera</SectionTitle>
                <Para>Usa queste combinazioni per velocizzare il tuo flusso di lavoro.</Para>
                
                <SubTitle>File e Cronologia</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>Ctrl+S</Key> — Salva progetto.</ListItem>
                    <ListItem><Key>Ctrl+Z</Key> — Annulla l'ultima azione.</ListItem>
                    <ListItem><Key>Ctrl+Y</Key> (o <Key>Ctrl+Shift+Z</Key>) — Ripristina azione.</ListItem>
                </ul>

                <SubTitle>Strumenti e Selezione</SubTitle> 
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem><Key>V</Key> — Attiva strumento "Seleziona".</ListItem>
                    <ListItem><Key>A</Key> — Attiva strumento "Modifica Nodi".</ListItem>
                    <ListItem><Key>Ctrl+G</Key> — Raggruppa oggetti selezionati.</ListItem>
                    <ListItem><Key>Ctrl+Shift+G</Key> — Separa.</ListItem>
                    <ListItem><Key>Ctrl+D</Key> — Duplica oggetto selezionato.</ListItem>
                    <ListItem><Key>Ctrl+H</Key> — Capovolgi Orizzontalmente.</ListItem>
                    <ListItem><Key>Ctrl+V</Key> — Capovolgi Verticalmente.</ListItem>
                    <ListItem><Key>Delete</Key> / <Key>Backspace</Key> — Elimina oggetto o nodo selezionato.</ListItem>
                </ul>
                
                <SubTitle>Movimento</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                     <ListItem><Key>Frecce</Key> — Muovi oggetto selezionato di 1 pixel.</ListItem>
                     <ListItem><Key>Shift + Frecce</Key> — Muovi oggetto selezionato di 10 pixel.</ListItem>
                     <ListItem><Key>Alt + Frecce</Key> — Muovi senza ancoraggio (snapping).</ListItem>
                </ul>
                
                <SubTitle>Navigazione e Generale</SubTitle>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <ListItem>
                        <Key>?</Key> — Mostra tutte le scorciatoie.
                    </ListItem>
                    <ListItem>
                        <Key>Rotellina del Mouse</Key> — Zoom della tela.
                    </ListItem>
                    <ListItem>
                        <Key>Tasto Centrale del Mouse</Key> — Panoramica della tela.
                    </ListItem>
                     <ListItem>
                        <Key>F11</Key> — Entra / esci da schermo intero.
                    </ListItem>
                    <ListItem>
                        <Key>Escape (Esc)</Key> — Annulla l'azione corrente, deseleziona o chiudi modali.
                    </ListItem>
                </ul>
            </section>
        </>
    );
};
