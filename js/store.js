/* Stockage local (IndexedDB) + envoi vers Supabase quand Internet est disponible. */
(function(){
const C=window.NSA_CONFIG||{};
const online=()=>!!(C.supabaseUrl&&C.supabaseAnonKey);
/* clé publique : les anciennes clés (eyJ…) vont aussi dans Authorization, les nouvelles (sb_publishable_…) seulement dans apikey */
const anonHeaders=(extra)=>Object.assign({apikey:C.supabaseAnonKey},String(C.supabaseAnonKey).startsWith('eyJ')?{Authorization:'Bearer '+C.supabaseAnonKey}:{},extra||{});
let dbp=null;
function db(){ if(dbp) return dbp; dbp=new Promise((res,rej)=>{const r=indexedDB.open('nsa',1);
  r.onupgradeneeded=()=>{const d=r.result; d.createObjectStore('outbox',{keyPath:'id'}); d.createObjectStore('kv');};
  r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error);}); return dbp; }
function tx(store,mode,fn){ return db().then(d=>new Promise((res,rej)=>{const t=d.transaction(store,mode);const s=t.objectStore(store);const out=fn(s);
  t.oncomplete=()=>res(out&&out.result!==undefined?out.result:out); t.onerror=()=>rej(t.error);})); }
const uid=()=> (crypto.randomUUID?crypto.randomUUID():'x'+Date.now()+Math.random().toString(16).slice(2));

function ls(k,v){ try{ if(v===undefined) return JSON.parse(localStorage.getItem('nsa:'+k)); localStorage.setItem('nsa:'+k,JSON.stringify(v)); }catch(e){ return null; } }

async function queue(result, audioBlob){
  const item={id:uid(), result, audio:audioBlob||null, t:Date.now()};
  try{ await tx('outbox','readwrite',s=>s.put(item)); }catch(e){ console.warn('outbox',e); }
  flush();
}
let flushing=false;
async function flush(){
  if(flushing) return; if(!online()||!navigator.onLine){ document.dispatchEvent(new Event('nsa-sync')); return; }
  flushing=true;
  try{
    const items=await tx('outbox','readonly',s=>s.getAll());
    for(const it of items){
      try{
        const r=Object.assign({},it.result);
        if(it.audio){
          const ty=it.audio.type||'', ext=ty.includes('mpeg')?'mp3':ty.includes('mp4')?'m4a':'webm';
          const path=`s${r.semaine}/${r.appareil}/${r.activite}-${it.id}.${ext}`;
          const up=await fetch(`${C.supabaseUrl}/storage/v1/object/eleves/${path}`,{method:'POST',
            headers:anonHeaders({'Content-Type':ty.split(';')[0]||'application/octet-stream'}),body:it.audio});
          if(up.ok || up.status===409 || up.status===400&&/exist/i.test(await up.clone().text())) r.audio_path=path;
          else ls('lastErr','audio '+up.status+' '+(await up.text()).slice(0,120)); /* le score part quand même */
        }
        const res=await fetch(`${C.supabaseUrl}/rest/v1/resultats`,{method:'POST',
          headers:anonHeaders({'Content-Type':'application/json',Prefer:'return=minimal'}),
          body:JSON.stringify(Object.assign({id:it.id},r))});
        if(!res.ok && res.status!==409){ const t=(await res.text()).slice(0,160); throw new Error(res.status+' '+t); }
        await tx('outbox','readwrite',s=>s.delete(it.id)); if(!it.audio||r.audio_path) ls('lastErr','');
      }catch(e){ console.warn('envoi reporté',e); ls('lastErr',String(e&&e.message||e)); if(!navigator.onLine) break; }
    }
  } finally { flushing=false; document.dispatchEvent(new Event('nsa-sync')); }
}
async function pending(){ try{ return (await tx('outbox','readonly',s=>s.count())); }catch(e){ return 0; } }
window.addEventListener('online',flush);
window.NSA_STORE={ls,queue,flush,pending,online,uid};
})();
