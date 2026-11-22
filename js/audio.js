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
/* --- fichiers audio préparés (voix française de synthèse, identique sur tous les téléphones) --- */
let manifest={}; const mp=fetch('audio/manifest.json').then(r=>r.json()).then(m=>{manifest=m;}).catch(()=>{});
/* éléments audio préchargés pour l'écran affiché : la lecture démarre tout de suite au toucher */
let pre={};
function urlFor(key,text){
  const f=index[key]; if(f && S.online() && canPlay(f)) return pub(f);
  if(manifest[text]) return 'audio/'+manifest[text];
  return null;
}
function canPlay(f){ const a=document.createElement('audio');
  if(/\.webm$/.test(f)) return !!a.canPlayType('audio/webm; codecs="opus"');
  if(/\.m4a$/.test(f)) return !!a.canPlayType('audio/mp4');
  return true; }
function stop(){ if(current){ try{ current.pause(); current.currentTime=0; }catch(e){} current=null; }
  if(TTS.ok&&(speechSynthesis.speaking||speechSynthesis.pending)) speechSynthesis.cancel(); }
function prepare(list){ /* list = [[key,text],…] */
  const next={};
  list.forEach(([k,t])=>{ const u=urlFor(k,t); if(!u) return; const id=k+'|'+t;
    const a=(pre[id]&&pre[id].src.endsWith(u))?pre[id]:new Audio(u); a.preload='auto'; try{ a.load(); }catch(e){} next[id]=a; });
  pre=next;
}
function playEl(a){ return new Promise((res,rej)=>{ current=a; a.onended=()=>res(true); a.onerror=()=>rej(new Error('audio'));
  try{ a.currentTime=0; }catch(e){} const p=a.play(); if(p&&p.catch) p.catch(rej); }); }
function playFile(url){ return playEl(new Audio(url)); }
async function say(texts){
  if(!Array.isArray(texts)) texts=[texts];
  stop();
  for(const t of texts){ const f=manifest[t];
    if(f){ try{ await playFile('audio/'+f); continue; }catch(e){} }
    speakFR(t); return; }
}
function play(key,text){
  stop();
  const id=key+'|'+text, u=urlFor(key,text);
  if(u){
    const a=pre[id]||new Audio(u);
    playEl(a).catch(()=>{ /* repli : fichier préparé puis synthèse */
      const m=manifest[text]; if(m && !a.src.endsWith(m)) playFile('audio/'+m).catch(()=>speakFR(text)); else speakFR(text); });
    return Promise.resolve(index[key]?'voix':'fichier');
  }
  return Promise.resolve(speakFR(text)?'synthese':'aucun');
}
window.NSA_AUDIO={play,say,stop,prepare,speakFR,loadIndex,pickVoice,TTS,index:()=>index,pub};
})();
