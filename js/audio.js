/* Sons : voix de la formatrice (enregistrements), sinon fichiers préparés, sinon voix de synthèse française de France.
   Un seul lecteur audio pour toute l'appli : débloqué au premier toucher, il peut ensuite jouer sans délai (iPhone compris). */
(function(){
const C=window.NSA_CONFIG||{}; const S=window.NSA_STORE;
const pub=f=>`${C.supabaseUrl}/storage/v1/object/public/voix/${f}`;
let index=S.ls('voixIndex')||{};
async function loadIndex(){
  if(!S.online()) return index;
  try{ const r=await fetch(pub('index.json')+'?t='+Date.now(),{cache:'no-store'}); if(r.ok){ index=await r.json(); S.ls('voixIndex',index);
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
function speakFR(text,onend){ if(!TTS.ok) return false;
  const all=speechSynthesis.getVoices(); const v=TTS.voice||pickVoice();
  if(!v && all.length) return false; /* des voix existent mais aucune n'est française de France */
  try{ const u=new SpeechSynthesisUtterance(text); if(v) u.voice=v; u.lang='fr-FR'; u.rate=.9; u.volume=1;
    if(onend){ u.onend=onend; u.onerror=onend; }
    if(speechSynthesis.speaking||speechSynthesis.pending) speechSynthesis.cancel();
    speechSynthesis.speak(u); return true; }catch(e){ return false; } }

/* --- lecteur unique --- */
const player=new Audio(); player.preload='auto'; player.setAttribute('playsinline',''); player.setAttribute('webkit-playsinline','');
const SILENCE='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';
let unlocked=false, token=0;
function unlock(){ if(unlocked) return; unlocked=true;
  try{ if(!player.src){ player.src=SILENCE; const p=player.play(); if(p&&p.then) p.then(()=>{ if(player.src===SILENCE) player.pause(); },()=>{ unlocked=false; }); } }catch(e){ unlocked=false; }
  if(TTS.ok){ try{ const u=new SpeechSynthesisUtterance(''); u.volume=0; speechSynthesis.speak(u); }catch(e){} } }
['touchend','mousedown','keydown'].forEach(ev=>document.addEventListener(ev,unlock,{capture:true,passive:true}));

let manifest={}; fetch('audio/manifest.json').then(r=>r.json()).then(m=>{manifest=m;}).catch(()=>{});
function canPlay(f){ const a=document.createElement('audio');
  if(/\.webm$/.test(f)) return !!a.canPlayType('audio/webm; codecs="opus"');
  if(/\.m4a$/.test(f)) return !!a.canPlayType('audio/mp4');
  return true; }
function sources(key,text){ const out=[]; const f=key&&index[key];
  if(f && canPlay(f)) out.push(pub(f));
  if(manifest[text]) out.push('audio/'+manifest[text]);
  return out; }
function ended(key){ document.dispatchEvent(new CustomEvent('nsa-audio-end',{detail:{key}})); }
function stop(){ token++; try{ player.pause(); }catch(e){}
  if(TTS.ok&&(speechSynthesis.speaking||speechSynthesis.pending)) speechSynthesis.cancel(); }
/* joue une adresse ; échoue si erreur ou si rien ne démarre en 5 s */
function playUrl(url,my){ return new Promise((res,rej)=>{
  let started=false; const guard=setTimeout(()=>{ if(!started&&my===token) rej(new Error('lent')); },5000);
  const clean=()=>{ clearTimeout(guard); player.onended=player.onerror=player.onplaying=null; };
  player.onplaying=()=>{ started=true; };
  player.onended=()=>{ clean(); res(); };
  player.onerror=()=>{ clean(); rej(new Error('audio')); };
  try{ if(player.src!==new URL(url,location.href).href) player.src=url; player.currentTime=0; }catch(e){}
  const p=player.play(); if(p&&p.catch) p.catch(e=>{ clean(); rej(e); });
}); }
async function playText(key,text,my){
  for(const u of sources(key,text)){ if(my!==token) return 'stop';
    try{ await playUrl(u,my); return 'ok'; }catch(e){} }
  if(my!==token) return 'stop';
  return await new Promise(res=>{ if(!speakFR(text,()=>res('ok'))) res('aucun'); });
}
function play(key,text){ stop(); const my=token; unlock();
  const hasFile=sources(key,text).length>0;
  playText(key,text,my).then(r=>{ if(my===token&&r==='ok') ended(key); });
  return Promise.resolve(hasFile?'fichier':(TTS.ok&&(TTS.voice||!speechSynthesis.getVoices().length)?'synthese':'aucun'));
}
async function say(texts){ if(!Array.isArray(texts)) texts=[texts];
  stop(); const my=token;
  for(const t of texts){ if(my!==token) return; await playText(null,t,my); } }
/* met les sons de l'écran en mémoire (téléchargement à l'avance) */
const warmed=new Set();
function prepare(list){ list.forEach(([k,t])=>sources(k,t).forEach(u=>{ if(warmed.has(u)) return; warmed.add(u); fetch(u).catch(()=>warmed.delete(u)); })); }
window.NSA_AUDIO={play,say,stop,prepare,speakFR,loadIndex,pickVoice,unlock,TTS,index:()=>index,pub};
})();
