# NSA Révisions

Application web installable (PWA) pour les élèves du dispositif NSA : un lien par semaine de cours, fonctionne hors ligne.

- `index.html` : application élève. Lien d'une semaine : `…/#semaine-2`.
- `prof.html` : espace formatrice (résultats, enregistrement de la voix des consignes).
- `weeks/` : contenu des semaines (un fichier JSON par semaine, liste dans `weeks/index.json`).
- `js/config.js` : adresse et clé publique Supabase.
- `supabase/schema.sql` : création de la base (tables, droits, stockage audio).

Ajouter une semaine : créer `weeks/semaine-N.json`, l'ajouter à `weeks/index.json` et à la liste `SHELL` de `sw.js`, puis augmenter `VERSION` dans `sw.js`.

## Voix de synthèse
Les phrases sont transformées à l'avance en fichiers `audio/*.mp3` (voix française de France « siwis », Piper) :
`python3 tools/generer_audio.py chemin/fr_FR-siwis-medium.onnx` après chaque ajout de semaine.
Ordre de lecture dans l'application : voix enregistrée par la formatrice, sinon fichier préparé, sinon voix du téléphone (fr-FR uniquement).
