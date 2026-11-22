/* Liste de tous les sons d'une semaine (clé + texte), partagée par l'appli élève, l'espace formatrice et le script d'enregistrement. */
(function(root){
function audioList(week){
  const out=[]; const n=week.n;
  week.activites.forEach((a,ai)=>{
    const base=`s${n}-${a.id}`;
    const push=(suffix,text,role)=>{ if(text) out.push({key:`${base}-${suffix}`,text,role,act:a.titre,actIndex:ai+1}); };
    push('c',a.consigne,'Consigne');
    if(a.consigne2) push('c2',a.consigne2,'Consigne (2e partie)');
    if(a.type==='record') push('ex',a.exemple,'Exemple à imiter');
    (a.items||[]).forEach((it,i)=>{
      const t=itemText(a,it);
      if(t) push(String(i+1),t,'Question '+(i+1));
    });
  });
  return out;
}
function itemText(a,it){
  switch(a.type){
    case 'choice': return it.say;
    case 'sound': return it.w;
    case 'letters': return it.say || null;
    case 'conj': return it.p+(it.glue?'':' ')+it.a+' '+it.b;
    case 'keypad': case 'map': case 'plan': return it.say;
    default: return null;
  }
}
root.NSA_CONTENT={audioList,itemText};
if(typeof module!=='undefined') module.exports={audioList,itemText};
})(typeof window!=='undefined'?window:globalThis);
