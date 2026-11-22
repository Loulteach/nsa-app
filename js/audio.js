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
function speakFR(text){ if(!TTS.ok) return false; const v=TTS.voice||pickVoice(); if(!v) return false;
  try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.voice=v; u.lang='fr-FR'; u.rate=.9; speechSynthesis.speak(u); return true; }catch(e){ return false; } }
document.addEventListener('pointerdown',function unlock(){ if(TTS.ok){ try{ const u=new SpeechSynthesisUtterance(' '); u.volume=0; u.lang='fr-FR'; speechSynthesis.speak(u);}catch(e){} } },{once:true});
let current=null;
async function cachedUrl(u){ try{ if('caches' in window){ const c=await caches.open('nsa-voix'); const m=await c.match(u); if(m) return URL.createObjectURL(await m.blob()); } }catch(e){} return u; }
async function play(key,text){
  if(current){ current.pause(); current=null; } if(TTS.ok) speechSynthesis.cancel();
  const f=index[key];
  if(f && S.online()){
    try{ const a=new Audio(await cachedUrl(pub(f))); current=a; await a.play(); return 'voix'; }catch(e){ /* repli synthèse */ }
  }
  return speakFR(text)?'synthese':'aucun';
}
window.NSA_AUDIO={play,speakFR,loadIndex,pickVoice,TTS,index:()=>index,pub};
})();
