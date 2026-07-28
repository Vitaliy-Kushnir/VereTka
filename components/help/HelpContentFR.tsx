import React from 'react';
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
