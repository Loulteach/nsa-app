/* Sons : voix de la formatrice (enregistrements) ou, à défaut, voix de synthèse française de France. */
(function(){
const C=window.NSA_CONFIG||{}; const S=window.NSA_STORE;
const pub=f=>`${C.supabaseUrl}/storage/v1/object/public/voix/${f}`;
let index=S.ls('voixIndex')||{};
async function loadIndex(){
  if(!S.online()) return index;
  try{ const r=await fetch(pub('index.json')+'?t='+Date.now(),{cache:'no-store'}); if(r.ok){ index=await r.json(); S.ls('voixIndex',index);
      // préchargement pour le hors ligne
      if('caches' in window){ const c=await caches.open('nsa-voix'); for(const f of Object.values(index)){ const u=pub(f); if(!(await c.match(u))){ try{ await c.add(u);}catch(e){} } } }
  } }catch(e){}
  return index;
}
/* --- synthèse vocale : uniquement fr-FR --- */
const TTS={voice:null,ok:'speechSynthesis' in window};
const NOT_FR=/canad|qu[ée]bec|belg|suisse|switz|am[ée]lie|chantal/i;
function pickVoice(){ if(!TTS.ok) return null;
  const vs=speechSynthesis.getVoices().filter(v=>/^fr[-_]FR$/i.test(v.lang)&&!NOT_FR.test(v.name));
  const pref=[/thomas/i,/audrey/i,/aur[ée]lie/i,/marie/i,/google/i,/denise|henri|julie|paul|hortense/i];
  TTS.voice=pref.map(r=>vs.find(v=>r.test(v.name))).find(Boolean)||vs.find(v=>v.localService)||vs[0]||null; return TTS.voice; }
if(TTS.ok){ pickVoice(); speechSynthesis.onvoiceschanged=pickVoice; }
function speakFR(text){ if(!TTS.ok) return false;
  const all=speechSynthesis.getVoices(); const v=TTS.voice||pickVoice();
  if(!v && all.length) return false; /* des voix existent mais aucune n'est française de France : on ne lit pas */
  try{ const u=new SpeechSynthesisUtterance(text); if(v) u.voice=v; u.lang='fr-FR'; u.rate=.9; u.volume=1;
    if(speechSynthesis.speaking||speechSynthesis.pending){ speechSynthesis.cancel(); setTimeout(()=>speechSynthesis.speak(u),80); }
    else speechSynthesis.speak(u);
    return true; }catch(e){ return false; } }

let current=null;
async function cachedUrl(u){ try{ if('caches' in window){ const c=await caches.open('nsa-voix'); const m=await c.match(u); if(m) return URL.createObjectURL(await m.blob()); } }catch(e){} return u; }
/* --- fichiers audio préparés (voix française de synthèse, identique sur tous les téléphones) --- */
let manifest={}; const mp=fetch('audio/manifest.json').then(r=>r.json()).then(m=>{manifest=m;}).catch(()=>{});
function playFile(url){ return new Promise((res,rej)=>{ const a=new Audio(url); current=a; a.onended=()=>res(true); a.onerror=()=>rej(new Error('audio')); a.play().catch(rej); }); }
async function say(texts){
  if(!Array.isArray(texts)) texts=[texts];
  if(current){ current.pause(); current=null; } if(TTS.ok&&speechSynthesis.speaking) speechSynthesis.cancel();
  for(const t of texts){ const f=manifest[t];
    if(f){ try{ await playFile('audio/'+f); continue; }catch(e){} }
    speakFR(t); return; }
}
async function play(key,text){
  if(current){ current.pause(); current=null; }
  const f=index[key];
  if(f && S.online()){
    try{ await playFile(pub(f)); return 'voix'; }catch(e){ /* repli : fichier préparé ou synthèse */ }
  }
  if(manifest[text]){ try{ playFile('audio/'+manifest[text]).catch(()=>speakFR(text)); return 'fichier'; }catch(e){} }
  return speakFR(text)?'synthese':'aucun';
}
window.NSA_AUDIO={play,say,speakFR,loadIndex,pickVoice,TTS,index:()=>index,pub};
})();
