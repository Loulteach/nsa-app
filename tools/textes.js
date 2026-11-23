// Liste de toutes les phrases à transformer en fichiers audio (node tools/textes.js > /tmp/textes.json)
const fs=require('fs'),path=require('path');const {audioList}=require('../js/content.js');
const root=path.join(__dirname,'..');const idx=JSON.parse(fs.readFileSync(path.join(root,'weeks/index.json')));
const T=new Set(["Écrivez votre prénom. Touchez la flèche.","Écrivez votre prénom.",
 "Essayez encore.","Écoutez encore.","Regardez bien. Essayez encore.","Tracez avec votre doigt.","Suivez bien les pointillés.",
 "Pas encore. Cherchez la lettre suivante.","Pas encore. Regardez la lettre grise. Touchez la même lettre.","Regardez la lettre qui clignote. Touchez-la.","Bravo !","Comptez avec votre doigt. Essayez encore.","Comptez encore.","Regardez le tableau. Essayez encore.",
 "Pas encore. Écoutez encore la date.","Regardez le jour. Essayez encore.","Regardez le mois. Essayez encore.","Pas encore. Écoutez le mot. Coupez entre les syllabes.","Touchez entre deux lettres pour couper.","Regardez la syllabe qui clignote. Touchez-la.","Pas encore. Écoutez le mot.","Ce n'est pas le même mot. Regardez bien.",
 "Le micro est bloqué. Autorisez le micro dans les réglages du téléphone."]);
for(const w of idx.semaines){const wk=JSON.parse(fs.readFileSync(path.join(root,`weeks/semaine-${w.n}.json`)));
  audioList(wk).forEach(x=>T.add(x.text));
  wk.activites.forEach(a=>{ (a.fields||[]).forEach(f=>T.add(f.err)); if(a.type==='map') a.items.forEach(i=>T.add(`Ce n'est pas ${i.a}. Essayez encore.`)); });}
process.stdout.write(JSON.stringify([...T],null,1));
